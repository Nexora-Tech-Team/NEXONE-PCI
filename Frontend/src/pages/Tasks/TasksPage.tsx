import { useEffect, useMemo, useState } from 'react'
import { taskService, projectService, teamService } from '@/services/api'
import { toISODate } from '@/utils/format'
import { ManageLabelsModal } from '@/components/common/ManageLabelsModal'
import { toast } from 'react-toastify'
import { Plus, Filter, FileDown, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import {
  PageHeader, Toolbar, SearchInput, Pagination,
  StatusBadge, Modal, FormField, ConfirmDialog, Loading, EmptyState, ViewTabs, Avatar,
} from '@/components/common'

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'expired'

interface ProjectOption {
  id: number
  title: string
}

interface MemberOption {
  id: number
  name: string
}

interface TaskItem {
  id: number
  title: string
  project_id?: number | null
  project?: ProjectOption | null
  assigned_to_id?: number | null
  assigned_to?: MemberOption | null
  status: TaskStatus | string
  priority: string
  start_date?: string
  deadline?: string
  description?: string
}

interface TaskFormState {
  title: string
  project_id: string
  assigned_to_id: string
  status: TaskStatus
  priority: string
  start_date: string
  deadline: string
  description: string
}

type TaskBoardState = Record<TaskStatus, TaskItem[]>

const VIEWS = [
  { key: 'list', label: 'List' },
  { key: 'kanban', label: 'Kanban' },
  { key: 'gantt', label: 'Gantt' },
]

const TASK_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
  { id: 'done', label: 'Done', color: 'bg-green-50' },
  { id: 'expired', label: 'Expired', color: 'bg-red-50' },
]

const EMPTY_FORM: TaskFormState = {
  title: '',
  project_id: '',
  assigned_to_id: '',
  status: 'todo',
  priority: 'medium',
  start_date: '',
  deadline: '',
  description: '',
}

const LIST_LIMIT = 10

const priorityColor: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
}

function isTaskStatus(status: string): status is TaskStatus {
  return TASK_COLUMNS.some(col => col.id === status)
}

function createEmptyBoard(): TaskBoardState {
  return {
    todo: [],
    in_progress: [],
    done: [],
    expired: [],
  }
}

function groupTasksByStatus(items: TaskItem[]): TaskBoardState {
  const grouped = createEmptyBoard()

  items.forEach(task => {
    const status = isTaskStatus(task.status) ? task.status : 'todo'
    grouped[status].push({ ...task, status })
  })

  return grouped
}

function mapTaskToForm(task?: TaskItem | null): TaskFormState {
  if (!task) return EMPTY_FORM

  return {
    title: task.title || '',
    project_id: task.project_id ? String(task.project_id) : task.project?.id ? String(task.project.id) : '',
    assigned_to_id: task.assigned_to_id ? String(task.assigned_to_id) : task.assigned_to?.id ? String(task.assigned_to.id) : '',
    status: isTaskStatus(task.status) ? task.status : 'todo',
    priority: task.priority || 'medium',
    start_date: task.start_date?.split('T')[0] || '',
    deadline: task.deadline?.split('T')[0] || '',
    description: task.description || '',
  }
}

function buildTaskPayload(form: TaskFormState) {
  return {
    ...form,
    project_id: form.project_id ? Number(form.project_id) : null,
    assigned_to_id: form.assigned_to_id ? Number(form.assigned_to_id) : null,
    start_date: toISODate(form.start_date),
    deadline: toISODate(form.deadline),
  }
}

function formatTaskDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id')
}

function isTaskOverdue(task: TaskItem) {
  if (!task.deadline || task.status === 'done') return false
  const deadline = new Date(task.deadline)
  return !Number.isNaN(deadline.getTime()) && deadline < new Date()
}

function reorderBoard(board: TaskBoardState, result: DropResult): TaskBoardState {
  if (!result.destination) return board

  const sourceStatus = result.source.droppableId as TaskStatus
  const destinationStatus = result.destination.droppableId as TaskStatus

  if (!isTaskStatus(sourceStatus) || !isTaskStatus(destinationStatus)) return board

  const nextBoard: TaskBoardState = {
    todo: [...board.todo],
    in_progress: [...board.in_progress],
    done: [...board.done],
    expired: [...board.expired],
  }

  const sourceItems = [...nextBoard[sourceStatus]]
  const [movedTask] = sourceItems.splice(result.source.index, 1)

  if (!movedTask) return board

  if (sourceStatus === destinationStatus) {
    sourceItems.splice(result.destination.index, 0, movedTask)
    nextBoard[sourceStatus] = sourceItems
    return nextBoard
  }

  const destinationItems = [...nextBoard[destinationStatus]]
  destinationItems.splice(result.destination.index, 0, { ...movedTask, status: destinationStatus })

  nextBoard[sourceStatus] = sourceItems
  nextBoard[destinationStatus] = destinationItems

  return nextBoard
}

export default function TasksPage() {
  const [view, setView] = useState('list')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [boardTasks, setBoardTasks] = useState<TaskBoardState>(createEmptyBoard())
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [projectFilter, setProjectFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [boardLoading, setBoardLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showManageLabels, setShowManageLabels] = useState(false)
  const [editTask, setEditTask] = useState<TaskItem | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM)

  const allBoardTasks = useMemo(
    () => TASK_COLUMNS.flatMap(col => boardTasks[col.id]),
    [boardTasks]
  )

  const summaryCounts = useMemo(
    () => TASK_COLUMNS.reduce((acc, col) => {
      acc[col.id] = boardTasks[col.id].length
      return acc
    }, {} as Record<TaskStatus, number>),
    [boardTasks]
  )

  const buildQueryParams = (base?: Record<string, string | number | boolean>) => {
    const params: Record<string, string | number | boolean> = { ...(base || {}) }

    if (search.trim()) params.q = search.trim()
    if (statusFilter) params.status = statusFilter
    if (projectFilter) params.project_id = projectFilter
    if (assigneeFilter) params.assigned_to_id = assigneeFilter

    return params
  }

  const loadList = async () => {
    setLoading(true)

    try {
      const params = buildQueryParams({ page, limit: LIST_LIMIT })
      const response = await taskService.list(params)
      setTasks(response.data.data || [])
      setTotal(response.data.total || 0)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const loadBoard = async () => {
    setBoardLoading(true)

    try {
      const params = buildQueryParams({ fetch_all: true })
      const response = await taskService.list(params)
      setBoardTasks(groupTasksByStatus(response.data.data || []))
    } catch {
      toast.error('Failed to load board')
    } finally {
      setBoardLoading(false)
    }
  }

  const refreshTasks = async () => {
    await Promise.all([loadList(), loadBoard()])
  }

  useEffect(() => {
    void loadList()
  }, [page, search, statusFilter, projectFilter, assigneeFilter])

  useEffect(() => {
    void loadBoard()
  }, [search, statusFilter, projectFilter, assigneeFilter])

  useEffect(() => {
    Promise.all([
      projectService.list({ limit: 100 }),
      teamService.listMembers({ limit: 100 }),
    ])
      .then(([projectRes, memberRes]) => {
        setProjects(projectRes.data.data || [])
        setMembers(memberRes.data.data || [])
      })
      .catch(() => {
        toast.error('Failed to load task dependencies')
      })
  }, [])

  const closeTaskModal = () => {
    setShowModal(false)
    setEditTask(null)
    setForm(EMPTY_FORM)
  }

  const openAdd = () => {
    setEditTask(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (task: TaskItem) => {
    setEditTask(task)
    setForm(mapTaskToForm(task))
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }

    setSaving(true)

    try {
      const payload = buildTaskPayload(form)

      if (editTask) {
        await taskService.update(editTask.id, payload)
        toast.success('Task updated!')
      } else {
        await taskService.create(payload)
        toast.success('Task created!')
      }

      closeTaskModal()
      await refreshTasks()
    } catch {
      toast.error(editTask ? 'Failed to update task' : 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await taskService.delete(deleteId)
      toast.success('Task deleted')

      if (editTask?.id === deleteId) {
        closeTaskModal()
      }

      await refreshTasks()
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const sourceStatus = result.source.droppableId as TaskStatus
    const destinationStatus = result.destination.droppableId as TaskStatus

    if (
      sourceStatus === destinationStatus &&
      result.source.index === result.destination.index
    ) {
      return
    }

    const taskId = Number(result.draggableId)
    const previousBoard = boardTasks
    const nextBoard = reorderBoard(boardTasks, result)

    setBoardTasks(nextBoard)

    if (sourceStatus === destinationStatus) return

    try {
      await taskService.updateStatus(taskId, destinationStatus)
      void loadList()
    } catch {
      toast.error('Failed to update status')
      setBoardTasks(previousBoard)
      void loadList()
    }
  }

  return (
    <div className="p-5">
      <PageHeader
        title="Tasks"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowManageLabels(true)}>
              <Filter size={12} />
              Manage labels
            </button>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={12} />
              Add task
            </button>
          </>
        }
      />

      <ViewTabs tabs={VIEWS} active={view} onChange={setView} />

      <Toolbar
        left={
          <>
            <select
              className="input input-sm"
              value={statusFilter}
              onChange={e => {
                setStatusFilter((e.target.value as TaskStatus) || '')
                setPage(1)
              }}
            >
              <option value="">All status</option>
              {TASK_COLUMNS.map(col => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>

            <select
              className="input input-sm"
              value={projectFilter}
              onChange={e => {
                setProjectFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>

            <select
              className="input input-sm"
              value={assigneeFilter}
              onChange={e => {
                setAssigneeFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All assignees</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </>
        }
        right={
          <>
            <button className="btn btn-secondary">
              <FileDown size={12} />
              Excel
            </button>
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 mb-4 xl:grid-cols-4">
        {TASK_COLUMNS.map(col => {
          const active = statusFilter === col.id
          return (
            <button
              key={col.id}
              onClick={() => {
                setStatusFilter(current => current === col.id ? '' : col.id)
                setPage(1)
              }}
              className={`rounded-2xl border p-4 text-left transition-all ${
                active
                  ? 'border-blue-300 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-600">{col.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${active ? 'bg-white text-blue-600' : 'bg-slate-100 text-gray-500'}`}>
                  {summaryCounts[col.id]}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-gray-900">{summaryCounts[col.id]}</p>
              <p className="mt-1 text-xs text-gray-400">
                {active ? 'Status filter active — click to clear.' : 'Click to filter this status.'}
              </p>
            </button>
          )
        })}
      </div>

      {view === 'list' && (
        <div className="table-container">
          {loading ? <Loading /> : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Project</th>
                    <th>Assigned To</th>
                    <th>Priority</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0
                    ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState message="No tasks match the current filters." />
                        </td>
                      </tr>
                    )
                    : tasks.map(task => (
                      <tr
                        key={task.id}
                        className="cursor-pointer"
                        onClick={() => openEdit(task)}
                      >
                        <td>
                          <div className="max-w-[280px]">
                            <p className="font-medium text-gray-900">{task.title}</p>
                            {task.description && (
                              <p className="mt-0.5 truncate text-xs text-gray-400">{task.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-gray-500">{task.project?.title || '-'}</td>
                        <td>
                          {task.assigned_to
                            ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar name={task.assigned_to.name} />
                                <span className="text-xs text-gray-500">{task.assigned_to.name}</span>
                              </div>
                            )
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td>
                          <span className={`text-xs font-medium capitalize ${priorityColor[task.priority] || ''}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className={`text-sm whitespace-nowrap ${isTaskOverdue(task) ? 'text-red-500' : 'text-gray-400'}`}>
                          {formatTaskDate(task.deadline)}
                        </td>
                        <td><StatusBadge status={isTaskStatus(task.status) ? task.status : 'todo'} /></td>
                        <td>
                          <div className="flex gap-1 justify-end">
                            <button
                              className="btn btn-secondary text-xs py-0.5 px-2"
                              onClick={(event) => {
                                event.stopPropagation()
                                openEdit(task)
                              }}
                            >
                              <Pencil size={10} />
                              Edit
                            </button>
                            <button
                              className="btn btn-danger text-xs py-0.5 px-2"
                              onClick={(event) => {
                                event.stopPropagation()
                                setDeleteId(task.id)
                              }}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <Pagination page={page} total={total} limit={LIST_LIMIT} onChange={setPage} />
            </>
          )}
        </div>
      )}

      {view === 'kanban' && (
        <>
          <div className="mb-3 rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-3 text-xs text-gray-500">
            Drag cards between the fixed workflow columns to sync task status instantly. Click any card to edit task details.
          </div>

          {boardLoading ? (
            <div className="table-container">
              <Loading />
            </div>
          ) : allBoardTasks.length === 0 ? (
            <div className="table-container">
              <EmptyState message="No tasks match the current filters." />
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {TASK_COLUMNS.map(col => (
                  <div key={col.id} className="flex-shrink-0 w-72">
                    <div className={`rounded-t-2xl px-4 py-3 flex items-center justify-between ${col.color}`}>
                      <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500">
                        {boardTasks[col.id].length}
                      </span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[280px] rounded-b-2xl border border-t-0 border-gray-200 p-3 space-y-3 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white'
                          }`}
                        >
                          {boardTasks[col.id].map((task, index) => (
                            <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  style={prov.draggableProps.style}
                                  onClick={() => openEdit(task)}
                                  className={`kanban-card mb-0 select-none ${snap.isDragging ? 'ring-1 ring-blue-400 shadow-md' : ''}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-medium text-gray-900">{task.title}</p>
                                      {task.project && (
                                        <p className="mt-0.5 truncate text-[11px] text-gray-400">{task.project.title}</p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        {...prov.dragHandleProps}
                                        onClick={event => event.stopPropagation()}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                        aria-label={`Drag ${task.title}`}
                                      >
                                        <GripVertical size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setDeleteId(task.id)
                                        }}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                                        aria-label={`Delete ${task.title}`}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  {task.description && (
                                    <p className="mt-2 text-xs text-gray-500 max-h-10 overflow-hidden">{task.description}</p>
                                  )}

                                  <div className="mt-3 flex items-center justify-between gap-2">
                                    <span className={`text-xs font-medium capitalize ${priorityColor[task.priority] || ''}`}>
                                      {task.priority}
                                    </span>
                                    {task.assigned_to
                                      ? <Avatar name={task.assigned_to.name} />
                                      : <span className="text-[11px] text-gray-300">Unassigned</span>}
                                  </div>

                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <StatusBadge status={isTaskStatus(task.status) ? task.status : 'todo'} />
                                    <span className={`text-[11px] ${isTaskOverdue(task) ? 'text-red-500' : 'text-gray-400'}`}>
                                      {task.deadline ? `Due ${formatTaskDate(task.deadline)}` : 'No deadline'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          )}
        </>
      )}

      {view === 'gantt' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
          {boardLoading
            ? <Loading />
            : <GanttView tasks={allBoardTasks} columns={TASK_COLUMNS} />}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={closeTaskModal}
        title={editTask ? 'Edit Task' : 'Add Task'}
        size="lg"
        footer={
          <>
            {editTask && (
              <button
                className="btn btn-danger"
                onClick={() => setDeleteId(editTask.id)}
                disabled={saving}
              >
                Delete
              </button>
            )}
            <button className="btn btn-secondary" onClick={closeTaskModal}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editTask ? 'Update' : 'Save'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <FormField label="Title" required>
              <input
                className="input"
                value={form.title}
                onChange={e => setForm(current => ({ ...current, title: e.target.value }))}
                placeholder="Task title"
              />
            </FormField>
          </div>

          <FormField label="Project">
            <select
              className="input"
              value={form.project_id}
              onChange={e => setForm(current => ({ ...current, project_id: e.target.value }))}
            >
              <option value="">No project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Assign To">
            <select
              className="input"
              value={form.assigned_to_id}
              onChange={e => setForm(current => ({ ...current, assigned_to_id: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Status">
            <select
              className="input"
              value={form.status}
              onChange={e => setForm(current => ({ ...current, status: e.target.value as TaskStatus }))}
            >
              {TASK_COLUMNS.map(col => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Priority">
            <select
              className="input"
              value={form.priority}
              onChange={e => setForm(current => ({ ...current, priority: e.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </FormField>

          <FormField label="Start Date">
            <input
              className="input"
              type="date"
              value={form.start_date}
              onChange={e => setForm(current => ({ ...current, start_date: e.target.value }))}
            />
          </FormField>

          <FormField label="Deadline">
            <input
              className="input"
              type="date"
              value={form.deadline}
              onChange={e => setForm(current => ({ ...current, deadline: e.target.value }))}
            />
          </FormField>

          <div className="col-span-2">
            <FormField label="Description">
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={e => setForm(current => ({ ...current, description: e.target.value }))}
              />
            </FormField>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
      <ManageLabelsModal open={showManageLabels} onClose={() => setShowManageLabels(false)} />
    </div>
  )
}

function GanttView({ tasks, columns }: { tasks: TaskItem[]; columns: { id: string; label: string }[] }) {
  const validTasks = tasks.filter(task => task.start_date && task.deadline)

  if (validTasks.length === 0) {
    return <EmptyState message="No tasks with dates to display." />
  }

  const allDates = validTasks.flatMap(task => [new Date(task.start_date as string), new Date(task.deadline as string)])
  const minDate = new Date(Math.min(...allDates.map(date => date.getTime())))
  const maxDate = new Date(Math.max(...allDates.map(date => date.getTime())))
  const totalDays = Math.max((maxDate.getTime() - minDate.getTime()) / 86400000, 1)

  const defaultColors = ['bg-gray-400', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-yellow-500']
  const barColors = columns.reduce((acc, col, index) => {
    acc[col.id] = defaultColors[index % defaultColors.length]
    return acc
  }, {} as Record<string, string>)

  return (
    <div className="min-w-[700px]">
      <div className="flex text-xs text-gray-400 mb-2 px-36">
        <span>{minDate.toLocaleDateString('id')}</span>
        <span className="ml-auto">{maxDate.toLocaleDateString('id')}</span>
      </div>
      <div className="space-y-2">
        {validTasks.map(task => {
          const start = (new Date(task.start_date as string).getTime() - minDate.getTime()) / 86400000
          const duration = Math.max((new Date(task.deadline as string).getTime() - new Date(task.start_date as string).getTime()) / 86400000, 1)
          const left = `${(start / totalDays) * 100}%`
          const width = `${Math.max((duration / totalDays) * 100, 2)}%`

          return (
            <div key={task.id} className="flex items-center gap-2 h-7">
              <div className="w-32 text-xs text-gray-600 truncate flex-shrink-0">{task.title}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded relative">
                <div
                  className={`absolute h-full rounded text-[10px] text-white flex items-center px-1 truncate ${barColors[task.status] || 'bg-blue-400'}`}
                  style={{ left, width }}
                  title={`${task.title}: ${formatTaskDate(task.start_date)} - ${formatTaskDate(task.deadline)}`}
                >
                  {task.title}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

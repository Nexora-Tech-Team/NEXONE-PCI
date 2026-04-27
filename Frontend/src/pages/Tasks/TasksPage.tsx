import { useEffect, useState } from 'react'
import { taskService, projectService, teamService } from '@/services/api'
import { toISODate } from '@/utils/format'
import { ManageLabelsModal } from '@/components/common/ManageLabelsModal'
import { toast } from 'react-toastify'
import { Plus, Filter, FileDown } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import {
  PageHeader, Toolbar, SearchInput, Pagination,
  StatusBadge, Modal, FormField, ConfirmDialog, Loading, EmptyState, ViewTabs, Avatar
} from '@/components/common'

const VIEWS = [{ key: 'list', label: 'List' }, { key: 'kanban', label: 'Kanban' }, { key: 'gantt', label: 'Gantt' }]
const KANBAN_COLS = ['todo', 'in_progress', 'done', 'expired']
const COL_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', expired: 'Expired' }
const COL_COLORS: Record<string, string> = { todo: 'bg-gray-100', in_progress: 'bg-blue-50', done: 'bg-green-50', expired: 'bg-red-50' }
const priorityColor: Record<string, string> = { high: 'text-red-500', medium: 'text-yellow-500', low: 'text-green-500' }

export default function TasksPage() {
  const [view, setView] = useState('list')
  const [tasks, setTasks] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showManageLabels, setShowManageLabels] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    title: '', project_id: '', assigned_to_id: '', status: 'todo', priority: 'medium',
    start_date: '', deadline: '', description: '',
  })

  const load = () => {
    setLoading(true)
    const params: any = { page, limit: 10, q: search }
    if (statusFilter) params.status = statusFilter
    taskService.list(params)
      .then(r => { setTasks(r.data.data || []); setTotal(r.data.total || 0) })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }

  const loadAll = () => {
    taskService.list({ limit: 200 })
      .then(r => setAllTasks(r.data.data || []))
      .catch(() => {})
  }

  useEffect(() => { load() }, [page, search, statusFilter])
  useEffect(() => { loadAll() }, [])
  useEffect(() => {
    projectService.list({ limit: 100 }).then(r => setProjects(r.data.data || [])).catch(() => {})
    teamService.listMembers().then(r => setMembers(r.data.data || [])).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      await taskService.create({ ...form, project_id: form.project_id ? Number(form.project_id) : null, assigned_to_id: form.assigned_to_id ? Number(form.assigned_to_id) : null, start_date: toISODate(form.start_date), deadline: toISODate(form.deadline) })
      toast.success('Task created!')
      setShowModal(false)
      setForm({ title: '', project_id: '', assigned_to_id: '', status: 'todo', priority: 'medium', start_date: '', deadline: '', description: '' })
      load(); loadAll()
    } catch { toast.error('Failed to create task') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await taskService.delete(deleteId)
      toast.success('Task deleted')
      load(); loadAll()
    } catch { toast.error('Failed to delete') }
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const newStatus = result.destination.droppableId
    const taskId = Number(result.draggableId)
    setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    try {
      await taskService.updateStatus(taskId, newStatus)
    } catch {
      toast.error('Failed to update status')
      loadAll()
    }
  }

  const kanbanTasks = KANBAN_COLS.reduce((acc, col) => {
    acc[col] = allTasks.filter(t => t.status === col)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="p-5">
      <PageHeader
        title="Tasks"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowManageLabels(true)}><Filter size={12} /> Manage labels</button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={12} /> Add task</button>
          </>
        }
      />

      <ViewTabs tabs={VIEWS} active={view} onChange={setView} />

      {/* List View */}
      {view === 'list' && (
        <>
          <Toolbar
            left={
              <select className="input input-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
                <option value="">All status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="expired">Expired</option>
              </select>
            }
            right={
              <>
                <button className="btn btn-secondary"><FileDown size={12} />Excel</button>
                <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} />
              </>
            }
          />
          <div className="table-container">
            {loading ? <Loading /> : (
              <>
                <table className="table">
                  <thead>
                    <tr><th>Title</th><th>Project</th><th>Assigned To</th><th>Priority</th><th>Deadline</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0
                      ? <tr><td colSpan={7}><EmptyState /></td></tr>
                      : tasks.map(t => (
                        <tr key={t.id}>
                          <td className="font-medium">{t.title}</td>
                          <td className="text-gray-400 text-xs">{t.project?.title || '-'}</td>
                          <td>
                            {t.assigned_to
                              ? <div className="flex items-center gap-1"><Avatar name={t.assigned_to.name} /><span className="text-xs">{t.assigned_to.name}</span></div>
                              : <span className="text-gray-400">—</span>}
                          </td>
                          <td><span className={`text-xs font-medium capitalize ${priorityColor[t.priority] || ''}`}>{t.priority}</span></td>
                          <td className={`text-sm whitespace-nowrap ${new Date(t.deadline) < new Date() && t.status !== 'done' ? 'text-red-500' : 'text-gray-400'}`}>
                            {t.deadline ? new Date(t.deadline).toLocaleDateString('id') : '-'}
                          </td>
                          <td><StatusBadge status={t.status} /></td>
                          <td><button className="btn btn-danger text-xs py-0.5 px-2" onClick={() => setDeleteId(t.id)}>×</button></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
                <Pagination page={page} total={total} limit={10} onChange={setPage} />
              </>
            )}
          </div>
        </>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {KANBAN_COLS.map(col => (
              <div key={col} className="flex-shrink-0 w-64">
                <div className={`rounded-t-lg px-3 py-2 flex items-center justify-between ${COL_COLORS[col]}`}>
                  <span className="text-xs font-semibold text-gray-600">{COL_LABELS[col]}</span>
                  <span className="text-xs bg-white rounded-full px-1.5 py-0.5 text-gray-500">{kanbanTasks[col]?.length}</span>
                </div>
                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] p-2 rounded-b-lg border border-t-0 border-gray-200 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white'}`}
                    >
                      {kanbanTasks[col]?.map((task, index) => (
                        <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-sm cursor-grab ${snap.isDragging ? 'shadow-md ring-1 ring-blue-400' : ''}`}
                            >
                              <p className="font-medium text-gray-800 mb-1">{task.title}</p>
                              {task.project && <p className="text-gray-400 mb-1">{task.project.title}</p>}
                              <div className="flex items-center justify-between mt-2">
                                <span className={`font-medium capitalize ${priorityColor[task.priority] || ''}`}>{task.priority}</span>
                                {task.assigned_to && <Avatar name={task.assigned_to.name} />}
                              </div>
                              {task.deadline && (
                                <p className={`mt-1 ${new Date(task.deadline) < new Date() && task.status !== 'done' ? 'text-red-500' : 'text-gray-400'}`}>
                                  Due: {new Date(task.deadline).toLocaleDateString('id')}
                                </p>
                              )}
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

      {/* Gantt View */}
      {view === 'gantt' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
          <GanttView tasks={allTasks} />
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Task" size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <FormField label="Title" required>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
            </FormField>
          </div>
          <FormField label="Project">
            <select className="input" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </FormField>
          <FormField label="Assign To">
            <select className="input" value={form.assigned_to_id} onChange={e => setForm({ ...form, assigned_to_id: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </FormField>
          <FormField label="Priority">
            <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </FormField>
          <FormField label="Start Date">
            <input className="input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          </FormField>
          <FormField label="Deadline">
            <input className="input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Description">
              <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </FormField>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
      <ManageLabelsModal open={showManageLabels} onClose={() => setShowManageLabels(false)} />
    </div>
  )
}

function GanttView({ tasks }: { tasks: any[] }) {
  const valid = tasks.filter(t => t.start_date && t.deadline)
  if (valid.length === 0) return <EmptyState message="No tasks with dates to display." />

  const allDates = valid.flatMap(t => [new Date(t.start_date), new Date(t.deadline)])
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
  const totalDays = Math.max((maxDate.getTime() - minDate.getTime()) / 86400000, 1)

  const barColors: Record<string, string> = { todo: 'bg-gray-400', in_progress: 'bg-blue-500', done: 'bg-green-500', expired: 'bg-red-500' }

  return (
    <div className="min-w-[700px]">
      <div className="flex text-xs text-gray-400 mb-2 px-36">
        <span>{minDate.toLocaleDateString('id')}</span>
        <span className="ml-auto">{maxDate.toLocaleDateString('id')}</span>
      </div>
      <div className="space-y-2">
        {valid.map(t => {
          const start = (new Date(t.start_date).getTime() - minDate.getTime()) / 86400000
          const dur = Math.max((new Date(t.deadline).getTime() - new Date(t.start_date).getTime()) / 86400000, 1)
          const left = `${(start / totalDays) * 100}%`
          const width = `${Math.max((dur / totalDays) * 100, 2)}%`
          return (
            <div key={t.id} className="flex items-center gap-2 h-7">
              <div className="w-32 text-xs text-gray-600 truncate flex-shrink-0">{t.title}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded relative">
                <div
                  className={`absolute h-full rounded text-[10px] text-white flex items-center px-1 truncate ${barColors[t.status] || 'bg-blue-400'}`}
                  style={{ left, width }}
                  title={`${t.title}: ${new Date(t.start_date).toLocaleDateString('id')} - ${new Date(t.deadline).toLocaleDateString('id')}`}
                >
                  {t.title}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

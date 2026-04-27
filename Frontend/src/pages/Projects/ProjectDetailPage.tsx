import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectService, taskService } from '@/services/api'
import { toISODate } from '@/utils/format'
import { toast } from 'react-toastify'
import { ChevronLeft, Plus } from 'lucide-react'
import {
  Loading, EmptyState, StatusBadge, ProgressBar, Avatar,
  Modal, FormField, ConfirmDialog, ViewTabs
} from '@/components/common'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'timeline', label: 'Timeline' },
]

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null)
  const [savingTask, setSavingTask] = useState(false)
  const [taskForm, setTaskForm] = useState<any>({
    title: '', status: 'todo', priority: 'medium', start_date: '', deadline: '', description: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, tRes, tlRes] = await Promise.all([
        projectService.get(projectId),
        projectService.getTasks(projectId),
        projectService.getTimeline(projectId),
      ])
      setProject(pRes.data)
      setTasks(tRes.data.data || [])
      setTimeline(tlRes.data.data || [])
    } catch { toast.error('Failed to load project') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [projectId])

  const handleAddTask = async () => {
    if (!taskForm.title.trim()) { toast.error('Title is required'); return }
    setSavingTask(true)
    try {
      await taskService.create({ ...taskForm, project_id: projectId, start_date: toISODate(taskForm.start_date), deadline: toISODate(taskForm.deadline) })
      toast.success('Task created!')
      setShowTaskModal(false)
      setTaskForm({ title: '', status: 'todo', priority: 'medium', start_date: '', deadline: '', description: '' })
      const res = await projectService.getTasks(projectId)
      setTasks(res.data.data || [])
    } catch { toast.error('Failed to create task') }
    finally { setSavingTask(false) }
  }

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return
    try {
      await taskService.delete(deleteTaskId)
      toast.success('Task deleted')
      const res = await projectService.getTasks(projectId)
      setTasks(res.data.data || [])
    } catch { toast.error('Failed to delete task') }
  }

  const priorityColor: Record<string, string> = {
    high: 'text-red-500', medium: 'text-yellow-500', low: 'text-green-500',
  }

  if (loading) return <div className="p-5"><Loading /></div>
  if (!project) return <div className="p-5"><EmptyState message="Project not found." /></div>

  const doneTasks = tasks.filter(t => t.status === 'done').length

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/projects" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
          <ChevronLeft size={16} /> Projects
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{project.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{project.client?.name || 'No client'}</p>
            {project.description && <p className="text-sm text-gray-600 mt-2">{project.description}</p>}
          </div>
          <StatusBadge status={project.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Price</p>
            <p className="text-sm font-medium">{project.currency} {Number(project.price).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Start Date</p>
            <p className="text-sm">{project.start_date ? new Date(project.start_date).toLocaleDateString('id') : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Deadline</p>
            <p className={`text-sm ${new Date(project.deadline) < new Date() && project.status !== 'completed' ? 'text-red-500' : ''}`}>
              {project.deadline ? new Date(project.deadline).toLocaleDateString('id') : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Progress</p>
            <div className="flex items-center gap-2 mt-1">
              <ProgressBar value={project.progress} className="w-20" />
              <span className="text-xs text-gray-500">{project.progress}%</span>
            </div>
          </div>
        </div>
        {project.members?.length > 0 && (
          <div className="mt-3 flex items-center gap-1">
            <p className="text-xs text-gray-400 mr-2">Members:</p>
            {project.members.map((m: any) => <Avatar key={m.id} name={m.name} />)}
          </div>
        )}
      </div>

      <ViewTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">Total Tasks</p>
            <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">Completed</p>
            <p className="text-2xl font-semibold text-green-600">{doneTasks}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">Remaining</p>
            <p className="text-2xl font-semibold text-blue-600">{tasks.length - doneTasks}</p>
          </div>
        </div>
      )}

      {/* Tasks */}
      {tab === 'tasks' && (
        <div>
          <div className="flex justify-end mb-3">
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}><Plus size={12} /> Add task</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Title</th><th>Assigned To</th><th>Priority</th><th>Deadline</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {tasks.length === 0
                  ? <tr><td colSpan={6}><EmptyState /></td></tr>
                  : tasks.map(t => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.title}</td>
                      <td>
                        {t.assigned_to
                          ? <div className="flex items-center gap-1"><Avatar name={t.assigned_to.name} /><span className="text-xs text-gray-500">{t.assigned_to.name}</span></div>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                      <td><span className={`text-xs font-medium capitalize ${priorityColor[t.priority] || ''}`}>{t.priority}</span></td>
                      <td className={`text-sm ${new Date(t.deadline) < new Date() && t.status !== 'done' ? 'text-red-500' : 'text-gray-400'}`}>
                        {t.deadline ? new Date(t.deadline).toLocaleDateString('id') : '-'}
                      </td>
                      <td><StatusBadge status={t.status} /></td>
                      <td>
                        <button className="btn btn-danger text-xs py-0.5 px-2" onClick={() => setDeleteTaskId(t.id)}>×</button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="bg-white rounded-lg border border-gray-200">
          {timeline.length === 0
            ? <EmptyState />
            : (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <GanttChart tasks={timeline} />
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* Add Task Modal */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Add Task" size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddTask} disabled={savingTask}>{savingTask ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <FormField label="Title" required>
              <input className="input" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" />
            </FormField>
          </div>
          <FormField label="Status">
            <select className="input" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </FormField>
          <FormField label="Priority">
            <select className="input" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </FormField>
          <FormField label="Start Date">
            <input className="input" type="date" value={taskForm.start_date} onChange={e => setTaskForm({ ...taskForm, start_date: e.target.value })} />
          </FormField>
          <FormField label="Deadline">
            <input className="input" type="date" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Description">
              <textarea className="input" rows={2} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
            </FormField>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTaskId} onClose={() => setDeleteTaskId(null)} onConfirm={handleDeleteTask} />
    </div>
  )
}

function GanttChart({ tasks }: { tasks: any[] }) {
  const validTasks = tasks.filter(t => t.start_date && t.deadline)
  if (validTasks.length === 0) return <EmptyState />

  const dates = validTasks.flatMap(t => [new Date(t.start_date), new Date(t.deadline)])
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
  const totalDays = Math.max((maxDate.getTime() - minDate.getTime()) / 86400000, 1)

  const statusColors: Record<string, string> = {
    todo: 'bg-gray-300', in_progress: 'bg-blue-400', done: 'bg-green-400', expired: 'bg-red-400',
  }

  return (
    <div className="min-w-[600px]">
      <div className="text-xs text-gray-400 mb-2 flex justify-between">
        <span>{minDate.toLocaleDateString('id')}</span>
        <span>{maxDate.toLocaleDateString('id')}</span>
      </div>
      <div className="space-y-2">
        {validTasks.map(t => {
          const start = (new Date(t.start_date).getTime() - minDate.getTime()) / 86400000
          const duration = (new Date(t.deadline).getTime() - new Date(t.start_date).getTime()) / 86400000
          const left = (start / totalDays) * 100
          const width = Math.max((duration / totalDays) * 100, 2)
          return (
            <div key={t.id} className="flex items-center gap-3">
              <div className="w-32 text-xs text-gray-600 truncate flex-shrink-0">{t.title}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded relative">
                <div
                  className={`absolute h-full rounded text-[10px] text-white flex items-center px-1 truncate ${statusColors[t.status] || 'bg-blue-400'}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
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

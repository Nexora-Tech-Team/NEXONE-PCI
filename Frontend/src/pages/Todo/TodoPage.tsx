import { useEffect, useState } from 'react'
import { todoService } from '@/services/api'
import { ManageLabelsModal } from '@/components/common/ManageLabelsModal'
import { toast } from 'react-toastify'
import { Plus, Trash2, CheckCircle, Circle, Filter } from 'lucide-react'
import { Loading, EmptyState, ViewTabs } from '@/components/common'

const VIEWS = [{ key: 'pending', label: 'Pending' }, { key: 'done', label: 'Done' }]

export default function TodoPage() {
  const [view, setView] = useState('pending')
  const [showManageLabels, setShowManageLabels] = useState(false)
  const [todos, setTodos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const load = () => {
    setLoading(true)
    todoService.list({ done: view === 'done' })
      .then(r => setTodos(r.data.data || []))
      .catch(() => toast.error('Failed to load todos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [view])

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      await todoService.create({ title: newTitle })
      setNewTitle('')
      load()
    } catch { toast.error('Failed to add todo') }
    finally { setAdding(false) }
  }

  const handleMarkDone = async (id: number) => {
    try {
      await todoService.markDone(id)
      toast.success('Marked as done!')
      load()
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async (id: number) => {
    try {
      await todoService.delete(id)
      load()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="p-5 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">To Do</h1>
        <button className="btn btn-secondary text-xs" onClick={() => setShowManageLabels(true)}>
          <Filter size={11} /> Manage labels
        </button>
      </div>

      {/* Add new */}
      {view === 'pending' && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Add a new task... (Enter to save)"
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-300"
          />
          <button className="btn btn-primary" onClick={handleAdd} disabled={adding || !newTitle.trim()}>
            <Plus size={12} /> Add
          </button>
        </div>
      )}

      <ViewTabs tabs={VIEWS} active={view} onChange={setView} />

      {loading ? <Loading /> : (
        todos.length === 0
          ? <EmptyState message={view === 'pending' ? 'No pending tasks. You\'re all caught up!' : 'No completed tasks yet.'} />
          : (
            <div className="space-y-1">
              {todos.map(todo => (
                <div key={todo.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 group hover:shadow-sm transition-shadow">
                  <button
                    onClick={() => view === 'pending' && handleMarkDone(todo.id)}
                    className={`flex-shrink-0 ${view === 'pending' ? 'text-gray-300 hover:text-green-500' : 'text-green-500'} transition-colors`}
                  >
                    {view === 'done' ? <CheckCircle size={16} /> : <Circle size={16} />}
                  </button>
                  <span className={`flex-1 text-sm ${view === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {todo.title}
                  </span>
                  {view === 'done' && todo.done_at && (
                    <span className="text-xs text-gray-300">{new Date(todo.done_at).toLocaleDateString('id')}</span>
                  )}
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )
      )}

      {!loading && todos.length > 0 && view === 'pending' && (
        <p className="text-xs text-gray-400 mt-3">{todos.length} pending task{todos.length !== 1 ? 's' : ''}</p>
      )}

      <ManageLabelsModal open={showManageLabels} onClose={() => setShowManageLabels(false)} />
    </div>
  )
}

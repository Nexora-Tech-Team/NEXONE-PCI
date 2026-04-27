import { useEffect, useState } from 'react'
import { noteService } from '@/services/api'
import { toast } from 'react-toastify'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { Loading, EmptyState, Modal, FormField, ConfirmDialog } from '@/components/common'

const CATEGORIES = ['General', 'Meeting', 'Audit', 'Research', 'Personal', 'Other']

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editNote, setEditNote] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({ title: '', content: '', category: 'General' })

  const load = () => {
    setLoading(true)
    noteService.list()
      .then(r => setNotes(r.data.data || []))
      .catch(() => toast.error('Failed to load notes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    let list = notes
    if (search) { const q = search.toLowerCase(); list = list.filter(n => n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)) }
    if (category) list = list.filter(n => n.category === category)
    setFiltered(list)
  }, [search, category, notes])

  const openAdd = () => {
    setEditNote(null)
    setForm({ title: '', content: '', category: 'General' })
    setShowModal(true)
  }

  const openEdit = (n: any) => {
    setEditNote(n)
    setForm({ title: n.title || '', content: n.content || '', category: n.category || 'General' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.content.trim()) { toast.error('Content is required'); return }
    setSaving(true)
    try {
      if (editNote) { await noteService.update(editNote.id, form); toast.success('Note updated!') }
      else { await noteService.create(form); toast.success('Note created!') }
      setShowModal(false)
      load()
    } catch { toast.error('Failed to save note') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try { await noteService.delete(deleteId); toast.success('Note deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const categoryColors: Record<string, string> = {
    General: 'bg-gray-100 text-gray-600',
    Meeting: 'bg-blue-100 text-blue-600',
    Audit: 'bg-purple-100 text-purple-600',
    Research: 'bg-green-100 text-green-600',
    Personal: 'bg-yellow-100 text-yellow-600',
    Other: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Notes</h1>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={12} /> New note</button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." className="input input-sm pl-7 w-48" />
        </div>
        <select className="input input-sm w-36" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : (
        filtered.length === 0
          ? <EmptyState message="No notes found." />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(n => (
                <div key={n.id} className="bg-white border border-gray-200 rounded-lg p-4 group hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      {n.title && <h3 className="font-medium text-gray-800 text-sm">{n.title}</h3>}
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${categoryColors[n.category] || categoryColors.General}`}>{n.category}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <button onClick={() => openEdit(n)} className="p-1 text-gray-400 hover:text-blue-500"><Edit2 size={12} /></button>
                      <button onClick={() => setDeleteId(n.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{n.content}</p>
                  <p className="text-xs text-gray-300 mt-3">{new Date(n.created_at).toLocaleDateString('id')}</p>
                </div>
              ))}
            </div>
          )
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editNote ? 'Edit Note' : 'New Note'} size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Title">
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Note title (optional)" />
          </FormField>
          <FormField label="Category">
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Content" required>
            <textarea className="input" rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your note..." />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  )
}

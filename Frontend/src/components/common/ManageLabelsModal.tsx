import { useState, useEffect } from 'react'
import { Check, X as XIcon } from 'lucide-react'
import { labelService } from '@/services/api'
import { toast } from 'react-toastify'
import { Modal } from './index'

const LABEL_COLORS = [
  '#22c55e','#14b8a6','#3b82f6','#94a3b8','#eab308','#f97316',
  '#ef4444','#ec4899','#a855f7','#06b6d4','#1e293b','#d1d5db',
]

interface Props {
  open: boolean
  onClose: () => void
  onUpdated?: (labels: any[]) => void
}

export function ManageLabelsModal({ open, onClose, onUpdated }: Props) {
  const [labels, setLabels] = useState<any[]>([])
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      labelService.list().then(r => {
        const data = r.data.data || []
        setLabels(data)
        onUpdated?.(data)
      })
    }
  }, [open])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await labelService.create({ name: name.trim(), color })
      toast.success('Label created')
      setName('')
      const r = await labelService.list()
      const data = r.data.data || []
      setLabels(data)
      onUpdated?.(data)
    } catch { toast.error('Failed to create label') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      await labelService.delete(id)
      const updated = labels.filter(l => l.id !== id)
      setLabels(updated)
      onUpdated?.(updated)
    } catch { toast.error('Failed to delete label') }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage labels"
      footer={
        <button className="btn btn-secondary w-full" onClick={onClose}>Close</button>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-2">Pick a color</p>
          <div className="flex flex-wrap gap-2">
            {LABEL_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: color === c ? '#1e293b' : 'transparent' }}
              />
            ))}
            <div
              className="h-7 px-3 rounded-full flex items-center text-xs font-medium text-white ml-1"
              style={{ backgroundColor: color }}
            >
              {name || 'Preview'}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Label name..."
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          />
          <button
            className="btn btn-primary flex items-center gap-1"
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            <Check size={14} /> Save
          </button>
        </div>

        {labels.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Existing labels</p>
            <div className="flex flex-wrap gap-2">
              {labels.map(l => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: l.color || '#3b82f6' }}
                >
                  {l.name}
                  <button className="ml-1 hover:opacity-75" onClick={() => handleDelete(l.id)}>
                    <XIcon size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

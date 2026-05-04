import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { eventService } from '@/services/api'
import { toISODate } from '@/utils/format'
import { ManageLabelsModal } from '@/components/common/ManageLabelsModal'
import { toast } from 'react-toastify'
import { Plus, Filter, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, Modal, FormField, ConfirmDialog, Loading } from '@/components/common'

const localizer = momentLocalizer(moment)

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<any[]>([])
  const [calEvents, setCalEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768
  const [view, setView] = useState<string>(() => (
    typeof window !== 'undefined' && window.innerWidth < 768
      ? Views.AGENDA
      : Views.MONTH
  ))
  const [date, setDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [showManageLabels, setShowManageLabels] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    title: '', description: '', start_date: '', end_date: '', all_day: false, color: '#3b82f6', type: '',
  })

  const load = () => {
    setLoading(true)
    eventService.list({ month: date.getMonth() + 1, year: date.getFullYear() })
      .then(r => {
        const raw = r.data.data || []
        setEvents(raw)
        setCalEvents(raw.map((e: any) => ({
          id: e.id,
          title: e.title,
          start: new Date(e.start_date),
          end: new Date(e.end_date),
          allDay: e.all_day,
          resource: e,
        })))
      })
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [date.getMonth(), date.getFullYear()])

  const openAdd = (slotInfo?: { start: Date; end: Date }) => {
    setEditItem(null)
    setForm({
      title: '',
      description: '',
      start_date: slotInfo ? moment(slotInfo.start).format('YYYY-MM-DDTHH:mm') : '',
      end_date: slotInfo ? moment(slotInfo.end).format('YYYY-MM-DDTHH:mm') : '',
      all_day: false,
      color: '#3b82f6',
      type: '',
    })
    setShowModal(true)
  }

  const openEdit = (e: any) => {
    setSelectedEvent(null)
    setEditItem(e)
    setForm({
      title: e.title,
      description: e.description || '',
      start_date: e.start_date ? moment(e.start_date).format('YYYY-MM-DDTHH:mm') : '',
      end_date: e.end_date ? moment(e.end_date).format('YYYY-MM-DDTHH:mm') : '',
      all_day: e.all_day,
      color: e.color || '#3b82f6',
      type: e.type || '',
    })
    setShowModal(true)
  }

  useEffect(() => {
    if (searchParams.get('compose') !== 'new') return

    setEditItem(null)
    setForm({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      all_day: false,
      color: '#3b82f6',
      type: '',
    })
    setShowModal(true)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('compose')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      if (editItem) {
        await eventService.update(editItem.id, { ...form, start_date: toISODate(form.start_date), end_date: toISODate(form.end_date) })
        toast.success('Event updated!')
      } else {
        await eventService.create({ ...form, start_date: toISODate(form.start_date), end_date: toISODate(form.end_date) })
        toast.success('Event created!')
      }
      setShowModal(false)
      load()
    } catch { toast.error('Failed to save event') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await eventService.delete(deleteId)
      toast.success('Event deleted')
      setSelectedEvent(null)
      load()
    } catch { toast.error('Failed to delete') }
  }

  const onSelectEvent = (event: any) => setSelectedEvent(event.resource)

  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: event.resource?.color || '#3b82f6',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      fontSize: '11px',
    },
  })

  const fmt = (iso: string) => iso ? moment(iso).format('DD MMM YYYY, HH:mm') : '-'

  return (
    <div className="p-5">
      <PageHeader
        title="Events"
        actions={<>
          <button className="btn btn-secondary" onClick={() => setShowManageLabels(true)}><Filter size={12} /> Manage labels</button>
          <button className="btn btn-primary" onClick={() => openAdd()}><Plus size={12} /> Add event</button>
        </>}
      />

      {loading
        ? <Loading />
        : (
          <div className="overflow-hidden rounded-[22px] border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
            <Calendar
              localizer={localizer}
              events={calEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: isMobileViewport ? 560 : 650 }}
              view={view as any}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectSlot={openAdd}
              onSelectEvent={onSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            />
          </div>
        )
      }

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            {/* Color header */}
            <div
              className="flex items-center justify-between rounded-t-2xl px-5 py-4"
              style={{ backgroundColor: selectedEvent.color || '#3b82f6' }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                  {selectedEvent.type || 'Event'}
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-white">{selectedEvent.title}</h3>
              </div>
              <button
                className="ml-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={() => setSelectedEvent(null)}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="space-y-3 px-5 py-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Start</p>
                  <p className="font-medium text-gray-800">{fmt(selectedEvent.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">End</p>
                  <p className="font-medium text-gray-800">{fmt(selectedEvent.end_date)}</p>
                </div>
              </div>

              {selectedEvent.all_day && (
                <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  All day
                </span>
              )}

              {selectedEvent.description && (
                <div>
                  <p className="text-xs text-gray-400">Description</p>
                  <p className="mt-0.5 text-sm text-gray-700">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
              <button
                className="btn btn-danger flex items-center gap-1.5"
                onClick={() => { setDeleteId(selectedEvent.id) }}
              >
                <Trash2 size={13} /> Delete
              </button>
              <button
                className="btn btn-primary flex items-center gap-1.5"
                onClick={() => openEdit(selectedEvent)}
              >
                <Pencil size={13} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Event' : 'Add Event'}
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
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
            </FormField>
          </div>
          <FormField label="Start Date & Time">
            <input className="input" type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          </FormField>
          <FormField label="End Date & Time">
            <input className="input" type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </FormField>
          <FormField label="Type">
            <input className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="meeting, deadline..." />
          </FormField>
          <FormField label="Color">
            <input className="input" type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          </FormField>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="all_day" checked={form.all_day} onChange={e => setForm({ ...form, all_day: e.target.checked })} />
            <label htmlFor="all_day" className="text-sm text-gray-600">All day event</label>
          </div>
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

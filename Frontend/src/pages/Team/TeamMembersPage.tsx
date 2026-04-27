import { useEffect, useState } from 'react'
import { teamService } from '@/services/api'
import { toast } from 'react-toastify'
import { Search, Mail, Phone, Briefcase, KeyRound } from 'lucide-react'
import { Loading, EmptyState, Modal, FormField } from '@/components/common'

export default function TeamMembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMember, setEditMember] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [form, setForm] = useState<any>({ name: '', job_title: '', phone: '', role: 'member' })

  const load = () => {
    setLoading(true)
    teamService.listMembers()
      .then(r => setMembers(r.data.data || []))
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!search) { setFiltered(members); return }
    const q = search.toLowerCase()
    setFiltered(members.filter(m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.job_title?.toLowerCase().includes(q)))
  }, [search, members])

  const openEdit = (m: any) => {
    setEditMember(m)
    setForm({ name: m.name, job_title: m.job_title || '', phone: m.phone || '', role: m.role })
    setShowModal(true)
  }

  const handleResetPassword = async () => {
    if (!editMember) return
    if (!window.confirm(`Reset password for ${editMember.name}? They will receive a temporary password.`)) return
    setResetting(true)
    try {
      const res = await teamService.resetPassword(editMember.id)
      const tempPass = res.data?.temp_password || res.data?.temporary_password
      if (tempPass) {
        toast.success(`Password reset! Temporary password: ${tempPass}`, { autoClose: false })
      } else {
        toast.success('Password has been reset successfully.')
      }
    } catch { toast.error('Failed to reset password') }
    finally { setResetting(false) }
  }

  const handleSave = async () => {
    if (!editMember) return
    setSaving(true)
    try {
      await teamService.updateMember(editMember.id, form)
      toast.success('Member updated!')
      setShowModal(false)
      load()
    } catch { toast.error('Failed to update member') }
    finally { setSaving(false) }
  }

  const initials = (name: string) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const roleColors: Record<string, string> = { admin: 'badge-blue', member: 'badge-gray' }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Team Members</h1>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="input input-sm pl-7 w-48" />
        </div>
      </div>

      {loading ? <Loading /> : (
        filtered.length === 0
          ? <EmptyState message="No members found." />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(m => (
                <div key={m.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {initials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-800 text-sm truncate">{m.name}</p>
                        <span className={`badge text-[10px] flex-shrink-0 ${roleColors[m.role] || 'badge-gray'}`}>{m.role}</span>
                      </div>
                      {m.job_title && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Briefcase size={10} />{m.job_title}
                        </p>
                      )}
                      {m.email && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail size={10} />{m.email}
                        </p>
                      )}
                      {m.phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} />{m.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${m.clocked_in ? 'bg-green-400' : 'bg-gray-300'}`} />
                      <span className="text-xs text-gray-400">{m.clocked_in ? 'Clocked in' : 'Not clocked in'}</span>
                    </div>
                    <button className="btn btn-secondary text-xs py-0.5 px-2" onClick={() => openEdit(m)}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Edit Member"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              className="btn btn-secondary flex items-center gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={handleResetPassword}
              disabled={resetting}
            >
              <KeyRound size={12} />
              {resetting ? 'Resetting...' : 'Reset Password'}
            </button>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <FormField label="Name">
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Job Title">
            <input className="input" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} placeholder="e.g. Senior Auditor" />
          </FormField>
          <FormField label="Phone">
            <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+62..." />
          </FormField>
          <FormField label="Role">
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  )
}

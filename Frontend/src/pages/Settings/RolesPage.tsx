import { useEffect, useState } from 'react'
import { roleService } from '@/services/api'
import { toast } from 'react-toastify'
import { Plus, Trash2, ShieldCheck } from 'lucide-react'
import { PageHeader, Modal, ConfirmDialog, Loading, EmptyState } from '@/components/common'

const MENUS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'events', label: 'Events' },
  { key: 'clients', label: 'Clients' },
  { key: 'projects', label: 'Projects' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'leads', label: 'Leads' },
  { key: 'sales', label: 'Sales' },
  { key: 'notes', label: 'Notes' },
  { key: 'messages', label: 'Messages' },
  { key: 'team', label: 'Team' },
  { key: 'files', label: 'Files' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'reports', label: 'Reports' },
  { key: 'todo', label: 'To Do' },
  { key: 'settings', label: 'Settings' },
]

interface Role {
  id: number
  name: string
  description: string
  permissions?: { menu: string; can_read: boolean; can_edit: boolean }[]
}

type PermMap = Record<string, { can_read: boolean; can_edit: boolean }>

function buildPermMap(permissions: Role['permissions']): PermMap {
  const map: PermMap = {}
  MENUS.forEach(m => { map[m.key] = { can_read: false, can_edit: false } })
  permissions?.forEach(p => {
    map[p.menu] = { can_read: p.can_read, can_edit: p.can_edit }
  })
  return map
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermModal, setShowPermModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [form, setForm] = useState({ name: '', description: '' })
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [permRole, setPermRole] = useState<Role | null>(null)
  const [permMap, setPermMap] = useState<PermMap>({})

  const load = () => {
    setLoading(true)
    roleService.list()
      .then(r => setRoles(r.data.data || []))
      .catch(() => toast.error('Failed to load roles'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Role name is required'); return }
    setSaving(true)
    try {
      await roleService.create({ name: form.name, description: form.description })
      toast.success('Role created!')
      setShowCreateModal(false)
      setForm({ name: '', description: '' })
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to create role')
    } finally { setSaving(false) }
  }

  const handleUpdate = async () => {
    if (!editRole) return
    if (!form.name.trim()) { toast.error('Role name is required'); return }
    setSaving(true)
    try {
      await roleService.update(editRole.id, { name: form.name, description: form.description })
      toast.success('Role updated!')
      setShowEditModal(false)
      load()
    } catch { toast.error('Failed to update role') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await roleService.delete(deleteId)
      toast.success('Role deleted!')
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to delete role')
    } finally { setDeleteId(null) }
  }

  const openEdit = (r: Role) => {
    setEditRole(r)
    setForm({ name: r.name, description: r.description || '' })
    setShowEditModal(true)
  }

  const openPermissions = async (r: Role) => {
    try {
      const res = await roleService.get(r.id)
      const detail: Role = res.data
      setPermRole(detail)
      setPermMap(buildPermMap(detail.permissions))
      setShowPermModal(true)
    } catch { toast.error('Failed to load permissions') }
  }

  const handleSavePermissions = async () => {
    if (!permRole) return
    setSaving(true)
    const permissions = MENUS.map(m => ({
      menu: m.key,
      can_read: permMap[m.key]?.can_read ?? false,
      can_edit: permMap[m.key]?.can_edit ?? false,
    }))
    try {
      await roleService.setPermissions(permRole.id, permissions)
      toast.success('Permissions saved!')
      setShowPermModal(false)
      load()
    } catch { toast.error('Failed to save permissions') }
    finally { setSaving(false) }
  }

  const togglePerm = (menu: string, field: 'can_read' | 'can_edit') => {
    setPermMap(prev => {
      const current = { ...prev[menu] }
      current[field] = !current[field]
      if (field === 'can_edit' && current.can_edit) current.can_read = true
      if (field === 'can_read' && !current.can_read) current.can_edit = false
      return { ...prev, [menu]: current }
    })
  }

  const toggleAll = (field: 'can_read' | 'can_edit', value: boolean) => {
    setPermMap(prev => {
      const next = { ...prev }
      MENUS.forEach(m => {
        next[m.key] = { ...next[m.key], [field]: value }
        if (field === 'can_edit' && value) next[m.key].can_read = true
        if (field === 'can_read' && !value) next[m.key].can_edit = false
      })
      return next
    })
  }

  return (
    <div className="p-5">
      <PageHeader
        title="App Roles"
        actions={
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '' }); setShowCreateModal(true) }}>
            <Plus size={12} /> Add role
          </button>
        }
      />

      {loading ? <Loading /> : roles.length === 0 ? <EmptyState /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td className="font-medium text-gray-800">{r.name}</td>
                  <td className="text-gray-500">{r.description || '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary text-xs py-0.5 px-2" onClick={() => openPermissions(r)}>
                        <ShieldCheck size={11} /> Permissions
                      </button>
                      <button className="btn btn-secondary text-xs py-0.5 px-2" onClick={() => openEdit(r)}>
                        Edit
                      </button>
                      <button className="btn btn-danger text-xs py-0.5 px-2" onClick={() => setDeleteId(r.id)}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Role Modal ──────────────────────────── */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Role"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <RoleFormFields form={form} onChange={setForm} />
        </div>
      </Modal>

      {/* ── Edit Role Modal ────────────────────────────── */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Role"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <RoleFormFields form={form} onChange={setForm} />
        </div>
      </Modal>

      {/* ── Permissions Matrix Modal ───────────────────── */}
      <Modal
        open={showPermModal}
        onClose={() => setShowPermModal(false)}
        title={`Permissions — ${permRole?.name}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowPermModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSavePermissions} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium">Menu</th>
                <th className="text-center py-2 px-3 text-gray-600 font-medium w-20">
                  <div>Read</div>
                  <div className="flex justify-center gap-1 mt-1">
                    <button className="text-[10px] text-blue-500 hover:underline" onClick={() => toggleAll('can_read', true)}>all</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-[10px] text-gray-400 hover:underline" onClick={() => toggleAll('can_read', false)}>none</button>
                  </div>
                </th>
                <th className="text-center py-2 px-3 text-gray-600 font-medium w-20">
                  <div>Edit</div>
                  <div className="flex justify-center gap-1 mt-1">
                    <button className="text-[10px] text-blue-500 hover:underline" onClick={() => toggleAll('can_edit', true)}>all</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-[10px] text-gray-400 hover:underline" onClick={() => toggleAll('can_edit', false)}>none</button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {MENUS.map(m => (
                <tr key={m.key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4 text-gray-700">{m.label}</td>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={permMap[m.key]?.can_read ?? false}
                      onChange={() => togglePerm(m.key, 'can_read')}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={permMap[m.key]?.can_edit ?? false}
                      onChange={() => togglePerm(m.key, 'can_edit')}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">Enabling Edit automatically enables Read. Disabling Read automatically disables Edit.</p>
        </div>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Delete this role? Users assigned to it will lose their app role."
      />
    </div>
  )
}

function RoleFormFields({ form, onChange }: { form: { name: string; description: string }; onChange: (f: any) => void }) {
  return (
    <>
      <div className="flex items-start gap-2">
        <span className="w-28 text-sm text-gray-600 flex-shrink-0 pt-2">Role Name *</span>
        <input
          className="input flex-1"
          value={form.name}
          onChange={e => onChange((f: any) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Sales Staff"
        />
      </div>
      <div className="flex items-start gap-2">
        <span className="w-28 text-sm text-gray-600 flex-shrink-0 pt-2">Description</span>
        <input
          className="input flex-1"
          value={form.description}
          onChange={e => onChange((f: any) => ({ ...f, description: e.target.value }))}
          placeholder="Optional description"
        />
      </div>
    </>
  )
}

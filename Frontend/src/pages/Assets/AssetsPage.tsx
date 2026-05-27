import { useEffect, useMemo, useState } from 'react'
import { assetService } from '@/services/api'
import { toast } from 'react-toastify'
import {
  ArrowLeftRight,
  Boxes,
  CheckCircle,
  ClipboardCheck,
  History,
  Plus,
  QrCode,
  RotateCcw,
  Wrench,
} from 'lucide-react'
import { ConfirmDialog, EmptyState, FormField, Loading, Modal, PageHeader, Pagination, PriceInput, SearchInput, Toolbar } from '@/components/common'

const PAGE_SIZE = 30
const STATUSES = ['available', 'assigned', 'maintenance', 'damaged', 'retired', 'lost']
const CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged']

const emptyAsset = {
  asset_code: '',
  name: '',
  category_id: '',
  location_id: '',
  assigned_to_id: '',
  serial_number: '',
  brand: '',
  model: '',
  status: 'available',
  condition: 'good',
  purchase_date: '',
  purchase_price: '',
  vendor: '',
  warranty_expiry: '',
  notes: '',
}

function titleCase(value?: string) {
  if (!value) return '-'
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function dateValue(value?: string) {
  return value ? value.split('T')[0] : ''
}

function assetPayload(form: any) {
  const nullableNumber = (value: any) => value ? Number(value) : null
  return {
    ...form,
    category_id: nullableNumber(form.category_id),
    location_id: nullableNumber(form.location_id),
    assigned_to_id: nullableNumber(form.assigned_to_id),
    purchase_price: Number(form.purchase_price || 0),
  }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [options, setOptions] = useState<any>({ categories: [], locations: [], users: [] })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [editAsset, setEditAsset] = useState<any>(null)
  const [form, setForm] = useState<any>(emptyAsset)
  const [actionAsset, setActionAsset] = useState<any>(null)
  const [actionType, setActionType] = useState<'assign' | 'move' | 'maintenance' | 'label' | 'history' | null>(null)
  const [actionForm, setActionForm] = useState<any>({})
  const [labelSvg, setLabelSvg] = useState<{ qr?: string; barcode?: string }>({})
  const [history, setHistory] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [lookupType, setLookupType] = useState<'category' | 'location' | null>(null)
  const [lookupForm, setLookupForm] = useState<any>({ id: null, name: '', code: '', description: '' })
  const [lookupDeleteItem, setLookupDeleteItem] = useState<any>(null)

  const loadOptions = () => {
    assetService.options()
      .then(r => setOptions(r.data || { categories: [], locations: [], users: [] }))
      .catch(() => toast.error('Failed to load asset options'))
  }

  const loadAssets = () => {
    setLoading(true)
    assetService.list({ page, limit: PAGE_SIZE, q: search, status })
      .then(r => {
        setAssets(r.data.data || [])
        setTotal(r.data.total || 0)
      })
      .catch(() => toast.error('Failed to load assets'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOptions() }, [])
  useEffect(() => { loadAssets() }, [page, search, status])

  const stats = useMemo(() => {
    const summary = { total, available: 0, assigned: 0, maintenance: 0 }
    for (const asset of assets) {
      if (asset.status === 'available') summary.available += 1
      if (asset.status === 'assigned') summary.assigned += 1
      if (asset.status === 'maintenance') summary.maintenance += 1
    }
    return summary
  }, [assets, total])

  const openAdd = () => {
    setEditAsset(null)
    setForm(emptyAsset)
    setShowAssetModal(true)
  }

  const openEdit = (asset: any) => {
    setEditAsset(asset)
    setForm({
      asset_code: asset.asset_code || '',
      name: asset.name || '',
      category_id: asset.category_id || '',
      location_id: asset.location_id || '',
      assigned_to_id: asset.assigned_to_id || '',
      serial_number: asset.serial_number || '',
      brand: asset.brand || '',
      model: asset.model || '',
      status: asset.status || 'available',
      condition: asset.condition || 'good',
      purchase_date: dateValue(asset.purchase_date),
      purchase_price: asset.purchase_price || '',
      vendor: asset.vendor || '',
      warranty_expiry: dateValue(asset.warranty_expiry),
      notes: asset.notes || '',
    })
    setShowAssetModal(true)
  }

  const saveAsset = async () => {
    if (!form.name.trim()) {
      toast.error('Asset name is required')
      return
    }
    setSaving(true)
    try {
      if (editAsset) {
        await assetService.update(editAsset.id, assetPayload(form))
        toast.success('Asset updated')
      } else {
        await assetService.create(assetPayload(form))
        toast.success('Asset created')
      }
      setShowAssetModal(false)
      loadAssets()
    } catch {
      toast.error('Failed to save asset')
    } finally {
      setSaving(false)
    }
  }

  const openAction = async (type: typeof actionType, asset: any) => {
    setActionAsset(asset)
    setActionType(type)
    setActionForm({})
    setLabelSvg({})
    setHistory(null)
    if (type === 'label') {
      try {
        const [qr, barcode] = await Promise.all([assetService.qr(asset.id), assetService.barcode(asset.id)])
        setLabelSvg({ qr: qr.data, barcode: barcode.data })
      } catch {
        toast.error('Failed to load QR/Barcode')
      }
    }
    if (type === 'history') {
      try {
        const res = await assetService.history(asset.id)
        setHistory(res.data)
      } catch {
        toast.error('Failed to load asset history')
      }
    }
  }

  const runAction = async () => {
    if (!actionAsset || !actionType) return
    setSaving(true)
    try {
      if (actionType === 'assign') await assetService.assign(actionAsset.id, { ...actionForm, user_id: Number(actionForm.user_id) })
      if (actionType === 'move') await assetService.move(actionAsset.id, { ...actionForm, location_id: Number(actionForm.location_id) })
      if (actionType === 'maintenance') await assetService.maintenance(actionAsset.id, { ...actionForm, cost: Number(actionForm.cost || 0) })
      toast.success('Asset action saved')
      setActionType(null)
      loadAssets()
    } catch {
      toast.error('Failed to save action')
    } finally {
      setSaving(false)
    }
  }

  const returnAsset = async (asset: any) => {
    try {
      await assetService.returnAsset(asset.id, { condition_back: asset.condition || 'good' })
      toast.success('Asset returned')
      loadAssets()
    } catch {
      toast.error('Failed to return asset')
    }
  }

  const deleteAsset = async () => {
    if (!deleteId) return
    try {
      await assetService.delete(deleteId)
      toast.success('Asset deleted')
      loadAssets()
    } catch {
      toast.error('Failed to delete asset')
    }
  }

  const saveLookup = async () => {
    if (!lookupType || !lookupForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      if (lookupType === 'category') {
        if (lookupForm.id) await assetService.updateCategory(lookupForm.id, lookupForm)
        else await assetService.createCategory(lookupForm)
      }
      if (lookupType === 'location') {
        if (lookupForm.id) await assetService.updateLocation(lookupForm.id, lookupForm)
        else await assetService.createLocation(lookupForm)
      }
      toast.success(`${titleCase(lookupType)} ${lookupForm.id ? 'updated' : 'created'}`)
      setLookupForm({ id: null, name: '', code: '', description: '' })
      loadOptions()
    } catch {
      toast.error(`Failed to save ${lookupType}`)
    } finally {
      setSaving(false)
    }
  }

  const deleteLookup = async () => {
    if (!lookupType || !lookupDeleteItem) return
    try {
      if (lookupType === 'category') await assetService.deleteCategory(lookupDeleteItem.id)
      if (lookupType === 'location') await assetService.deleteLocation(lookupDeleteItem.id)
      toast.success(`${titleCase(lookupType)} deleted`)
      if (lookupForm.id === lookupDeleteItem.id) setLookupForm({ id: null, name: '', code: '', description: '' })
      setLookupDeleteItem(null)
      loadOptions()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || `Failed to delete ${lookupType}`)
    }
  }

  return (
    <div className="p-5">
      <PageHeader
        title="Asset Management"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => { setLookupType('category'); setLookupForm({ id: null, name: '', code: '', description: '' }); setLookupDeleteItem(null) }}>
              Category list
            </button>
            <button className="btn btn-secondary" onClick={() => { setLookupType('location'); setLookupForm({ id: null, name: '', code: '', description: '' }); setLookupDeleteItem(null) }}>
              Location list
            </button>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={12} /> Add asset</button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Summary icon={Boxes} label="Total assets" value={stats.total} />
        <Summary icon={CheckCircle} label="Available" value={stats.available} />
        <Summary icon={ClipboardCheck} label="Assigned" value={stats.assigned} />
        <Summary icon={Wrench} label="Maintenance" value={stats.maintenance} />
      </div>

      <Toolbar
        left={
          <select className="input input-sm h-10 w-full sm:w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="all">All statuses</option>
            {STATUSES.map(item => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
        }
        right={<SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search assets..." />}
      />

      <div className="table-container">
        {loading ? <Loading /> : (
          <table className="table">
            <thead>
              <tr>
                <th className="w-14">No.</th>
                <th>Asset</th>
                <th>Category</th>
                <th>Location</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Condition</th>
                <th className="w-72"></th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr><td colSpan={8}><EmptyState message="No assets yet." /></td></tr>
              ) : assets.map((asset, index) => (
                <tr key={asset.id}>
                  <td className="text-gray-400">{(page - 1) * PAGE_SIZE + index + 1}</td>
                  <td>
                    <div>
                      <p className="font-medium text-gray-900">{asset.name}</p>
                      <p className="text-xs text-gray-400">{asset.asset_code} {asset.serial_number ? `• SN ${asset.serial_number}` : ''}</p>
                    </div>
                  </td>
                  <td>{asset.category?.name || '-'}</td>
                  <td>{asset.location?.name || '-'}</td>
                  <td>{asset.assigned_to?.name || '-'}</td>
                  <td><span className="badge badge-blue">{titleCase(asset.status)}</span></td>
                  <td>{titleCase(asset.condition)}</td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-1">
                      <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => openAction('label', asset)}><QrCode size={12} /> Label</button>
                      <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => openAction('assign', asset)}><ClipboardCheck size={12} /> Assign</button>
                      {asset.assigned_to_id && <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => returnAsset(asset)}><RotateCcw size={12} /></button>}
                      <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => openAction('move', asset)}><ArrowLeftRight size={12} /></button>
                      <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => openAction('maintenance', asset)}><Wrench size={12} /></button>
                      <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => openAction('history', asset)}><History size={12} /></button>
                      <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => openEdit(asset)}>Edit</button>
                      <button className="btn btn-danger text-xs py-1 px-2" onClick={() => setDeleteId(asset.id)}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />}
      </div>

      <AssetFormModal
        open={showAssetModal}
        editAsset={editAsset}
        form={form}
        setForm={setForm}
        options={options}
        saving={saving}
        onClose={() => setShowAssetModal(false)}
        onSave={saveAsset}
      />

      <ActionModal
        type={actionType}
        asset={actionAsset}
        form={actionForm}
        setForm={setActionForm}
        options={options}
        saving={saving}
        labelSvg={labelSvg}
        history={history}
        onClose={() => setActionType(null)}
        onSave={runAction}
      />

      <LookupModal
        type={lookupType}
        form={lookupForm}
        setForm={setLookupForm}
        items={lookupType === 'category' ? options.categories : options.locations}
        saving={saving}
        onClose={() => { setLookupType(null); setLookupDeleteItem(null) }}
        onSave={saveLookup}
        onDelete={setLookupDeleteItem}
      />

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={deleteAsset} />
      <ConfirmDialog
        open={!!lookupDeleteItem}
        onClose={() => setLookupDeleteItem(null)}
        onConfirm={deleteLookup}
        title={`Delete ${titleCase(lookupType || '')}`}
        message={`Delete "${lookupDeleteItem?.name || ''}"? This is only allowed when it is not used by any asset.`}
      />
    </div>
  )
}

function Summary({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={18} />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function AssetFormModal({ open, editAsset, form, setForm, options, saving, onClose, onSave }: any) {
  return (
    <Modal open={open} onClose={onClose} title={editAsset ? 'Edit Asset' : 'Add Asset'} size="lg"
      footer={<><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save'}</button></>}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Asset Code">
          <input className="input" value={form.asset_code} onChange={e => setForm({ ...form, asset_code: e.target.value })} placeholder="Auto generated" />
        </FormField>
        <FormField label="Asset Name" required>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Category">
          <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
            <option value="">Select category</option>
            {options.categories.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </FormField>
        <FormField label="Location">
          <select className="input" value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })}>
            <option value="">Select location</option>
            {options.locations.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </FormField>
        <FormField label="Brand">
          <input className="input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
        </FormField>
        <FormField label="Model">
          <input className="input" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
        </FormField>
        <FormField label="Serial Number">
          <input className="input" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
        </FormField>
        <FormField label="Vendor">
          <input className="input" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
        </FormField>
        <FormField label="Status">
          <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map(item => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
        </FormField>
        <FormField label="Condition">
          <select className="input" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
            {CONDITIONS.map(item => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
        </FormField>
        <FormField label="Purchase Date">
          <input type="date" className="input" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
        </FormField>
        <FormField label="Warranty Expiry">
          <input type="date" className="input" value={form.warranty_expiry} onChange={e => setForm({ ...form, warranty_expiry: e.target.value })} />
        </FormField>
        <FormField label="Purchase Price">
          <PriceInput value={form.purchase_price} onChange={value => setForm({ ...form, purchase_price: value })} />
        </FormField>
        <div className="col-span-2">
          <FormField label="Notes">
            <textarea className="input min-h-[88px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>
        </div>
      </div>
    </Modal>
  )
}

function ActionModal({ type, asset, form, setForm, options, saving, labelSvg, history, onClose, onSave }: any) {
  if (!type || !asset) return null
  const title = type === 'label' ? 'QR & Barcode Label' : type === 'history' ? 'Asset History' : titleCase(type)
  const readOnly = type === 'label' || type === 'history'
  return (
    <Modal open={!!type} onClose={onClose} title={`${title} - ${asset.asset_code}`} size="lg"
      footer={!readOnly && <><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save'}</button></>}
    >
      {type === 'label' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 p-3 [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: labelSvg.qr || '' }} />
          <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 p-3 [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: labelSvg.barcode || '' }} />
        </div>
      )}
      {type === 'history' && (
        <div className="space-y-4">
          <HistoryBlock title="Assignments" items={history?.assignments} render={(item: any) => `${item.user?.name || 'User'} assigned at ${new Date(item.assigned_at).toLocaleString('id')}`} />
          <HistoryBlock title="Movements" items={history?.movements} render={(item: any) => `${item.from_location?.name || '-'} → ${item.to_location?.name || '-'} by ${item.moved_by?.name || '-'}`} />
          <HistoryBlock title="Maintenance" items={history?.maintenances} render={(item: any) => `${item.title} • ${titleCase(item.status)} • IDR ${Number(item.cost || 0).toLocaleString('id-ID')}`} />
        </div>
      )}
      {type === 'assign' && (
        <div className="space-y-3">
          <FormField label="Assign To" required>
            <select className="input" value={form.user_id || ''} onChange={e => setForm({ ...form, user_id: e.target.value })}>
              <option value="">Select user</option>
              {options.users.map((user: any) => <option key={user.id} value={user.id}>{user.name} - {user.email}</option>)}
            </select>
          </FormField>
          <FormField label="Condition Out">
            <select className="input" value={form.condition_out || asset.condition || 'good'} onChange={e => setForm({ ...form, condition_out: e.target.value })}>
              {CONDITIONS.map(item => <option key={item} value={item}>{titleCase(item)}</option>)}
            </select>
          </FormField>
          <FormField label="Notes"><textarea className="input min-h-[88px]" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormField>
        </div>
      )}
      {type === 'move' && (
        <div className="space-y-3">
          <FormField label="Move To" required>
            <select className="input" value={form.location_id || ''} onChange={e => setForm({ ...form, location_id: e.target.value })}>
              <option value="">Select location</option>
              {options.locations.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </FormField>
          <FormField label="Notes"><textarea className="input min-h-[88px]" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormField>
        </div>
      )}
      {type === 'maintenance' && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Title" required><input className="input" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></FormField>
          <FormField label="Vendor"><input className="input" value={form.vendor || ''} onChange={e => setForm({ ...form, vendor: e.target.value })} /></FormField>
          <FormField label="Scheduled Date"><input type="date" className="input" value={form.scheduled_at || ''} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} /></FormField>
          <FormField label="Cost"><input type="number" className="input" value={form.cost || ''} onChange={e => setForm({ ...form, cost: e.target.value })} /></FormField>
          <div className="col-span-2"><FormField label="Description"><textarea className="input min-h-[88px]" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></FormField></div>
        </div>
      )}
    </Modal>
  )
}

function HistoryBlock({ title, items, render }: { title: string; items?: any[]; render: (item: any) => string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="space-y-2">
        {!items?.length ? <p className="text-sm text-gray-400">No records.</p> : items.map((item: any) => (
          <div key={item.id} className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">{render(item)}</div>
        ))}
      </div>
    </div>
  )
}

function LookupModal({ type, form, setForm, items, saving, onClose, onSave, onDelete }: any) {
  if (!type) return null
  const isEdit = Boolean(form.id)
  const resetForm = () => setForm({ id: null, name: '', code: '', description: '' })
  return (
    <Modal open={!!type} onClose={onClose} title={`${titleCase(type)} List`} size="lg"
      footer={<button className="btn btn-secondary" onClick={onClose}>Close</button>}
    >
      <div className="space-y-5">
        <div id="asset-lookup-form" className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-800">{isEdit ? `Edit ${titleCase(type)}` : `Add ${titleCase(type)}`}</p>
            {isEdit && <button className="btn btn-secondary text-xs py-1 px-2" onClick={resetForm}>New</button>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Name" required>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </FormField>
            {type === 'location' && (
              <FormField label="Code">
                <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="HO" />
              </FormField>
            )}
            <div className={type === 'location' ? 'md:col-span-2' : 'md:col-span-2'}>
              <FormField label="Description">
                <textarea className="input min-h-[78px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </FormField>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button className="btn btn-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="table min-w-[820px]">
            <thead>
              <tr>
                <th className="w-14">No.</th>
                <th className="w-52">Name</th>
                {type === 'location' && <th>Code</th>}
                <th className="min-w-[320px]">Description</th>
                <th className="w-44 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {!items?.length ? (
                <tr><td colSpan={type === 'location' ? 5 : 4}><EmptyState message={`No ${type} data yet.`} /></td></tr>
              ) : items.map((item: any, index: number) => (
                <tr key={item.id} className={form.id === item.id ? 'bg-blue-50' : undefined}>
                  <td className="text-gray-400">{index + 1}</td>
                  <td className="font-medium">{item.name}</td>
                  {type === 'location' && <td>{item.code || '-'}</td>}
                  <td className="text-gray-500">{item.description || '-'}</td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary text-xs py-1 px-3"
                        onClick={() => {
                          setForm({ id: item.id, name: item.name || '', code: item.code || '', description: item.description || '' })
                          document.getElementById('asset-lookup-form')?.scrollIntoView({ block: 'nearest' })
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger text-xs py-1 px-3" onClick={() => onDelete(item)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}

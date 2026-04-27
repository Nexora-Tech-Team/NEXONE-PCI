import { ReactNode, useState, useEffect } from 'react'
import { formatNumber, parseNumber } from '@/utils/format'
import { X, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

// ─── Modal ───────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}
export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={clsx('modal', widths[size])}>
        <div className="modal-header">
          <span className="font-semibold text-sm text-gray-900">{title}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ─── SearchInput ─────────────────────────────────────
interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}
export function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  return (
    <div className={clsx('relative', className)}>
      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input input-sm pl-7 w-40"
      />
    </div>
  )
}

// ─── PageHeader ──────────────────────────────────────
interface PageHeaderProps {
  title: string
  actions?: ReactNode
}
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="page-title">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── Toolbar ─────────────────────────────────────────
interface ToolbarProps {
  left?: ReactNode
  right?: ReactNode
}
export function Toolbar({ left, right }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  )
}

// ─── Pagination ──────────────────────────────────────
interface PaginationProps {
  page: number
  total: number
  limit: number
  onChange: (page: number) => void
}
export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="pagination">
      <span>{total > 0 ? `${start}-${end} / ${total}` : '0-0 / 0'}</span>
      <div className="flex gap-1">
        <button
          className="page-btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={12} />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            className={clsx('page-btn', p === page && 'active')}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="page-btn"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────
const statusColors: Record<string, string> = {
  open: 'badge-blue',
  completed: 'badge-green',
  hold: 'badge-orange',
  cancelled: 'badge-red',
  todo: 'badge-orange',
  in_progress: 'badge-blue',
  done: 'badge-green',
  expired: 'badge-red',
  draft: 'badge-gray',
  not_paid: 'badge-orange',
  partially_paid: 'badge-yellow',
  fully_paid: 'badge-green',
  overdue: 'badge-red',
  won: 'badge-green',
  lost: 'badge-red',
  discussion: 'badge-blue',
  new: 'badge-gray',
  negotiation: 'badge-yellow',
  qualified: 'badge-purple',
  pending: 'badge-orange',
  approved: 'badge-green',
  rejected: 'badge-red',
}

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return <span className={clsx('badge', statusColors[status] || 'badge-gray')}>{label}</span>
}

// ─── Loading ─────────────────────────────────────────
export function Loading() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── EmptyState ──────────────────────────────────────
export function EmptyState({ message = 'No record found.' }: { message?: string }) {
  return <div className="empty-state">{message}</div>
}

// ─── ConfirmDialog ───────────────────────────────────
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
}
export function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm Delete', message = 'Are you sure you want to delete this item?' }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { onConfirm(); onClose() }}>Delete</button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  )
}

// ─── FormField ───────────────────────────────────────
interface FormFieldProps {
  label: string
  required?: boolean
  children: ReactNode
  error?: string
  hint?: string
}
export function FormField({ label, required, children, error, hint }: FormFieldProps) {
  return (
    <div className="mb-3">
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-blue-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ─── Avatar ──────────────────────────────────────────
export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sizes = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs' }
  return (
    <div className={clsx('rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-semibold flex-shrink-0', sizes[size])}>
      {initials}
    </div>
  )
}

// ─── ProgressBar ─────────────────────────────────────
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={clsx('progress-bar', className)}>
      <div className="progress-fill" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

// ─── ViewTabs ────────────────────────────────────────
interface ViewTabsProps {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}
export function ViewTabs({ tabs, active, onChange }: ViewTabsProps) {
  return (
    <div className="flex border-b border-gray-200 mb-4">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx('view-tab', active === tab.key && 'active')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── PriceInput ──────────────────────────────────────
interface PriceInputProps {
  value: number | string
  onChange: (num: number) => void
  placeholder?: string
  className?: string
}
export function PriceInput({ value, onChange, placeholder = '0', className }: PriceInputProps) {
  const [display, setDisplay] = useState(value !== 0 && value !== '' ? formatNumber(Number(value)) : '')

  useEffect(() => {
    setDisplay(value !== 0 && value !== '' ? formatNumber(Number(value)) : '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d,]/g, '')
    setDisplay(raw)
    onChange(parseNumber(raw))
  }

  const handleBlur = () => {
    const num = parseNumber(display)
    setDisplay(num > 0 ? formatNumber(num) : '')
    onChange(num)
  }

  return (
    <input
      className={className ?? 'input'}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      inputMode="numeric"
    />
  )
}

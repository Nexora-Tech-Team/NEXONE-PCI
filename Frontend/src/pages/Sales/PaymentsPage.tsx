import { useEffect, useState, useCallback } from 'react'
import { paymentService } from '@/services/api'
import { toast } from 'react-toastify'
import { FileDown, Printer } from 'lucide-react'
import { PageHeader, Toolbar, SearchInput, Loading, EmptyState } from '@/components/common'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback((q = '') => {
    setLoading(true)
    paymentService.list(q ? { q } : undefined)
      .then(r => { setPayments(r.data.data || []); setTotal(r.data.total || 0) })
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fmt = (n: number, cur = 'IDR') => `${cur} ${Number(n).toLocaleString()}`
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="p-5">
      <PageHeader title="Payments" />

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Total Payments</p>
          <p className="text-xl font-semibold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Total Received</p>
          <p className="text-xl font-semibold text-green-600">{fmt(totalAmount)}</p>
        </div>
      </div>

      <Toolbar
        left={<span className="text-xs text-gray-400">{payments.length} records</span>}
        right={
          <>
            <button className="btn btn-secondary"><FileDown size={12} />Excel</button>
            <button className="btn btn-secondary"><Printer size={12} />Print</button>
            <SearchInput value={search} onChange={setSearch} placeholder="Invoice, client, method..." />
          </>
        }
      />

      <div className="table-container">
        {loading ? <Loading /> : (
          <table className="table">
            <thead>
              <tr><th>Invoice #</th><th>Client</th><th>Amount</th><th>Method</th><th>Date</th><th>Note</th></tr>
            </thead>
            <tbody>
              {payments.length === 0
                ? <tr><td colSpan={6}><EmptyState /></td></tr>
                : payments.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium text-blue-600">{p.invoice?.invoice_number || '-'}</td>
                    <td className="text-gray-500">{p.invoice?.client?.name || '-'}</td>
                    <td className="whitespace-nowrap font-medium text-green-600">{fmt(p.amount, p.currency)}</td>
                    <td className="text-gray-500 capitalize">{p.payment_method || '-'}</td>
                    <td className="text-gray-400 whitespace-nowrap">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('id') : '-'}</td>
                    <td className="text-gray-400">{p.note || '-'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

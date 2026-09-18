// TaxListModal — Property Tax Assessment Register matching tax_revenue.html
import { useState, useEffect, useRef } from 'react'
import { Button, Input } from '../../../components/ui'
import { useTaxList } from '../hooks/useTaxRevenue'
import { formatCurrency, formatIndianNumber } from '../utils/revenueFormatters'
import { calculatePropertyTax } from '../utils/propertyTaxCalculator'
import {
  X, Search, MapPin, Download, CheckCircle, AlertTriangle,
  CreditCard, ChevronLeft, ChevronRight, RefreshCw,
  Filter, List, ClipboardCheck
} from 'lucide-react'

const TABS = [
  { id: 'all', label: 'All Properties', icon: List },
  { id: 'paid', label: 'Paid', icon: CheckCircle, color: 'emerald' },
  { id: 'unpaid', label: 'Due / Unpaid', icon: AlertTriangle, color: 'red' },
]

export function TaxListModal({
  isOpen,
  onClose,
  onLocatePlot,
  onPayPlot,
  onViewReceipt,
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const modalRef = useRef(null)
  const searchInputRef = useRef(null)

  const { taxList: data, isLoading: loading, isError, error: queryError, refetch } = useTaxList({ status: activeTab, search: searchQuery, page, page_size: pageSize, enabled: isOpen })
  const error = isError ? (queryError?.message || 'Unable to load property tax register.') : null

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const results = data?.results || []
  const pagination = data?.pagination || { page: 1, page_size: pageSize, total_items: 0, total_pages: 0, has_next: false, has_previous: false }
  const summary = data?.summary || { total_properties: 0, paid_count: 0, unpaid_count: 0, total_tax_collected: 0, collection_rate_pct: 0 }

  const currentPage = Number(pagination.page) || page
  const totalItems = Number(pagination.total_items ?? pagination.count) || results.length
  const totalPages = Number(pagination.total_pages) || Math.max(1, Math.ceil(totalItems / pageSize))
  // Some backend deployments only return next/previous URLs.  Page state is
  // still authoritative for moving backwards, rather than leaving Previous
  // disabled because one optional metadata flag is absent.
  const hasPrevious = pagination.has_previous === true || Boolean(pagination.previous) || currentPage > 1
  const hasNext = pagination.has_next === true || Boolean(pagination.next) || currentPage < totalPages
  const totalCount = summary.total_properties || totalItems
  const paidCount = summary.paid_count !== undefined ? summary.paid_count : results.filter(r => r.is_paid || r.status === 'PAID').length
  const unpaidCount = summary.unpaid_count !== undefined ? summary.unpaid_count : Math.max(0, totalCount - paidCount)
  const totalCollected = summary.total_tax_collected !== undefined ? summary.total_tax_collected : results.filter(r => r.is_paid).reduce((s, r) => s + (r.paid_amount || r.total_paid || r.paid || 0), 0)

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setPage(1)
    setSearchQuery('')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || (newPage > currentPage && !hasNext)) return
    setPage(newPage)
  }

  const handleRowAction = (action, item) => {
    switch (action) {
      case 'locate':
        onClose()
        onLocatePlot?.(item)
        break
      case 'pay':
        onClose()
        onPayPlot?.(item)
        break
      case 'receipt':
        onViewReceipt?.(item)
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-950/35 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={modalRef}
        className="relative bg-white border border-ink-200 rounded-xl shadow-2xl w-full max-w-6xl max-h-[min(86vh,650px)] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-ink-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-leaf-100 border border-leaf-200 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-leaf-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-950">Property Tax Register &amp; Cadastral Assessment</h2>
              <p className="text-xs text-slate-400">Authoritative Municipal Revenue Cadastral Ledger • Nalanda District</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
            aria-label="Close tax register modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-ink-50 border-b border-ink-200 shrink-0">
          <div className="p-3 bg-white border border-ink-200 rounded-lg">
            <span className="text-[10px] text-ink-500 uppercase tracking-wider block mb-0.5">Total Properties</span>
            <span className="text-lg font-semibold text-ink-950">{formatIndianNumber(totalCount)}</span>
          </div>
          <div className="p-3 bg-leaf-50 border border-leaf-200 rounded-lg">
            <span className="text-[10px] text-leaf-700 uppercase tracking-wider block mb-0.5">Paid Properties</span>
            <span className="text-lg font-semibold text-leaf-700">{formatIndianNumber(paidCount)}</span>
          </div>
          <div className="p-3 bg-alert-50 border border-alert-100 rounded-lg">
            <span className="text-[10px] text-alert-600 uppercase tracking-wider block mb-0.5">Due / Unpaid</span>
            <span className="text-lg font-semibold text-alert-600">{formatIndianNumber(unpaidCount)}</span>
          </div>
          <div className="p-3 bg-saffron-100/50 border border-saffron-200 rounded-lg">
            <span className="text-[10px] text-saffron-700 uppercase tracking-wider block mb-0.5">Revenue Collected</span>
            <span className="text-lg font-semibold text-saffron-700">{formatCurrency(totalCollected)}</span>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-3 bg-white border-b border-ink-200 flex flex-wrap gap-3 items-center justify-between shrink-0">
          {/* Tabs */}
          <div className="flex gap-1 bg-ink-100 p-1 border border-ink-200 rounded-lg">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const count = tab.id === 'all' ? totalCount : tab.id === 'paid' ? paidCount : unpaidCount
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all flex items-center gap-1.5 ${
                    isActive
                      ? `bg-${tab.color || 'blue'}-600 text-white shadow-sm`
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-slate-700'}`}>
                    {formatIndianNumber(count)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-64 sm:w-80 flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by owner, plot #, mobile..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-ink-300 rounded-lg text-xs text-ink-900 placeholder:text-ink-400 focus:ring-2 focus:ring-ink-900/20 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-900"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <Button
            variant="outline"
            size="xs"
            onClick={() => refetch()}
            className="hidden sm:flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* Table Container */}
        <div className="max-h-[430px] overflow-auto p-3 sm:max-h-[48vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading property tax assessment ledger...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-800/30 rounded-lg text-xs text-red-300 text-center">
              <p>{error}</p>
              <Button size="xs" variant="outline" onClick={() => refetch()} className="mt-2">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
              </Button>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <Filter className="w-12 h-12 mx-auto mb-2 text-slate-600" />
              <p>No matching records found in tax register.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-ink-700 border-collapse">
                <thead className="bg-ink-950 text-ink-200 uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-ink-900">
                  <tr>
                    <th className="p-2.5 w-24">Status</th>
                    <th className="p-2.5 w-24">Plot No</th>
                    <th className="p-2.5">Owner Name</th>
                    <th className="p-2.5 w-32">Mobile</th>
                    <th className="p-2.5 w-28">Package</th>
                    <th className="p-2.5 w-28 text-right">Amount</th>
                    <th className="p-2.5 w-40 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {results.map((item) => {
                    const isPaid = Boolean(item.is_paid || item.status === 'PAID')
                    const plotNo = item.plot_no || item.plotNo || item.id
                    const ownerName = item.owner_name || item.ownerName || item.name || 'N/A'
                    const mobile = item.mobile || item.owner_mobile || '—'
                    const packageName = item.package_name || item.source || 'N/A'

                    // Use centralized tax calculator for correct total (base + cess)
                    const taxCalc = calculatePropertyTax(item)
                    const amount = isPaid
                      ? (item.paid_amount || item.total_paid || item.totalPaid || taxCalc.totalAmount || 0)
                      : (taxCalc.totalAmount ?? item.estimated_tax ?? item.tax_amount ?? item.demand ?? 0)

                    return (
                      <tr key={item.id || item.plot_id || item.plotNo} className="hover:bg-ink-50 transition-colors">
                        <td className="p-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid ? 'bg-leaf-100 text-leaf-700 border border-leaf-200' : 'bg-alert-50 text-alert-600 border border-alert-100'
                          }`}>
                            {isPaid ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {isPaid ? 'PAID' : 'DUE'}
                          </span>
                        </td>
                        <td className="p-2.5 font-semibold text-ink-900 font-mono">#{plotNo}</td>
                        <td className="p-2.5 font-medium text-ink-900 truncate max-w-xs">{ownerName}</td>
                        <td className="p-2.5 text-ink-500 font-mono">{mobile}</td>
                        <td className="p-2.5 text-ink-500 text-xs">{packageName}</td>
                        <td className="p-2.5 font-bold text-right">
                          {isPaid ? (
                            <span className="text-leaf-700">{formatCurrency(amount)}</span>
                          ) : (
                            <span className="text-alert-600">{formatCurrency(amount)}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleRowAction('locate', item)}
                            className="gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          {isPaid ? (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleRowAction('receipt', item)}
                              className="gap-1 text-leaf-700 border-leaf-200 hover:bg-leaf-50"
                            >
                              <Download className="w-3 h-3" />
                              <span className="hidden sm:inline">Receipt</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleRowAction('pay', item)}
                              className="gap-1 text-saffron-700 border-saffron-200 hover:bg-saffron-100"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span className="hidden sm:inline">Pay</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer & Pagination */}
        <div className="p-3 bg-ink-50 border-t border-ink-200 flex items-center justify-between text-xs text-ink-500 shrink-0">
          <span>
            Page {currentPage} of {totalPages} ({formatIndianNumber(totalItems)} Total Records)
          </span>
          <div className="flex gap-2">
            <Button
              size="xs"
              variant="outline"
              disabled={!hasPrevious}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <Button
              size="xs"
              variant="outline"
              disabled={!hasNext}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaxListModal

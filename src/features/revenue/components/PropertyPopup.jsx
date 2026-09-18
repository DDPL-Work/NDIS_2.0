import { X, CreditCard, FileText, Home, MapPin, Calculator } from 'lucide-react'
import { formatCurrency, formatArea } from '../utils/revenueFormatters'
import { normalizeTaxStatus } from '../utils/taxStatus'
import { calculatePropertyTax, getTaxBreakdown } from '../utils/propertyTaxCalculator'

const displayValue = (value) =>
  value === null || value === undefined || value === '' || String(value).toLowerCase() === 'null'
    ? 'N/A'
    : value

const TaxRow = ({ label, value, highlight = false }) => (
  <div className="flex justify-between items-center py-1 border-b border-ink-100 last:border-0">
    <span className="text-sm text-ink-600">{label}</span>
    <span className={`text-sm font-medium ${highlight ? 'text-ink-950' : 'text-ink-900'}`}>
      {value}
    </span>
  </div>
)

export default function PropertyPopup({ feature, onClose, onPay, onReceipt }) {
  const p = feature?.properties || {}
  const isPaid = p.is_paid === true || p.is_paid === 1 || String(p.is_paid).toLowerCase() === 'true'
  const status = normalizeTaxStatus(p.tax_status || p.status || (isPaid ? 'PAID' : 'UNPAID'))

  const breakdown = getTaxBreakdown(feature)
  const calculation = calculatePropertyTax(feature)

  if (!breakdown.available) {
    return (
      <div className="w-[min(360px,calc(100vw-48px))] p-4 font-sans text-sm leading-5 text-ink-800">
        <div className="mb-3 flex items-center justify-between">
          <strong className="text-base text-ink-950">Property Details</strong>
          <button onClick={onClose} aria-label="Close property details" className="rounded p-1 text-ink-500 hover:bg-ink-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-0.5">
          <div><b>Plot #:</b> {displayValue(p.plot_no)}</div>
          <div><b>Owner:</b> {displayValue(p.name || p.feature_name)}</div>
          <div><b>Mobile:</b> {displayValue(p.mobile)}</div>
        </div>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          {breakdown.message}
        </div>
        <div className="mt-3">{status === 'paid' ? (
          <button onClick={() => onReceipt(feature)} className="inline-flex items-center gap-1 rounded-md bg-leaf-600 px-3 py-1.5 text-sm font-semibold text-white">
            <FileText className="h-3.5 w-3.5" /> View Tax Receipt
          </button>
        ) : (
          <button onClick={() => onPay(feature)} className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white">
            <CreditCard className="h-3.5 w-3.5" /> Pay Tax
          </button>
        )}</div>
      </div>
    )
  }

  return (
    <div className="w-[min(360px,calc(100vw-48px))] max-h-[70vh] overflow-y-auto p-4 font-sans text-sm leading-5 text-ink-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-blue-600" />
          </div>
          <strong className="text-base text-ink-950">Property Details</strong>
        </div>
        <button onClick={onClose} aria-label="Close property details" className="rounded p-1 text-ink-500 hover:bg-ink-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-ink-500">Plot #</span><span className="font-medium text-ink-900 font-mono">{displayValue(p.plot_no)}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Owner</span><span className="font-medium text-ink-900 truncate max-w-[200px]">{displayValue(p.name || p.feature_name)}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Mobile</span><span className="font-medium text-ink-900 font-mono">{displayValue(p.mobile)}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Property Type</span><span className="font-medium text-ink-900 capitalize">{displayValue(p.sub_class)}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Assessment Year</span><span className="font-medium text-ink-900">{displayValue(p.assessment_year || '2026-2027')}</span></div>
        <div className="flex justify-between">
          <span className="text-ink-500">Tax Status</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
            status === 'paid' ? 'bg-leaf-100 text-leaf-700' : 'bg-alert-50 text-alert-600'
          }`}>
            {status === 'paid' ? 'PAID' : 'DUE / UNPAID'}
          </span>
        </div>
      </div>

      <div className="my-2 border-t border-ink-200" />
      <div className="mb-2 font-medium text-ink-900 flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5 text-ink-500" /> GIS Property
      </div>
      <div className="mb-3 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-ink-500">Area</span><span className="font-medium text-ink-900">{breakdown.areaSqft ? formatArea(breakdown.areaSqft) : 'N/A'}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Rate</span><span className="font-medium text-ink-900">{formatCurrency(breakdown.ratePerSqft)}/sq.ft</span></div>
      </div>

      <div className="my-2 border-t border-ink-200" />
      <div className="mb-2 font-medium text-ink-900 flex items-center gap-1">
        <Calculator className="w-3.5 h-3.5 text-ink-500" /> Tax Breakdown
      </div>
      <div className="mb-3 bg-ink-50 rounded-lg p-3 space-y-1">
        <TaxRow label="Base Property Tax" value={formatCurrency(breakdown.baseTax)} />
        <TaxRow label="Urban Development Cess (5%)" value={formatCurrency(breakdown.cess)} />
        <TaxRow label="TOTAL TAX PAYABLE" value={formatCurrency(breakdown.totalAmount)} highlight />
      </div>

      <div className="flex gap-2 pt-2 border-t border-ink-200">
        {status === 'paid' ? (
          <button
            onClick={() => onReceipt(feature)}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-leaf-600 px-3 py-2 text-sm font-semibold text-white hover:bg-leaf-700"
          >
            <FileText className="h-4 w-4" /> View Tax Receipt
          </button>
        ) : (
          <button
            onClick={() => onPay(feature)}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            <CreditCard className="h-4 w-4" /> Pay Tax
          </button>
        )}
      </div>
    </div>
  )
}
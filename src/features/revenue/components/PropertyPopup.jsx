import { X, CreditCard, FileText, Home, MapPin, Calculator, Loader2, CheckCircle, AlertCircle, ChevronRight, Building2 } from 'lucide-react'
import { formatCurrency, formatArea } from '../utils/revenueFormatters'
import { normalizeTaxStatus } from '../utils/taxStatus'
import { calculatePropertyTax, getTaxBreakdown } from '../utils/propertyTaxCalculator'
import { processPropertyTaxPayment } from '../utils/razorpay'
import { normalizePropertyForDisplay, getTaxStatusBadgeClasses, getTaxStatusDisplay } from '../utils/propertyNormalizer'
import { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'

const TaxRow = ({ label, value, highlight = false }) => (
  <div className="flex justify-between items-center py-0.5 border-b border-ink-100 last:border-0">
    <span className="text-[12px] text-ink-600">{label}</span>
    <span className={`text-[12px] font-medium ${highlight ? 'text-ink-950' : 'text-ink-900'}`}>
      {value}
    </span>
  </div>
)

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="mb-1 font-medium text-ink-900 text-[12px] flex items-center gap-1">
    <Icon className="w-3 h-3 text-ink-500" />
    {title}
  </div>
)

const InfoRow = ({ label, value, className = '' }) => (
  <div className={`flex justify-between ${className}`}>
    <span className="text-ink-500 text-[12px]">{label}</span>
    <span className="font-medium text-ink-900 text-[12px] truncate max-w-[200px]">{value}</span>
  </div>
)

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${getTaxStatusBadgeClasses(status)}`}>
    {getTaxStatusDisplay(status)}
  </span>
)

const displayValue = (value) =>
  value === null || value === undefined || value === '' || String(value).toLowerCase() === 'null'
    ? 'Not available'
    : value

export default function PropertyPopup({ feature, onClose, onPay, onReceipt, onPaymentSuccess }) {
  const [paymentState, setPaymentState] = useState('idle')
  const [paymentError, setPaymentError] = useState(null)
  const contentRef = useRef(null)

  // Handle content scroll to prevent body scroll
  const handleWheel = useRef(null)

  useEffect(() => {
    if (contentRef.current) {
      handleWheel.current = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current
        const atTop = scrollTop === 0
        const atBottom = scrollHeight - scrollTop === clientHeight

        if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
          e.preventDefault()
        }
      }
      contentRef.current.addEventListener('wheel', handleWheel.current, { passive: false })
    }
    return () => {
      if (contentRef.current && handleWheel.current) {
        contentRef.current.removeEventListener('wheel', handleWheel.current)
      }
    }
  }, [])

  // Normalize property data for clean display
  const normalized = normalizePropertyForDisplay(feature)
  const { plotNo, ownerName, mobile, propertyType, assessmentYear, gis, tax, payment, raw } = normalized
  const isPaid = tax.status === 'paid'

  const handlePayment = async () => {
    if (!tax.calculationAvailable || !raw.taxAmount || raw.taxAmount <= 0) {
      setPaymentError('Unable to determine tax amount for this property.')
      setTimeout(() => setPaymentError(null), 5000)
      return
    }

    if (isPaid) {
      setPaymentError('This property tax has already been paid.')
      setTimeout(() => setPaymentError(null), 5000)
      return
    }

    setPaymentState('preparing')
    setPaymentError(null)

    try {
      setPaymentState('checkout')
      await processPropertyTaxPayment({
        propertyId: raw.propertyId,
        plotNo: raw.plotNo,
        ownerName: raw.ownerName,
        mobile: raw.mobile,
        areaSqft: raw.areaSqft,
        taxAmount: raw.taxAmount,
        paymentMode: 'UPI',
        assessmentYear: raw.assessmentYear,
        periodMonth: raw.periodMonth,
        onPaymentStart: () => setPaymentState('preparing'),
        onPaymentSuccess: async (result) => {
          setPaymentState('success')
          onPaymentSuccess?.()
          // Show SweetAlert2 success popup
          await Swal.fire({
            icon: 'success',
            title: 'Tax Payment Successful',
            html: `
              <div className="text-left space-y-2">
                <p><strong>Property:</strong> Plot #${raw.plotNo}</p>
                <p><strong>Amount Paid:</strong> ₹${formatCurrency(raw.taxAmount)}</p>
                ${result.receipt_no ? `<p><strong>Receipt No:</strong> ${result.receipt_no}</p>` : ''}
                ${result.transaction_id ? `<p><strong>Transaction Ref:</strong> ${result.transaction_id}</p>` : ''}
                <p className="text-green-600 font-medium">Status: PAID</p>
              </div>
            `,
            confirmButtonText: 'Done',
            confirmButtonColor: '#059669',
          })
          // Close popup after showing success
          setTimeout(() => onClose?.(), 1500)
        },
        onPaymentFailure: (err) => {
          setPaymentState('error')
          setPaymentError(err.message || 'Payment failed. Please try again.')
          Swal.fire({
            icon: 'error',
            title: 'Payment Failed',
            text: err.message || 'Payment failed. Please try again.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc2626',
          })
          setTimeout(() => setPaymentError(null), 8000)
        },
        onPaymentCancel: () => {
          setPaymentState('idle')
          setPaymentError('Payment was cancelled. Property tax status remains DUE.')
          Swal.fire({
            icon: 'info',
            title: 'Payment Cancelled',
            text: 'No payment was recorded. The property remains DUE.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3b82f6',
          })
          setTimeout(() => setPaymentError(null), 5000)
        },
      })
    } catch (err) {
      setPaymentState('error')
      setPaymentError(err.message || 'Payment initiation failed. Please try again.')
      Swal.fire({
        icon: 'error',
        title: 'Payment Error',
        text: err.message || 'Payment initiation failed. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626',
      })
      setTimeout(() => setPaymentError(null), 5000)
    }
  }

  const renderNotAvailable = (label) => (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-400">Not available</span>
    </div>
  )

  return (
    <div className="property-popup flex flex-col w-[min(360px,calc(100vw-24px))] max-h-[min(400px,calc(100dvh-100px))] max-h-[min(400px,calc(100vh-100px))] rounded-xl overflow-hidden ">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 px-3 py-2 border-b border-ink-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center">
            <Home className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <strong className="text-sm text-ink-950">Property Details</strong>
            <p className="text-[11px] text-ink-400">Cadastral Property • {propertyType}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close property details" className="rounded p-1 text-ink-500 hover:bg-ink-100 transition-colors w-7 h-7 flex items-center justify-center">
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2 pb-1" ref={contentRef}>
        {/* Property Identity Section */}
        <div className="mb-2 p-2 bg-ink-50 rounded-lg border border-ink-100">
          <SectionHeader icon={MapPin} title="Property Identity" />
          <div className="space-y-1 text-[12px]">
            <InfoRow label="Plot Number" value={`#${displayValue(plotNo)}`} />
            <InfoRow label="Owner" value={displayValue(ownerName)} />
            <InfoRow label="Mobile" value={displayValue(mobile)} />
            <InfoRow label="Property Type" value={displayValue(propertyType)} />
            <InfoRow label="Assessment Year" value={displayValue(assessmentYear)} />
          </div>
        </div>

        {/* Tax Status Badge */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-ink-500 text-[12px]">Tax Status</span>
          <StatusBadge status={tax.status} />
        </div>

        {/* GIS Property Section */}
        <div className="mb-2 p-2 bg-ink-50 rounded-lg border border-ink-100">
          <SectionHeader icon={Building2} title="GIS Property" />
          <div className="space-y-1 text-[12px]">
            <InfoRow label="Area" value={gis.areaSqft ? formatArea(gis.areaSqft) : 'Not available'} />
            <InfoRow label="Tax Rate" value={`${formatCurrency(gis.ratePerSqft)}/sq.ft`} />
            <InfoRow label="Cadastral Layer" value={gis.layer} />
          </div>
        </div>

        {/* Tax Summary Section */}
        <div className="mb-2 p-2 bg-ink-50 rounded-lg border border-ink-100">
          <SectionHeader icon={Calculator} title="Tax Summary" />
          <div className="space-y-0">
            <TaxRow label="Base Property Tax" value={formatCurrency(tax.baseTax)} />
            <TaxRow label="Urban Development Cess (5%)" value={formatCurrency(tax.cess)} />
            <TaxRow label="TOTAL TAX PAYABLE" value={formatCurrency(tax.totalAmount)} highlight />
          </div>
        </div>

        {paymentError && (
          <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 text-center animate-fade-in">
            {paymentError}
          </div>
        )}
      </div>

      {/* Footer - Fixed */}
      <footer className="flex-shrink-0 px-3 py-2 border-t border-ink-200 bg-white rounded-b-xl">
        <div className="flex gap-2">
          {isPaid ? (
            <button
              onClick={() => onReceipt?.(feature)}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-leaf-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-leaf-700 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" /> View Tax Receipt
            </button>
          ) : (
            <button
              onClick={handlePayment}
              disabled={paymentState !== 'idle' || !tax.calculationAvailable}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {paymentState === 'preparing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {paymentState === 'checkout' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {paymentState === 'verifying' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {paymentState === 'success' && <CheckCircle className="h-3.5 w-3.5" />}
              {(paymentState === 'idle' || paymentState === 'error') && <CreditCard className="h-3.5 w-3.5" />}
              {paymentState === 'preparing' && 'Preparing…'}
              {paymentState === 'checkout' && 'Opening Payment…'}
              {paymentState === 'verifying' && 'Verifying…'}
              {paymentState === 'success' && 'Paid!'}
              {(paymentState === 'idle' || paymentState === 'error') && `Pay Tax ${tax.totalAmount ? `₹${formatCurrency(tax.totalAmount)}` : ''}`}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
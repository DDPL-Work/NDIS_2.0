import React, { useState } from 'react'
import { X, CreditCard, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react'
import { Button, Input, Select } from '../../../components/ui'
import { taxPaymentApi } from '../api/taxPaymentApi'
import { taxSlipApi } from '../api/taxSlipApi'
import { formatCurrency } from '../utils/revenueFormatters'

export function PaymentDialog({ isOpen, onClose, property, onSuccess }) {
  const [amount, setAmount] = useState(0)
  const [paymentMode, setPaymentMode] = useState('UPI')
  const [remarks, setRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentResult, setPaymentResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  React.useEffect(() => {
    if (property) {
      const initialTax = Number(property.taxAmount || property.tax_amount || property.demand || property.outstanding || 0)
      setAmount(initialTax)
      setPaymentResult(null)
      setErrorMessage(null)
    }
  }, [property, isOpen])

  if (!isOpen || !property) return null

  const handlePayTax = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = {
        id: property.id || (property.plotId ? `data_resi_${property.plotId}` : undefined),
        plot_id: property.plotId || property.plot_id || property.id,
        plot_no: String(property.plotNo || property.plot_no || property.plotId || property.id || ''),
        name: property.ownerName || property.name || property.owner_name || 'Property Owner',
        mobile: property.mobile || property.owner_mobile || property.phone || '',
        area_sqft: Number(property.areaSqft || property.area_sqft || property.landAreaSqft || 0),
        tax_amount: Number(amount),
        payment_mode: paymentMode,
        remarks: remarks || 'Online property tax payment'
      }

      const res = await taxPaymentApi.submitPayment(payload)
      setPaymentResult(res)
      if (onSuccess) onSuccess(res)
    } catch (err) {
      setErrorMessage(err.message || 'Payment submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadTaxSlip = () => {
    const slipUrl = paymentResult?.receiptUrl || paymentResult?.data?.receipt_url || paymentResult?.raw?.data?.receipt_url
    if (slipUrl) {
      window.open(slipUrl, '_blank')
    } else {
      const plotNo = property.plotNo || property.plot_no || property.plotId || property.id
      const name = encodeURIComponent(property.ownerName || property.name || 'Owner')
      const fallbackUrl = `/tax-slip/?id=${property.id || ('data_resi_' + plotNo)}&plot_no=${plotNo}&name=${name}&tax=${amount}&receipt_no=${paymentResult?.receiptNo || ''}&txn_id=${paymentResult?.transactionId || ''}`
      window.open(fallbackUrl, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden z-10 border border-ink-200 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-100 bg-ink-900 text-white">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-base">Property Tax Payment</h3>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {paymentResult ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-ink-900">Payment Successful!</h4>
                <p className="text-xs text-ink-600 mt-1">
                  Transaction Ref: <span className="font-mono font-bold text-ink-800">{paymentResult.transactionId || 'N/A'}</span>
                </p>
              </div>
              <div className="p-3 bg-ink-50 rounded-lg text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-500">Property Plot ID:</span>
                  <span className="font-bold text-ink-800">{property.plotId || property.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Payment Mode:</span>
                  <span className="font-bold text-ink-800">{paymentMode}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleDownloadTaxSlip} className="flex-1 text-xs gap-1.5">
                  <Download className="w-4 h-4" />
                  Download Tax Slip
                </Button>
                <Button variant="primary" onClick={onClose} className="flex-1 text-xs">
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePayTax} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-600">Plot / Holding ID:</span>
                  <span className="font-bold text-ink-900">{property.plotId || property.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Owner Name:</span>
                  <span className="font-semibold text-ink-900">{property.ownerName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Total Tax Demand:</span>
                  <span className="font-bold text-ink-900">{formatCurrency(property.demand)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Payment Amount (₹)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  required
                  placeholder="Enter payment amount"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full text-xs rounded-lg border border-ink-300 p-2 bg-white text-ink-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ONLINE">Online / Gateway</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CHALLAN">Bank Challan</option>
                  <option value="CASH">Cash counter</option>
                  <option value="CHEQUE">Cheque / DD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Reference / Transaction Number</label>
                <Input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. UTR / Receipt Ref No."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Remarks</label>
                <Input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-ink-100">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1 text-xs gap-1.5">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Submit Payment
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentDialog

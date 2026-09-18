// PayTaxModal — Property Tax Payment Modal matching tax_revenue.html
import { useState, useEffect, useRef } from 'react'
import { Button, Input, Badge } from '../../../components/ui'
import { taxRevenueApi } from '../api/taxRevenueApi'
import { formatCurrency, formatArea } from '../utils/revenueFormatters'
import { calculatePropertyTax, getTaxBreakdown } from '../utils/propertyTaxCalculator'
import {
  X, Search, CreditCard, CheckCircle, AlertCircle, Loader2,
  User, MapPin, Phone, Home, FileText, Calculator, MapPin as MapPinIcon
} from 'lucide-react'

export function PayTaxModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  prefillData = {},
}) {
  const [searchStep, setSearchStep] = useState(true) // true = search, false = payment
  const [searchForm, setSearchForm] = useState({
    ownerName: prefillData.ownerName || prefillData.name || '',
    mobile: prefillData.mobile || '',
    plotNo: prefillData.plotNo || prefillData.plot_no || '',
    houseNo: prefillData.houseNo || prefillData.house_no || '',
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMode: 'UPI',
    remarks: 'Online property tax payment',
  })
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const modalRef = useRef(null)

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setSearchStep(true)
      setSearchResults([])
      setErrorMessage(null)
      setSuccessMessage(null)
      setPaymentResult(null)
      setSelectedProperty(null)
      setSearchForm({
        ownerName: prefillData.ownerName || prefillData.name || '',
        mobile: prefillData.mobile || '',
        plotNo: prefillData.plotNo || prefillData.plot_no || '',
        houseNo: prefillData.houseNo || prefillData.house_no || '',
      })
    }
  }, [isOpen, prefillData])

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

  const handleSearch = async (e) => {
    e.preventDefault()
    setSearchLoading(true)
    setErrorMessage(null)
    setSearchResults([])

    try {
      // Search using tax list endpoint with search query
      const searchTerms = []
      if (searchForm.ownerName) searchTerms.push(searchForm.ownerName)
      if (searchForm.mobile) searchTerms.push(searchForm.mobile)
      if (searchForm.plotNo) searchTerms.push(searchForm.plotNo)
      if (searchForm.houseNo) searchTerms.push(searchForm.houseNo)

      const searchQuery = searchTerms.join(' ')

      const response = await taxRevenueApi.fetchTaxList({
        search: searchQuery,
        status: 'all',
        page: 1,
        page_size: 20,
      })

      const results = response?.results || []
      setSearchResults(results)

      if (results.length === 0) {
        setErrorMessage('No matching properties found. Please check your search criteria.')
      } else if (results.length === 1) {
        // Auto-select single result
        setSelectedProperty(results[0])
        setSearchStep(false)
        const taxCalc = calculatePropertyTax(results[0])
        setPaymentForm(prev => ({ ...prev, amount: taxCalc.totalAmount ?? 0 }))
      }
    } catch (err) {
      setErrorMessage(err.message || 'Search failed. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectProperty = (property) => {
    setSelectedProperty(property)
    setSearchStep(false)
    const taxCalc = calculatePropertyTax(property)
    setPaymentForm(prev => ({ ...prev, amount: taxCalc.totalAmount ?? 0 }))
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!selectedProperty) return

    setPaymentLoading(true)
    setErrorMessage(null)

    try {
      const payload = {
        id: `data_resi_${selectedProperty.id || selectedProperty.plotId}`,
        plot_id: selectedProperty.id || selectedProperty.plotId,
        plot_no: selectedProperty.plotNo || selectedProperty.plot_no || selectedProperty.plotId,
        name: selectedProperty.ownerName || selectedProperty.owner_name || selectedProperty.name || undefined,
        mobile: selectedProperty.mobile || selectedProperty.owner_mobile || '',
        area_sqft: selectedProperty.landAreaSqft || selectedProperty.areaSqft || selectedProperty.estimated_area_sqft || undefined,
        tax_amount: paymentForm.amount,
        payment_mode: paymentForm.paymentMode,
        remarks: paymentForm.remarks,
        assessment_year: selectedProperty.assessment_year || undefined,
        period_month: selectedProperty.period_month || undefined,
      }

      const response = await taxRevenueApi.submitTaxPayment(payload)

      if (response.status === 'success' || response.success) {
        const result = response.data || response
        const verification = await taxRevenueApi.verifyTaxPayment({ plot_no: payload.plot_no })
        if (!verification?.is_tax_paid) {
          setErrorMessage('Payment was submitted, but the backend has not yet confirmed its tax status. Please verify before retrying.')
          return
        }
        setPaymentResult(result)
        setSuccessMessage(`Payment verified. Receipt: ${result.receipt_no || 'available from the backend'}`)
        onPaymentSuccess?.(result)
      } else {
        setErrorMessage(response.message || 'Payment failed. Please try again.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Payment submission failed. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleBackToSearch = () => {
    setSearchStep(true)
    setSelectedProperty(null)
    setPaymentResult(null)
    setSuccessMessage(null)
  }

  const handleViewReceipt = () => {
    if (paymentResult?.receipt_url) {
      window.open(paymentResult.receipt_url, '_blank')
    } else if (selectedProperty) {
      const fallbackUrl = taxRevenueApi.getTaxSlipUrl({
        id: `data_resi_${selectedProperty.id}`,
        plot_no: selectedProperty.plotNo,
        name: selectedProperty.ownerName,
        tax: paymentForm.amount,
        receipt_no: paymentResult?.receipt_no || '',
        txn_id: paymentResult?.transaction_id || '',
      })
      window.open(fallbackUrl, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/35 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={modalRef}
        className="relative bg-white border border-ink-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-ink-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-leaf-100 border border-leaf-200 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-leaf-700" />
            </div>
            <h3 className="font-semibold text-ink-950">{searchStep ? 'Find property for tax payment' : 'Property Tax Payment'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {searchStep ? (
            // Search Step
            <div className="space-y-4">
              <p className="text-sm text-ink-500">Use any available detail to find the property.</p>

              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Owner / Citizen Name
                  </label>
                  <Input
                    type="text"
                    value={searchForm.ownerName}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, ownerName: e.target.value }))}
                    placeholder="Enter owner name"
                    className="w-full bg-white border border-ink-300 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:ring-1 focus:ring-ink-900/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Mobile Number
                  </label>
                  <Input
                    type="tel"
                    value={searchForm.mobile}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="Enter 10-digit mobile"
                    className="w-full bg-white border border-ink-300 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:ring-1 focus:ring-ink-900/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Plot Number
                  </label>
                  <Input
                    type="text"
                    value={searchForm.plotNo}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, plotNo: e.target.value }))}
                    placeholder="Enter plot number"
                    className="w-full bg-white border border-ink-300 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:ring-1 focus:ring-ink-900/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1 flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" /> House / Unit No
                  </label>
                  <Input
                    type="text"
                    value={searchForm.houseNo}
                    onChange={(e) => setSearchForm(prev => ({ ...prev, houseNo: e.target.value }))}
                    placeholder="Enter house/unit number (optional)"
                    className="w-full bg-white border border-ink-300 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:ring-1 focus:ring-ink-900/20"
                  />
                </div>
              </div>

              <Button
                onClick={handleSearch}
                disabled={searchLoading}
                variant="positive"
                className="w-full py-2.5 gap-2"
              >
                {searchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search Property
                  </>
                )}
              </Button>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Search Results ({searchResults.length})</h4>
                  {searchResults.map((property) => (
                    <button
                      key={property.id || property.plotId}
                      onClick={() => handleSelectProperty(property)}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-left hover:border-emerald-500 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">Plot #{property.plotNo || property.plotId}</p>
                          <p className="text-xs text-slate-400">{property.ownerName || 'Unknown Owner'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${property.isPaid || property.taxStatus === 'paid' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                          {property.isPaid || property.taxStatus === 'paid' ? 'PAID' : 'DUE'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Payment Step
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Property Summary with Tax Breakdown */}
              {selectedProperty && (
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-white">Plot #{selectedProperty.plotNo || selectedProperty.plotId}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${selectedProperty.isPaid || selectedProperty.taxStatus === 'paid' ? 'bg-emerald-900/50 text-emerald-400 border-emerald-800' : 'bg-red-900/50 text-red-400 border-red-800'}`}
                    >
                      {selectedProperty.isPaid || selectedProperty.taxStatus === 'paid' ? 'PAID' : 'DUE'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Owner:</span>
                      <span className="font-medium text-white ml-1">{selectedProperty.ownerName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Mobile:</span>
                      <span className="font-medium text-white ml-1">{selectedProperty.mobile || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Area:</span>
                      <span className="font-medium text-white ml-1">{formatArea(selectedProperty.landAreaSqft || selectedProperty.areaSqft || 0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Assessment Year:</span>
                      <span className="font-medium text-white ml-1">{selectedProperty.assessment_year || '2026-2027'}</span>
                    </div>
                  </div>
                  {(() => {
                    const taxCalc = calculatePropertyTax(selectedProperty)
                    if (!taxCalc.calculationUnavailable) {
                      return (
                        <div className="border-t border-slate-700 pt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Base Property Tax</span>
                            <span className="font-medium text-white">{formatCurrency(taxCalc.baseTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Urban Development Cess (5%)</span>
                            <span className="font-medium text-white">{formatCurrency(taxCalc.cess)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-700 pt-1">
                            <span className="text-slate-400 font-semibold">TOTAL TAX PAYABLE</span>
                            <span className="font-bold text-emerald-400">{formatCurrency(taxCalc.totalAmount)}</span>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="border-t border-slate-700 pt-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tax Demand:</span>
                          <span className="font-bold text-emerald-400">{formatCurrency(paymentForm.amount)}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Payment Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Payment Amount (₹)</label>
                  <Input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    min="1"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Payment Mode</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                    <option value="CASH">Cash at Counter</option>
                    <option value="CHEQUE">Cheque / DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Remarks</label>
                  <Input
                    type="text"
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Optional notes"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={handleBackToSearch}
                  className="flex-1 text-sm"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Back to Search
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={paymentLoading || paymentForm.amount <= 0}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-2 gap-2"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pay ₹{paymentForm.amount.toLocaleString('en-IN')}
                    </>
                  )}
                </Button>
              </div>

              {/* Payment Result */}
              {paymentResult && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Confirmation</h4>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Receipt No:</span>
                      <span className="font-mono text-emerald-400">{paymentResult.receipt_no || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transaction ID:</span>
                      <span className="font-mono text-blue-400">{paymentResult.transaction_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount Paid:</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(paymentResult.total_amount || paymentForm.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="text-white">{new Date(paymentResult.paid_at || Date.now()).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleViewReceipt}
                    className="w-full text-sm gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View / Download Tax Receipt
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PayTaxModal

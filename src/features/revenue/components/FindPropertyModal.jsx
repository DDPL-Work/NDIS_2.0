// FindPropertyModal — Search cadastral property for tax payment
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Input, Badge } from '../../../components/ui'
import { taxRevenueApi } from '../api/taxRevenueApi'
import { formatCurrency, formatArea } from '../utils/revenueFormatters'
import { calculatePropertyTax } from '../utils/propertyTaxCalculator'
import {
  X, Search, MapPin, User, Phone, Home, Loader2,
  AlertCircle, CheckCircle, CreditCard, ChevronRight
} from 'lucide-react'

export function FindPropertyModal({
  isOpen,
  onClose,
  onPropertySelect, // callback with { feature, taxCalc }
}) {
  const [searchForm, setSearchForm] = useState({
    ownerName: '',
    mobile: '',
    plotNo: '',
    houseNo: '',
  })
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const modalRef = useRef(null)
  const searchInputRef = useRef(null)

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSearchForm({ ownerName: '', mobile: '', plotNo: '', houseNo: '' })
      setSearchResults([])
      setErrorMessage(null)
      setSelectedProperty(null)
      // Focus first input
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen])

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

  const handleSearch = useCallback(async (e) => {
    e.preventDefault()
    setSearchLoading(true)
    setErrorMessage(null)
    setSearchResults([])
    setSelectedProperty(null)

    // At least one field required
    const hasCriteria = searchForm.ownerName.trim() || searchForm.mobile.trim() ||
                        searchForm.plotNo.trim() || searchForm.houseNo.trim()
    if (!hasCriteria) {
      setErrorMessage('Enter at least one property detail to search.')
      setSearchLoading(false)
      return
    }

    try {
      // Build search query
      const searchTerms = []
      if (searchForm.ownerName.trim()) searchTerms.push(searchForm.ownerName.trim())
      if (searchForm.mobile.trim()) searchTerms.push(searchForm.mobile.trim())
      if (searchForm.plotNo.trim()) searchTerms.push(searchForm.plotNo.trim())
      if (searchForm.houseNo.trim()) searchTerms.push(searchForm.houseNo.trim())

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
        setErrorMessage('No matching properties found. Try another owner name, mobile number, plot number or house/unit number.')
      } else if (results.length === 1) {
        // Auto-select single result
        const property = results[0]
        const taxCalc = calculatePropertyTax(property)
        setSelectedProperty(property)
        onPropertySelect?.({ feature: property, taxCalc })
        onClose()
      }
    } catch (err) {
      setErrorMessage(err.message || 'Search failed. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }, [searchForm, onClose, onPropertySelect])

  const handleSelectProperty = useCallback((property) => {
    const taxCalc = calculatePropertyTax(property)
    setSelectedProperty(property)
    onPropertySelect?.({ feature: property, taxCalc })
    onClose()
  }, [onClose, onPropertySelect])

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
            <div className="w-8 h-8 bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="font-semibold text-ink-950">Find Property for Tax Payment</h3>
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
          <p className="text-sm text-ink-500 mb-4">Search the cadastral property using any available detail.</p>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Owner / Citizen Name
              </label>
              <Input
                ref={searchInputRef}
                type="text"
                value={searchForm.ownerName}
                onChange={(e) => setSearchForm(prev => ({ ...prev, ownerName: e.target.value }))}
                placeholder="Enter owner name"
                className="w-full bg-white border border-ink-300 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
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
                className="w-full bg-white border border-ink-300 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
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
                className="w-full bg-white border border-ink-300 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
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
                className="w-full bg-white border border-ink-300 rounded-lg px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            <Button
              type="submit"
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
          </form>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Search Results ({searchResults.length})</h4>
              {searchResults.map((property) => {
                const taxCalc = calculatePropertyTax(property)
                const isPaid = property.is_paid || property.taxStatus === 'paid' || property.isPaid
                return (
                  <button
                    key={property.id || property.plotId || property.plot_id}
                    onClick={() => handleSelectProperty(property)}
                    className="w-full p-3 bg-white border border-ink-200 rounded-lg text-left hover:border-emerald-500 hover:bg-emerald-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-ink-900">Plot #{property.plot_no || property.plotNo || property.plotId}</p>
                      <p className="text-xs text-ink-500">{property.owner_name || property.ownerName || 'Unknown Owner'}</p>
                      <p className="text-xs text-ink-400">Mobile: {property.mobile || property.owner_mobile || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-leaf-100 text-leaf-700 border border-leaf-200' : 'bg-alert-50 text-alert-600 border border-alert-100'}`}>
                        {isPaid ? 'PAID' : 'DUE'}
                      </span>
                      {!taxCalc.calculationUnavailable && taxCalc.totalAmount && (
                        <span className="text-sm font-semibold text-ink-900">{formatCurrency(taxCalc.totalAmount)}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-ink-400" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FindPropertyModal
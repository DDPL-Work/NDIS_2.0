// Revenue & Property Intelligence — Utility Functions

import { TAX_STATUS, TAX_STATUS_LABELS, TAX_STATUS_COLORS, ARREARS_AGING } from '../constants/revenueConstants'

// Format currency in Indian Rupees
export function formatCurrency(amount, options = {}) {
  const { showSymbol = true, compact = false, decimals = 0 } = options
  if (amount == null || !Number.isFinite(amount)) return showSymbol ? '₹0' : '0'

  if (compact && Math.abs(amount) >= 10000000) {
    return (showSymbol ? '₹' : '') + (amount / 10000000).toFixed(decimals) + ' Cr'
  }
  if (compact && Math.abs(amount) >= 100000) {
    return (showSymbol ? '₹' : '') + (amount / 100000).toFixed(decimals) + ' L'
  }
  if (compact && Math.abs(amount) >= 1000) {
    return (showSymbol ? '₹' : '') + (amount / 1000).toFixed(decimals) + ' K'
  }

  return (showSymbol ? '₹' : '') + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// Format area in sq ft
export function formatArea(sqft, options = {}) {
  const { unit = 'sqft', compact = false } = options
  if (sqft == null || !Number.isFinite(sqft)) return '0 sqft'

  if (unit === 'sqm') {
    return (sqft / 10.764).toFixed(2) + ' sqm'
  }
  if (unit === 'acre' && sqft >= 43560) {
    return (sqft / 43560).toFixed(2) + ' acres'
  }
  if (compact && sqft >= 10000) {
    return (sqft / 10000).toFixed(1) + 'K sqft'
  }
  return Number(sqft).toLocaleString('en-IN') + ' sqft'
}

// Get tax status from demand and payment data
export function computeTaxStatus(demand, paid, outstanding, arrears) {
  if (demand === 0) return TAX_STATUS.EXEMPT
  if (arrears > 0) return TAX_STATUS.ARREARS
  if (paid === 0) return TAX_STATUS.DUE
  if (paid >= demand) return TAX_STATUS.PAID
  if (paid > 0 && paid < demand) return TAX_STATUS.PARTIAL
  if (outstanding > 0) return TAX_STATUS.DUE
  return TAX_STATUS.DUE
}

export function getTaxStatusLabel(status) {
  return TAX_STATUS_LABELS[status] || status
}

export function getTaxStatusColor(status) {
  return TAX_STATUS_COLORS[status] || '#94a3b8'
}

// Get arrears aging bucket
export function getArrearsAgingBucket(yearsPending) {
  const bucket = ARREARS_AGING.find(b => yearsPending >= b.minYears && yearsPending < b.maxYears)
  return bucket || ARREARS_AGING[ARREARS_AGING.length - 1]
}

// Calculate collection rate
export function calculateCollectionRate(collected, demand) {
  if (demand === 0) return 0
  return Math.min(100, (collected / demand) * 100)
}

// Calculate revenue gap
export function calculateRevenueGap(expectedRevenue, actualCollection) {
  return Math.max(0, expectedRevenue - actualCollection)
}

// Format financial year
export function formatFinancialYear(fy) {
  if (!fy) return ''
  // Convert "2025-26" to "FY 2025-26"
  return fy.startsWith('FY') ? fy : `FY ${fy}`
}

// Parse financial year string
export function parseFinancialYear(fy) {
  if (!fy) return null
  const match = fy.match(/(\d{4})-(\d{2})/)
  if (!match) return null
  return { startYear: parseInt(match[1]), endYear: 2000 + parseInt(match[2]) }
}

// Get current financial year
export function getCurrentFinancialYear() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`
  }
  return `${year - 1}-${String(year).slice(-2)}`
}

// Generate demand number
export function generateDemandNumber(fy, sequence) {
  const yearPart = fy.replace('FY ', '').replace('-', '')
  return `DEM-${yearPart}-${String(sequence).padStart(6, '0')}`
}

// Generate receipt number
export function generateReceiptNumber(fy, sequence) {
  const yearPart = fy.replace('FY ', '').replace('-', '')
  return `RCT-${yearPart}-${String(sequence).padStart(6, '0')}`
}

// Format date for display
export function formatDate(dateString, options = {}) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

// Format date time
export function formatDateTime(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Truncate text
export function truncate(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Generate property search key
export function generatePropertySearchKey(property) {
  const parts = [
    property.plotNo,
    property.houseNo,
    property.unitNo,
    property.ownerName,
    property.ownerMobile,
  ].filter(Boolean)
  return parts.join(' ').toLowerCase()
}

// Validate property search query
export function validateSearchQuery(query) {
  if (!query || !query.trim()) return { valid: false, error: 'Search query is required' }
  if (query.trim().length < 2) return { valid: false, error: 'Search query must be at least 2 characters' }
  return { valid: true }
}

// Calculate property tax (for display only - backend is source of truth)
export function calculatePropertyTaxDisplay(assessment) {
  if (!assessment) return { annual: 0, halfYearly: 0, quarterly: 0 }

  const baseTax = (assessment.baseRatePerSqft || 0) * (assessment.taxableAreaSqft || 0)
  const rebate = assessment.rebateAmount || 0
  const penalty = assessment.penaltyAmount || 0
  const annual = Math.max(0, baseTax - rebate + penalty)
  const halfYearly = annual / 2
  const quarterly = annual / 4

  return { annual, halfYearly, quarterly }
}

// Normalize property for map rendering
export function normalizePropertyForMap(property) {
  return {
    id: property.id,
    type: 'Feature',
    geometry: property.geometry || {
      type: 'Point',
      coordinates: [property.longitude, property.latitude],
    },
    properties: {
      plotNo: property.plotNo,
      houseNo: property.houseNo,
      unitNo: property.unitNo,
      ownerName: property.ownerName,
      ownerMobile: property.ownerMobile,
      propertyType: property.propertyType,
      taxStatus: property.taxStatus,
      currentDemand: property.currentDemand,
      totalPaid: property.totalPaid,
      totalOutstanding: property.totalOutstanding,
      totalArrears: property.totalArrears,
      landAreaSqft: property.landAreaSqft,
      builtUpAreaSqft: property.builtUpAreaSqft,
      blockName: property.blockName,
      wardName: property.wardName,
      villageName: property.villageName,
      isHighValue: property.isHighValue,
      isDisputed: property.isDisputed,
    },
  }
}

// Get map style for property based on tax status
export function getPropertyMapStyle(property, selectedId = null) {
  const isSelected = property.id === selectedId
  const status = property.taxStatus || 'due'

  const baseStyles = {
    paid: { fillColor: '#22c55e', color: '#15803d', fillOpacity: 0.6, weight: 2 },
    due: { fillColor: '#ef4444', color: '#b91c1c', fillOpacity: 0.5, weight: 1.5 },
    partial: { fillColor: '#f97316', color: '#c2410c', fillOpacity: 0.5, weight: 1.5 },
    arrears: { fillColor: '#dc2626', color: '#991b1b', fillOpacity: 0.6, weight: 2 },
    exempt: { fillColor: '#3b82f6', color: '#1d4ed8', fillOpacity: 0.3, weight: 1.5 },
    disputed: { fillColor: '#a855f7', color: '#7e22ce', fillOpacity: 0.5, weight: 2 },
  }

  const style = baseStyles[status] || baseStyles.due

  if (isSelected) {
    return {
      ...style,
      color: '#ffcc00',
      weight: 4,
      fillOpacity: Math.min(style.fillOpacity + 0.15, 0.9),
    }
  }

  return {
    ...style,
    opacity: style.weight === 2 ? 0.95 : 0.9,
  }
}

// Debounce function
export function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Format number with Indian numbering system
export function formatIndianNumber(num) {
  if (num == null || !Number.isFinite(num)) return '0'
  return Number(num).toLocaleString('en-IN')
}

// Calculate percentage
export function calculatePercentage(value, total, decimals = 1) {
  if (total === 0) return 0
  return Number(((value / total) * 100).toFixed(decimals))
}
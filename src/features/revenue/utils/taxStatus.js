// Revenue & Property Intelligence — Tax Status Utilities
// Backend is the source of truth; these are display helpers only

import { TAX_STATUS } from '../constants/revenueConstants.js'

export function normalizeTaxStatus(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (['paid', 'fully_paid'].includes(normalized)) return 'paid'
  if (['partial', 'partially_paid'].includes(normalized)) return 'partial'
  if (normalized === 'arrears') return 'arrears'
  if (normalized === 'unassessed') return 'unassessed'
  if (['unpaid', 'due', 'assessed'].includes(normalized)) return 'due'
  return 'unknown'
}

export function getTaxStatusLabel(status) {
  return ({ paid: 'Paid', due: 'Unpaid', partial: 'Partially paid', arrears: 'Arrears', unassessed: 'Unassessed', unknown: 'Status unavailable' })[normalizeTaxStatus(status)]
}

// Determine overall property tax status from multiple data points
// This is for display only - backend computes authoritative status
export function derivePropertyTaxStatus(propertyData) {
  const {
    currentDemand = 0,
    totalPaid = 0,
    totalOutstanding = 0,
    totalArrears = 0,
    isDisputed = false,
    isExempt = false,
  } = propertyData

  if (isExempt || currentDemand === 0) return TAX_STATUS.EXEMPT
  if (isDisputed) return TAX_STATUS.DISPUTED
  if (totalArrears > 0) return TAX_STATUS.ARREARS
  if (totalPaid === 0) return TAX_STATUS.DUE
  if (totalPaid >= currentDemand && totalOutstanding === 0) return TAX_STATUS.PAID
  if (totalPaid > 0 && totalPaid < currentDemand) return TAX_STATUS.PARTIAL
  if (totalOutstanding > 0) return TAX_STATUS.DUE
  return TAX_STATUS.DUE
}

// Get demand status label
export function getDemandStatusLabel(status) {
  const labels = {
    generated: 'Generated',
    sent: 'Notice Sent',
    partially_paid: 'Partially Paid',
    fully_paid: 'Fully Paid',
    cancelled: 'Cancelled',
    revised: 'Revised',
  }
  return labels[status] || status
}

// Get demand status color
export function getDemandStatusColor(status) {
  const colors = {
    generated: '#3b82f6',
    sent: '#f97316',
    partially_paid: '#eab308',
    fully_paid: '#22c55e',
    cancelled: '#94a3b8',
    revised: '#8b5cf6',
  }
  return colors[status] || '#94a3b8'
}

// Get recovery status label
export function getRecoveryStatusLabel(status) {
  const labels = {
    initiated: 'Initiated',
    notice_sent: 'Notice Sent',
    field_visit: 'Field Visit Scheduled',
    attachment: 'Property Attached',
    auction: 'Auction Scheduled',
    settled: 'Settled',
    write_off: 'Written Off',
  }
  return labels[status] || status
}

// Get recovery status color
export function getRecoveryStatusColor(status) {
  const colors = {
    initiated: '#3b82f6',
    notice_sent: '#f97316',
    field_visit: '#eab308',
    attachment: '#dc2626',
    auction: '#991b1b',
    settled: '#22c55e',
    write_off: '#6b7280',
  }
  return colors[status] || '#94a3b8'
}

// Check if property needs attention
export function getPropertyAttentionFlags(property) {
  const flags = []

  if (property.totalArrears > 0) {
    flags.push({ type: 'arrears', severity: 'high', message: `Arrears: ${property.totalArrears}` })
  }

  if (property.taxStatus === 'partial') {
    flags.push({ type: 'partial_payment', severity: 'medium', message: 'Partial payment received' })
  }

  if (property.isDisputed) {
    flags.push({ type: 'disputed', severity: 'high', message: 'Property under dispute' })
  }

  if (property.yearsPending >= 3) {
    flags.push({ type: 'long_term_arrears', severity: 'high', message: `${property.yearsPending} years pending` })
  }

  if (property.assessmentAreaMismatch) {
    flags.push({ type: 'area_mismatch', severity: 'high', message: 'GIS/Assessment area mismatch' })
  }

  if (property.suddenAssessmentChange) {
    flags.push({ type: 'assessment_change', severity: 'medium', message: 'Sudden assessment change detected' })
  }

  return flags
}

// Get payment status for a specific financial year
export function getFYPaymentStatus(payments, fy, demand) {
  const fyPayments = payments.filter(p => p.financialYear === fy)
  const totalPaid = fyPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  if (demand === 0) return { status: 'exempt', paid: 0, demand: 0 }
  if (totalPaid === 0) return { status: 'due', paid: 0, demand }
  if (totalPaid >= demand) return { status: 'paid', paid: totalPaid, demand }
  return { status: 'partial', paid: totalPaid, demand }
}

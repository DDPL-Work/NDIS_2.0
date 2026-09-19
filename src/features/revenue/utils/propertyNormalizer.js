// Property Normalizer — Single source of truth for property data presentation
// Normalizes raw GeoJSON/API data into a clean presentation model

import { calculatePropertyTax, getTaxBreakdown } from './propertyTaxCalculator'

// Normalize mobile number for display
export function formatMobile(mobile) {
  if (!mobile) return 'Not available'
  const cleaned = String(mobile).replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return mobile
}

// Get a human-readable property type
export function getPropertyType(subClass) {
  if (!subClass) return 'Not available'
  return String(subClass).charAt(0).toUpperCase() + String(subClass).slice(1).toLowerCase()
}

// Main property normalizer - converts raw feature/API data to clean presentation model
export function normalizePropertyForDisplay(feature) {
  const props = feature?.properties || {}
  const geometry = feature?.geometry
  const featureId = feature?.id

  // Calculate tax breakdown using existing utilities
  const breakdown = getTaxBreakdown(feature)
  const taxCalc = calculatePropertyTax(feature)

  // Determine tax status from backend data
  const isPaid = props.is_paid === true ||
    props.is_paid === 1 ||
    String(props.is_paid).toLowerCase() === 'true' ||
    String(props.tax_status || props.status).toUpperCase() === 'PAID'

  const taxStatus = isPaid ? 'paid' : 'due'

  // Generate unique property ID
  const propertyId = `data_resi_${featureId}`

  // Extract and normalize fields
  const normalized = {
    // Identity
    id: propertyId,
    plotNo: props.plot_no || props.plotNo || featureId,
    ownerName: props.name || props.feature_name || 'Not available',
    mobile: formatMobile(props.mobile || props.owner_mobile),
    propertyType: getPropertyType(props.sub_class),
    assessmentYear: props.assessment_year || '2026-2027',

    // GIS Information
    gis: {
      areaSqft: breakdown.available ? breakdown.areaSqft : (taxCalc.areaSqft ?? null),
      ratePerSqft: breakdown.available ? breakdown.ratePerSqft : (taxCalc.ratePerSqft ?? 50),
      layer: props.layer_name || 'data.gpkg',
      geometryType: geometry?.type || 'MultiPolygon',
    },

    // Tax Summary
    tax: {
      status: taxStatus,
      statusLabel: taxStatus === 'paid' ? 'PAID' : 'DUE / UNPAID',
      baseTax: breakdown.available ? breakdown.baseTax : (taxCalc.baseTax ?? 0),
      cess: breakdown.available ? breakdown.cess : (taxCalc.cess ?? 0),
      cessRate: breakdown.available ? breakdown.cessRate : (taxCalc.cessRate ?? 0.05),
      totalAmount: breakdown.available ? breakdown.totalAmount : (taxCalc.totalAmount ?? 0),
      calculationAvailable: breakdown.available && !taxCalc.calculationUnavailable,
    },

    // Payment info (if paid)
    payment: isPaid ? {
      receiptNo: props.receipt_no,
      transactionId: props.transaction_id,
      paidAt: props.paid_at,
      paidAmount: props.paid_amount || props.total_paid || props.totalPaid,
    } : null,

    // Raw data for payment processing
    raw: {
      propertyId,
      plotNo: props.plot_no,
      ownerName: props.name || props.feature_name,
      mobile: props.mobile,
      areaSqft: breakdown.available ? breakdown.areaSqft : (taxCalc.areaSqft ?? 0),
      taxAmount: breakdown.available ? breakdown.totalAmount : (taxCalc.totalAmount ?? 0),
      assessmentYear: props.assessment_year || '2026-2027',
      periodMonth: props.period_month,
      isPaid,
    },
  }

  return normalized
}

// Normalize property for payment processing (minimal fields)
export function normalizePropertyForPayment(feature) {
  const normalized = normalizePropertyForDisplay(feature)
  return {
    propertyId: normalized.raw.propertyId,
    plotNo: normalized.raw.plotNo,
    ownerName: normalized.raw.ownerName,
    mobile: normalized.raw.mobile,
    areaSqft: normalized.raw.areaSqft,
    taxAmount: normalized.raw.taxAmount,
    assessmentYear: normalized.raw.assessmentYear,
    periodMonth: normalized.raw.periodMonth,
    isPaid: normalized.raw.isPaid,
  }
}

// Normalize property for map rendering
export function normalizePropertyForMap(feature) {
  const normalized = normalizePropertyForDisplay(feature)
  return {
    id: normalized.id,
    type: 'Feature',
    geometry: feature?.geometry,
    properties: {
      plotNo: normalized.plotNo,
      ownerName: normalized.ownerName,
      taxStatus: normalized.tax.status,
      isPaid: normalized.raw.isPaid,
      totalAmount: normalized.tax.totalAmount,
    },
  }
}

// Normalize a list of properties
export function normalizePropertiesList(features) {
  return features.map(normalizePropertyForDisplay)
}

// Check if property data is valid for payment
export function isPropertyPayable(normalizedProperty) {
  return normalizedProperty &&
    !normalizedProperty.raw.isPaid &&
    normalizedProperty.tax.totalAmount > 0 &&
    normalizedProperty.raw.plotNo &&
    normalizedProperty.raw.ownerName
}

// Get display label for tax status
export function getTaxStatusDisplay(status) {
  const labels = {
    paid: 'PAID',
    due: 'DUE / UNPAID',
    partial: 'PARTIALLY PAID',
    arrears: 'ARREARS',
  }
  return labels[status] || status.toUpperCase()
}

// Get CSS classes for tax status badge
export function getTaxStatusBadgeClasses(status) {
  const classes = {
    paid: 'bg-leaf-100 text-leaf-700 border border-leaf-200',
    due: 'bg-alert-50 text-alert-600 border border-alert-100',
    partial: 'bg-amber-50 text-amber-700 border border-amber-200',
    arrears: 'bg-red-50 text-red-700 border border-red-200',
  }
  return classes[status] || classes.due
}
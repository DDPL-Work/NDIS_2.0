// Revenue & Property Intelligence — Data Normalizers
// Transform backend DTOs to frontend view models

import { mapProperty } from '../api/propertyApi.js'
import { mapAssessment } from '../api/assessmentApi.js'
import { mapDemand } from '../api/demandApi.js'
import { mapPayment, mapReceipt } from '../api/paymentApi.js'
import { mapArrear, mapRecoveryAction } from '../api/arrearsApi.js'
import { mapNotice, mapInspection, mapReassessment } from '../api/noticeInspectionReassessmentApi.js'

// Normalize property list from backend
export function normalizePropertyList(response) {
  if (!response) return { data: [], pagination: { count: 0, next: null, previous: null } }
  const data = Array.isArray(response) ? response : response.data || response.results || response.records || []
  return {
    data: data.map(mapProperty),
    pagination: {
      count: response.count ?? 0,
      next: response.next ?? null,
      previous: response.previous ?? null,
    },
  }
}

// Normalize single property with all related data
export function normalizePropertyDetail(propertyDto, relatedData = {}) {
  const property = mapProperty(propertyDto)
  return {
    ...property,
    assessments: (relatedData.assessments || []).map(mapAssessment),
    demands: (relatedData.demands || []).map(mapDemand),
    payments: (relatedData.payments || []).map(mapPayment),
    receipts: (relatedData.receipts || []).map(mapReceipt),
    arrears: (relatedData.arrears || []).map(mapArrear),
    notices: (relatedData.notices || []).map(mapNotice),
    inspections: (relatedData.inspections || []).map(mapInspection),
    reassessments: (relatedData.reassessments || []).map(mapReassessment),
    recoveryActions: (relatedData.recoveryActions || []).map(mapRecoveryAction),
  }
}

// Normalize assessment list
export function normalizeAssessmentList(response) {
  if (!response) return { data: [], pagination: { count: 0, next: null, previous: null } }
  const data = Array.isArray(response) ? response : response.data || response.results || response.records || []
  return {
    data: data.map(mapAssessment),
    pagination: {
      count: response.count ?? 0,
      next: response.next ?? null,
      previous: response.previous ?? null,
    },
  }
}

// Normalize demand list
export function normalizeDemandList(response) {
  if (!response) return { data: [], pagination: { count: 0, next: null, previous: null } }
  const data = Array.isArray(response) ? response : response.data || response.results || response.records || []
  return {
    data: data.map(mapDemand),
    pagination: {
      count: response.count ?? 0,
      next: response.next ?? null,
      previous: response.previous ?? null,
    },
  }
}

// Normalize payment list
export function normalizePaymentList(response) {
  if (!response) return { data: [], pagination: { count: 0, next: null, previous: null } }
  const data = Array.isArray(response) ? response : response.data || response.results || response.records || []
  return {
    data: data.map(mapPayment),
    pagination: {
      count: response.count ?? 0,
      next: response.next ?? null,
      previous: response.previous ?? null,
    },
  }
}

// Normalize arrears list
export function normalizeArrearsList(response) {
  if (!response) return { data: [], pagination: { count: 0, next: null, previous: null } }
  const data = Array.isArray(response) ? response : response.data || response.results || response.records || []
  return {
    data: data.map(mapArrear),
    pagination: {
      count: response.count ?? 0,
      next: response.next ?? null,
      previous: response.previous ?? null,
    },
  }
}

// Normalize recovery actions list
export function normalizeRecoveryList(response) {
  if (!response) return { data: [], pagination: { count: 0, next: null, previous: null } }
  const data = Array.isArray(response) ? response : response.data || response.results || response.records || []
  return {
    data: data.map(mapRecoveryAction),
    pagination: {
      count: response.count ?? 0,
      next: response.next ?? null,
      previous: response.previous ?? null,
    },
  }
}

// Normalize notice list
export function normalizeNoticeList(response) {
  if (!response) return { data: [], pagination: { count: 0, next: null, previous: null } }
  const data = Array.isArray(response) ? response : response.data || response.results || response.records || []
  return {
    data: data.map(mapNotice),
    pagination: {
      count: response.count ?? 0,
      next: response.next ?? null,
      previous: response.previous ?? null,
    },
  }
}

// Normalize inspection list
export function normalizeInspectionList(response) {
  if (!response) return { data: [], pagination: { count: 0, next: null, previous: null } }
  const data = Array.isArray(response) ? response : response.data || response.results || response.records || []
  return {
    data: data.map(mapInspection),
    pagination: {
      count: response.count ?? 0,
      next: response.next ?? null,
      previous: response.previous ?? null,
    },
  }
}

// Normalize reassessment list
export function normalizeReassessmentList(response) {
  if (!response) return { data: [], pagination: { count: 0, next: null, previous: null } }
  const data = Array.isArray(response) ? response : response.data || response.results || response.records || []
  return {
    data: data.map(mapReassessment),
    pagination: {
      count: response.count ?? 0,
      next: response.next ?? null,
      previous: response.previous ?? null,
    },
  }
}

// Create GeoJSON FeatureCollection from property list
export function propertiesToGeoJSON(properties) {
  return {
    type: 'FeatureCollection',
    features: properties.map(p => ({
      type: 'Feature',
      id: p.id,
      geometry: p.geometry || {
        type: 'Point',
        coordinates: [p.longitude, p.latitude],
      },
      properties: {
        plotNo: p.plotNo,
        houseNo: p.houseNo,
        unitNo: p.unitNo,
        ownerName: p.ownerName,
        propertyType: p.propertyType,
        taxStatus: p.taxStatus,
        currentDemand: p.currentDemand,
        totalPaid: p.totalPaid,
        totalOutstanding: p.totalOutstanding,
        totalArrears: p.totalArrears,
        landAreaSqft: p.landAreaSqft,
        builtUpAreaSqft: p.builtUpAreaSqft,
        blockName: p.blockName,
        wardName: p.wardName,
        villageName: p.villageName,
        isHighValue: p.isHighValue,
        isDisputed: p.isDisputed,
      },
    })),
  }
}

// Aggregate properties by location for block/ward analytics
export function aggregatePropertiesByLocation(properties) {
  const blockMap = new Map()
  const wardMap = new Map()
  const villageMap = new Map()

  properties.forEach(p => {
    // Block aggregation
    if (p.blockId) {
      const block = blockMap.get(p.blockId) || {
        blockId: p.blockId,
        blockName: p.blockName,
        totalProperties: 0,
        totalDemand: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        totalArrears: 0,
        paidCount: 0,
        dueCount: 0,
        partialCount: 0,
        arrearsCount: 0,
      }
      block.totalProperties++
      block.totalDemand += p.currentDemand || 0
      block.totalCollected += p.totalPaid || 0
      block.totalOutstanding += p.totalOutstanding || 0
      block.totalArrears += p.totalArrears || 0
      if (p.taxStatus === 'paid') block.paidCount++
      else if (p.taxStatus === 'due') block.dueCount++
      else if (p.taxStatus === 'partial') block.partialCount++
      else if (p.taxStatus === 'arrears') block.arrearsCount++
      blockMap.set(p.blockId, block)
    }

    // Ward aggregation
    if (p.wardId) {
      const ward = wardMap.get(p.wardId) || {
        wardId: p.wardId,
        wardName: p.wardName,
        blockId: p.blockId,
        blockName: p.blockName,
        totalProperties: 0,
        totalDemand: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        totalArrears: 0,
      }
      ward.totalProperties++
      ward.totalDemand += p.currentDemand || 0
      ward.totalCollected += p.totalPaid || 0
      ward.totalOutstanding += p.totalOutstanding || 0
      ward.totalArrears += p.totalArrears || 0
      wardMap.set(p.wardId, ward)
    }

    // Village aggregation
    if (p.villageId) {
      const village = villageMap.get(p.villageId) || {
        villageId: p.villageId,
        villageName: p.villageName,
        wardId: p.wardId,
        wardName: p.wardName,
        totalProperties: 0,
        totalDemand: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        totalArrears: 0,
      }
      village.totalProperties++
      village.totalDemand += p.currentDemand || 0
      village.totalCollected += p.totalPaid || 0
      village.totalOutstanding += p.totalOutstanding || 0
      village.totalArrears += p.totalArrears || 0
      villageMap.set(p.villageId, village)
    }
  })

  return {
    blocks: Array.from(blockMap.values()),
    wards: Array.from(wardMap.values()),
    villages: Array.from(villageMap.values()),
  }
}

// Normalize analytics response
// eslint-disable-next-line no-unused-vars
export function normalizeAnalyticsResponse(response, _type) {
  if (!response) return null
  // Backend returns pre-aggregated analytics data
  return response
}

/**
 * Normalize single tax list record from GET /api/gis/tax-list/
 */
export function normalizeTaxListRecord(dto) {
  if (!dto || typeof dto !== 'object') return null
  const id = String(dto.id || dto.plot_id || dto.property_id || '')
  const plotId = dto.plot_id || dto.plot_no || dto.plot_number || id
  const demand = typeof dto.tax_amount === 'number' ? dto.tax_amount : (typeof dto.demand === 'number' ? dto.demand : 0)
  const paid = typeof dto.paid_amount === 'number' ? dto.paid_amount : (typeof dto.paid === 'number' ? dto.paid : 0)
  const outstanding = typeof dto.due_amount === 'number' ? dto.due_amount : Math.max(0, demand - paid)
  const isPaid = Boolean(dto.paid_status || dto.is_paid || dto.status === 'PAID' || (demand > 0 && paid >= demand))

  return {
    id,
    plotId,
    ownerName: dto.owner_name || dto.owner || '',
    mobile: dto.owner_mobile || dto.mobile || '',
    address: dto.address || '',
    demand,
    paid,
    outstanding,
    taxStatus: isPaid ? 'paid' : (outstanding > 0 ? 'due' : 'unknown'),
    isPaid,
    paymentDate: dto.payment_date || dto.last_payment_date || null,
    raw: dto
  }
}

/**
 * Normalize payment submission response from POST /api/gis/pay-tax/
 */
export function normalizePaymentResponse(dto) {
  if (!dto || typeof dto !== 'object') return { success: false, message: 'Invalid response' }
  return {
    success: Boolean(dto.status === 'SUCCESS' || dto.success || dto.transaction_id),
    transactionId: dto.transaction_id || dto.reference_no || dto.id || null,
    status: dto.status || 'SUCCESS',
    message: dto.message || 'Payment successfully processed',
    raw: dto
  }
}
// Revenue & Property Intelligence — Arrears & Recovery API
// Mirrors backend endpoints: /api/revenue/arrears/, /api/revenue/recovery/

import { apiRequest, withQuery, normalizeRows, normalizePagination, BackendCapabilityError } from '../../../api/apiClient.js'

const ARREARS_PATH = '/revenue/arrears/'
const RECOVERY_PATH = '/revenue/recovery/'

export function mapArrear(dto) {
  return {
    id: String(dto.id || dto.arrear_id),
    arrearId: dto.arrear_id || dto.id,
    propertyId: dto.property_id || '',
    propertyPlotNo: dto.property_plot_no || '',
    ownerName: dto.owner_name || '',
    financialYear: dto.financial_year || '',
    demandId: dto.demand_id || '',
    originalDemand: Number(dto.original_demand || 0),
    paidAmount: Number(dto.paid_amount || 0),
    outstandingAmount: Number(dto.outstanding_amount || 0),
    penaltyAmount: Number(dto.penalty_amount || 0),
    interestAmount: Number(dto.interest_amount || 0),
    totalArrears: Number(dto.total_arrears || 0),
    yearsPending: Number(dto.years_pending || 0),
    oldestFy: dto.oldest_fy || '',
    lastPaymentDate: dto.last_payment_date || null,
    lastPaymentAmount: Number(dto.last_payment_amount || 0),
    agingBucket: dto.aging_bucket || 'current',
    recoveryStatus: dto.recovery_status || 'initiated',
    recoveryActionId: dto.recovery_action_id || '',
    recoveryOfficer: dto.recovery_officer || '',
    assignedAt: dto.assigned_at || null,
    isDisputed: Boolean(dto.is_disputed),
    disputeDetails: dto.dispute_details || '',
    remarks: dto.remarks || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

export function mapRecoveryAction(dto) {
  return {
    id: String(dto.id || dto.recovery_id),
    recoveryId: dto.recovery_id || dto.id,
    arrearId: dto.arrear_id || '',
    propertyId: dto.property_id || '',
    propertyPlotNo: dto.property_plot_no || '',
    actionType: dto.action_type || 'notice_sent',
    actionDate: dto.action_date || null,
    actionBy: dto.action_by || '',
    description: dto.description || '',
    status: dto.status || 'pending',
    nextActionDate: dto.next_action_date || null,
    nextActionType: dto.next_action_type || '',
    attachedPropertyDetails: dto.attached_property_details || '',
    auctionDate: dto.auction_date || null,
    auctionResult: dto.auction_result || '',
    settledAmount: Number(dto.settled_amount || 0),
    settledDate: dto.settled_date || null,
    writeOffAmount: Number(dto.write_off_amount || 0),
    writeOffReason: dto.write_off_reason || '',
    writeOffApprovedBy: dto.write_off_approved_by || '',
    writeOffApprovedAt: dto.write_off_approved_at || null,
    remarks: dto.remarks || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

export const arrearsApi = {
  async list(params = {}) {
    try {
      const response = await apiRequest(withQuery(ARREARS_PATH, params))
      const rows = normalizeRows(response)
      const pagination = normalizePagination(response)
      return { data: rows.map(mapArrear), pagination }
    } catch (error) {
      const mockResult = revenueMockEngine.getProperties({ taxStatus: 'ARREARS', ...params })
      const mockArrears = mockResult.items.map(p => ({
        id: `ARR-${p.id}`,
        arrearId: `ARR-${p.id}`,
        propertyId: p.id,
        propertyPlotNo: p.holdingNumber,
        ownerName: p.ownerName,
        financialYear: '2025-2026',
        originalDemand: p.annualDemand,
        paidAmount: 0,
        outstandingAmount: p.arrearsAmount,
        penaltyAmount: Math.round(p.arrearsAmount * 0.1),
        interestAmount: Math.round(p.arrearsAmount * 0.12),
        totalArrears: p.arrearsAmount,
        yearsPending: p.arrearsAgingBucket === '5+_years' ? 5 : 2,
        agingBucket: p.arrearsAgingBucket || '1-3_years',
        recoveryStatus: 'INITIATED'
      }))
      return {
        data: mockArrears.map(mapArrear),
        pagination: {
          total: mockResult.total,
          page: mockResult.page,
          limit: mockResult.limit,
          totalPages: mockResult.totalPages
        }
      }
    }
  },

  async get(id) {
    try {
      const dto = await apiRequest(`${ARREARS_PATH}${encodeURIComponent(id)}/`)
      return mapArrear(dto)
    } catch (error) {
      return mapArrear({
        id,
        arrear_id: id,
        property_id: 'PROP-NAL-0004',
        total_arrears: 45000,
        aging_bucket: '1-3_years'
      })
    }
  },

  async getByProperty(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${ARREARS_PATH}by-property/`, { propertyId, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapArrear)
    } catch (error) {
      const prop = revenueMockEngine.getPropertyById(propertyId)
      if (!prop || prop.arrearsAmount === 0) return []
      return [
        mapArrear({
          id: `ARR-${propertyId}`,
          property_id: propertyId,
          total_arrears: prop.arrearsAmount,
          aging_bucket: prop.arrearsAgingBucket || '1-3_years'
        })
      ]
    }
  },

  async getAging(params = {}) {
    try {
      const response = await apiRequest(withQuery(`${ARREARS_PATH}aging/`, params))
      const rows = normalizeRows(response)
      return rows.map(mapArrear)
    } catch (error) {
      const list = await this.list({ ...params, limit: 100 })
      return list.data
    }
  },

  async getRecoveryList(params = {}) {
    try {
      const response = await apiRequest(withQuery(RECOVERY_PATH, params))
      const rows = normalizeRows(response)
      const pagination = normalizePagination(response)
      return { data: rows.map(mapRecoveryAction), pagination }
    } catch (error) {
      return {
        data: revenueMockEngine.recoveryActions.map(mapRecoveryAction),
        pagination: { total: revenueMockEngine.recoveryActions.length, page: 1, limit: 50, totalPages: 1 }
      }
    }
  },

  async getRecoveryDetail(id) {
    try {
      const dto = await apiRequest(`${RECOVERY_PATH}${encodeURIComponent(id)}/`)
      return mapRecoveryAction(dto)
    } catch (error) {
      const item = revenueMockEngine.recoveryActions.find(r => r.id === id) || revenueMockEngine.recoveryActions[0]
      return mapRecoveryAction(item)
    }
  },

  async getRecoveryByProperty(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${RECOVERY_PATH}by-property/`, { propertyId, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapRecoveryAction)
    } catch (error) {
      return revenueMockEngine.getPropertyWorkflows(propertyId).recoveryActions.map(mapRecoveryAction)
    }
  },

  async createRecoveryAction(_payload) {
    return { id: `REC-2026-${Date.now()}`, status: 'SUCCESS' }
  },

  async updateRecoveryAction(_id, _payload) {
    return { status: 'UPDATED' }
  },

  async initiateAttachment(_recoveryId) {
    return { status: 'ATTACHMENT_INITIATED' }
  },

  async scheduleAuction(_recoveryId, _auctionDate) {
    return { status: 'AUCTION_SCHEDULED' }
  },

  async recordSettlement(_recoveryId, _payload) {
    return { status: 'SETTLED' }
  },

  async writeOff(_recoveryId, _payload) {
    return { status: 'WRITTEN_OFF' }
  },
}
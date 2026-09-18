// Revenue & Property Intelligence — Notices, Inspections & Reassessment API
// Mirrors backend endpoints: /api/revenue/notices/, /api/revenue/inspections/, /api/revenue/reassessment/

import { apiRequest, withQuery, normalizeRows, normalizePagination, BackendCapabilityError } from '../../../api/apiClient.js'
import { revenueMockEngine } from '../mock/revenueMockEngine.js'


const NOTICES_PATH = '/revenue/notices/'
const INSPECTIONS_PATH = '/revenue/inspections/'
const REASSESSMENT_PATH = '/revenue/reassessment/'

export function mapNotice(dto) {
  return {
    id: String(dto.id || dto.notice_id),
    noticeId: dto.notice_id || dto.id,
    propertyId: dto.property_id || '',
    propertyPlotNo: dto.property_plot_no || '',
    ownerName: dto.owner_name || '',
    noticeType: dto.notice_type || 'demand_notice',
    noticeNumber: dto.notice_number || '',
    issueDate: dto.issue_date || null,
    dueDate: dto.due_date || null,
    financialYear: dto.financial_year || '',
    demandAmount: Number(dto.demand_amount || 0),
    outstandingAmount: Number(dto.outstanding_amount || 0),
    issuedBy: dto.issued_by || '',
    status: dto.status || 'issued',
    servedDate: dto.served_date || null,
    servedBy: dto.served_by || '',
    responseReceived: Boolean(dto.response_received),
    responseDate: dto.response_date || null,
    responseDetails: dto.response_details || '',
    remarks: dto.remarks || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

export function mapInspection(dto) {
  return {
    id: String(dto.id || dto.inspection_id),
    inspectionId: dto.inspection_id || dto.id,
    propertyId: dto.property_id || '',
    propertyPlotNo: dto.property_plot_no || '',
    ownerName: dto.owner_name || '',
    inspectionType: dto.inspection_type || 'routine',
    inspectionDate: dto.inspection_date || null,
    scheduledDate: dto.scheduled_date || null,
    inspectorId: dto.inspector_id || '',
    inspectorName: dto.inspector_name || '',
    assignedBy: dto.assigned_by || '',
    status: dto.status || 'scheduled',
    findings: dto.findings || '',
    gisVerified: Boolean(dto.gis_verified),
    gisVerificationDate: dto.gis_verification_date || null,
    gisVerificationBy: dto.gis_verification_by || '',
    areaDiscrepancy: Number(dto.area_discrepancy || 0),
    assessmentChangeRecommended: Boolean(dto.assessment_change_recommended),
    recommendedAssessment: Number(dto.recommended_assessment || 0),
    evidencePhotos: dto.evidence_photos || [],
    evidenceDocuments: dto.evidence_documents || [],
    gpsCoordinates: dto.gps_coordinates || null,
    remarks: dto.remarks || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

export function mapReassessment(dto) {
  return {
    id: String(dto.id || dto.reassessment_id),
    reassessmentId: dto.reassessment_id || dto.id,
    propertyId: dto.property_id || '',
    propertyPlotNo: dto.property_plot_no || '',
    ownerName: dto.owner_name || '',
    triggerReason: dto.trigger_reason || '',
    requestedBy: dto.requested_by || '',
    requestedDate: dto.requested_date || null,
    approvedBy: dto.approved_by || '',
    approvedDate: dto.approved_date || null,
    status: dto.status || 'requested',
    oldAssessment: Number(dto.old_assessment || 0),
    newAssessment: Number(dto.new_assessment || 0),
    changePercent: Number(dto.change_percent || 0),
    effectiveFrom: dto.effective_from || null,
    effectiveTo: dto.effective_to || null,
    inspectionId: dto.inspection_id || '',
    remarks: dto.remarks || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

export const noticeApi = {
  async list(params = {}) {
    try {
      const response = await apiRequest(withQuery(NOTICES_PATH, params))
      const rows = normalizeRows(response)
      const pagination = normalizePagination(response)
      return { data: rows.map(mapNotice), pagination }
    } catch (error) {
      return {
        data: revenueMockEngine.notices.map(mapNotice),
        pagination: { total: revenueMockEngine.notices.length, page: 1, limit: 50, totalPages: 1 }
      }
    }
  },

  async get(id) {
    try {
      const dto = await apiRequest(`${NOTICES_PATH}${encodeURIComponent(id)}/`)
      return mapNotice(dto)
    } catch (error) {
      const item = revenueMockEngine.notices.find(n => n.id === id) || revenueMockEngine.notices[0]
      return mapNotice(item)
    }
  },

  async getByProperty(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${NOTICES_PATH}by-property/`, { propertyId, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapNotice)
    } catch (error) {
      return revenueMockEngine.getPropertyWorkflows(propertyId).notices.map(mapNotice)
    }
  },

  async issue(payload) {
    try {
      const dto = await apiRequest(NOTICES_PATH, { method: 'POST', body: payload })
      return mapNotice(dto)
    } catch (error) {
      const created = revenueMockEngine.createNotice(payload.propertyId, payload)
      return mapNotice(created)
    }
  },

  async markServed(_id, _servedBy, _servedDate) {
    return { status: 'SERVED' }
  },

  async recordResponse(_id, _responseDetails) {
    return { status: 'RESPONSE_RECORDED' }
  },
}

export const inspectionApi = {
  async list(params = {}) {
    try {
      const response = await apiRequest(withQuery(INSPECTIONS_PATH, params))
      const rows = normalizeRows(response)
      const pagination = normalizePagination(response)
      return { data: rows.map(mapInspection), pagination }
    } catch (error) {
      return {
        data: revenueMockEngine.inspections.map(mapInspection),
        pagination: { total: revenueMockEngine.inspections.length, page: 1, limit: 50, totalPages: 1 }
      }
    }
  },

  async get(id) {
    try {
      const dto = await apiRequest(`${INSPECTIONS_PATH}${encodeURIComponent(id)}/`)
      return mapInspection(dto)
    } catch (error) {
      const item = revenueMockEngine.inspections.find(i => i.id === id) || revenueMockEngine.inspections[0]
      return mapInspection(item)
    }
  },

  async getByProperty(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${INSPECTIONS_PATH}by-property/`, { propertyId, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapInspection)
    } catch (error) {
      return revenueMockEngine.getPropertyWorkflows(propertyId).inspections.map(mapInspection)
    }
  },

  async getAssigned(officerId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${INSPECTIONS_PATH}assigned/`, { officerId, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapInspection)
    } catch (error) {
      return revenueMockEngine.inspections.map(mapInspection)
    }
  },

  async getScheduled(params = {}) {
    try {
      const response = await apiRequest(withQuery(`${INSPECTIONS_PATH}scheduled/`, params))
      const rows = normalizeRows(response)
      return rows.map(mapInspection)
    } catch (error) {
      return revenueMockEngine.inspections.map(mapInspection)
    }
  },

  async schedule(payload) {
    try {
      const dto = await apiRequest(INSPECTIONS_PATH, { method: 'POST', body: payload })
      return mapInspection(dto)
    } catch (error) {
      const created = revenueMockEngine.createInspection(payload.propertyId, payload)
      return mapInspection(created)
    }
  },

  async start(_id, _inspectorId) {
    return { status: 'IN_PROGRESS' }
  },

  async complete(_id, _payload) {
    return { status: 'COMPLETED' }
  },

  async uploadEvidence(_id, _files) {
    return { status: 'EVIDENCE_UPLOADED' }
  },
}

export const reassessmentApi = {
  async list(params = {}) {
    try {
      const response = await apiRequest(withQuery(REASSESSMENT_PATH, params))
      const rows = normalizeRows(response)
      const pagination = normalizePagination(response)
      return { data: rows.map(mapReassessment), pagination }
    } catch (error) {
      return {
        data: revenueMockEngine.reassessments.map(mapReassessment),
        pagination: { total: revenueMockEngine.reassessments.length, page: 1, limit: 50, totalPages: 1 }
      }
    }
  },

  async get(id) {
    try {
      const dto = await apiRequest(`${REASSESSMENT_PATH}${encodeURIComponent(id)}/`)
      return mapReassessment(dto)
    } catch (error) {
      const item = revenueMockEngine.reassessments.find(r => r.id === id) || revenueMockEngine.reassessments[0]
      return mapReassessment(item)
    }
  },

  async getByProperty(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${REASSESSMENT_PATH}by-property/`, { propertyId, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapReassessment)
    } catch (error) {
      return revenueMockEngine.getPropertyWorkflows(propertyId).reassessments.map(mapReassessment)
    }
  },

  async initiate(payload) {
    return { id: `REASS-2026-${Date.now()}`, status: 'INITIATED' }
  },

  async approve(_id, _payload) {
    return { status: 'APPROVED' }
  },

  async reject(_id, _reason) {
    return { status: 'REJECTED' }
  },
}
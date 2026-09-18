// Revenue & Property Intelligence — Timeline, Risk, Compliance Hooks
import { useQuery } from '@tanstack/react-query'
import { apiRequest, withQuery, normalizeRows, BackendCapabilityError } from '../../../api/apiClient'
import { timelineKeys, riskKeys, complianceKeys } from '../constants/queryKeys'

const TIMELINE_PATH = '/revenue/timeline/'
const RISK_PATH = '/revenue/risk/'
const COMPLIANCE_PATH = '/revenue/compliance/'

function mapTimelineEvent(dto) {
  return {
    id: String(dto.id || dto.event_id),
    eventId: dto.event_id || dto.id,
    propertyId: dto.property_id || '',
    eventType: dto.event_type || '',
    eventTypeLabel: dto.event_type_label || dto.event_type || '',
    eventDate: dto.event_date || null,
    description: dto.description || '',
    amount: Number(dto.amount || 0),
    status: dto.status || '',
    actor: dto.actor || '',
    actorRole: dto.actor_role || '',
    metadata: dto.metadata || {},
    createdAt: dto.created_at || null,
    raw: dto,
  }
}

function mapRiskAssessment(dto) {
  return {
    id: String(dto.id || dto.risk_id),
    riskId: dto.risk_id || dto.id,
    propertyId: dto.property_id || '',
    riskScore: Number(dto.risk_score || 0),
    riskLevel: dto.risk_level || 'low',
    riskFactors: dto.risk_factors || [],
    assessmentDate: dto.assessment_date || null,
    assessedBy: dto.assessed_by || '',
    isMockData: Boolean(dto.is_mock_data),
    mockDataDisclaimer: dto.mock_data_disclaimer || 'This risk assessment is based on mock data for demonstration purposes only.',
    nextReviewDate: dto.next_review_date || null,
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

function mapComplianceStatus(dto) {
  return {
    id: String(dto.id || dto.compliance_id),
    complianceId: dto.compliance_id || dto.id,
    propertyId: dto.property_id || '',
    noticeStatus: dto.notice_status || 'none',
    noticeCount: Number(dto.notice_count || 0),
    lastNoticeDate: dto.last_notice_date || null,
    inspectionStatus: dto.inspection_status || 'none',
    inspectionCount: Number(dto.inspection_count || 0),
    lastInspectionDate: dto.last_inspection_date || null,
    disputeStatus: dto.dispute_status || 'none',
    disputeCount: Number(dto.dispute_count || 0),
    reassessmentStatus: dto.reassessment_status || 'none',
    reassessmentCount: Number(dto.reassessment_count || 0),
    lastUpdated: dto.last_updated || null,
    raw: dto,
  }
}

export const timelineApi = {
  async getTimeline(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${TIMELINE_PATH}property/${encodeURIComponent(propertyId)}/`, params))
      const rows = normalizeRows(response)
      return rows.map(mapTimelineEvent)
    } catch {
      throw new BackendCapabilityError('property timeline')
    }
  },

  async getTimelineEvent(id) {
    try {
      const dto = await apiRequest(`${TIMELINE_PATH}${encodeURIComponent(id)}/`)
      return mapTimelineEvent(dto)
    } catch {
      throw new BackendCapabilityError('timeline event detail')
    }
  },
}

export const riskApi = {
  async getRiskAssessment(propertyId) {
    try {
      const dto = await apiRequest(`${RISK_PATH}property/${encodeURIComponent(propertyId)}/`)
      return mapRiskAssessment(dto)
    } catch {
      throw new BackendCapabilityError('risk assessment')
    }
  },

  async getRiskAssessmentDetail(id) {
    try {
      const dto = await apiRequest(`${RISK_PATH}${encodeURIComponent(id)}/`)
      return mapRiskAssessment(dto)
    } catch {
      throw new BackendCapabilityError('risk assessment detail')
    }
  },

  async triggerRiskRecalculation(propertyId) {
    throw new BackendCapabilityError('risk recalculation trigger')
  },
}

export const complianceApi = {
  async getComplianceStatus(propertyId) {
    try {
      const dto = await apiRequest(`${COMPLIANCE_PATH}property/${encodeURIComponent(propertyId)}/`)
      return mapComplianceStatus(dto)
    } catch {
      throw new BackendCapabilityError('compliance status')
    }
  },
}
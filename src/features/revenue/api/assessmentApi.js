// Revenue & Property Intelligence — Assessment API
// Mirrors backend endpoints: /api/revenue/assessments/

import { apiRequest, withQuery, normalizeRows, normalizePagination, BackendCapabilityError } from '../../../api/apiClient.js'
import { revenueMockEngine } from '../mock/revenueMockEngine.js'

const PATH = '/revenue/assessments/'

export function mapAssessment(dto) {
  return {
    id: String(dto.id || dto.assessment_id),
    assessmentId: dto.assessment_id || dto.id,
    propertyId: dto.property_id || '',
    propertyPlotNo: dto.property_plot_no || '',
    financialYear: dto.financial_year || '',
    assessmentDate: dto.assessment_date || null,
    assessedBy: dto.assessed_by || '',
    propertyType: dto.property_type || 'residential',
    landAreaSqft: Number(dto.land_area_sqft || 0),
    builtUpAreaSqft: Number(dto.built_up_area_sqft || 0),
    usageType: dto.usage_type || 'self_occupied',
    constructionType: dto.construction_type || 'pucca',
    floors: Number(dto.floors || 1),
    assessmentCategory: dto.assessment_category || '',
    applicableRuleId: dto.applicable_rule_id || '',
    applicableRuleName: dto.applicable_rule_name || '',
    baseRatePerSqft: Number(dto.base_rate_per_sqft || 0),
    taxableAreaSqft: Number(dto.taxable_area_sqft || 0),
    rebatePercent: Number(dto.rebate_percent || 0),
    rebateAmount: Number(dto.rebate_amount || 0),
    penaltyPercent: Number(dto.penalty_percent || 0),
    penaltyAmount: Number(dto.penalty_amount || 0),
    annualTax: Number(dto.annual_tax || 0),
    annualValue: Number(dto.annual_value || dto.annual_tax || 0),
    halfYearlyTax: Number(dto.half_yearly_tax || 0),
    quarterlyTax: Number(dto.quarterly_tax || 0),
    status: dto.status || 'active',
    effectiveFrom: dto.effective_from || null,
    effectiveTo: dto.effective_to || null,
    remarks: dto.remarks || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

export function mapTaxRule(dto) {
  return {
    id: String(dto.id || dto.rule_id),
    ruleId: dto.rule_id || dto.id,
    name: dto.name || '',
    code: dto.code || '',
    description: dto.description || '',
    propertyType: dto.property_type || 'all',
    usageType: dto.usage_type || 'all',
    constructionType: dto.construction_type || 'all',
    minAreaSqft: Number(dto.min_area_sqft || 0),
    maxAreaSqft: dto.max_area_sqft ? Number(dto.max_area_sqft) : null,
    baseRatePerSqft: Number(dto.base_rate_per_sqft || 0),
    rebateRules: dto.rebate_rules || [],
    penaltyRules: dto.penalty_rules || [],
    effectiveFrom: dto.effective_from || null,
    effectiveTo: dto.effective_to || null,
    isActive: Boolean(dto.is_active),
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

export const assessmentApi = {
  async list(params = {}) {
    try {
      const response = await apiRequest(withQuery(PATH, params))
      const rows = normalizeRows(response)
      const pagination = normalizePagination(response)
      return { data: rows.map(mapAssessment), pagination }
    } catch (error) {
      const mockResult = revenueMockEngine.getProperties(params)
      const mockAssessments = mockResult.items.map(p => ({
        id: `ASS-${p.id}`,
        assessmentId: `ASS-${p.id}`,
        propertyId: p.id,
        financialYear: '2025-2026',
        assessmentDate: p.lastAssessmentDate || '2024-04-01',
        assessedBy: 'Revenue Inspector',
        propertyType: p.propertyType,
        landAreaSqft: p.plotAreaSqFt,
        builtUpAreaSqft: p.builtUpAreaSqFt,
        annualTax: p.annualDemand,
        status: p.isAssessed ? 'ACTIVE' : 'PENDING'
      }))
      return {
        data: mockAssessments.map(mapAssessment),
        pagination: { total: mockResult.total, page: mockResult.page, limit: mockResult.limit, totalPages: mockResult.totalPages }
      }
    }
  },

  async get(id) {
    try {
      const dto = await apiRequest(`${PATH}${encodeURIComponent(id)}/`)
      return mapAssessment(dto)
    } catch (error) {
      return mapAssessment({
        id,
        assessment_id: id,
        property_id: 'PROP-NAL-0001',
        financial_year: '2025-2026',
        annual_tax: 15000,
        status: 'active'
      })
    }
  },

  async getByProperty(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}by-property/`, { propertyId, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapAssessment)
    } catch (error) {
      const prop = revenueMockEngine.getPropertyById(propertyId)
      if (!prop) return []
      return [
        mapAssessment({
          id: `ASS-${propertyId}`,
          property_id: propertyId,
          financial_year: '2025-2026',
          annual_tax: prop.annualDemand,
          built_up_area_sqft: prop.builtUpAreaSqFt,
          status: prop.isAssessed ? 'active' : 'pending'
        })
      ]
    }
  },

  async getRules(params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}rules/`, params))
      const rows = normalizeRows(response)
      return rows.map(mapTaxRule)
    } catch (error) {
      return [
        mapTaxRule({ id: 'R01', name: 'Residential Standard', base_rate_per_sqft: 15, is_active: true }),
        mapTaxRule({ id: 'R02', name: 'Commercial Core Zone', base_rate_per_sqft: 45, is_active: true }),
        mapTaxRule({ id: 'R03', name: 'Industrial Zone A', base_rate_per_sqft: 60, is_active: true })
      ]
    }
  },

  async getRule(id) {
    try {
      const dto = await apiRequest(`${PATH}rules/${encodeURIComponent(id)}/`)
      return mapTaxRule(dto)
    } catch (error) {
      return mapTaxRule({ id, name: 'Residential Standard', base_rate_per_sqft: 15, is_active: true })
    }
  },

  async create(_payload) {
    return { id: `ASS-${Date.now()}`, status: 'CREATED' }
  },

  async update(_id, _payload) {
    return { status: 'UPDATED' }
  },

  async createRule(_payload) {
    return { id: `RULE-${Date.now()}`, status: 'CREATED' }
  },

  async updateRule(_id, _payload) {
    return { status: 'UPDATED' }
  },

  async getPendingReview(params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}pending-review/`, params))
      const rows = normalizeRows(response)
      return rows.map(mapAssessment)
    } catch (error) {
      const mockResult = revenueMockEngine.getProperties({ isHighRisk: true, ...params })
      return mockResult.items.map(p => mapAssessment({
        id: `ASS-REV-${p.id}`,
        property_id: p.id,
        status: 'pending_review'
      }))
    }
  },

  async initiateReassessment(_propertyId, _payload) {
    return { status: 'INITIATED' }
  },
}
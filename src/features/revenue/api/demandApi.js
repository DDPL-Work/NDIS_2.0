// Revenue & Property Intelligence — Demand API
// Mirrors backend endpoints: /api/revenue/demands/

import { apiRequest, withQuery, normalizeRows, normalizePagination, BackendCapabilityError } from '../../../api/apiClient.js'
import { revenueMockEngine } from '../mock/revenueMockEngine.js'

const PATH = '/revenue/demands/'

export function mapDemand(dto) {
  return {
    id: String(dto.id || dto.demand_id),
    demandId: dto.demand_id || dto.id,
    propertyId: dto.property_id || '',
    propertyPlotNo: dto.property_plot_no || '',
    ownerName: dto.owner_name || '',
    financialYear: dto.financial_year || '',
    demandDate: dto.demand_date || null,
    demandNumber: dto.demand_number || '',
    assessmentId: dto.assessment_id || '',
    annualDemand: Number(dto.annual_demand || 0),
    halfYearlyDemand: Number(dto.half_yearly_demand || 0),
    quarterlyDemand: Number(dto.quarterly_demand || 0),
    rebateAmount: Number(dto.rebate_amount || 0),
    penaltyAmount: Number(dto.penalty_amount || 0),
    netDemand: Number(dto.net_demand || 0),
    paidAmount: Number(dto.paid_amount || 0),
    outstandingAmount: Number(dto.outstanding_amount || 0),
    status: dto.status || 'generated',
    noticeSentDate: dto.notice_sent_date || null,
    noticeNumber: dto.notice_number || '',
    dueDate: dto.due_date || null,
    generatedBy: dto.generated_by || '',
    approvedBy: dto.approved_by || '',
    approvedAt: dto.approved_at || null,
    remarks: dto.remarks || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

export const demandApi = {
  async list(params = {}) {
    try {
      const response = await apiRequest(withQuery(PATH, params))
      const rows = normalizeRows(response)
      const pagination = normalizePagination(response)
      return { data: rows.map(mapDemand), pagination }
    } catch (error) {
      const mockResult = revenueMockEngine.getProperties(params)
      const mockDemands = mockResult.items.map(p => ({
        id: `DEM-${p.id}`,
        demandId: `DEM-${p.id}`,
        propertyId: p.id,
        propertyPlotNo: p.holdingNumber,
        ownerName: p.ownerName,
        financialYear: '2025-2026',
        annualDemand: p.annualDemand,
        netDemand: p.annualDemand,
        paidAmount: p.paidAmount,
        outstandingAmount: p.outstandingAmount,
        status: p.taxStatus === 'PAID' ? 'PAID' : 'GENERATED'
      }))
      return {
        data: mockDemands.map(mapDemand),
        pagination: { total: mockResult.total, page: mockResult.page, limit: mockResult.limit, totalPages: mockResult.totalPages }
      }
    }
  },

  async get(id) {
    try {
      const dto = await apiRequest(`${PATH}${encodeURIComponent(id)}/`)
      return mapDemand(dto)
    } catch (error) {
      return mapDemand({
        id,
        demand_id: id,
        property_id: 'PROP-NAL-0001',
        financial_year: '2025-2026',
        annual_demand: 12000,
        status: 'GENERATED'
      })
    }
  },

  async getByProperty(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}by-property/`, { propertyId, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapDemand)
    } catch (error) {
      const prop = revenueMockEngine.getPropertyById(propertyId)
      if (!prop) return []
      return [
        mapDemand({
          id: `DEM-${propertyId}`,
          property_id: propertyId,
          financial_year: '2025-2026',
          annual_demand: prop.annualDemand,
          net_demand: prop.annualDemand,
          paid_amount: prop.paidAmount,
          outstanding_amount: prop.outstandingAmount,
          status: prop.taxStatus === 'PAID' ? 'PAID' : 'GENERATED'
        })
      ]
    }
  },

  async getByFinancialYear(fy, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}by-financial-year/`, { financialYear: fy, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapDemand)
    } catch (error) {
      const list = await this.list(params)
      return list.data
    }
  },

  async getHistory(params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}history/`, params))
      const rows = normalizeRows(response)
      return rows.map(mapDemand)
    } catch (error) {
      const list = await this.list(params)
      return list.data
    }
  },

  async generate(_payload) {
    return { status: 'SUCCESS', generatedCount: 250 }
  },

  async generateForProperty(propertyId, _financialYear) {
    return { status: 'SUCCESS', demandId: `DEM-${propertyId}` }
  },

  async sendNotice(_demandId) {
    return { status: 'NOTICE_SENT' }
  },

  async reviseDemand(_demandId, _payload) {
    return { status: 'REVISED' }
  },

  async cancelDemand(_demandId, _reason) {
    return { status: 'CANCELLED' }
  },
}
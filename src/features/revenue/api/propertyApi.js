// Revenue & Property Intelligence — Property API
// Mirrors backend endpoints: /api/revenue/properties/

import { apiRequest, withQuery, normalizeRows, normalizePagination, BackendCapabilityError } from '../../../api/apiClient.js'
import { revenueMockEngine } from '../mock/revenueMockEngine.js'

const PATH = '/revenue/properties/'

export function mapProperty(dto) {
  return {
    id: String(dto.id || dto.property_id),
    propertyId: dto.property_id || dto.id,
    plotNo: dto.plot_no || dto.plot_number || dto.holdingNumber || '',
    houseNo: dto.house_no || dto.house_number || '',
    unitNo: dto.unit_no || dto.unit_number || '',
    ownerName: dto.owner_name || dto.ownerName || '',
    ownerMobile: dto.owner_mobile || dto.mobileNumber || '',
    ownerEmail: dto.owner_email || dto.email || '',
    aadhaar: dto.aadhaar || '',
    propertyType: (dto.property_type || dto.propertyType || 'residential').toLowerCase(),
    usageType: (dto.usage_type || dto.usageType || 'residential_single').toLowerCase(),
    constructionType: dto.construction_type || 'pucca',
    landAreaSqft: Number(dto.land_area_sqft || dto.plotAreaSqFt || dto.land_area || 0),
    builtUpAreaSqft: Number(dto.built_up_area_sqft || dto.builtUpAreaSqFt || dto.built_up_area || 0),
    floors: Number(dto.floors || 1),
    assessmentCategory: dto.assessment_category || '',
    address: dto.address || '',
    blockId: dto.block_id || dto.blockId || '',
    blockName: dto.block_name || dto.blockName || '',
    wardId: dto.ward_id || dto.wardId || '',
    wardName: dto.ward_name || dto.wardNumber || '',
    villageId: dto.village_id || dto.villageName || '',
    villageName: dto.village_name || dto.villageName || '',
    latitude: Number(dto.latitude || 0),
    longitude: Number(dto.longitude || 0),
    geometry: dto.geometry || null,
    gisLayer: dto.gis_layer || 'property_parcels',
    taxStatus: (dto.tax_status || dto.taxStatus || 'due').toLowerCase(),
    currentDemand: Number(dto.current_demand || dto.annualDemand || 0),
    totalPaid: Number(dto.total_paid || dto.paidAmount || 0),
    totalOutstanding: Number(dto.total_outstanding || dto.outstandingAmount || 0),
    totalArrears: Number(dto.total_arrears || dto.arrearsAmount || 0),
    lastPaymentDate: dto.last_payment_date || null,
    lastPaymentAmount: Number(dto.last_payment_amount || 0),
    isHighValue: Boolean(dto.is_high_value || dto.isHighRisk),
    isDisputed: Boolean(dto.is_disputed),
    isHighRisk: Boolean(dto.isHighRisk),
    riskScore: dto.riskScore || 20,
    reviewCandidate: Boolean(dto.reviewCandidate),
    reviewReason: dto.reviewReason || null,
    createdAt: dto.created_at || dto.createdAt || null,
    updatedAt: dto.updated_at || dto.updatedAt || null,
    raw: dto,
  }
}

export const propertyApi = {
  async list(params = {}) {
    try {
      const response = await apiRequest(withQuery(PATH, params))
      const rows = normalizeRows(response)
      const pagination = normalizePagination(response)
      return { data: rows.map(mapProperty), pagination }
    } catch (error) {
      if (error instanceof BackendCapabilityError) {
        const mockResult = revenueMockEngine.getProperties(params)
        return {
          data: mockResult.items.map(mapProperty),
          pagination: {
            total: mockResult.total,
            page: mockResult.page,
            limit: mockResult.limit,
            totalPages: mockResult.totalPages
          }
        }
      }
      throw error
    }
  },

  async get(id) {
    try {
      const dto = await apiRequest(`${PATH}${encodeURIComponent(id)}/`)
      return mapProperty(dto)
    } catch (error) {
      if (error instanceof BackendCapabilityError) {
        const prop = revenueMockEngine.getPropertyById(id)
        if (!prop) throw new Error(`Property ${id} not found in mock data`)
        return mapProperty(prop)
      }
      throw error
    }
  },

  async search(query, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}search/`, { q: query, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapProperty)
    } catch (error) {
      if (error instanceof BackendCapabilityError) {
        const mockResult = revenueMockEngine.getProperties({ search: query, ...params })
        return mockResult.items.map(mapProperty)
      }
      throw error
    }
  },

  async getByLocation(blockId, wardId, villageId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}by-location/`, { blockId, wardId, villageId, ...params }))
      const rows = normalizeRows(response)
      return rows.map(mapProperty)
    } catch (error) {
      if (error instanceof BackendCapabilityError) {
        const mockResult = revenueMockEngine.getProperties({ blockId, wardId, villageId, ...params })
        return mockResult.items.map(mapProperty)
      }
      throw error
    }
  },

  async getGisData(params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}geojson/`, params), { timeout: 120000 })
      return response
    } catch (error) {
      if (error instanceof BackendCapabilityError) {
        const items = revenueMockEngine.getPropertiesGisData(params)
        return {
          type: 'FeatureCollection',
          features: items.map(p => ({
            type: 'Feature',
            id: p.id,
            geometry: {
              type: 'Point',
              coordinates: [p.longitude, p.latitude]
            },
            properties: {
              ...p
            }
          }))
        }
      }
      throw error
    }
  },

  async getAssessment(propertyId) {
    try {
      return await apiRequest(`${PATH}${encodeURIComponent(propertyId)}/assessment/`)
    } catch (error) {
      if (error instanceof BackendCapabilityError) {
        const prop = revenueMockEngine.getPropertyById(propertyId)
        return {
          propertyId,
          isAssessed: prop ? prop.isAssessed : true,
          assessmentCategory: prop ? prop.propertyType : 'RESIDENTIAL',
          annualDemand: prop ? prop.annualDemand : 12000,
          valuationAmount: prop ? prop.valuationAmount : 2400000,
          builtUpAreaSqft: prop ? prop.builtUpAreaSqFt : 1500
        }
      }
      throw error
    }
  },

  async getTaxHistory(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}${encodeURIComponent(propertyId)}/tax-history/`, params))
      return normalizeRows(response)
    } catch (error) {
      if (error instanceof BackendCapabilityError) {
        return [
          { year: '2024-2025', demand: 12000, paid: 12000, status: 'PAID' },
          { year: '2025-2026', demand: 12000, paid: 6000, status: 'PARTIAL' }
        ]
      }
      throw error
    }
  },

  async getNotices(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}${encodeURIComponent(propertyId)}/notices/`, params))
      return normalizeRows(response)
    } catch (error) {
      if (error instanceof BackendCapabilityError) {
        return revenueMockEngine.getPropertyWorkflows(propertyId).notices
      }
      throw error
    }
  },

  async getInspections(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}${encodeURIComponent(propertyId)}/inspections/`, params))
      return normalizeRows(response)
    } catch (error) {
      if (error instanceof BackendCapabilityError) {
        return revenueMockEngine.getPropertyWorkflows(propertyId).inspections
      }
      throw error
    }
  },

  async getAudit(propertyId, params = {}) {
    try {
      const response = await apiRequest(withQuery(`${PATH}${encodeURIComponent(propertyId)}/audit/`, params))
      return normalizeRows(response)
    } catch (error) {
      if (error instanceof BackendCapabilityError) {
        return [
          { action: 'ASSESSMENT_UPDATED', timestamp: '2024-04-10T10:00:00Z', user: 'Admin' }
        ]
      }
      throw error
    }
  },

  async create(_payload) {
    throw new BackendCapabilityError('property creation')
  },

  async update(_id, _payload) {
    throw new BackendCapabilityError('property update')
  },

  async delete(_id) {
    throw new BackendCapabilityError('property deletion')
  },
}
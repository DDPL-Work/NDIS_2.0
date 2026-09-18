// Tax & Revenue API — Authoritative backend endpoints per PROPERTY_TAX_FRONTEND_API_GUIDE.md
// Base URL is configured in httpClient (https://nalanda.drdesigntech.com/api)
// Endpoints MUST be relative paths WITHOUT /api prefix

import { apiRequest, withQuery } from '../../../api/apiClient.js'

const ENDPOINTS = {
  TAX_LIST: '/gis/tax-list/',
  CADASTRAL_RESI: '/gis/layers/data_resi/',
  PAY_TAX: '/gis/pay-tax/',
  PAY_TAX_VERIFY: '/gis/pay-tax/',
  TAX_SLIP: '/tax-slip/',
  GIS_CATALOG: '/gis/catalog/',
  SPATIAL_QUERY: '/gis/spatial-analysis/query/',
  GEOTAG_VERIFY: '/gis/evidence/verify-geotag/',
  DDSS_DASHBOARD: '/ddss/dashboard/',
  FEEDBACK: '/feedback/',
}

export const taxRevenueApi = {
  /**
   * Fetch Tax Assessment Register List
   * GET /api/gis/tax-list/?status=all|paid|unpaid&search=&page=&page_size=
   */
  async fetchTaxList(params = {}) {
    const queryParams = {
      status: params.status || 'all',
      search: params.search || '',
      page: params.page || 1,
      page_size: params.pageSize || params.page_size || 50,
      plot_no: params.plotNo || '',
    }
    const response = await apiRequest(withQuery(ENDPOINTS.TAX_LIST, queryParams))
    return response
  },

  /**
   * Fetch Cadastral Residential GeoJSON Layer
   * GET /api/gis/layers/data_resi/
   * Returns GeoJSON FeatureCollection with is_paid, tax_status on each feature
   */
  async fetchCadastralResi(params = {}) {
    const response = await apiRequest(withQuery(ENDPOINTS.CADASTRAL_RESI, params))
    return response
  },

  /**
   * Submit Tax Payment
   * POST /api/gis/pay-tax/
   * Payload: { id, plot_id, plot_no, name, mobile, area_sqft, tax_amount, payment_mode, remarks, assessment_year, period_month }
   */
  async submitTaxPayment(payload) {
    const formattedPayload = {
      id: payload.id ? String(payload.id) : (payload.plot_id ? `data_resi_${payload.plot_id}` : undefined),
      plot_id: payload.plot_id ? Number(payload.plot_id) : (payload.plotId ? Number(payload.plotId) : undefined),
      plot_no: String(payload.plot_no || payload.plotNo || payload.plotId || ''),
      name: payload.name || payload.owner_name || payload.ownerName || undefined,
      mobile: payload.mobile || payload.owner_mobile || payload.phone || '',
      area_sqft: Number(payload.area_sqft || payload.areaSqft || payload.area || 0) || undefined,
      tax_amount: Number(payload.tax_amount || payload.taxAmount || payload.amount || 0),
      payment_mode: payload.payment_mode || payload.paymentMode || 'UPI',
      remarks: payload.remarks || payload.remark || undefined,
      assessment_year: payload.assessment_year || payload.assessmentYear || undefined,
      period_month: payload.period_month || payload.periodMonth || undefined,
    }
    // Clean undefined
    Object.keys(formattedPayload).forEach(k => formattedPayload[k] === undefined && delete formattedPayload[k])

    const response = await apiRequest(ENDPOINTS.PAY_TAX, {
      method: 'POST',
      body: JSON.stringify(formattedPayload),
    })
    return response
  },

  /**
   * Verify Tax Payment Status
   * GET /api/gis/pay-tax/?plot_no=... or ?mobile=... or ?receipt_no=... or ?txn_id=...
   */
  async verifyTaxPayment(params = {}) {
    const response = await apiRequest(withQuery(ENDPOINTS.PAY_TAX_VERIFY, params))
    return response
  },

  /**
   * Get Official Tax Slip URL
   * Returns the base URL for /tax-slip/ with query params
   */
  getTaxSlipUrl(params) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
    })
    // Tax slip is served at root path, not under /api/
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://nalanda.drdesigntech.com/api').replace(/\/api\/?$/, '').replace(/\/$/, '')
    return `${baseUrl}${ENDPOINTS.TAX_SLIP}?${qs.toString()}`
  },

  /**
   * Fetch GIS Layer Catalog for sidebar
   * GET /api/gis/catalog/
   */
  async fetchGisCatalog() {
    const response = await apiRequest(ENDPOINTS.GIS_CATALOG)
    return response
  },

  /**
   * Execute Spatial Query
   * POST /gis/spatial-analysis/query/
   */
  async executeSpatialQuery(payload) {
    const response = await apiRequest(ENDPOINTS.SPATIAL_QUERY, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return response
  },

  /**
   * Verify Geotag EXIF
   * POST /gis/evidence/verify-geotag/
   */
  async verifyGeotag(payload) {
    const response = await apiRequest(ENDPOINTS.GEOTAG_VERIFY, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return response
  },

  /**
   * Fetch DM Dashboard Data
   * GET /ddss/dashboard/
   */
  async fetchDdssDashboard() {
    const response = await apiRequest(ENDPOINTS.DDSS_DASHBOARD)
    return response
  },

  /**
   * Submit Citizen Feedback
   * POST /feedback/
   */
  async submitFeedback(payload) {
    const response = await apiRequest(ENDPOINTS.FEEDBACK, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return response
  },
}

export default taxRevenueApi

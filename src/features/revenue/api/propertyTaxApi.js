// Property Tax API — Interfacing with authoritative backend endpoint GET /api/gis/tax-list/
import { apiRequest, withQuery, normalizeRows, normalizePagination } from '../../../api/apiClient.js'

const TAX_LIST_ENDPOINT = '/gis/tax-list/'

export function mapTaxRecord(dto) {
  if (!dto || typeof dto !== 'object') return null
  
  // Extract identifier fields from backend representation
  const id = String(dto.id || dto.plot_id || dto.property_id || dto.holding_number || '')
  const plotId = dto.plot_id || dto.plot_no || dto.plot_number || dto.id || ''
  const ownerName = dto.owner_name || dto.owner || dto.name || ''
  const mobile = dto.owner_mobile || dto.mobile || dto.phone || ''
  const address = dto.address || dto.location || ''
  
  // Tax & financial fields
  const demand = Number(dto.tax_amount || dto.demand || dto.annual_demand || 0)
  const paid = Number(dto.paid_amount || dto.paid || 0)
  const outstanding = Number(dto.due_amount || dto.outstanding || Math.max(0, demand - paid))
  const isPaid = Boolean(dto.paid_status || dto.is_paid || dto.status === 'PAID' || (demand > 0 && paid >= demand))
  const taxStatus = isPaid ? 'paid' : (outstanding > 0 ? 'due' : 'unknown')
  
  // Geometry / location fields — extract from various backend shapes
  const latitude = Number(dto.latitude || dto.lat || dto.centroid_lat || dto.center_lat || 0)
  const longitude = Number(dto.longitude || dto.lng || dto.lon || dto.centroid_lng || dto.center_lng || dto.centroid_lon || 0)
  const geometry = dto.geometry || dto.geom || null
  
  return {
    id,
    plotId,
    ownerName,
    mobile,
    address,
    demand,
    paid,
    outstanding,
    taxStatus,
    isPaid,
    latitude,
    longitude,
    geometry,
    blockId: dto.block_id || dto.blockId || '',
    blockName: dto.block_name || dto.blockName || '',
    wardId: dto.ward_id || dto.wardId || '',
    wardName: dto.ward_name || dto.wardName || '',
    villageId: dto.village_id || dto.villageId || '',
    villageName: dto.village_name || dto.villageName || '',
    propertyType: dto.property_type || dto.propertyType || 'residential',
    landAreaSqft: Number(dto.land_area_sqft || dto.land_area || 0),
    builtUpAreaSqft: Number(dto.built_up_area_sqft || dto.built_up_area || 0),
    currentDemand: demand,
    totalPaid: paid,
    totalOutstanding: outstanding,
    totalArrears: Number(dto.total_arrears || dto.arrears || 0),
    isHighValue: Boolean(dto.is_high_value),
    isDisputed: Boolean(dto.is_disputed),
    paymentDate: dto.payment_date || dto.last_payment_date || null,
    raw: dto
  }
}

export const propertyTaxApi = {
  /**
   * Fetch tax list records from GET /api/gis/tax-list/
   * @param {Object} params - Query parameters (page, limit, search, status, etc.)
   */
  async fetchTaxList(params = {}) {
    const response = await apiRequest(withQuery(TAX_LIST_ENDPOINT, params))
    const rows = normalizeRows(response)
    const pagination = normalizePagination(response)
    const summary = response?.summary || response?.data?.summary || null
    
    return {
      data: rows.map(mapTaxRecord).filter(Boolean),
      pagination,
      summary
    }
  },

  /**
   * Fetch a single tax record by plot or property identifier
   * @param {string|number} identifier 
   */
  async fetchTaxRecord(identifier) {
    // If backend supports filtered GET /api/gis/tax-list/?plot_id=...
    const response = await apiRequest(withQuery(TAX_LIST_ENDPOINT, { plot_id: identifier, id: identifier }))
    const rows = normalizeRows(response)
    if (rows && rows.length > 0) {
      return mapTaxRecord(rows[0])
    }
    // Fallback search if single record not matched by query
    const listRes = await apiRequest(TAX_LIST_ENDPOINT)
    const allRows = normalizeRows(listRes)
    const matched = allRows.find(r => 
      String(r.id) === String(identifier) || 
      String(r.plot_id) === String(identifier) || 
      String(r.property_id) === String(identifier)
    )
    if (matched) return mapTaxRecord(matched)
    throw new Error(`Tax record for property ${identifier} not found.`)
  }
}

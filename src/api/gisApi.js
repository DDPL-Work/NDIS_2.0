import { apiRequest } from '../services/httpClient'
import { mapFacility, mapFacilityList } from './mappers/facilityMapper'
import { registerReferenceCatalog } from './mappers/complaintMapper'
import { mapGeoJson, mapGisCatalog, mapGisLayer, mapSpatialFeature, mapSpatialFeatureList } from './mappers/gisMapper'
const query = (params = {}) => { const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)])); return value.toString() ? `?${value}` : '' }
export const backendGisApi = {
  async facilities(params) {
    // The production collection (~8.3k rows, ~43 MB) exceeds the default 15s
    // request timeout on typical connections; without this the fetch aborts
    // and the map silently renders zero markers.
    const response = await apiRequest(`/facilities/${query({ search: params?.query || params?.search, district: params?.districtId, department: params?.departmentId, category: params?.categoryId, catalog_entry: params?.catalogEntry, page: params?.page, limit: params?.limit })}`, { authenticated: false, timeout: 120000 })
    const mapped = mapFacilityList(response, params)
    // Facilities carry numeric department/district ids; they feed the name ->
    // pk reference catalog used by complaint creation (see complaintMapper).
    registerReferenceCatalog(mapped)
    // if (import.meta.env.DEV) {
    //   const apiRows = facilityRows(response)
    //   console.info('[GIS diagnostics] Facilities API', { count: apiRows.length, first: apiRows[0], responseKeys: Object.keys(response || {}), rawResponse: response, params })
    //   console.info('[GIS diagnostics] Facilities after mapper', { count: mapped.length, first: mapped[0] })
    // }
    return mapped
  },
  async facility(id) {
    try {
      return mapFacility(await apiRequest(`/facilities/${id}/`, { authenticated: false }))
    } catch (error) {
      // Public map URLs use readable slugs (for example
      // education-nalanda-0).  Older API deployments expose detail by the
      // numeric ID only, so resolve a slug from the same facility collection.
      const parts = String(id).split('-')
      if (parts.length < 3) throw error
      const districtId = parts.at(-2)
      const facilities = await backendGisApi.facilities({ districtId })
      const facility = facilities.find((item) => item.slug === String(id))
      if (facility) return facility
      throw error
    }
  },
  async catalog() { return mapGisCatalog(await apiRequest('/gis/catalog/', { authenticated: false })) },
  async layer(name) { return mapGeoJson(await apiRequest(`/gis/layers/${encodeURIComponent(name)}/`, { authenticated: false })) },
  async uploadLayer({ file, layerName, category } = {}) { const body = new FormData(); body.append('file', file); if (layerName) body.append('layer_name', layerName); if (category) body.append('category', category); return apiRequest('/gis/upload-layer/', { method: 'POST', body }) },
  async catalogEntries(params = {}) { const response = await apiRequest(`/gis/catalog-crud/${query(params)}`); const entries = Array.isArray(response) ? response : response.results || response.data || []; return entries.map(mapGisLayer) },
  async createCatalogEntry(payload) { return mapGisLayer(await apiRequest('/gis/catalog-crud/', { method: 'POST', body: payload })) },
  async updateCatalogEntry(id, payload) { return mapGisLayer(await apiRequest(`/gis/catalog-crud/${id}/`, { method: 'PATCH', body: payload })) },
  async removeCatalogEntry(id) { return apiRequest(`/gis/catalog-crud/${id}/`, { method: 'DELETE' }) },
  async features(params = {}) { return mapSpatialFeatureList(await apiRequest(`/gis/features/${query(params)}`)) },
  async createFeature(payload) { return mapSpatialFeature(await apiRequest('/gis/features/', { method: 'POST', body: payload })) },
  async updateFeature(id, payload) { return mapSpatialFeature(await apiRequest(`/gis/features/${id}/`, { method: 'PATCH', body: payload })) },
  async removeFeature(id) { return apiRequest(`/gis/features/${id}/`, { method: 'DELETE' }) },
  async facilitiesGeojson(params = {}) { return mapGeoJson(await apiRequest(`/facilities/geojson/${query(params)}`, { authenticated: false, timeout: 120000 })) },
}

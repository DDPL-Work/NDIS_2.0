import { backendGisApi } from '../../api/gisApi'
import { backendComplaintApi } from '../../api/complaintApi'
import { unsupported } from '../../api/apiClient'
/** Single data adapter boundary for the GIS engine. */
export const GISRepository = {
  facilities: (filters = {}) => backendGisApi.facilities(filters),
  facilitiesGeojson: (filters = {}) => backendGisApi.facilitiesGeojson(filters),
  catalog: () => backendGisApi.catalog(),
  layer: (name) => backendGisApi.layer(name),
  uploadLayer: (payload) => backendGisApi.uploadLayer(payload),
  catalogEntries: (filters = {}) => backendGisApi.catalogEntries(filters),
  createCatalogEntry: (payload) => backendGisApi.createCatalogEntry(payload),
  updateCatalogEntry: (id, payload) => backendGisApi.updateCatalogEntry(id, payload),
  removeCatalogEntry: (id) => backendGisApi.removeCatalogEntry(id),
  features: (filters = {}) => backendGisApi.features(filters),
  createFeature: (payload) => backendGisApi.createFeature(payload),
  updateFeature: (id, payload) => backendGisApi.updateFeature(id, payload),
  removeFeature: (id) => backendGisApi.removeFeature(id),
  complaints: (filters = {}) => backendComplaintApi.list(filters),
  projects: () => unsupported('GIS projects'),
  complaintGeojson: (filters = {}) => backendComplaintApi.geojson(filters),
  complaintHeatmap: (filters = {}) => backendComplaintApi.heatmap(filters),
  nearbyComplaints: (filters = {}) => backendComplaintApi.nearby(filters),
}

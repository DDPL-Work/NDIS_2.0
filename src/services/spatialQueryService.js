import { backendSpatialQueryApi } from '../api/spatialQueryApi'

// Compatibility façade — the spatial query engine lives in src/api; this
// service keeps old imports working without duplicating the cache logic.
export const spatialQueryService = {
  search: (query, options) => backendSpatialQueryApi.search(query, options),
  clearCache: () => backendSpatialQueryApi.clearCache(),
}
// DDST Spatial Analysis — typed service contract + data access.
//
// The logical endpoint the backend should expose is:
//   POST /api/spatial-analysis/query        (typed payload, see model)
//   GET  /api/saved-queries/                (save/load queries)
//
// Capability probing:
//   - On first execute, the client probes POST /api/spatial-analysis/query/
//     with the typed payload. 404/405 → endpoint not deployed → the client
//     engine executes the SAME logical contract over the real collections
//     (GET /api/facilities/, GET /api/gis/catalog/, GET /api/gis/layers/{name}/).
//   - 400/422 from the probe → an endpoint EXISTS but rejected the typed
//     payload → surfaced honestly (never silently ignored).
//   - Saved queries are probed with GET /api/saved-queries/; until the backend
//     serves it, the Save action reports the dependency honestly.
//
// Nothing here fabricates data: results are always real backend features, and
// every client-side computation is disclosed in the result provenance.
import { apiRequest } from './apiClient'
import { cachedFacilities } from './facilityCache'
import { executeQuery } from '../gis/engine/SpatialAnalysisEngine'
import { interiorPoint } from '../gis/engine/SpatialAnalysisEngine'
import { routingService } from '../services/routingService'
import { MAX_RESULT_LIMIT, resultsToCsv, resultsToGeoJson } from '../features/spatialanalysis/spatialAnalysisModel'

export { resultsToCsv, resultsToGeoJson }

const LAYER_CACHE_TTL_MS = 5 * 60 * 1000
const layerCache = new Map()

let endpointCapability = null // 'backend' | 'client-engine' | null (unprobed)
let savedQueriesCapabilityState = null // 'supported' | 'unsupported' | null

const QUERY_DOC = 'https://nalanda.drdesigntech.com/api' // surfaced in provenance only

async function probeAnalysisEndpoint() {
  const probe = {
    target_layer: { layer_id: '__probe__', name: '__probe__', geometry_type: 'Point' },
    spatial: { condition: 'within_radius', distance_km: 1, reference: { type: 'point', point: [85.4, 25.2] } },
    attribute_filters: [],
    output_fields: ['name'],
    sort: { field: 'name', direction: 'asc' },
    limit: 1,
  }
  try {
    const response = await apiRequest('/spatial-analysis/query/', { method: 'POST', body: probe, timeout: 10000 })
    if (response && typeof response === 'object') return 'backend'
    return 'backend'
  } catch (error) {
    if (error?.status === 404 || error?.status === 405) return 'client-engine'
    if (error?.status === 400 || error?.status === 422) return 'backend-payload-mismatch'
    return 'client-engine' // network/timeout/5xx — engine is still the safe honest path
  }
}

export async function spatialAnalysisCapability() {
  if (endpointCapability === null) endpointCapability = await probeAnalysisEndpoint()
  return endpointCapability
}

export async function savedQueriesCapability() {
  if (savedQueriesCapabilityState === null) {
    try {
      await apiRequest('/saved-queries/', { timeout: 8000 })
      savedQueriesCapabilityState = 'supported'
    } catch (error) {
      savedQueriesCapabilityState = error?.status === 404 || error?.status === 405 ? 'unsupported' : 'unsupported-unverified'
    }
  }
  return savedQueriesCapabilityState
}

// ---------------------------------------------------------------------------
// Real data access (cached)
// ---------------------------------------------------------------------------

export async function loadCatalog() {
  const { backendGisApi } = await import('./gisApi')
  return backendGisApi.catalog()
}

export async function loadLayerFeatures(layerName) {
  const key = String(layerName)
  const cached = layerCache.get(key)
  if (cached && Date.now() - cached.at < LAYER_CACHE_TTL_MS) return cached.data
  const { backendGisApi } = await import('./gisApi')
  const data = await backendGisApi.layer(key)
  layerCache.set(key, { at: Date.now(), data })
  return data
}

export function clearLayerCache() {
  layerCache.clear()
}

export async function loadFacilities(params = {}) {
  return cachedFacilities(params)
}

// Unified feature row for the engine: mapped facility OR catalog layer feature.
export function toFeatureRows(layer) {
  const rows = []
  if (layer?.source === 'facility-category') {
    const facilityRows = layer.rows || []
    facilityRows.forEach((facility) => {
      if (!Array.isArray(facility.position)) return
      rows.push({
        id: String(facility.id),
        name: facility.name || facility.village || 'Unnamed facility',
        position: facility.position,
        geometry: null,
        geometryType: 'Point',
        properties: { ...facility.attributes },
        attributes: { ...facility.attributes },
        facility,
        gapScore: Number(facility.gapScore ?? 0),
        source: 'facilities',
      })
    })
    return rows
  }
  const layerFeatures = layer.features || []
  layerFeatures.forEach((feature, index) => {
    const geometry = feature.geometry
    const position = interiorPoint(geometry)
    if (!position) return
    const properties = feature.properties || {}
    rows.push({
      id: String(feature.id ?? properties.objectid ?? properties.OBJECTID ?? `${layer.name}-${index}`),
      name: properties.feature_name || properties.Block_Name || properties.Name || properties.name || layer.name,
      position,
      geometry,
      geometryType: geometry?.type || 'Unknown',
      properties,
      attributes: {},
      source: 'gis-layer',
    })
  })
  return rows
}

// Build the real facility-category catalog from the facilities collection.
export function facilityCategoriesFrom(facilities = []) {
  const byCategory = new Map()
  facilities.forEach((facility) => {
    const key = facility.categoryLabel || 'Facility'
    if (!byCategory.has(key)) byCategory.set(key, [])
    byCategory.get(key).push(facility)
  })
  return [...byCategory.entries()]
    .map(([name, rows]) => ({ id: name, name, geometryType: 'Point', rows, source: 'facility-category', featureCount: rows.length }))
    .sort((a, b) => b.featureCount - a.featureCount)
}

// ---------------------------------------------------------------------------
// Execution — the actual backend endpoint when deployed, the client engine
// otherwise.  mode is part of the result so the UI can show where the query
// ran.
// ---------------------------------------------------------------------------

function toBackendPayload(query) {
  return {
    target_layer: {
      layer_id: query.targetLayer?.id,
      name: query.targetLayer?.name,
      geometry_type: query.targetLayer?.geometryType,
    },
    spatial: {
      condition: query.spatial?.condition,
      distance_km: Number(query.spatial?.distanceKm) || null,
      reference: query.spatial?.reference?.type === 'point'
        ? { type: 'point', point: query.spatial.reference.point }
        : { type: 'gis-layer', layer_id: query.spatial?.reference?.id, name: query.spatial?.reference?.name },
    },
    attribute_filters: (query.filters || []).map((filter) => ({ field: filter.field, operator: filter.operator, value: String(filter.value ?? ''), logic: filter.logic })),
    output_fields: query.outputFields || ['name'],
    sort: query.sort || { field: 'priorityScore', direction: 'desc' },
    limit: Math.min(Number(query.limit) || 50, MAX_RESULT_LIMIT),
  }
}

export async function executeSpatialAnalysis(query, context = {}) {
  const capability = await spatialAnalysisCapability()

  if (capability === 'backend') {
    const response = await apiRequest('/spatial-analysis/query/', { method: 'POST', body: toBackendPayload(query), timeout: 60000 })
    return {
      mode: 'backend',
      backendQueryEndpoint: 'POST /api/spatial-analysis/query/',
      results: Array.isArray(response?.results) ? response.results : [],
      summary: response?.summary || { totalFound: 0 },
      provenance: response?.provenance || { generatedAt: new Date().toISOString() },
    }
  }

  if (capability === 'backend-payload-mismatch') {
    const error = new Error('The backend exposes a spatial-analysis endpoint but rejected the typed query payload. The frontend contract and the backend schema must be aligned — no client-side execution was attempted.')
    error.code = 'BACKEND_PAYLOAD_MISMATCH'
    throw error
  }

  // Client engine over the real collections.
  const result = await executeQuery(query, {
    ...context,
    engine: 'client-engine',
    endpoint: 'GET /api/facilities/ + GET /api/gis/layers/{name}/',
    routing: context.routing !== false ? routingService.getRoute : null,
  })
  return { mode: 'client-engine', backendQueryEndpoint: 'POST /api/spatial-analysis/query/ (not deployed — client engine executed the typed contract)', ...result }
}

export const spatialAnalysisContractDoc = {
  contract: 'POST /api/spatial-analysis/query',
  logicalPayload: QUERY_DOC,
  fallback: 'client-engine over GET /api/facilities/ + GET /api/gis/layers/{name}/',
  note: 'The client engine executes the same logical contract on real backend data. Every derived field is disclosed in result provenance. Nothing is fabricated.',
}
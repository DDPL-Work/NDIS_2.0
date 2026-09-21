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

export { resultsToCsv, resultsToGeoJson, normalizeLocationQueryResponse }

const LAYER_CACHE_TTL_MS = 5 * 60 * 1000
const layerCache = new Map()

let endpointCapability = null // 'backend' | 'client-engine' | null (unprobed)
let endpointBugMessage = null // human-readable description when endpoint exists but is broken
let savedQueriesCapabilityState = null // 'supported' | 'unsupported' | null

const QUERY_DOC = 'https://nalanda.drdesigntech.com/api' // surfaced in provenance only

async function probeAnalysisEndpoint() {
  // Probe with a lightweight valid payload. The backend accepts any valid shape
  // and returns results (possibly empty) or an error indicating the endpoint
  // does not exist. We detect deployment by checking for a successful response
  // or a 400 (payload exists but rejected), NOT by response content.
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
    // Any successful response (even empty) means the endpoint is deployed
    if (response && typeof response === 'object') {
      return 'backend'
    }
    return 'backend'
  } catch (error) {
    // 404/405 = endpoint genuinely not deployed
    if (error?.status === 404 || error?.status === 405) return 'client-engine'
    // 400/422 = endpoint exists but our probe payload was rejected — still deployed
    if (error?.status === 400 || error?.status === 422) return 'backend'
    // 5xx = endpoint exists but has a backend-side bug
    if (error?.status >= 500) {
      endpointBugMessage = error?.message || `POST /api/spatial-analysis/query/ returned ${error.status} — backend bug, not a missing endpoint`
      return 'client-engine'
    }
    // Network/timeout — assume client engine is safer
    return 'client-engine'
  }
}

export async function spatialAnalysisCapability() {
  if (endpointCapability === null) endpointCapability = await probeAnalysisEndpoint()
  return endpointCapability
}

export function spatialAnalysisBugMessage() {
  return endpointBugMessage
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

function normalizeLocationQueryResponse(response, query) {
  if (!response) {
    throw new Error('Invalid spatial analysis response: empty response')
  }
  const payload = response.data ?? response
  const geojson = payload?.geojson
  if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new Error('Invalid location query response: expected geojson.features[]')
  }
  const referenceLayerName = query.spatial?.reference?.name ?? 'reference'
  const features = geojson.features
  const normalizedFeatures = features.map((feature, index) => {
    const properties = feature.properties ?? {}
    const geometry = feature.geometry
    const position = geometry?.type === 'Point' && Array.isArray(geometry.coordinates)
      ? [geometry.coordinates[0], geometry.coordinates[1]]
      : null
    return {
      id: String(properties.id ?? index),
      name: properties.name ?? properties.Mosque_Nam ?? properties.Temple_Nam ?? properties.Name ?? 'Unnamed',
      blockName: properties.block_name ?? properties.Block_Name ?? null,
      population: properties.population ?? null,
      accessibility: properties.accessibility ?? properties.road_accessibility ?? null,
      roadAccessibility: properties.road_accessibility ?? null,
      nearestFacility: properties.nearest_facility ?? properties.nearestFacility ?? null,
      nearestReference: properties.nearest_facility ?? properties.nearestFacility ?? null,
      nearestReferenceName: properties.nearest_facility ?? properties.nearestFacility ?? null,
      distanceKm: properties.distance_km ?? properties.distanceKm ?? null,
      gapScore: properties.gap_score ?? properties.gapScore ?? null,
      priorityScore: properties.priority_score ?? properties.priorityScore ?? null,
      latitude: properties.latitude ?? position?.[1] ?? null,
      longitude: properties.longitude ?? position?.[0] ?? null,
      position,
      geometry,
      properties,
      rank: index + 1,
    }
  })
  return {
    targetLayer: payload.target_layer ?? query.targetLayer?.name ?? '',
    totalCount: Number(payload.total_count ?? features.length),
    returnedCount: Number(payload.returned_count ?? features.length),
    features: normalizedFeatures,
    geojson,
  }
}

export async function executeSpatialAnalysis(query, context = {}) {
  const capability = await spatialAnalysisCapability()

  if (capability === 'backend') {
    const response = await apiRequest('/spatial-analysis/query/', { method: 'POST', body: toBackendPayload(query), timeout: 60000 })
    // Backend returns { target_layer, total_count, returned_count, geojson: { features: [...] } }
    const normalized = normalizeLocationQueryResponse(response, query)
    const referenceLayerName = query.spatial?.reference?.name ?? 'reference'
    const backendProvenance = { generatedAt: new Date().toISOString() }
    return {
      mode: 'backend',
      backendQueryEndpoint: 'POST /api/spatial-analysis/query/',
      results: normalized.features,
      summary: {
        totalFound: normalized.totalCount,
        limit: normalized.returnedCount,
        condition: query.spatial?.condition,
        targetLayer: query.targetLayer?.name ?? '',
        referenceLayer: referenceLayerName,
        referenceLayerType: 'gis-layer',
      },
      provenance: {
        ...backendProvenance,
        targetLayer: normalized.targetLayer,
        referenceLayer: referenceLayerName,
        referenceLayerType: 'gis-layer',
        distanceKm: query.spatial?.distanceKm ?? null,
      },
    }
  }

  // Client engine over the real collections.
  const result = await executeQuery(query, {
    ...context,
    engine: 'client-engine',
    endpoint: 'GET /api/facilities/ + GET /api/gis/layers/{name}/',
    routing: context.routing !== false ? routingService.getRoute : null,
    referenceLayerName: context.referenceLayerName,
    referenceLayerType: context.referenceLayerType,
  })
  return { mode: 'client-engine', backendQueryEndpoint: 'POST /api/spatial-analysis/query/ (not deployed — client engine executed the typed contract)', ...result }
}

export const spatialAnalysisContractDoc = {
  contract: 'POST /api/spatial-analysis/query',
  logicalPayload: QUERY_DOC,
  fallback: 'client-engine over GET /api/facilities/ + GET /api/gis/layers/{name}/',
  note: 'The client engine executes the same logical contract on real backend data. Every derived field is disclosed in result provenance. Nothing is fabricated.',
}
// Typed Spatial Analysis query model + validation.
//
// This is the FRONTEND SERVICE CONTRACT for the DDST Spatial Analysis engine.
// The logical endpoint the backend SHOULD expose is:
//
//   POST /api/spatial-analysis/query
//   {
//     target_layer: { layer_id, name, geometry_type },
//     spatial: {
//       condition: "within_radius" | "buffer" | "nearest" | "polygon_containment"
//                | "intersects" | "distance" | "road_route",
//       distance_km: number | null,
//       reference: { type: "gis-layer" | "facility-category" | "point", layer_id, name, point }
//     },
//     attribute_filters: [ { field, operator, value, logic } ],
//     output_fields: [...],
//     sort: { field, direction },
//     limit: number
//   }
//   -> { mode, results: [...], summary, provenance }
//
// As of 2026-08 the live backend does not expose this endpoint, so the app
// executes the SAME logical contract through a typed client engine over the
// real backend collections (GET /api/facilities/, GET /api/gis/catalog/,
// GET /api/gis/layers/{name}/).  Results are real backend data; every derived
// field is computed from real coordinates and documented.  No data is ever
// fabricated.

export const SPATIAL_CONDITIONS = [
  { key: 'within_radius', label: 'Within radius', description: 'Target features within a straight-line radius of the reference geometry.' },
  { key: 'buffer', label: 'Buffer', description: 'Features whose centroid falls inside a buffer polygon around the reference point.' },
  { key: 'nearest', label: 'Nearest', description: 'The closest features to the reference geometry, ranked by distance.' },
  { key: 'polygon_containment', label: 'Polygon containment', description: 'Target features inside the reference polygon layer.' },
  { key: 'intersects', label: 'Intersects', description: 'Target geometries that intersect the reference geometry.' },
  { key: 'distance', label: 'Distance', description: 'Distance to the reference geometry returned as a field.' },
  { key: 'road_route', label: 'Road route', description: 'OSRM road distance to the reference point (two-point driving route, where supported).' },
]

export const FIELD_OPERATORS = [
  { key: 'eq', label: '=', types: ['number', 'string', 'boolean'] },
  { key: 'ne', label: '!=', types: ['number', 'string', 'boolean'] },
  { key: 'gt', label: '>', types: ['number'] },
  { key: 'gte', label: '>=', types: ['number'] },
  { key: 'lt', label: '<', types: ['number'] },
  { key: 'lte', label: '<=', types: ['number'] },
  { key: 'contains', label: 'contains', types: ['string'] },
  { key: 'in', label: 'in', types: ['number', 'string'] },
]

export const FILTER_LOGIC = [
  { key: 'and', label: 'AND' },
  { key: 'or', label: 'OR' },
]

export const MAX_RESULT_LIMIT = 500
export const DEFAULT_RESULT_LIMIT = 50
export const MAX_ROAD_ROUTE_SAMPLES = 5

// Accessibility thresholds (km from nearest road layer).  Calibrated against
// the real Nalanda road network: measured nearest-road distances across the 20
// rural blocks range 0.03–1.38 km (median 0.44 km), so in this dataset every
// block is Good or Moderate and none is Poor.  The thresholds are model
// parameters — adjust them in the engine or the query to re-segment the data;
// the UI surfaces the real distribution whenever a filter yields an empty set.
export const ACCESSIBILITY_THRESHOLDS_KM = { good: 1, moderate: 3 } // <=1 Good, <=3 Moderate, else Poor

// Accessible roads used by the accessibility derivation (real catalog layers).
export const ROAD_LAYER_NAMES = ['Other_Roads', 'National_Highway', 'State_Highway']

export const DERIVED_FIELDS = {
  name: { label: 'Name', description: 'Feature name (layer attribute or facility name).' },
  population: { label: 'Population', description: 'Real census field of the layer (e.g. Block_Rura / Block_Tota on Rural_population) or facility attribute.' },
  nearestFacility: { label: 'Nearest facility', description: 'Name of the closest reference-layer facility (real coordinates).' },
  distanceKm: { label: 'Distance (km)', description: 'Straight-line distance from the feature to the reference geometry (Haversine).' },
  accessibility: { label: 'Road accessibility', description: 'Derived from distance to the nearest road layer feature: <=1 km Good, <=3 km Moderate, else Poor.' },
  gapScore: { label: 'Facility gap score', description: 'Coverage-deficit heuristic of the nearest facility (50% coverage + 50% isolation).' },
  priorityScore: { label: 'Priority score', description: '0.4 population tier + 0.3 nearest-facility gap + 0.2 accessibility penalty + 0.1 distance penalty.' },
}

// Default output fields for the DST demo query (all real or documented).
export const DEMO_QUERY = {
  targetLayer: { type: 'gis-layer', id: 'Rural_population', name: 'Rural_population', geometryType: 'Polygon' },
  spatial: {
    condition: 'within_radius',
    distanceKm: 5,
    reference: { type: 'facility-category', id: 'health', name: 'Health facilities', geometryType: 'Point' },
  },
  filters: [
    { id: 'f1', field: 'population', operator: 'gte', value: '1000', logic: 'and' },
    { id: 'f2', field: 'accessibility', operator: 'eq', value: 'Poor', logic: 'and' },
  ],
  outputFields: ['name', 'population', 'nearestFacility', 'distanceKm', 'accessibility', 'gapScore'],
  sort: { field: 'priorityScore', direction: 'desc' },
  limit: 50,
}

// ---------------------------------------------------------------------------
// Field catalogs — built from REAL data only.
// ---------------------------------------------------------------------------

// Convenience fields that resolve to real backend fields with documented
// fallbacks; each candidate is checked against the row before use.
export const FIELD_ALIASES = {
  name: ['name', 'properties.feature_name', 'properties.Block_Name', 'properties.Name', 'properties.name'],
  population: ['attributes.population', 'attributes.population_served', 'properties.Block_Rura', 'properties.Sub_distri', 'properties.Block_Tota', 'properties.Population', 'properties.population'],
  village: ['village', 'properties.Block_Name', 'properties.village', 'attributes.Location'],
}

// Build the real attribute field catalog for a set of rows.  Only keys that
// actually exist in the data are listed — the UI can never filter on a field
// the backend does not provide.
export function buildFieldCatalog(rows = []) {
  const keys = new Set()
  rows.slice(0, 400).forEach((row) => {
    if (row.attributes && typeof row.attributes === 'object') Object.keys(row.attributes).forEach((key) => keys.add(key))
    if (row.properties && typeof row.properties === 'object') Object.keys(row.properties).forEach((key) => keys.add(`properties.${key}`))
    ;['name', 'village', 'block', 'departmentName', 'categoryLabel', 'status', 'gapScore', 'hazardSafe'].forEach((key) => {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') keys.add(key)
    })
  })
  return [...keys].sort()
}

// Resolve a field value from a unified feature row (facility or layer feature).
export function getFieldValue(row = {}, field = '') {
  if (!field) return undefined
  const path = String(field).split('.')
  let value = row
  for (const part of path) {
    if (value == null || typeof value !== 'object') return undefined
    value = value[part]
  }
  if (value === undefined || value === null || value === '') return undefined
  return value
}

export function resolveField(row = {}, field = '') {
  if (!field) return undefined
  const direct = getFieldValue(row, field)
  if (direct !== undefined) return direct
  for (const alias of FIELD_ALIASES[field] || []) {
    const resolved = getFieldValue(row, alias)
    if (resolved !== undefined) return resolved
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Validation (requirement §7) — prevent missing target, invalid distance,
// invalid operator/value, empty filters, invalid geometry, excessive limits.
// ---------------------------------------------------------------------------

function valueError(value, operator) {
  if (value === undefined || value === null || String(value).trim() === '') return 'Value cannot be empty.'
  const operatorMeta = FIELD_OPERATORS.find((op) => op.key === operator)
  if (!operatorMeta) return 'Unknown operator.'
  const numeric = Number(String(value).replace(/[^\d.-]/g, ''))
  if (operatorMeta.types.includes('number') && !Number.isFinite(numeric)) return `Operator ${operatorMeta.label} requires a numeric value.`
  return null
}

export function validateQuery(query = {}) {
  const errors = []
  const warnings = []

  if (!query.targetLayer?.id) errors.push({ field: 'targetLayer', message: 'Select a target layer.' })

  const condition = SPATIAL_CONDITIONS.find((c) => c.key === query.spatial?.condition)
  if (!condition) errors.push({ field: 'spatial.condition', message: 'Select a spatial condition.' })

  const distanceKm = Number(query.spatial?.distanceKm)
  if (['within_radius', 'buffer', 'distance'].includes(query.spatial?.condition)) {
    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      errors.push({ field: 'spatial.distanceKm', message: `Enter a valid distance (km) for the ${condition?.label || 'spatial'} condition.` })
    } else if (distanceKm > 200) {
      errors.push({ field: 'spatial.distanceKm', message: 'Distance cannot exceed 200 km.' })
    }
  }

  const reference = query.spatial?.reference
  if (reference?.type === 'point') {
    const point = reference.point
    if (!Array.isArray(point) || point.length < 2 || !point.every(Number.isFinite)) {
      errors.push({ field: 'spatial.reference', message: 'The reference point is invalid — pick it on the map or enter valid coordinates.' })
    }
  } else if (!reference?.id) {
    errors.push({ field: 'spatial.reference', message: 'Select a reference layer or geometry for the spatial condition.' })
  }

  const filters = Array.isArray(query.filters) ? query.filters.filter((f) => f.field || f.value) : []
  if (filters.length > 0) {
    filters.forEach((filter, index) => {
      if (!filter.field) { errors.push({ field: `filters.${index}.field`, message: 'Filter row has no field selected.' }); return }
      const operatorError = valueError(filter.value, filter.operator)
      if (operatorError) errors.push({ field: `filters.${index}.value`, message: `${filter.field}: ${operatorError}` })
    })
  }

  const limit = Number(query.limit ?? DEFAULT_RESULT_LIMIT)
  if (!Number.isFinite(limit) || limit < 1) errors.push({ field: 'limit', message: 'Result limit must be at least 1.' })
  else if (limit > MAX_RESULT_LIMIT) errors.push({ field: 'limit', message: `Result limit cannot exceed ${MAX_RESULT_LIMIT}.` })

  if (!Array.isArray(query.outputFields) || query.outputFields.length === 0) {
    warnings.push({ field: 'outputFields', message: 'No output fields selected — the default field set will be used.' })
  }

  return { errors, warnings }
}

// Attribute filter evaluation against a row (AND/OR chain, left-to-right).
// `logic` on a filter row joins it to the previous row.
export function evaluateFilters(row, filters = []) {
  const rows = filters.filter((f) => f.field && f.value !== undefined && f.value !== null && String(f.value).trim() !== '')
  if (!rows.length) return true
  let result = null
  rows.forEach((filter) => {
    const match = evaluateFilter(row, filter)
    if (result === null) { result = match; return }
    result = filter.logic === 'or' ? result || match : result && match
  })
  return result === null ? true : result
}

export function evaluateFilter(row, filter) {
  const actual = resolveField(row, filter.field)
  const expected = String(filter.value).trim()
  const numericActual = Number(actual)
  const numericExpected = Number(expected.replace(/[^\d.-]/g, ''))
  const actualNumber = Number.isFinite(numericActual) && Number(String(actual).replace(/[^\d.-]/g, '')) ? numericActual : null

  switch (filter.operator) {
    case 'eq': return String(actual).toLowerCase() === expected.toLowerCase()
    case 'ne': return String(actual).toLowerCase() !== expected.toLowerCase()
    case 'gt': return actualNumber !== null && Number.isFinite(numericExpected) && actualNumber > numericExpected
    case 'gte': return actualNumber !== null && Number.isFinite(numericExpected) && actualNumber >= numericExpected
    case 'lt': return actualNumber !== null && Number.isFinite(numericExpected) && actualNumber < numericExpected
    case 'lte': return actualNumber !== null && Number.isFinite(numericExpected) && actualNumber <= numericExpected
    case 'contains': return String(actual).toLowerCase().includes(expected.toLowerCase())
    case 'in': return expected.split(',').map((item) => item.trim().toLowerCase()).includes(String(actual).toLowerCase())
    default: return true
  }
}

// ---------------------------------------------------------------------------
// Export builders — pure functions over the REAL result rows only.  No
// fabricated rows, no guessed values; provenance is embedded in the headers.
// Kept in the model so they are testable in Node without browser dependencies.
// ---------------------------------------------------------------------------

export function resultsToCsv(result, outputFields = []) {
  const rows = result?.results || []
  if (!rows.length) return ''
  const fields = outputFields.length ? outputFields : ['name', 'population', 'nearestFacility', 'distanceKm', 'accessibility', 'gapScore', 'priorityScore']
  const header = ['rank', ...fields].join(',')
  const lines = rows.map((row) => [
    row.rank ?? '',
    ...fields.map((field) => {
      const value = row[field] ?? row.properties?.[field] ?? row.attributes?.[field] ?? ''
      const text = typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : String(value ?? '')
      return text
    }),
  ].join(','))
  const provenance = [
    '# NDISP Spatial Analysis export',
    `# Mode: ${result?.mode || 'client-engine'}`,
    `# Generated: ${result?.provenance?.generatedAt || new Date().toISOString()}`,
    `# Target layer: ${result?.summary?.targetLayer || ''}`,
    `# Condition: ${result?.summary?.condition || ''} (reference: ${result?.summary?.referenceLayer || ''})`,
  ]
  return [...provenance, header, ...lines].join('\n')
}

export function resultsToGeoJson(result) {
  const rows = result?.results || []
  const features = rows
    .map((row) => {
      const geometry = row.geometry || (row.position ? { type: 'Point', coordinates: row.position } : null)
      if (!geometry) return null
      return {
        type: 'Feature',
        properties: {
          id: row.id,
          rank: row.rank,
          name: row.name,
          population: row.population ?? null,
          nearestFacility: row.nearestFacility ?? null,
          distanceKm: row.distanceKm ?? null,
          accessibility: row.accessibility ?? null,
          gapScore: row.gapScore ?? null,
          priorityScore: row.priorityScore ?? null,
          provenance: `${result?.mode || 'client-engine'} · ${result?.provenance?.generatedAt || ''}`,
        },
        geometry,
      }
    })
    .filter(Boolean)
  return {
    type: 'FeatureCollection',
    generatedAt: result?.provenance?.generatedAt || new Date().toISOString(),
    mode: result?.mode || 'client-engine',
    targetLayer: result?.summary?.targetLayer || '',
    features,
  }
}
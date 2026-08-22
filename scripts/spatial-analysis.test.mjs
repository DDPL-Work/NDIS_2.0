import assert from 'node:assert/strict'
import {
  SPATIAL_CONDITIONS,
  FIELD_OPERATORS,
  FILTER_LOGIC,
  DEFAULT_RESULT_LIMIT,
  MAX_RESULT_LIMIT,
  ACCESSIBILITY_THRESHOLDS_KM,
  DEMO_QUERY,
  buildFieldCatalog,
  getFieldValue,
  resolveField,
  validateQuery,
  evaluateFilters,
  evaluateFilter,
  resultsToCsv,
  resultsToGeoJson,
} from '../src/features/spatialanalysis/spatialAnalysisModel.js'
import {
  interiorPoint,
  pointInPolygon,
  bufferPolygon,
  accessibilityStatus,
  priorityScore,
  executeQuery,
} from '../src/gis/engine/SpatialAnalysisEngine.js'

let passed = 0
const check = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`) }

// ---- Model: constants ----
check('SPATIAL_CONDITIONS covers the 7 required spatial ops', () => {
  const keys = SPATIAL_CONDITIONS.map((c) => c.key)
  assert.deepEqual(keys, ['within_radius', 'buffer', 'nearest', 'polygon_containment', 'intersects', 'distance', 'road_route'])
})
check('FIELD_OPERATORS cover = != > >= < <= contains in', () => {
  assert.deepEqual(FIELD_OPERATORS.map((o) => o.key), ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in'])
})
check('FILTER_LOGIC covers AND/OR', () => {
  assert.deepEqual(FILTER_LOGIC.map((l) => l.key), ['and', 'or'])
})
check('limits are sane', () => {
  assert.equal(DEFAULT_RESULT_LIMIT, 50)
  assert.equal(MAX_RESULT_LIMIT, 500)
})
check('accessibility thresholds are documented parameters', () => {
  assert.deepEqual(ACCESSIBILITY_THRESHOLDS_KM, { good: 1, moderate: 3 })
})

// ---- Model: DEMO_QUERY matches the DST requirement ----
check('DEMO_QUERY = 5km + population>=1000 + accessibility=Poor + priority sort', () => {
  assert.equal(DEMO_QUERY.targetLayer.id, 'Rural_population')
  assert.equal(DEMO_QUERY.spatial.condition, 'within_radius')
  assert.equal(DEMO_QUERY.spatial.distanceKm, 5)
  const fields = Object.fromEntries(DEMO_QUERY.filters.map((f) => [f.field, f]))
  assert.equal(fields.population.operator, 'gte')
  assert.equal(fields.population.value, '1000')
  assert.equal(fields.accessibility.operator, 'eq')
  assert.equal(fields.accessibility.value, 'Poor')
  assert.equal(DEMO_QUERY.sort.field, 'priorityScore')
  assert.equal(DEMO_QUERY.sort.direction, 'desc')
})

// ---- Model: field resolution ----
const blockRow = {
  id: '1', name: 'Asthawan', position: [85.4, 25.2],
  properties: { Block_Rura: 163938, Block_Name: 'Asthawan', feature_name: 'Asthawan', OBJECTID: 1 },
  attributes: {},
}
check('resolveField reads name via feature_name alias', () => {
  assert.equal(resolveField(blockRow, 'name'), 'Asthawan')
})
check('resolveField reads population via Block_Rura alias', () => {
  assert.equal(resolveField(blockRow, 'population'), 163938)
})
check('getFieldValue reads dotted paths', () => {
  assert.equal(getFieldValue(blockRow, 'properties.Block_Rura'), 163938)
})
check('buildFieldCatalog lists only real keys', () => {
  const catalog = buildFieldCatalog([blockRow])
  assert.ok(catalog.includes('properties.Block_Rura'))
  assert.ok(catalog.includes('properties.Block_Name'))
  assert.ok(catalog.includes('name'))
})

// ---- Model: validation ----
check('validateQuery rejects missing target layer', () => {
  const { errors } = validateQuery({ spatial: { condition: 'within_radius', distanceKm: 5 }, filters: [] })
  assert.ok(errors.some((e) => e.field === 'targetLayer'))
})
check('validateQuery rejects missing/invalid distance', () => {
  const base = { targetLayer: { id: 'Rural_population' }, spatial: { condition: 'within_radius', distanceKm: -3, reference: { type: 'point', point: [85.4, 25.2] } }, filters: [] }
  assert.ok(validateQuery(base).errors.some((e) => e.field === 'spatial.distanceKm'))
})
check('validateQuery rejects an invalid reference point', () => {
  const base = { targetLayer: { id: 'Rural_population' }, spatial: { condition: 'within_radius', distanceKm: 5, reference: { type: 'point', point: ['x', 25] } }, filters: [] }
  assert.ok(validateQuery(base).errors.some((e) => e.field === 'spatial.reference'))
})
check('validateQuery passes the DEMO_QUERY', () => {
  const { errors } = validateQuery(DEMO_QUERY)
  assert.equal(errors.length, 0)
})

// ---- Model: filter evaluation ----
const row = { ...blockRow, attributes: { population: 2500 } }
check('evaluateFilter: eq (string)', () => {
  assert.equal(evaluateFilter(row, { field: 'name', operator: 'eq', value: 'asthawan' }), true)
  assert.equal(evaluateFilter(row, { field: 'name', operator: 'eq', value: 'other' }), false)
})
check('evaluateFilter: numeric gte', () => {
  assert.equal(evaluateFilter(row, { field: 'population', operator: 'gte', value: '1000' }), true)
  assert.equal(evaluateFilter(row, { field: 'population', operator: 'gte', value: '5000' }), false)
})
check('evaluateFilter: contains', () => {
  assert.equal(evaluateFilter(row, { field: 'name', operator: 'contains', value: 'ast' }), true)
})
check('evaluateFilter: in', () => {
  assert.equal(evaluateFilter(row, { field: 'name', operator: 'in', value: 'A, Asthawan, B' }), true)
})
check('evaluateFilters: AND chain', () => {
  const filters = [
    { field: 'population', operator: 'gte', value: '1000', logic: 'and' },
    { field: 'name', operator: 'contains', value: 'asth', logic: 'and' },
  ]
  assert.equal(evaluateFilters(row, filters), true)
  assert.equal(evaluateFilters(row, [{ ...filters[1], value: 'zzz' }]), false)
})
check('evaluateFilters: empty filter list passes everything', () => {
  assert.equal(evaluateFilters(row, []), true)
})

// ---- Engine: geometry helpers ----
check('interiorPoint handles Point', () => {
  assert.deepEqual(interiorPoint({ type: 'Point', coordinates: [85.4, 25.2] }), [85.4, 25.2])
})
check('interiorPoint handles LineString via midpoint', () => {
  const point = interiorPoint({ type: 'LineString', coordinates: [[0, 0], [2, 0]] })
  assert.deepEqual(point, [1, 0])
})
check('interiorPoint handles Polygon via pointOnSurface', () => {
  const point = interiorPoint({ type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] })
  assert.ok(Array.isArray(point) && point.length === 2)
  assert.ok(pointInPolygon(point, { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] }))
})
check('pointInPolygon: inside true / outside false', () => {
  const poly = { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] }
  assert.equal(pointInPolygon([5, 5], poly), true)
  assert.equal(pointInPolygon([15, 5], poly), false)
})
check('bufferPolygon builds a closed ring of radius segments + closing point', () => {
  const ring = bufferPolygon([85.4, 25.2], 5)
  assert.equal(ring.type, 'Polygon')
  assert.equal(ring.coordinates[0].length, 49) // 48 segments + closing vertex
  assert.deepEqual(ring.coordinates[0][0], ring.coordinates[0][48])
})
check('bufferPolygon returns null for invalid input', () => {
  assert.equal(bufferPolygon(null, 5), null)
  assert.equal(bufferPolygon([85.4, 25.2], 0), null)
})
check('accessibilityStatus honours the documented thresholds', () => {
  assert.equal(accessibilityStatus(0.5), 'Good')
  assert.equal(accessibilityStatus(1), 'Good')
  assert.equal(accessibilityStatus(1.5), 'Moderate')
  assert.equal(accessibilityStatus(3), 'Moderate')
  assert.equal(accessibilityStatus(3.5), 'Poor')
  assert.equal(accessibilityStatus(null), 'Unknown')
})
check('priorityScore weights population, gap, accessibility and distance', () => {
  const high = priorityScore({ population: 40000, gapScore: 1, accessibility: 'Poor', distanceKm: 1 })
  const low = priorityScore({ population: 1000, gapScore: 0.2, accessibility: 'Good', distanceKm: 1 })
  assert.ok(high > low)
  assert.ok(Number.isFinite(high) && high >= 0 && high <= 1)
})

// ---- Engine: executeQuery over synthetic real-shaped data ----
const polygon = (lng, lat, size = 0.2) => ({
  type: 'Polygon',
  coordinates: [[
    [lng - size, lat - size], [lng + size, lat - size], [lng + size, lat + size],
    [lng - size, lat + size], [lng - size, lat - size],
  ]],
})
const targetRows = [
  { id: 'b1', name: 'Near Block', position: [85.4, 25.2], geometry: polygon(85.4, 25.2), properties: { Block_Rura: 5000, feature_name: 'Near Block' }, attributes: {} },
  { id: 'b2', name: 'Far Block', position: [86.6, 26.1], geometry: polygon(86.6, 26.1), properties: { Block_Rura: 9000, feature_name: 'Far Block' }, attributes: {} },
]
const referenceRows = [
  { id: 'h1', name: 'Health Hub', position: [85.405, 25.205], geometry: null, gapScore: 0.8 },
]
const roads = [
  { geometry: { type: 'LineString', coordinates: [[85.0, 25.0], [85.6, 25.4]] } }, // runs through the near block
  { geometry: { type: 'LineString', coordinates: [[88.0, 27.0], [88.5, 27.2]] } }, // far from the near block
]

const query = {
  targetLayer: { id: 'Rural_population', name: 'Rural_population', geometryType: 'Polygon' },
  spatial: { condition: 'within_radius', distanceKm: 5, reference: { type: 'facility-category', id: 'health', name: 'Health facilities' } },
  filters: [
    { id: 'f1', field: 'population', operator: 'gte', value: '1000', logic: 'and' },
  ],
  outputFields: ['name', 'population', 'nearestFacility', 'distanceKm', 'accessibility', 'gapScore'],
  sort: { field: 'priorityScore', direction: 'desc' },
  limit: 50,
}

check('executeQuery: within_radius matches any reference feature (nearest, not first)', async () => {
  const result = await executeQuery(query, { targetRows, referenceRows, roads, routing: false })
  assert.equal(result.results.length, 1)
  assert.equal(result.results[0].name, 'Near Block')
  assert.equal(result.results[0].population, 5000)
  assert.equal(result.results[0].nearestFacility, 'Health Hub')
  assert.ok(result.results[0].distanceKm < 1)
  assert.equal(result.results[0].rank, 1)
  assert.ok(typeof result.results[0].priorityScore === 'number')
  assert.ok(result.diagnosis.blocksExamined === 2)
  assert.ok(result.diagnosis.withinRadius === 1)
  assert.ok(result.diagnosis.populationPassed === 1)
  assert.ok(result.provenance.computedFields.length > 0)
})

check('executeQuery: attribute filters narrow the result (accessibility filter actually filters)', async () => {
  const poorQuery = { ...query, filters: [{ id: 'f1', field: 'population', operator: 'gte', value: '1000', logic: 'and' }, { id: 'f2', field: 'accessibility', operator: 'eq', value: 'Poor', logic: 'and' }] }
  const result = await executeQuery(poorQuery, { targetRows, referenceRows, roads, routing: false })
  // The near block's centroid sits ~5.7 km from the only nearby road, so it is
  // genuinely Poor (>3 km) — the filter keeps exactly that row.
  assert.equal(result.results.length, 1)
  assert.equal(result.results[0].name, 'Near Block')
  assert.equal(result.results[0].accessibility, 'Poor')
  assert.ok(result.diagnosis.byAccessibility)

  // The same query with accessibility=Good must now be empty (near block is Poor).
  const goodQuery = { ...poorQuery, filters: [{ id: 'f1', field: 'population', operator: 'gte', value: '1000', logic: 'and' }, { id: 'f2', field: 'accessibility', operator: 'eq', value: 'Good', logic: 'and' }] }
  const goodResult = await executeQuery(goodQuery, { targetRows, referenceRows, roads, routing: false })
  assert.equal(goodResult.results.length, 0)
})

check('executeQuery: road_route uses the routing provider and records the basis', async () => {
  const routeQuery = { ...query, spatial: { condition: 'road_route', distanceKm: 5, reference: { type: 'point', point: [85.4, 25.2] } }, filters: [] }
  const routing = async () => ({ distanceKm: 12.5, durationMinutes: 18 })
  const result = await executeQuery(routeQuery, { targetRows, referenceRows, roads, routing })
  assert.equal(result.results.length, 2)
  assert.equal(result.results[0].roadDistanceKm, 12.5)
  assert.ok(result.results[0].roadRouteBasis.includes('OSRM'))
  assert.ok(result.provenance.computedFields.some((f) => f.includes('OSRM')))
})

// ---- Exports are built from the REAL result rows only ----
const result = {
  mode: 'client-engine',
  summary: { targetLayer: 'Rural_population', condition: 'within_radius', referenceLayer: 'Health facilities', totalFound: 2 },
  provenance: { generatedAt: '2026-08-20T00:00:00.000Z' },
  results: [
    { id: 'b1', rank: 1, name: 'Near Block', population: 5000, nearestFacility: 'Health Hub', distanceKm: 0.5, accessibility: 'Good', gapScore: 0.8, priorityScore: 0.52, position: [85.4, 25.2] },
    { id: 'b2', rank: 2, name: 'Far Block', population: 9000, nearestFacility: null, distanceKm: 111, accessibility: 'Moderate', gapScore: null, priorityScore: 0.4, position: [86.6, 26.1] },
  ],
}
check('resultsToCsv emits provenance header + all real rows', () => {
  const csv = resultsToCsv(result, ['name', 'population', 'nearestFacility', 'distanceKm', 'accessibility', 'gapScore', 'priorityScore'])
  const lines = csv.split('\n')
  assert.ok(lines[0].startsWith('# NDISP Spatial Analysis export'))
  assert.ok(lines.some((l) => l.includes('Near Block')))
  assert.ok(lines.some((l) => l.includes('Far Block')))
  assert.equal(lines.filter((l) => !l.startsWith('#')).length, 3) // header + 2 rows
})
check('resultsToCsv escapes quotes in string values', () => {
  const quoted = resultsToCsv({ ...result, results: [{ ...result.results[0], name: 'Block "North"' }] }, ['name'])
  assert.ok(quoted.includes('"Block ""North"""'))
})
check('resultsToGeoJson produces a real FeatureCollection', () => {
  const geojson = resultsToGeoJson(result)
  assert.equal(geojson.type, 'FeatureCollection')
  assert.equal(geojson.features.length, 2)
  assert.equal(geojson.features[0].properties.name, 'Near Block')
  assert.equal(geojson.features[0].geometry.type, 'Point')
  assert.deepEqual(geojson.features[0].geometry.coordinates, [85.4, 25.2])
  assert.ok(geojson.features[0].properties.provenance.includes('client-engine'))
})

console.log(`\n${passed} checks passed`)
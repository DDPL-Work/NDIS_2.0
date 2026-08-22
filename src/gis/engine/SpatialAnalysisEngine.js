// Spatial Analysis engine — typed geometry + attribute execution over REAL
// backend data.  The backend has no spatial-analysis endpoint yet, so this
// engine implements the logical contract (see spatialAnalysisModel.js) using
// the real collections the backend DOES serve (facilities, GIS catalog layers).
//
// Honesty rules:
//  - every result row is a real backend feature (never synthesised);
//  - distance / containment / intersection are computed from real coordinates
//    (Haversine, point-in-ring, point-to-line);
//  - derived fields (accessibility, priority score, buffer geometry) are
//    computed by documented formulas and reported in the result provenance.
import { distanceMeters, pointInRing, pointOnSurface, midpointAlongLine, nearestPointOnLine } from '../../utils/geo.js'
import { evaluateFilters, resolveField, ACCESSIBILITY_THRESHOLDS_KM, MAX_ROAD_ROUTE_SAMPLES, MAX_RESULT_LIMIT, DEFAULT_RESULT_LIMIT } from '../../features/spatialanalysis/spatialAnalysisModel.js'

// ---------------------------------------------------------------------------
// Geometry accessors
// ---------------------------------------------------------------------------

export function interiorPoint(geometry) {
  if (!geometry) return null
  const coordinates = geometry.coordinates
  switch (geometry.type) {
    case 'Point': {
      const point = Array.isArray(coordinates) ? coordinates : null
      return point && point.length >= 2 ? [Number(point[0]), Number(point[1])] : null
    }
    case 'LineString': {
      if (!Array.isArray(coordinates) || coordinates.length < 2) return null
      return midpointAlongLine(coordinates.map((c) => [Number(c[0]), Number(c[1])]))
    }
    case 'MultiLineString': {
      const longest = (coordinates || []).reduce((best, line) => (line?.length > (best?.length || 0) ? line : best), null)
      return longest ? interiorPoint({ type: 'LineString', coordinates: longest }) : null
    }
    case 'Polygon': {
      const rings = coordinates || []
      if (!rings.length) return null
      return pointOnSurface(rings.map((ring) => ring.map((c) => [Number(c[0]), Number(c[1])]))) || averageOf(rings[0])
    }
    case 'MultiPolygon': {
      const polygons = coordinates || []
      for (const polygon of polygons) {
        const point = polygon ? interiorPoint({ type: 'Polygon', coordinates: polygon }) : null
        if (point) return point
      }
      return null
    }
    default:
      return null
  }
}

function averageOf(ring) {
  if (!Array.isArray(ring) || !ring.length) return null
  const sum = ring.reduce((acc, c) => [acc[0] + Number(c[0]), acc[1] + Number(c[1])], [0, 0])
  return [Number((sum[0] / ring.length).toFixed(6)), Number((sum[1] / ring.length).toFixed(6))]
}

// Polygon rings for containment / intersection tests.
function ringsOf(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return (geometry.coordinates || []).map((ring) => ring.map((c) => [Number(c[0]), Number(c[1])]))
  if (geometry.type === 'MultiPolygon') return (geometry.coordinates || []).flatMap((polygon) => (polygon || []).map((ring) => ring.map((c) => [Number(c[0]), Number(c[1])])))
  return []
}

function lineCoordinates(geometry) {
  if (!geometry) return []
  if (geometry.type === 'LineString') return (geometry.coordinates || []).map((c) => [Number(c[0]), Number(c[1])])
  if (geometry.type === 'MultiLineString') return (geometry.coordinates || []).flat().map((c) => [Number(c[0]), Number(c[1])])
  return []
}

// Point inside a polygon geometry (outer ring + holes).
export function pointInPolygon(point, geometry) {
  if (!point || !geometry) return false
  if (['Polygon', 'MultiPolygon'].includes(geometry.type)) {
    // The first ring of each polygon is the outer boundary; subsequent rings are holes.
    const rings = ringsOf(geometry)
    const outerRings = rings.filter((_, i) => i % 2 === 0)
    return outerRings.some((outerRing) => pointInRing(point, outerRing))
  }
  if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
    const nearest = nearestRoadDistance(point, [geometry])
    return nearest !== null && nearest <= 0.1 // within 100 m of the line
  }
  return false
}

// Approximate polygon/polygon intersection: bounding-box overlap (documented
// approximation — exact topology lives in PostGIS on the backend).
function bboxOf(rings) {
  if (!rings.length) return null
  const all = rings.flat()
  const lngs = all.map((c) => c[0])
  const lats = all.map((c) => c[1])
  return { minLng: Math.min(...lngs), maxLng: Math.max(...lngs), minLat: Math.min(...lats), maxLat: Math.max(...lats) }
}

function bboxesOverlap(a, b) {
  if (!a || !b) return false
  return a.minLng <= b.maxLng && a.maxLng >= b.minLng && a.minLat <= b.maxLat && a.maxLat >= b.minLat
}

export function geometriesIntersect(target, reference) {
  if (!target || !reference) return false
  const targetPoint = target.type === 'Point' ? target.coordinates : null
  const referencePoint = reference.type === 'Point' ? reference.coordinates : null

  // point vs polygon → containment; point vs point → within 100 m
  if (targetPoint && ['Polygon', 'MultiPolygon'].includes(reference.type)) {
    return pointInPolygon([Number(targetPoint[0]), Number(targetPoint[1])], reference)
  }
  if (targetPoint && referencePoint) {
    return distanceMeters([Number(targetPoint[0]), Number(targetPoint[1])], [Number(referencePoint[0]), Number(referencePoint[1])]) <= 100
  }
  // polygon vs polygon → bbox overlap (documented approximation)
  if (['Polygon', 'MultiPolygon'].includes(target.type) && ['Polygon', 'MultiPolygon'].includes(reference.type)) {
    return bboxesOverlap(bboxOf(ringsOf(target)), bboxOf(ringsOf(reference)))
  }
  // polygon vs line → any ring vertex within 100 m of the line (documented)
  if (['Polygon', 'MultiPolygon'].includes(target.type) && ['LineString', 'MultiLineString'].includes(reference.type)) {
    const line = [reference]
    const vertices = ringsOf(target).flat()
    return vertices.some((vertex) => {
      const nearest = nearestRoadDistance(vertex, line)
      return nearest !== null && nearest <= 0.1
    })
  }
  // line vs polygon → reverse of the above
  if (['LineString', 'MultiLineString'].includes(target.type) && ['Polygon', 'MultiPolygon'].includes(reference.type)) {
    const line = [target]
    const vertices = ringsOf(reference).flat()
    return vertices.some((vertex) => {
      const nearest = nearestRoadDistance(vertex, line)
      return nearest !== null && nearest <= 0.1
    })
  }
  // line vs line → bounding-box overlap (documented)
  if (['LineString', 'MultiLineString'].includes(target.type) && ['LineString', 'MultiLineString'].includes(reference.type)) {
    const a = lineCoordinates(target)
    const b = lineCoordinates(reference)
    if (!a.length || !b.length) return false
    return bboxesOverlap(
      { minLng: Math.min(...a.map((c) => c[0])), maxLng: Math.max(...a.map((c) => c[0])), minLat: Math.min(...a.map((c) => c[1])), maxLat: Math.max(...a.map((c) => c[1])) },
      { minLng: Math.min(...b.map((c) => c[0])), maxLng: Math.max(...b.map((c) => c[0])), minLat: Math.min(...b.map((c) => c[1])), maxLat: Math.max(...b.map((c) => c[1])) }
    )
  }
  return false
}

// Buffer polygon around a point (real geometry — the PostGIS ST_Buffer
// equivalent rendered client-side; 48 segments, documented).
export function bufferPolygon(point, radiusKm, segments = 48) {
  if (!Array.isArray(point) || point.length < 2 || !(radiusKm > 0)) return null
  const [lng, lat] = point
  const ring = []
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2
    const dLat = (radiusKm / 111) * Math.sin(angle)
    const dLng = (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.cos(angle)
    ring.push([Number((lng + dLng).toFixed(6)), Number((lat + dLat).toFixed(6))])
  }
  ring.push(ring[0])
  return { type: 'Polygon', coordinates: [ring] }
}

function nearestRoadDistance(point, roadFeatures = []) {
  let best = null
  roadFeatures.forEach((road) => {
    const coords = road?.geometry ? lineCoordinates(road.geometry) : (road?.coordinates || [])
    if (!coords.length) return
    const nearest = nearestPointOnLine(coords, point)
    if (nearest && (best === null || nearest.distanceM < best)) best = nearest.distanceM
  })
  return best === null ? null : Number((best / 1000).toFixed(3))
}

// ---------------------------------------------------------------------------
// Derived field computations (documented formulas)
// ---------------------------------------------------------------------------

export function accessibilityStatus(roadDistanceKm) {
  if (roadDistanceKm === null || roadDistanceKm === undefined) return 'Unknown'
  if (roadDistanceKm <= ACCESSIBILITY_THRESHOLDS_KM.good) return 'Good'
  if (roadDistanceKm <= ACCESSIBILITY_THRESHOLDS_KM.moderate) return 'Moderate'
  return 'Poor'
}

export function priorityScore({ population, gapScore, accessibility, distanceKm }) {
  const populationTier = population == null ? 0 : Math.min(1, Number(population) / 50000)
  const gap = Number(gapScore) || 0
  const accessibilityPenalty = accessibility === 'Poor' ? 1 : accessibility === 'Moderate' ? 0.5 : accessibility === 'Good' ? 0 : 0
  const distancePenalty = Number(distanceKm) == null ? 0 : Math.min(1, Number(distanceKm) / 10)
  return Math.round((0.4 * populationTier + 0.3 * gap + 0.2 * accessibilityPenalty + 0.1 * distancePenalty) * 100) / 100
}

// ---------------------------------------------------------------------------
// Query execution
// ---------------------------------------------------------------------------

function nearestReference(row, referenceRows = []) {
  let best = null
  referenceRows.forEach((reference) => {
    if (!reference.position) return
    const d = distanceMeters(row.position, reference.position)
    if (!best || d < best.distanceM) best = { reference, distanceM: d }
  })
  return best
}

/**
 * Execute a typed query against real data.
 *
 * @param {object} query      typed query (spatialAnalysisModel shape)
 * @param {object} context    { targetRows, referenceRows, roads, routing }
 *   targetRows      unified feature rows of the target layer (real data)
 *   referenceRows   unified feature rows of the reference layer (real data)
 *   roads           real road layer features [{ geometry }]
 *   routing         async ({ origin, destination }) => { distanceKm } | null (OSRM); optional
 * @returns {{ results, summary, provenance }}
 */
export async function executeQuery(query = {}, context = {}) {
  const targetRows = (context.targetRows || []).filter((row) => Array.isArray(row.position))
  const referenceRows = (context.referenceRows || []).filter((row) => Array.isArray(row.position))
  const roads = context.roads || []
  const condition = query.spatial?.condition || 'within_radius'
  const distanceKm = Number(query.spatial?.distanceKm) || 0
  const limit = Math.min(Number(query.limit ?? DEFAULT_RESULT_LIMIT), MAX_RESULT_LIMIT)

  // Reference point: explicit point, or the first reference feature position.
  let referencePoint = null
  if (query.spatial?.reference?.type === 'point' && Array.isArray(query.spatial.reference.point)) {
    referencePoint = [Number(query.spatial.reference.point[0]), Number(query.spatial.reference.point[1])]
  } else if (referenceRows.length) {
    referencePoint = referenceRows[0].position
  }

  // Per-row nearest reference — the spatial tests below use THIS, so a
  // reference layer with many features (e.g. "health facilities") correctly
  // matches any feature within the radius, not just the first one.
  const nearestPerRow = targetRows.map((row) => nearestReference(row, referenceRows))

  const spatial = (row, index) => {
    const nearest = nearestPerRow[index]
    switch (condition) {
      case 'within_radius':
      case 'buffer': {
        if (!nearest) return false
        return nearest.distanceM <= distanceKm * 1000
      }
      case 'nearest':
      case 'distance':
        return true
      case 'polygon_containment': {
        if (!row.geometry || !referenceRows.length) return false
        return referenceRows.some((reference) => pointInPolygon(row.position, reference.geometry))
      }
      case 'intersects': {
        if (!row.geometry || !referenceRows.length) return false
        return referenceRows.some((reference) => geometriesIntersect(row.geometry, reference.geometry))
      }
      case 'road_route':
        return true
      default:
        return false
    }
  }

  let results = targetRows
    .filter((row, index) => spatial(row, index))
    .map((row) => {
      const nearest = nearestReference(row, referenceRows)
      const nearestFacility = nearest?.reference || null
      const nearestDistanceKm = nearest ? Number((nearest.distanceM / 1000).toFixed(2)) : null
      const roadDistanceKm = nearestRoadDistance(row.position, roads)
      const accessibility = accessibilityStatus(roadDistanceKm)
      const facilityGap = nearestFacility ? nearestFacility.gapScore : null
      const population = resolveField(row, 'population')
      return {
        ...row,
        id: row.id,
        position: row.position,
        geometry: row.geometry,
        nearestFacility: nearestFacility?.name || null,
        nearestFacilityId: nearestFacility?.id || null,
        distanceKm: nearestDistanceKm,
        roadDistanceKm,
        accessibility,
        accessibilityBasis: roadDistanceKm === null ? 'No road layer data' : `Nearest road ${roadDistanceKm} km (real road geometry)`,
        gapScore: facilityGap,
        population,
        priorityScore: priorityScore({ population, gapScore: facilityGap, accessibility, distanceKm: nearestDistanceKm }),
      }
    })

  // Attribute filters (AND/OR chain) — evaluated on real fields only.
  const spatiallyFiltered = results
  const populationFilter = (query.filters || []).find((f) => f.field === 'population')
  const diagnosis = (() => {
    const roadDistances = spatiallyFiltered.map((r) => r.roadDistanceKm).filter((v) => v !== null && v !== undefined)
    const sortedRoad = roadDistances.slice().sort((a, b) => a - b)
    const byAccessibility = spatiallyFiltered.reduce((acc, r) => { const k = r.accessibility || 'Unknown'; acc[k] = (acc[k] || 0) + 1; return acc }, {})
    const populationThreshold = populationFilter ? Number(String(populationFilter.value).replace(/[^\d.-]/g, '')) : null
    return {
      blocksExamined: targetRows.length,
      withinRadius: spatiallyFiltered.length,
      populationPassed: populationThreshold == null
        ? spatiallyFiltered.length
        : spatiallyFiltered.filter((r) => (Number(resolveField(r, 'population')) || 0) >= populationThreshold).length,
      byAccessibility,
      roadRange: sortedRoad.length
        ? { min: sortedRoad[0], max: sortedRoad[sortedRoad.length - 1], median: sortedRoad[Math.floor(sortedRoad.length / 2)] }
        : null,
      accessibilityBasis: 'distance to nearest road layer feature (real geometry)',
    }
  })()
  results = results.filter((row) => evaluateFilters(row, query.filters))

  // Road route (where supported): OSRM road distance for the top samples.
  let roadRouteSupported = null
  if (condition === 'road_route' && referencePoint && context.routing) {
    roadRouteSupported = true
    const samples = results.slice(0, MAX_ROAD_ROUTE_SAMPLES)
    await Promise.all(samples.map(async (row) => {
      try {
        const route = await context.routing({ origin: { lng: referencePoint[0], lat: referencePoint[1] }, destination: { lng: row.position[0], lat: row.position[1] } })
        if (route?.distanceKm != null) row.roadDistanceKm = route.distanceKm
        row.roadRouteBasis = 'OSRM two-point driving route (real)'
      } catch {
        row.roadRouteBasis = 'OSRM routing unavailable for this pair'
      }
    }))
  } else if (condition === 'road_route') {
    roadRouteSupported = false
  }

  // Sort / rank.
  const sortField = query.sort?.field || 'priorityScore'
  const direction = query.sort?.direction === 'asc' ? 1 : -1
  results = results
    .map((row) => ({ ...row, [sortField]: resolveField(row, sortField) }))
    .sort((a, b) => {
      const av = a[sortField]
      const bv = b[sortField]
      if (av === bv) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction
      return String(av).localeCompare(String(bv)) * direction
    })
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }))

  const computedFields = []
  if (['within_radius', 'buffer'].includes(condition)) computedFields.push('spatial filter: distance to reference (Haversine)')
  if (condition === 'polygon_containment') computedFields.push('spatial filter: point-in-polygon (real geometry)')
  if (condition === 'intersects') computedFields.push('spatial filter: intersection test (containment / bbox overlap, documented)')
  if (condition === 'nearest') computedFields.push('ranking: distance to reference (Haversine)')
  if (condition === 'road_route') computedFields.push(roadRouteSupported ? 'road distance: OSRM driving route' : 'road route: unsupported by this deployment — straight-line distance shown')
  computedFields.push('accessibility: distance to nearest road layer (real geometry)')
  computedFields.push('gapScore: client coverage-isolation heuristic of nearest facility')
  computedFields.push('priorityScore: 0.4 population tier + 0.3 gap + 0.2 accessibility penalty + 0.1 distance penalty')

  const provenance = {
    engine: context.engine || 'client-engine',
    endpoint: context.endpoint || 'GET /api/facilities/ + GET /api/gis/layers/{name}/ (client engine)',
    backendQueryEndpoint: 'POST /api/spatial-analysis/query — NOT deployed; client engine executes the typed contract',
    computedFields,
    targetLayer: query.targetLayer?.name || null,
    referenceLayer: query.spatial?.reference?.name || 'point',
    roadsUsed: roads.length ? `${roads.length} road features` : 'none',
    generatedAt: new Date().toISOString(),
  }

  return {
    results,
    summary: {
      totalFound: results.length,
      limit,
      condition: query.spatial?.condition,
      targetLayer: query.targetLayer?.name || '',
      referenceLayer: query.spatial?.reference?.name || 'point',
    },
    diagnosis,
    provenance,
  }
}

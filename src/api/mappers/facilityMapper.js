const departmentSlug = (value) => String(value || '').toLowerCase().replace(/\s+(department|&)/g, '').replace(/[^a-z]/g, '')
import { createFacilitySlug } from '../../utils/createFacilitySlug'

// Coverage-deficit ("gap") scoring
// The production facility API returns geometry + custom attributes but never a
// deficit score, so the raw mapper would render every gapScore as 0 — an empty
// "gap score" ring on maps and detail cards. We therefore derive an honest
// 0..1 coverage index from the facility's real spatial neighbourhood: a
// facility that sits alone in its category (few same-category neighbours for
// ~15 km) scores high ("High deficit"), one inside a dense same-category
// cluster scores low ("Well served").
const CELL_DEG = 0.045 // ~5 km per grid cell at this latitude
const GRID_WINDOW = 2 // Chebyshev cell radius counted as a same-area neighbourhood
const ISOLATION_CELLS = 4 // ~20 km of empty cells = fully isolated service point

let facilityGapPool = new Map() // last loaded list, reused to score single-detail requests

const gridCell = (lng, lat) => [Math.round(lng / CELL_DEG), Math.round(lat / CELL_DEG)]
const gridKey = (f) => `${f.categoryLabel}|${f.longitude ?? ''}|${f.latitude ?? ''}`

// Pool a scored list so a later single-facility page (numeric-id route) can
// reuse the same neighbourhood index instead of falling back to 0.
export function rememberScored(facilities) {
  if (Array.isArray(facilities)) {
    facilityGapPool = new Map(facilities.map((f) => [f.id, { gapScore: f.gapScore, key: gridKey(f) }]))
  }
  return facilities
}

function pooledGap(dto, attributes, id) {
  const raw = dto.gap_score ?? dto.deficit_score ?? attributes.gap_score ?? attributes.deficit_score
  if (raw != null) return Number(raw)
  const pooled = facilityGapPool.get(String(id))
  if (!pooled) return 0
  const point = dto.geom_geojson?.coordinates || dto.geom?.coordinates || dto.position
  const longitude = Array.isArray(point) ? Number(point[0]) : null
  const latitude = Array.isArray(point) ? Number(point[1]) : null
  const key = gridKey({ categoryLabel: dto.category_name || dto.layer_name || 'Facility', longitude, latitude })
  return pooled.key === key ? pooled.gapScore : 0
}

function computeCoverageGaps(mapped) {
  // Group the geometry of each category into a coarse grid so the whole list
  // can be scanned once (O(n) cells) instead of an O(n^2) pair-wise pass.
  const byCategory = new Map()
  mapped.forEach((facility, offset) => {
    if (!Number.isFinite(facility.longitude) || !Number.isFinite(facility.latitude)) return
    const [x, y] = gridCell(facility.longitude, facility.latitude)
    const key = `${x}:${y}`
    let cells = byCategory.get(facility.categoryLabel)
    if (!cells) { cells = new Map(); byCategory.set(facility.categoryLabel, cells) }
    const bucket = cells.get(key)
    if (bucket) bucket.push(offset)
    else cells.set(key, [offset])
  })

  const scored = mapped.map((f) => ({ ...f }))
  for (const cells of byCategory.values()) {
    const keys = [...cells.keys()]
    const coords = keys.map((key) => key.split(':').map(Number))
    for (let i = 0; i < keys.length; i += 1) {
      const [x, y] = coords[i]
      let neighbours = 0
      let nearest = cells.get(keys[i]).length > 1 ? 0 : Infinity
      for (let j = 0; j < keys.length; j += 1) {
        const dist = Math.max(Math.abs(x - coords[j][0]), Math.abs(y - coords[j][1]))
        if (i !== j && dist < nearest) nearest = dist
        if (dist <= GRID_WINDOW) neighbours += cells.get(keys[j]).length
      }
      neighbours -= 1 // do not count the facility itself
      const coverageFactor = Math.min(1, neighbours / 3)
      const isolation = Math.min(1, nearest / ISOLATION_CELLS)
      const gapScore = Math.round((0.5 * (1 - coverageFactor) + 0.5 * isolation) * 100) / 100
      cells.get(keys[i]).forEach((offset) => { scored[offset].gapScore = gapScore })
    }
  }
  return scored
}

export function mapFacility(dto = {}) { const point = dto.geom_geojson?.coordinates || dto.geom?.coordinates || dto.position; const longitude = Array.isArray(point) ? Number(point[0]) : null; const latitude = Array.isArray(point) ? Number(point[1]) : null; const attributes = dto.attributes || {}; const departmentValue = typeof dto.department === 'object' ? dto.department?.id : dto.department; const departmentName = dto.department_name || (typeof dto.department === 'object' ? dto.department?.name : ''); const districtValue = typeof dto.district === 'object' ? dto.district?.id : dto.district; const districtName = dto.district_name || (typeof dto.district === 'object' ? dto.district?.name : ''); const departmentId = String(departmentValue ?? dto.department_id ?? dto.department_slug ?? departmentSlug(departmentName) ?? ''); const mapped = { id: String(dto.id), name: dto.name || 'Unnamed facility', departmentId, departmentName, categoryId: dto.category_slug || String(dto.category || dto.category_name || '').toLowerCase().replace(/\s+/g, '_'), categoryLabel: dto.category_name || dto.layer_name || 'Facility', districtId: String(districtValue || ''), districtName, district_slug: dto.district_slug, department_slug: dto.department_slug, village: dto.village || dto.block_name || districtName || '', longitude, latitude, position: Number.isFinite(longitude) && Number.isFinite(latitude) ? [longitude, latitude] : null, status: dto.status || 'active', attributes, hazardSafe: dto.hazard_safe == null ? null : Boolean(dto.hazard_safe), contact: dto.contact || { phone: attributes.contact || 'Not provided', hours: attributes.hours || 'Not provided' }, geocodeMethod: dto.geocode_method || 'backend GIS', custodian: dto.custodian || departmentName || 'Department record', ingestionBatchId: dto.ingestion_batch_id || 'Not provided', confidence: Number(dto.confidence ?? 1), radiusKm: Number(dto.radius_km ?? 0), gapScore: pooledGap(dto, attributes, String(dto.id)), lastUpdated: dto.updated_at || dto.created_at || null, slug: dto.slug || createFacilitySlug({ department_slug: dto.department_slug, departmentName, district_slug: dto.district_slug, districtName, id: dto.id }) }; return mapped }

export function facilityRows(response) {
  if (Array.isArray(response)) return response
  // Production deployments may envelope DRF pagination under `data` or use a
  // resource key.  Normalise the documented collection before mapping.
  const candidate = response?.results || response?.facilities || response?.data?.results || response?.data?.facilities || response?.data
  return Array.isArray(candidate) ? candidate : []
}
export function mapFacilityList(response, context = {}) {
  const mapped = facilityRows(response).map((dto) => mapFacility({ ...dto, district_slug: dto.district_slug || context.districtId }))
  const needsScores = mapped.length > 1 && mapped.every((f) => f.gapScore === 0)
  if (!needsScores) { rememberScored(mapped); return mapped }
  const scored = computeCoverageGaps(mapped)
  rememberScored(scored)
  return scored
}
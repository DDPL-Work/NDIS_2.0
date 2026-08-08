// Spatial Query Engine — maps the /api/spatial-query/ response onto the app's
// shared facility shape (position [lng, lat], categoryLabel, departmentName,
// hazardSafe, distanceM) so every GIS portal can reuse the same markers,
// popups and result cards.  Backend contract (backend_guide2.0.md §11.1):
//   GET /api/spatial-query/?q=...&lat=..&lng=..&radius=..&limit=..
//   -> { status, query_info, total_found, results: [ { id, name, category,
//        department, hazard_safe, latitude, longitude, distance_m, distance_km } ] }
export function mapSpatialQueryResult(row = {}) {
  const longitude = Number(row.longitude)
  const latitude = Number(row.latitude)
  return {
    id: String(row.id),
    name: row.name || 'Unnamed facility',
    categoryLabel: row.category || 'Facility',
    departmentName: row.department || '',
    departmentId: row.department_id != null ? String(row.department_id) : '',
    hazardSafe: Boolean(row.hazard_safe),
    latitude,
    longitude,
    position: Number.isFinite(longitude) && Number.isFinite(latitude) ? [longitude, latitude] : null,
    distanceM: row.distance_m != null ? Number(row.distance_m) : null,
    distanceKm: row.distance_km != null ? Number(row.distance_km) : null,
    status: 'active',
    source: 'spatial-query',
    raw: row,
  }
}

export function mapSpatialQueryResponse(response = {}) {
  const rows = Array.isArray(response) ? response : response.results || response.data?.results || response.data || []
  return {
    totalFound: Number(response.total_found ?? response.total ?? rows.length ?? 0),
    queryInfo: response.query_info || null,
    results: Array.isArray(rows) ? rows.map(mapSpatialQueryResult) : [],
  }
}
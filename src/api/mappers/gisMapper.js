const rows = (value) => {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') {
    if (Array.isArray(value.results)) return value.results
    if (Array.isArray(value.data)) return value.data
    if (Array.isArray(value.records)) return value.records
    const values = Object.values(value)
    if (values.length === 1 && Array.isArray(values[0])) return values[0]
  }
  return []
}

export function mapGisCatalog(response = {}) {
  const categories = response.categories || {}
  return {
    totalLayers: Number(response.total_layers ?? 0),
    categories: Object.fromEntries(Object.entries(categories).map(([name, layers]) => [name, rows(layers).map(mapGisLayer)])),
    raw: response,
  }
}

export function mapGisLayer(dto = {}) {
  return { id: String(dto.id), name: dto.layer_name, displayName: dto.display_name || dto.layer_name, category: dto.category || '', geometryType: dto.geometry_type || '', featureCount: Number(dto.feature_count ?? 0), raw: dto }
}

export function mapGeoJson(response = {}) {
  return { type: response.type || 'FeatureCollection', layerName: response.layer_name, category: response.category, geometryType: response.geometry_type, featureCount: Number(response.feature_count ?? response.features?.length ?? 0), features: Array.isArray(response.features) ? response.features : [], raw: response }
}

export function mapSpatialFeature(dto = {}) {
  return { id: String(dto.id), catalogEntryId: String(dto.catalog_entry ?? dto.catalog_entry_id ?? ''), featureId: dto.feature_id || '', name: dto.name || '', properties: dto.properties || {}, geometry: dto.geom_geojson || dto.geometry || null, raw: dto }
}

export const mapSpatialFeatureList = (response) => rows(response).map(mapSpatialFeature)

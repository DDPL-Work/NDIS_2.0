// Property Bounds Utility — Calculates geographic bounds from cadastral property geometries
// Source of truth: actual backend GeoJSON geometries from /api/gis/layers/data_resi/

import L from 'leaflet'

/**
 * Extracts all valid coordinates from a GeoJSON feature's geometry
 * Handles Polygon, MultiPolygon, Point, LineString, MultiLineString
 * Returns array of [lng, lat] coordinate pairs
 */
export function extractCoordinatesFromGeometry(geometry) {
  if (!geometry || !geometry.coordinates) return []
  
  const coords = []
  const { type, coordinates } = geometry

  try {
    switch (type) {
      case 'Point':
        coords.push(coordinates)
        break
      case 'MultiPoint':
        coordinates.forEach(c => coords.push(c))
        break
      case 'LineString':
        coordinates.forEach(c => coords.push(c))
        break
      case 'MultiLineString':
        coordinates.forEach(line => line.forEach(c => coords.push(c)))
        break
      case 'Polygon':
        // Use exterior ring (first ring) for bounds
        coordinates[0]?.forEach(c => coords.push(c))
        break
      case 'MultiPolygon':
        coordinates.forEach(poly => poly[0]?.forEach(c => coords.push(c)))
        break
      default:
        console.warn('[PropertyBounds] Unsupported geometry type:', type)
    }
  } catch (err) {
    console.warn('[PropertyBounds] Failed to extract coordinates:', err)
  }

  return coords
}

/**
 * Calculates geographic bounds from an array of cadastral features
 * @param {Array} features - Array of GeoJSON features with geometry
 * @returns {L.LatLngBounds|null} Leaflet LatLngBounds or null if no valid geometries
 */
export function calculatePropertyBounds(features) {
  if (!features || !features.length) return null

  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity
  let validFeatureCount = 0

  for (const feature of features) {
    if (!feature?.geometry) continue

    const coords = extractCoordinatesFromGeometry(feature.geometry)
    if (!coords.length) continue

    for (const [lng, lat] of coords) {
      // Validate coordinate values
      if (typeof lat !== 'number' || typeof lng !== 'number') continue
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue

      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
    }

    if (minLat !== Infinity) validFeatureCount++
  }

  if (validFeatureCount === 0) {
    console.warn('[PropertyBounds] No valid geometries found in features')
    return null
  }

  // Create Leaflet bounds: [[minLat, minLng], [maxLat, maxLng]]
  const bounds = L.latLngBounds(
    [minLat, minLng],
    [maxLat, maxLng]
  )

  console.debug('[PropertyBounds] Calculated bounds from features:', {
    totalFeatures: features.length,
    validFeatures: validFeatureCount,
    bounds: {
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    }
  })

  return bounds
}

/**
 * Calculates bounds for a single feature
 * @param {Object} feature - GeoJSON feature
 * @returns {L.LatLngBounds|null}
 */
export function calculateFeatureBounds(feature) {
  return calculatePropertyBounds([feature])
}

/**
 * Calculates bounds from an array of normalized property objects
 * Used when working with normalized property data instead of raw GeoJSON
 * @param {Array} properties - Array of normalized property objects with latitude/longitude
 * @returns {L.LatLngBounds|null}
 */
export function calculateBoundsFromProperties(properties) {
  if (!properties || !properties.length) return null

  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity
  let validCount = 0

  for (const prop of properties) {
    const lat = prop.latitude || prop.latitude
    const lng = prop.longitude || prop.longitude

    if (typeof lat !== 'number' || typeof lng !== 'number') continue
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue

    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    validCount++
  }

  if (validCount === 0) return null

  return L.latLngBounds(
    [minLat, minLng],
    [maxLat, maxLng]
  )
}

export default {
  calculatePropertyBounds,
  calculateFeatureBounds,
  calculateBoundsFromProperties,
  extractCoordinatesFromGeometry,
}
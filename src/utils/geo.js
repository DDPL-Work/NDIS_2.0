// Lightweight geo helpers for the mock layer. In production these calculations
// live server-side in PostGIS (ST_Distance / ST_DWithin, LLD Vol 1 §10.2) —
// here they only need to be good enough to drive believable client-side demo data.

const EARTH_RADIUS_M = 6371000

export function toRad(deg) {
  return (deg * Math.PI) / 180
}

// Haversine distance in meters
export function distanceMeters([lng1, lat1], [lng2, lat2]) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

export function jitterPoint(rng, [lng, lat], radiusDeg) {
  const angle = rng() * Math.PI * 2
  const r = rng() * radiusDeg
  return [Number((lng + Math.cos(angle) * r).toFixed(6)), Number((lat + Math.sin(angle) * r).toFixed(6))]
}

export function formatCoord([lng, lat]) {
  return `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`
}

export function boundsFromPoints(points) {
  const lngs = points.map((p) => p[0])
  const lats = points.map((p) => p[1])
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}

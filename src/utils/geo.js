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

// Deterministic geometry-derived route destinations for GIS line/polygon
// features (no spatial library in the bundle — these are small, pure, and
// district-scale accurate).  All coordinates are [lng, lat] app convention.

export function polylineLengthMeters(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return 0
  let total = 0
  for (let i = 0; i < coords.length - 1; i++) total += distanceMeters(coords[i], coords[i + 1])
  return total
}

// Midpoint by cumulative Haversine distance — never the first coordinate.
export function midpointAlongLine(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return null
  const total = polylineLengthMeters(coords)
  if (!(total > 0)) return null
  const half = total / 2
  let walked = 0
  for (let i = 0; i < coords.length - 1; i++) {
    const segment = distanceMeters(coords[i], coords[i + 1])
    if (walked + segment >= half) {
      const t = segment > 0 ? (half - walked) / segment : 0
      return [
        Number((coords[i][0] + t * (coords[i + 1][0] - coords[i][0])).toFixed(6)),
        Number((coords[i][1] + t * (coords[i + 1][1] - coords[i][1])).toFixed(6)),
      ]
    }
    walked += segment
  }
  return coords[coords.length - 1].slice()
}

// Closest point on a polyline to a reference position ([lng, lat] both args).
export function nearestPointOnLine(coords, [refLng, refLat]) {
  if (!Array.isArray(coords) || coords.length < 2) return null
  let best = null
  let bestDistance = Infinity
  for (let i = 0; i < coords.length - 1; i++) {
    const [ax, ay] = coords[i]
    const [bx, by] = coords[i + 1]
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy
    let t = len2 > 0 ? ((refLng - ax) * dx + (refLat - ay) * dy) / len2 : 0
    t = Math.max(0, Math.min(1, t))
    const projected = [ax + t * dx, ay + t * dy]
    const d = distanceMeters(projected, [refLng, refLat])
    if (d < bestDistance) {
      bestDistance = d
      best = [Number(projected[0].toFixed(6)), Number(projected[1].toFixed(6))]
    }
  }
  return best ? { position: best, distanceM: bestDistance } : null
}

// Ray-casting point-in-ring test (ring = [lng, lat][]).
export function pointInRing([lng, lat], ring) {
  if (!Array.isArray(ring) || ring.length < 3) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// Deterministic interior point for a polygon (rings[0] = outer, rest = holes).
// For every outer vertex a horizontal ray is cast to the right; the midpoint
// between the vertex and the nearest right-side edge intersection is inside the
// outer ring.  The first candidate not swallowed by a hole wins — no centroid
// that could land outside a concave shape, no randomness.
export function pointOnSurface(rings) {
  if (!Array.isArray(rings) || !Array.isArray(rings[0]) || rings[0].length < 3) return null
  const outer = rings[0]
  const holes = rings.slice(1)
  const fallback = []
  for (const vertex of outer) {
    const [px, py] = vertex
    let nearestX = Infinity
    for (let i = 0; i < outer.length - 1; i++) {
      const [ax, ay] = outer[i]
      const [bx, by] = outer[i + 1]
      if ((ay > py) === (by > py)) continue
      const x = ax + ((py - ay) * (bx - ax)) / (by - ay)
      if (x > px && x < nearestX) nearestX = x
    }
    if (!Number.isFinite(nearestX)) continue
    const candidate = [Number(((px + nearestX) / 2).toFixed(6)), Number(py.toFixed(6))]
    fallback.push(candidate)
    if (!holes.some((hole) => pointInRing(candidate, hole))) return candidate
  }
  return fallback[0] || null
}

// Nearest boundary position of a polygon ring to a reference position.
export function nearestPointOnRing(ring, origin) {
  if (!Array.isArray(ring) || ring.length < 3) return null
  return nearestPointOnLine(ring, origin)?.position ?? null
}

// Shared device-geolocation helper ({ lng, lat } in [lng, lat] app convention).
// Resolves null when unsupported, denied, or timed out — callers decide the UX.
export function getDevicePosition() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  })
}

import { apiRequest } from './httpClient'
import { mapSpatialQueryResponse } from '../api/mappers/spatialQueryMapper'

// Smart Natural Language & Excel Spatial Query Engine — backend_guide2.0.md §11.1.
//   GET /api/spatial-query/?q=...&lat=..&lng=..&radius=..&limit=..
// The backend resolves the free-text query through its preset/spatial index;
// the frontend never parses or filters results locally.  Identical searches
// (same query + same center + same radius + same limit) are cached for 5 min.
const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map()

function sameQueryKey(query, { lat, lng, radius, limit }) {
  return [String(query).trim().toLowerCase(), Number(lat), Number(lng), Number(radius), Number(limit)].join('|')
}

export const spatialQueryService = {
  async search(query, { lat, lng, radius = 10, limit = 10 } = {}) {
    const q = String(query || '').trim()
    if (!q) return { totalFound: 0, results: [], queryInfo: null }

    const key = sameQueryKey(q, { lat, lng, radius, limit })
    const cached = cache.get(key)
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data

    const params = new URLSearchParams()
    params.set('q', q)
    if (lat != null && Number.isFinite(Number(lat))) params.set('lat', String(lat))
    if (lng != null && Number.isFinite(Number(lng))) params.set('lng', String(lng))
    params.set('radius', String(radius ?? 10))
    params.set('limit', String(limit ?? 10))

    const response = await apiRequest(`/spatial-query/?${params.toString()}`, { authenticated: false, timeout: 30000 })
    const data = mapSpatialQueryResponse(response || {})
    cache.set(key, { at: Date.now(), data })
    return data
  },

  clearCache() {
    cache.clear()
  },
}
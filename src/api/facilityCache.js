import { apiRequest } from '../services/httpClient'
import { mapFacilityList } from './mappers/facilityMapper'
import { createFacilityCache } from './facilityCacheCore'

// Shared in-memory cache for GET /api/facilities/ — the single choke point
// the whole frontend reads the ~43 MB production collection through.
//
// The project has no react-query/SWR (deliberately — the established pattern
// here is custom hooks + a repository layer), so the cache is a module-level
// singleton owned by the API layer:
//   - MISS    → download once, and also share the in-flight Promise, so two
//               components mounting at once trigger ONE request (dedupe).
//   - HIT     → repeated reads within the window need NO network call at
//               all; reopening the layer/department board never re-downloads.
//   - stale   → stale-while-revalidate: instant cached value + one
//               background refresh.
//   - errors  → never cached; the entry is released so the next call retries.
// The mapped result is cached too, so the per-row normalisation/gap scoring
// (facilityMapper) runs exactly once per cache entry instead of on every view.
// No localStorage — this payload stays in memory only, like all GIS state.
const courierLog = (action, key) => {
  if (import.meta.env.DEV) console.info(`[FacilityCache] ${action} ${key}`)
}

const queryString = (params = {}) => {
  const q = new URLSearchParams(
    Object.entries({
      search: params.query || params.search,
      district: params.districtId,
      department: params.departmentId,
      category: params.categoryId,
      catalog_entry: params.catalogEntry,
      page: params.page,
      limit: params.limit,
    })
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  )
  return q.toString() ? `?${q}` : ''
}

// The production collection (~8.3k rows, ~43 MB) exceeds the default 15s
// request timeout on typical connections; the download keeps the dedicated
// 120s window and is shared by every district/department consumer.
const defaultTransport = async (params) => {
  const response = await apiRequest(`/facilities/${queryString(params)}`, { authenticated: false, timeout: 120000 })
  return mapFacilityList(response, params)
}

export const cachedFacilities = createFacilityCache({ transport: defaultTransport, log: courierLog })
// Pure, testable core of the shared facilities cache. No network, no
// environment globals — the transport is injected (see facilityCache.js for
// the application wiring). Node-safe for verification harnesses.

// Within the freshness window the cached promise resolves with ZERO network
// traffic; beyond it the value is still returned instantly while a single
// background refresh replaces the entry.
export const FRESH_MS = 5 * 60 * 1000
export const RETAIN_MS = 30 * 60 * 1000

// Cache identity must span every parameter that changes the response, or two
// consumers would swap each other's payloads (district 24 vs 25, dept 7 vs 1).
export function facilityCacheKey(params = {}) {
  return [
    'facilities',
    params.districtId || 'all',
    params.departmentId || 'all',
    params.categoryId || 'all',
    params.catalogEntry || 'all',
    params.page || 'all',
    params.limit || 'all',
    String(params.query || params.search || '').trim() || 'all',
  ].join(':')
}

export function createFacilityCache({ transport, freshMs = FRESH_MS, retainMs = RETAIN_MS, log = () => {} }) {
  if (typeof transport !== 'function') throw new TypeError('createFacilityCache requires a transport(params) -> Promise')
  const store = new Map()

  const startRequest = (key, params) => {
    const promise = transport(params)
    // Release a failed in-flight entry so a later call retries; a rejected
    // promise is never handed to a subscriber twice as a cached value.
    promise.catch(() => { if (store.get(key)?.promise === promise) store.delete(key) })
    store.set(key, { promise, createdAt: Date.now() })
    return promise
  }

  // Mutation-aware eviction: facility writes drop only the entries that could
  // contain the touched rows (matching department/district, plus the unfiltered
  // collection), keeping every other department's cached payload intact so the
  // ~43 MB download is not re-triggered for unrelated sectors.
  const invalidate = ({ departmentId, districtId } = {}) => {
    let dropped = 0
    for (const key of [...store.keys()]) {
      const parts = key.split(':')
      const district = parts[1] || 'all'
      const department = parts[2] || 'all'
      if (departmentId && department !== 'all' && department !== String(departmentId)) continue
      if (districtId && district !== 'all' && district !== String(districtId)) continue
      store.delete(key)
      dropped += 1
    }
    if (dropped) { log('INVALIDATE', `${dropped} entry(ies)`) }
    return dropped
  }

  const read = (params = {}) => {
    const key = facilityCacheKey(params)
    const entry = store.get(key)
    if (!entry) { log('MISS', key); return startRequest(key, params) }

    const age = Date.now() - entry.createdAt
    if (age > retainMs) { log('EVICT', key); return startRequest(key, params) } // outside retention: hard miss
    if (age <= freshMs) { log('HIT', key); return entry.promise } // fresh: no network at all

    // Stale within retention: serve instantly while ONE background refresh
    // replaces the entry for the next callers.
    if (!entry.refreshing) {
      entry.refreshing = true
      log('REFRESH', key)
      startRequest(key, params)
    }
    log('HIT', key)
    return entry.promise
  }
  read.invalidate = invalidate
  return read
}
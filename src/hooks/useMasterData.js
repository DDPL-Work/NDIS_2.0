// Centralized master-data hook with module-level deduplication and caching.
// Every consumer shares one in-flight request per resource — no duplicate
// network calls. Stable data (departments, districts, roles) is cached for
// the session lifetime; dependent data (blocks, officers) is fetched on demand.

import { useEffect, useState, useRef } from 'react'
import { backendMasterApi } from '../api/masterApi'
import { backendDepartmentApi } from '../api/departmentApi'
import { AuthRepository } from '../services/auth/AuthRepository'
import { backendFacilityApi } from '../api/facilityApi'

// Module-level caches — survive across mounts, never go stale within a session
const cache = new Map()
const inflight = new Map()

function cachedFetch(key, fetcher, ttlMs = 30 * 60 * 1000) {
  if (cache.has(key)) {
    const entry = cache.get(key)
    if (Date.now() - entry.at < ttlMs) return Promise.resolve(entry.data)
  }
  if (inflight.has(key)) return inflight.get(key)

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, at: Date.now() })
      inflight.delete(key)
      return data
    })
    .catch((error) => {
      inflight.delete(key)
      throw error
    })

  inflight.set(key, promise)
  return promise
}

function invalidate(key) {
  cache.delete(key)
}

// ---------------------------------------------------------------------------
// Individual hooks — each wraps a single cached master-data collection
// ---------------------------------------------------------------------------

export function useDepartments() {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    let cancelled = false
    cachedFetch('departments', () => backendMasterApi.departments())
      .then((data) => { if (mounted.current && !cancelled) setState({ data, loading: false, error: null }) })
      .catch((error) => { if (mounted.current && !cancelled) setState({ data: null, loading: false, error }) })
    return () => { mounted.current = false; cancelled = true }
  }, [])

  return { ...state, refetch: () => { invalidate('departments'); setState((s) => ({ ...s, loading: true })); cachedFetch('departments', () => backendMasterApi.departments()).then((data) => { if (mounted.current) setState({ data, loading: false, error: null }) }).catch((error) => { if (mounted.current) setState({ data: null, loading: false, error }) }) } }
}

export function useDistricts() {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    let cancelled = false
    cachedFetch('districts', () => backendMasterApi.districts())
      .then((data) => { if (mounted.current && !cancelled) setState({ data, loading: false, error: null }) })
      .catch((error) => { if (mounted.current && !cancelled) setState({ data: null, loading: false, error }) })
    return () => { mounted.current = false; cancelled = true }
  }, [])

  return { ...state, refetch: () => { invalidate('districts'); setState((s) => ({ ...s, loading: true })); cachedFetch('districts', () => backendMasterApi.districts()).then((data) => { if (mounted.current) setState({ data, loading: false, error: null }) }).catch((error) => { if (mounted.current) setState({ data: null, loading: false, error }) }) } }
}

export function useBlocks(districtId) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    if (!districtId) { setState({ data: [], loading: false, error: null }); return }
    mounted.current = true
    let cancelled = false
    const key = `blocks:${districtId}`
    cachedFetch(key, () => backendMasterApi.blocks({ district: districtId }))
      .then((data) => { if (mounted.current && !cancelled) setState({ data, loading: false, error: null }) })
      .catch((error) => { if (mounted.current && !cancelled) setState({ data: null, loading: false, error }) })
    return () => { mounted.current = false; cancelled = true }
  }, [districtId])

  return state
}

export function useVillageWards(blockId) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    if (!blockId) { setState({ data: [], loading: false, error: null }); return }
    mounted.current = true
    let cancelled = false
    const key = `villageWards:${blockId}`
    cachedFetch(key, () => backendMasterApi.villageWards({ block: blockId }))
      .then((data) => { if (mounted.current && !cancelled) setState({ data, loading: false, error: null }) })
      .catch((error) => { if (mounted.current && !cancelled) setState({ data: null, loading: false, error }) })
    return () => { mounted.current = false; cancelled = true }
  }, [blockId])

  return state
}

export function useRoles() {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    let cancelled = false
    cachedFetch('roles', () => AuthRepository.listRoles())
      .then((data) => { if (mounted.current && !cancelled) setState({ data, loading: false, error: null }) })
      .catch(() => {
        // Roles endpoint may not be deployed — fall back to empty
        if (mounted.current && !cancelled) setState({ data: [], loading: false, error: null })
      })
    return () => { mounted.current = false; cancelled = true }
  }, [])

  return state
}

export function useDepartmentOfficers(departmentId) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    if (!departmentId) { setState({ data: [], loading: false, error: null }); return }
    mounted.current = true
    let cancelled = false
    const key = `deptOfficers:${departmentId}`
    cachedFetch(key, () => backendDepartmentApi.users(departmentId))
      .then((data) => { if (mounted.current && !cancelled) setState({ data, loading: false, error: null }) })
      .catch((error) => { if (mounted.current && !cancelled) setState({ data: null, loading: false, error }) })
    return () => { mounted.current = false; cancelled = true }
  }, [departmentId])

  return state
}

export function useAssetCategories(departmentId) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    let cancelled = false
    const key = `assetCategories:${departmentId || 'all'}`
    cachedFetch(key, () => backendFacilityApi.categories(departmentId))
      .then((data) => { if (mounted.current && !cancelled) setState({ data, loading: false, error: null }) })
      .catch((error) => { if (mounted.current && !cancelled) setState({ data: null, loading: false, error }) })
    return () => { mounted.current = false; cancelled = true }
  }, [departmentId])

  return state
}

export function useComplaintCategories() {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    let cancelled = false
    cachedFetch('complaintCategories', () => backendMasterApi.complaintCategories())
      .then((data) => { if (mounted.current && !cancelled) setState({ data, loading: false, error: null }) })
      .catch((error) => { if (mounted.current && !cancelled) setState({ data: null, loading: false, error }) })
    return () => { mounted.current = false; cancelled = true }
  }, [])

  return state
}

export { invalidate as invalidateMasterData }

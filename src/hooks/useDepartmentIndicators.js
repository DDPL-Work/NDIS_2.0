import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchDepartmentIndicators } from '../api/indicatorApi'

// Hook that fetches backend indicator data for a department.
// Each department ONLY calls its own API — no cross-department fallback.
// Returns { status, groups, source, updatedAt, loading, error, refetch }.
//
// status: 'idle' | 'loading' | 'loaded' | 'empty' | 'error' | 'not-configured'
// groups: Array of { key, label, endpoint, status, rows, count, error? }
//
// Usage:
//   const indicators = useDepartmentIndicators('health')
//   if (indicators.status === 'loaded') { ... }
//   indicators.groups.forEach(g => g.rows) // backend data per indicator group
export function useDepartmentIndicators(departmentId, params = {}) {
  const [state, setState] = useState({
    status: 'idle',
    groups: [],
    source: null,
    updatedAt: null,
    loading: false,
    error: null,
  })

  const paramsRef = useRef(params)
  paramsRef.current = params

  const fetch = useCallback(async () => {
    if (!departmentId) {
      setState({ status: 'not-configured', groups: [], source: null, updatedAt: null, loading: false, error: null })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const result = await fetchDepartmentIndicators(departmentId, paramsRef.current)
      setState({ ...result, loading: false, error: null })
    } catch (error) {
      setState((s) => ({
        ...s,
        status: 'error',
        loading: false,
        error: error?.message || 'Failed to fetch department indicators',
      }))
    }
  }, [departmentId])

  useEffect(() => { fetch() }, [fetch])

  return { ...state, refetch: fetch }
}

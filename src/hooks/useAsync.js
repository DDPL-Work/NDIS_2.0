import { useEffect, useRef, useState, useCallback } from 'react'

// Thin fetch-on-deps hook so pages don't hand-roll loading/error state for
// every call into services/api.js. `deps` follows the same rules as useEffect.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => mounted.current && setState({ data, loading: false, error: null }))
      .catch((error) => mounted.current && setState({ data: null, loading: false, error }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, refetch: run }
}

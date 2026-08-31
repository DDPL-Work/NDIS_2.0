import { useEffect, useRef, useState, useCallback } from 'react'

// Thin fetch-on-deps hook so pages don't hand-roll loading/error state for
// every call into services/api.js. `deps` follows the same rules as useEffect.
// Supports AbortSignal for request cancellation on unmount or deps change.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const mounted = useRef(true)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const run = useCallback((options = {}) => {
    const { signal } = options
    const controller = new AbortController()
    abortControllerRef.current = controller

    // If external signal provided, link it
    if (signal) {
      if (signal.aborted) {
        controller.abort()
      } else {
        const handler = () => controller.abort()
        signal.addEventListener('abort', handler)
        controller.signal.addEventListener('abort', () => signal.removeEventListener('abort', handler), { once: true })
      }
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    const promise = fn({ signal: controller.signal })
      .then((data) => {
        if (mounted.current) setState({ data, loading: false, error: null })
        return data
      })
      .catch((error) => {
        if (mounted.current) {
          // Don't set error state for aborted requests
          if (error?.isAborted || error?.name === 'AbortError') {
            return
          }
          setState({ data: null, loading: false, error })
        }
        throw error
      })
    return promise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, refetch: run, abort: () => abortControllerRef.current?.abort() }
}

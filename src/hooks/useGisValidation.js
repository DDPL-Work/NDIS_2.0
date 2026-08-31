import { useCallback, useRef, useState } from 'react'
import { backendGisApi } from '../api/gisApi'
import { DISTRICT_VALIDATION_STATES, VERIFICATION_STATES } from '../gis/validation/geoIntegrity'

export function useGisValidation() {
  const [boundaryStatus, setBoundaryStatus] = useState(DISTRICT_VALIDATION_STATES.PENDING)
  const [boundaryLoading, setBoundaryLoading] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [duplicateFeatures, setDuplicateFeatures] = useState([])
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const [geotagResult, setGeotagResult] = useState(null)
  const [geotagLoading, setGeotagLoading] = useState(false)
  const abortRef = useRef(null)

  const validateBoundary = useCallback(async ({ latitude, longitude } = {}) => {
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) return null
    setBoundaryLoading(true)
    setBoundaryStatus(DISTRICT_VALIDATION_STATES.PENDING)
    try {
      const result = await backendGisApi.validateCoordinate({ latitude, longitude })
      const inside = Boolean(result.inside_district)
      setBoundaryStatus(inside ? DISTRICT_VALIDATION_STATES.VALID : DISTRICT_VALIDATION_STATES.OUTSIDE_DISTRICT)
      return result
    } catch {
      setBoundaryStatus(DISTRICT_VALIDATION_STATES.VALIDATION_UNAVAILABLE)
      return null
    } finally {
      setBoundaryLoading(false)
    }
  }, [])

  const checkDuplicate = useCallback(async ({ latitude, longitude } = {}) => {
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      setDuplicateWarning(false)
      setDuplicateFeatures([])
      return null
    }
    if (Number(latitude) === 0 && Number(longitude) === 0) {
      setDuplicateWarning(false)
      setDuplicateFeatures([])
      return null
    }
    setDuplicateLoading(true)
    try {
      const result = await backendGisApi.checkDuplicate({ latitude, longitude })
      setDuplicateWarning(Boolean(result.duplicate_warning))
      setDuplicateFeatures(Array.isArray(result.nearby_features) ? result.nearby_features : [])
      return result
    } catch {
      setDuplicateWarning(false)
      setDuplicateFeatures([])
      return null
    } finally {
      setDuplicateLoading(false)
    }
  }, [])

  const verifyGeotag = useCallback(async ({ latitude, longitude } = {}) => {
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      setGeotagResult(null)
      return null
    }
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setGeotagLoading(true)
    try {
      const result = await backendGisApi.verifyGeotag({ latitude, longitude })
      if (!controller.signal.aborted) setGeotagResult(result)
      return result
    } catch {
      if (!controller.signal.aborted) setGeotagResult(null)
      return null
    } finally {
      if (!controller.signal.aborted) setGeotagLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setBoundaryStatus(DISTRICT_VALIDATION_STATES.PENDING)
    setDuplicateWarning(false)
    setDuplicateFeatures([])
    setGeotagResult(null)
  }, [])

  const geotagState = geotagResult
    ? geotagResult.status || (geotagResult.verified ? VERIFICATION_STATES.VERIFIED : VERIFICATION_STATES.REJECTED)
    : VERIFICATION_STATES.NOT_VERIFIED

  return {
    validateBoundary,
    boundaryStatus,
    boundaryLoading,
    checkDuplicate,
    duplicateWarning,
    duplicateFeatures,
    duplicateLoading,
    verifyGeotag,
    geotagResult,
    geotagState,
    geotagLoading,
    reset,
  }
}

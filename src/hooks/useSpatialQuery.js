import { useState, useCallback, useMemo } from 'react'
import { spatialQueryService } from '../services/spatialQueryService'
import { useUiStore } from '../app/store/uiStore'
import { DISTRICTS } from '../config/constants'

const DEFAULT_RADIUS = 10
const DEFAULT_LIMIT = 10

// District centre fallback ([lng, lat]) when the device location is not
// available or the geolocation prompt is denied.
function districtCenterFor(user) {
  const district = DISTRICTS.find((d) => d.id === user?.districtId) || DISTRICTS[0]
  return district?.center || [85.4434, 25.1372]
}

function getDevicePosition() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    )
  })
}

// One shared spatial-query hook for every GIS portal.  Calling runSearch is
// the ONLY way results arrive; typing never triggers a request (no debounce).
export function useSpatialQuery({ user = null } = {}) {
  const pushToast = useUiStore((s) => s.pushToast)
  const [results, setResults] = useState([])
  const [totalFound, setTotalFound] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const districtCenter = useMemo(() => districtCenterFor(user), [user])

  const runSearch = useCallback(async (query, { lat, lng, radius = DEFAULT_RADIUS, limit = DEFAULT_LIMIT } = {}) => {
    const q = String(query || '').trim()
    if (!q) {
      setResults([])
      setTotalFound(0)
      setError(null)
      return { results: [], totalFound: 0 }
    }
    let centerLng = lng
    let centerLat = lat
    if (centerLat == null || centerLng == null) {
      const device = await getDevicePosition()
      if (device) {
        centerLat = device.lat
        centerLng = device.lng
      } else {
        centerLng = districtCenter[0]
        centerLat = districtCenter[1]
      }
    }
    setLoading(true)
    setError(null)
    try {
      const data = await spatialQueryService.search(q, { lat: centerLat, lng: centerLng, radius, limit })
      setResults(data.results || [])
      setTotalFound(data.totalFound || 0)
      return data
    } catch (err) {
      setError(err)
      setResults([])
      setTotalFound(0)
      pushToast('Unable to perform spatial search.', 'error')
      return { results: [], totalFound: 0, error: err }
    } finally {
      setLoading(false)
    }
  }, [districtCenter, pushToast])

  const clear = useCallback(() => {
    setResults([])
    setTotalFound(0)
    setError(null)
  }, [])

  return { results, totalFound, loading, error, runSearch, clear }
}
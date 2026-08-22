import { useCallback, useEffect, useRef, useState } from 'react'
import { GISRepository } from '../gis/repositories/GISRepository'
import { createCatalogLayer } from '../services/LeafletLayerService'

// REF.html toggleLayer() + loadedGeoJSONLayers cache, expressed as React state.
// A layer is fetched from GET /api/gis/layers/{layer_name}/ exactly once and
// cached as a Leaflet layer; toggling only adds/removes it from the map.
// Catalog layers are display-only: boundaries and other GIS features support
// hover/identify but NEVER become routing destinations (routing targets must
// be explicitly selected facilities with point coordinates).
export const DEFAULT_LAYERS = ['District_boundary', 'Block_boundary']

export function useLeafletLayers(map, { defaults = DEFAULT_LAYERS } = {}) {
  const cache = useRef(new Map())          // layer name → Leaflet layer instance
  const [visible, setVisible] = useState({})
  const [loading, setLoading] = useState({})
  const [error, setError] = useState(null)
  const visibleRef = useRef(visible)
  const toggleRef = useRef()
  const defaultsRef = useRef(defaults)

  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  const toggle = useCallback(async (layer, forceVisible) => {
    const name = typeof layer === 'string' ? layer : layer?.name
    if (!name || !map) return
    const shouldShow = forceVisible ?? !visibleRef.current[name]

    if (!shouldShow) {
      const cached = cache.current.get(name)
      if (cached && map.hasLayer(cached)) map.removeLayer(cached)
      setVisible((current) => current[name] === false ? current : { ...current, [name]: false })
      return
    }

    if (cache.current.has(name)) {
      const cached = cache.current.get(name)
      if (!map.hasLayer(cached)) map.addLayer(cached)
      setVisible((current) => current[name] === true ? current : { ...current, [name]: true })
      return
    }

    setLoading((current) => ({ ...current, [name]: true }))
    setError(null)
    try {
      const geojson = await GISRepository.layer(name)
      const leafletLayer = createCatalogLayer(geojson, {
        layerName: geojson.layerName || name,
        category: geojson.category,
      })
      cache.current.set(name, leafletLayer)
      map.addLayer(leafletLayer)
      setVisible((current) => current[name] === true ? current : { ...current, [name]: true })
    } catch (requestError) {
      setError(requestError)
      setVisible((current) => current[name] === false ? current : { ...current, [name]: false })
    } finally {
      setLoading((current) => ({ ...current, [name]: false }))
    }
  }, [map])

  // Keep refs in sync without triggering effects. This must come after
  // `toggle` is initialized; referring to a const callback before its
  // declaration throws during render.
  useEffect(() => { toggleRef.current = toggle }, [toggle])
  useEffect(() => { defaultsRef.current = defaults }, [defaults])

  const clearAll = useCallback(() => {
    Object.keys(visibleRef.current).forEach((name) => {
      if (visibleRef.current[name]) toggleRef.current(name, false)
    })
  }, [])

  const showDefaults = useCallback(() => {
    defaultsRef.current.forEach((name) => toggleRef.current(name, true))
  }, [])

  // District + Block boundaries are ON by default: once the map is ready they
  // are fetched and added immediately (counter always equals visible layers).
  // Uses refs to avoid dependency on toggle/defaults which would cause
  // infinite update loops when setVisible triggers re-renders.
  useEffect(() => {
    if (!map) return
    defaultsRef.current.forEach((name) => toggleRef.current(name, true))
  }, [map])

  const activeCount = Object.values(visible).filter(Boolean).length

  return { visible, loading, error, toggle, clearAll, showDefaults, activeCount, cachedCount: cache.current.size, defaults }
}

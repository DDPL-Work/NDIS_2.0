import { useCallback, useEffect, useRef, useState } from 'react'
import { GISRepository } from '../gis/repositories/GISRepository'

// Cache server FeatureCollections by layer name; toggling a loaded layer only
// changes visibility and never repeats GET /api/gis/layers/{layer_name}/.
export function useVectorLayers() {
  const cache = useRef(new Map())
  const [visible, setVisible] = useState({})
  const [loading, setLoading] = useState({})
  const [error, setError] = useState(null)
  const toggle = useCallback(async (layer, forceVisible) => {
    const name = typeof layer === 'string' ? layer : layer.name
    const shouldShow = forceVisible ?? !visible[name]
    if (!shouldShow) { setVisible((current) => ({ ...current, [name]: false })); return }
    if (cache.current.has(name)) { setVisible((current) => ({ ...current, [name]: true })); return }
    setLoading((current) => ({ ...current, [name]: true })); setError(null)
    try { cache.current.set(name, await GISRepository.layer(name)); setVisible((current) => ({ ...current, [name]: true })) }
    catch (requestError) { setError(requestError) }
    finally { setLoading((current) => ({ ...current, [name]: false })) }
  }, [visible])
  // District + Block boundaries are ON by default (loaded exactly once).
  useEffect(() => { if (!cache.current.size) { toggle('District_boundary', true); toggle('Block_boundary', true) } }, [toggle])
  const layers = [...cache.current.entries()].filter(([name]) => visible[name]).map(([, layer]) => layer)
  return { layers, visible, loading, error, toggle, activeCount: layers.length, cachedCount: cache.current.size }
}

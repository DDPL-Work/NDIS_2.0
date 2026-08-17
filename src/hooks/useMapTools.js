// Map tool state machine — controls which GIS interaction mode is active.
// Used by MapView / MapToolbar across all three portals.
// Tools follow the Vol 1 §10.3 GIS interaction requirements.
import { useState, useCallback, useRef } from 'react'
import { distanceMeters } from '../utils/geo'

export const MAP_TOOLS = {
  NONE: 'none',
  RADIUS: 'radius',      // Draw deficit radius circle (3km default, Vol 3 §16)
  MEASURE: 'measure',    // Google-Maps-style: click to add vertices, double-click finishes
  CLUSTER: 'cluster',    // Toggle facility point clustering
}

export const BASEMAPS = [
  { id: 'osm', label: 'OSM', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { id: 'dark', label: 'Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { id: 'bright', label: 'Bright', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  {
    id: 'satellite',
    label: 'Satellite',
    // ESRI World Imagery raster tiles (no API key needed)
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
]

export function attributionFor(url = '') {
  if (url.includes('openstreetmap')) return '© OpenStreetMap contributors'
  if (url.includes('arcgisonline')) return 'Tiles © Esri — Source: Esri, Maxar, GeoEye, Earthstar Geographics'
  if (url.includes('cartocdn')) return '© CARTO'
  return ''
}

// Total Haversine length of a multi-point measure path in km ([lng, lat] pairs).
export function measurePathKm(points) {
  if (!Array.isArray(points) || points.length < 2) return null
  let totalM = 0
  for (let i = 0; i < points.length - 1; i++) totalM += distanceMeters(points[i], points[i + 1])
  return Number((totalM / 1000).toFixed(3))
}

export function useMapTools() {
  const [activeTool, setActiveTool] = useState(MAP_TOOLS.NONE)
  const [radiusCenter, setRadiusCenter] = useState(null)   // [lng, lat]
  const [radiusKm, setRadiusKm] = useState(3)              // configurable (Vol 3 §16)
  const [measurePoints, setMeasurePoints] = useState([])   // [[lng,lat], ...] — N vertices
  const [measureDistKm, setMeasureDistKm] = useState(null)
  const [clusterEnabled, setClusterEnabled] = useState(false)
  const [basemapId, setBasemapId] = useState('osm')

  // Mirror of measurePoints for use inside callbacks that must read the
  // current path synchronously (double-click finish, remove-last-point).
  const measurePointsRef = useRef(measurePoints)
  measurePointsRef.current = measurePoints

  // Double-click finish detection (Google Maps behaviour): a second map click
  // within 400 ms ends the measurement without adding another vertex.
  const lastMapClickAt = useRef(0)

  // Activate a tool; toggling same tool deactivates
  const selectTool = useCallback((tool) => {
    lastMapClickAt.current = 0
    setActiveTool((cur) => {
      if (cur === tool) {
        // deactivate
        if (tool === MAP_TOOLS.RADIUS) setRadiusCenter(null)
        if (tool === MAP_TOOLS.MEASURE) { setMeasurePoints([]); setMeasureDistKm(null) }
        return MAP_TOOLS.NONE
      }
      // switching tool — clear previous
      setRadiusCenter(null)
      setMeasurePoints([])
      setMeasureDistKm(null)
      return tool
    })
  }, [])

  // Handle a map click depending on current tool
  const handleMapClick = useCallback(
    (lngLat) => {
      if (activeTool === MAP_TOOLS.RADIUS) {
        setRadiusCenter([lngLat.lng, lngLat.lat])
      } else if (activeTool === MAP_TOOLS.MEASURE) {
        const now = Date.now()
        const isDoubleClick = now - lastMapClickAt.current < 400
        lastMapClickAt.current = now
        if (isDoubleClick) {
          // Finished — keep the path and leave the tool (the line stays).
          setMeasureDistKm(measurePathKm(measurePointsRef.current))
          setActiveTool(MAP_TOOLS.NONE)
          return
        }
        setMeasurePoints((pts) => {
          const next = [...pts, [lngLat.lng, lngLat.lat]]
          setMeasureDistKm(measurePathKm(next))
          return next
        })
      }
    },
    [activeTool]
  )

  // Google Maps "Remove point": pops the last vertex and keeps measuring.
  const removeLastMeasurePoint = useCallback(() => {
    const pts = measurePointsRef.current
    if (!pts.length) return
    const next = pts.slice(0, -1)
    setMeasurePoints(next)
    setMeasureDistKm(measurePathKm(next))
    setActiveTool((cur) => (next.length === 0 ? MAP_TOOLS.NONE : cur))
  }, [])

  // Google Maps "Done": exit the tool but keep the drawn path visible.
  const finishMeasure = useCallback(() => {
    setMeasureDistKm(measurePathKm(measurePointsRef.current))
    setActiveTool(MAP_TOOLS.NONE)
  }, [])

  const toggleCluster = useCallback(() => {
    setClusterEnabled((v) => !v)
    setActiveTool(MAP_TOOLS.NONE)
  }, [])

  const clearRadius = useCallback(() => {
    setRadiusCenter(null)
    if (activeTool === MAP_TOOLS.RADIUS) setActiveTool(MAP_TOOLS.NONE)
  }, [activeTool])

  const clearMeasure = useCallback(() => {
    setMeasurePoints([])
    setMeasureDistKm(null)
    lastMapClickAt.current = 0
    if (activeTool === MAP_TOOLS.MEASURE) setActiveTool(MAP_TOOLS.NONE)
  }, [activeTool])

  const currentBasemap = BASEMAPS.find((b) => b.id === basemapId) || BASEMAPS[0]

  return {
    activeTool, selectTool,
    radiusCenter, radiusKm, setRadiusKm, clearRadius,
    measurePoints, measureDistKm, removeLastMeasurePoint, finishMeasure, clearMeasure,
    clusterEnabled, toggleCluster,
    basemapId, setBasemapId, currentBasemap,
    handleMapClick,
  }
}

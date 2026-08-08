// Map tool state machine — controls which GIS interaction mode is active.
// Used by MapView / MapToolbar across all three portals.
// Tools follow the Vol 1 §10.3 GIS interaction requirements.
import { useState, useCallback } from 'react'

export const MAP_TOOLS = {
  NONE: 'none',
  RADIUS: 'radius',      // Draw deficit radius circle (3km default, Vol 3 §16)
  MEASURE: 'measure',    // Click two points → distance in km
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

export function useMapTools() {
  const [activeTool, setActiveTool] = useState(MAP_TOOLS.NONE)
  const [radiusCenter, setRadiusCenter] = useState(null)   // [lng, lat]
  const [radiusKm, setRadiusKm] = useState(3)              // configurable (Vol 3 §16)
  const [measurePoints, setMeasurePoints] = useState([])   // [[lng,lat], [lng,lat]]
  const [measureDistKm, setMeasureDistKm] = useState(null)
  const [clusterEnabled, setClusterEnabled] = useState(false)
  const [basemapId, setBasemapId] = useState('osm')

  // Activate a tool; toggling same tool deactivates
  const selectTool = useCallback((tool) => {
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
        setMeasurePoints((pts) => {
          if (pts.length >= 2) {
            // reset — start new measurement
            setMeasureDistKm(null)
            return [[lngLat.lng, lngLat.lat]]
          }
          const next = [...pts, [lngLat.lng, lngLat.lat]]
          if (next.length === 2) {
            setMeasureDistKm(haversineKm(next[0], next[1]))
          }
          return next
        })
      }
    },
    [activeTool]
  )

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
    if (activeTool === MAP_TOOLS.MEASURE) setActiveTool(MAP_TOOLS.NONE)
  }, [activeTool])

  const currentBasemap = BASEMAPS.find((b) => b.id === basemapId) || BASEMAPS[0]

  return {
    activeTool, selectTool,
    radiusCenter, radiusKm, setRadiusKm, clearRadius,
    measurePoints, measureDistKm, clearMeasure,
    clusterEnabled, toggleCluster,
    basemapId, setBasemapId, currentBasemap,
    handleMapClick,
  }
}

// Haversine great-circle distance in km
function haversineKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLng = deg2rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) ** 2
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2))
}

function deg2rad(d) { return (d * Math.PI) / 180 }

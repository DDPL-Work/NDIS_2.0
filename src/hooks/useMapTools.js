// Map tool state machine — controls which GIS interaction mode is active.
// Used by MapView / MapToolbar across all three portals.
// Tools follow the Vol 1 §10.3 GIS interaction requirements.
import { useState, useCallback, useRef } from 'react'
import { distanceMeters } from '../utils/geo.js'
import { area as geoJsonArea } from '@turf/turf'

export const MAP_TOOLS = {
  NONE: 'none',
  RADIUS: 'radius',      // Draw deficit radius circle (3km default, Vol 3 §16)
  MEASURE: 'measure',    // Google-Maps-style: click to add vertices, double-click finishes
  MEASURE_AREA: 'measure-area',
  CLUSTER: 'cluster',    // Toggle facility point clustering
  PICK_POINT: 'pick-point', // Pick a reference point on the map
  QUERY: 'query',        // Spatial query tool
  SELECTION: 'selection',// Polygon/box property selection tool
}

export const MEASURE_STATES = {
  IDLE: 'idle',
  DRAWING: 'drawing',
  EDITING: 'editing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
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

export function measurePolygonAreaSqm(points) {
  if (!Array.isArray(points) || points.length < 3) return null
  try {
    const ring = [...points, points[0]]
    return geoJsonArea({ type: 'Polygon', coordinates: [ring] })
  } catch { return null }
}

// Find the closest segment index to a click point for vertex insertion
function findClosestSegment(points, clickPoint, maxDistanceKm = 0.05) {
  if (!points || points.length < 2) return null
  let closestIndex = null
  let closestDist = maxDistanceKm
  for (let i = 0; i < points.length - 1; i++) {
    const dist = distanceToSegment(clickPoint, points[i], points[i + 1])
    if (dist < closestDist) {
      closestDist = dist
      closestIndex = i
    }
  }
  return closestIndex
}

// Distance from point to line segment in km
function distanceToSegment(point, segStart, segEnd) {
  const x = point[0], y = point[1]
  const x1 = segStart[0], y1 = segStart[1]
  const x2 = segEnd[0], y2 = segEnd[1]
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return distanceMeters(point, segStart) / 1000
  let t = ((x - x1) * dx + (y - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  return distanceMeters(point, [projX, projY]) / 1000
}



export function useMapTools() {
  const [activeTool, setActiveTool] = useState(MAP_TOOLS.NONE)
  const [radiusCenter, setRadiusCenter] = useState(null)   // [lng, lat]
  const [radiusKm, setRadiusKm] = useState(3)              // configurable (Vol 3 §16)
  const [measurePoints, setMeasurePoints] = useState([])   // [[lng,lat], ...] — N vertices
  const [measureDistKm, setMeasureDistKm] = useState(null)
  const [measureAreaSqm, setMeasureAreaSqm] = useState(null)
  const [measureMode, setMeasureMode] = useState('distance')
  const [measureState, setMeasureState] = useState(MEASURE_STATES.IDLE)
  const [clusterEnabled, setClusterEnabled] = useState(false)
  const [basemapId, setBasemapId] = useState('osm')

  // Undo stack for measurement
  const undoStack = useRef([])
  const measurePointsRef = useRef(measurePoints)
  measurePointsRef.current = measurePoints

  // Double-click finish detection (Google Maps behaviour): a second map click
  // within 400 ms ends the measurement without adding another vertex.
  const lastMapClickAt = useRef(0)

  // Track dragging state
  const draggingVertex = useRef(null) // { index, originalPoints }
  const isDragging = useRef(false)

  // Push current state to undo stack
  const pushUndo = useCallback((points) => {
    undoStack.current.push([...points])
    // Limit stack size
    if (undoStack.current.length > 50) undoStack.current.shift()
  }, [])

  // Activate a tool; toggling same tool deactivates
  const selectTool = useCallback((tool) => {
    lastMapClickAt.current = 0
    setActiveTool((cur) => {
      if (cur === tool) {
        // deactivate
        if (tool === MAP_TOOLS.RADIUS) setRadiusCenter(null)
        if (tool === MAP_TOOLS.MEASURE || tool === MAP_TOOLS.MEASURE_AREA) {
          setMeasurePoints([])
          setMeasureDistKm(null)
          setMeasureAreaSqm(null)
          setMeasureState(MEASURE_STATES.IDLE)
          undoStack.current = []
        }
        return MAP_TOOLS.NONE
      }
      // switching tool — clear previous
      setRadiusCenter(null)
      setMeasurePoints([])
      setMeasureDistKm(null)
      setMeasureAreaSqm(null)
      setMeasureState(MEASURE_STATES.IDLE)
      undoStack.current = []
      if (tool === MAP_TOOLS.MEASURE) setMeasureMode('distance')
      if (tool === MAP_TOOLS.MEASURE_AREA) setMeasureMode('area')
      return tool
    })
  }, [])

  // Handle a map click depending on current tool
  const handleMapClick = useCallback(
    (lngLat) => {
      if (activeTool === MAP_TOOLS.RADIUS) {
        setRadiusCenter([lngLat.lng, lngLat.lat])
      } else if (activeTool === MAP_TOOLS.MEASURE || activeTool === MAP_TOOLS.MEASURE_AREA) {
        const now = Date.now()
        const isDoubleClick = now - lastMapClickAt.current < 400
        lastMapClickAt.current = now
        const clickPoint = [lngLat.lng, lngLat.lat]

        if (measureState === MEASURE_STATES.EDITING) {
          // In editing mode, check if clicking on a segment to insert vertex
          const segmentIndex = findClosestSegment(measurePointsRef.current, clickPoint)
          if (segmentIndex !== null) {
            pushUndo(measurePointsRef.current)
            setMeasurePoints((pts) => {
              const next = [...pts]
              next.splice(segmentIndex + 1, 0, clickPoint)
              if (measureMode === 'area') setMeasureAreaSqm(measurePolygonAreaSqm(next))
              else setMeasureDistKm(measurePathKm(next))
              return next
            })
            return
          }
          // Check if clicking on a vertex to select for drag (handled by mousedown on vertex)
          // Click on empty space exits edit mode
          setMeasureState(MEASURE_STATES.COMPLETED)
          return
        }

        if (isDoubleClick) {
          // Finished — keep the path and leave the tool (the line stays).
          if (activeTool === MAP_TOOLS.MEASURE_AREA) setMeasureAreaSqm(measurePolygonAreaSqm(measurePointsRef.current))
          else setMeasureDistKm(measurePathKm(measurePointsRef.current))
          setActiveTool(MAP_TOOLS.NONE)
          setMeasureState(MEASURE_STATES.COMPLETED)
          return
        }

        if (measureState === MEASURE_STATES.IDLE) {
          setMeasureState(MEASURE_STATES.DRAWING)
        }

        pushUndo(measurePointsRef.current)
        setMeasurePoints((pts) => {
          const next = [...pts, clickPoint]
          if (activeTool === MAP_TOOLS.MEASURE_AREA) setMeasureAreaSqm(measurePolygonAreaSqm(next))
          else setMeasureDistKm(measurePathKm(next))
          return next
        })
      }
    },
    [activeTool, measureMode, measureState, pushUndo]
  )

  // Start dragging a vertex
  const startDragVertex = useCallback((index) => {
    if (measureState !== MEASURE_STATES.EDITING && measureState !== MEASURE_STATES.COMPLETED) return
    draggingVertex.current = { index, originalPoints: [...measurePointsRef.current] }
    isDragging.current = true
    setMeasureState(MEASURE_STATES.EDITING)
  }, [measureState, pushUndo])

  // Drag a vertex to new position
  const dragVertex = useCallback((index, newLngLat) => {
    if (!isDragging.current || draggingVertex.current?.index !== index) return
    const pts = [...draggingVertex.current.originalPoints]
    pts[index] = [newLngLat.lng, newLngLat.lat]
    setMeasurePoints(pts)
    if (measureMode === 'area') setMeasureAreaSqm(measurePolygonAreaSqm(pts))
    else setMeasureDistKm(measurePathKm(pts))
  }, [measureMode])

  // End dragging a vertex
  const endDragVertex = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    draggingVertex.current = null
  }, [])

  // Delete a specific vertex by index
  const deleteVertex = useCallback((index) => {
    pushUndo(measurePointsRef.current)
    setMeasurePoints((pts) => {
      if (pts.length <= (measureMode === 'area' ? 3 : 2)) return pts // Keep minimum for valid measurement
      const next = pts.filter((_, i) => i !== index)
      if (measureMode === 'area') setMeasureAreaSqm(measurePolygonAreaSqm(next))
      else setMeasureDistKm(measurePathKm(next))
      return next
    })
  }, [measureMode, pushUndo])

  // Google Maps "Remove point": pops the last vertex and keeps measuring.
  const removeLastMeasurePoint = useCallback(() => {
    const pts = measurePointsRef.current
    if (!pts.length) return
    pushUndo(pts)
    const next = pts.slice(0, -1)
    setMeasurePoints(next)
    setMeasureDistKm(measurePathKm(next))
    setMeasureAreaSqm(measurePolygonAreaSqm(next))
    setActiveTool((cur) => (next.length === 0 ? MAP_TOOLS.NONE : cur))
    if (next.length === 0) setMeasureState(MEASURE_STATES.IDLE)
  }, [])

  // Undo last action
  const undoMeasure = useCallback(() => {
    if (undoStack.current.length === 0) return
    const previous = undoStack.current.pop()
    setMeasurePoints(previous)
    if (measureMode === 'area') setMeasureAreaSqm(measurePolygonAreaSqm(previous))
    else setMeasureDistKm(measurePathKm(previous))
    if (previous.length === 0) {
      setActiveTool(MAP_TOOLS.NONE)
      setMeasureState(MEASURE_STATES.IDLE)
    }
  }, [measureMode])

  // Google Maps "Done": exit the tool but keep the drawn path visible.
  const finishMeasure = useCallback(() => {
    if (measureMode === 'area') setMeasureAreaSqm(measurePolygonAreaSqm(measurePointsRef.current))
    else setMeasureDistKm(measurePathKm(measurePointsRef.current))
    setActiveTool(MAP_TOOLS.NONE)
    setMeasureState(MEASURE_STATES.COMPLETED)
  }, [measureMode])

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
    setMeasureAreaSqm(null)
    setMeasureState(MEASURE_STATES.IDLE)
    undoStack.current = []
    lastMapClickAt.current = 0
    if (activeTool === MAP_TOOLS.MEASURE || activeTool === MAP_TOOLS.MEASURE_AREA) setActiveTool(MAP_TOOLS.NONE)
  }, [activeTool])

  // Enter edit mode for existing measurement
  const enterEditMode = useCallback(() => {
    if (measurePoints.length >= (measureMode === 'area' ? 3 : 2)) {
      setMeasureState(MEASURE_STATES.EDITING)
    }
  }, [measurePoints.length, measureMode])

  const currentBasemap = BASEMAPS.find((b) => b.id === basemapId) || BASEMAPS[0]

  return {
    activeTool, selectTool,
    radiusCenter, radiusKm, setRadiusKm, clearRadius,
    measurePoints, measureDistKm, measureAreaSqm, measureMode, measureState,
    removeLastMeasurePoint, finishMeasure, clearMeasure, undoMeasure,
    deleteVertex, startDragVertex, dragVertex, endDragVertex, enterEditMode,
    clusterEnabled, toggleCluster,
    basemapId, setBasemapId, currentBasemap,
    handleMapClick,
  }
}
// GIS map surface shared by all three portals (LLD Vol 1 §10.3).
// MapLibre GL consumes vector-style basemap + facility points as GeoJSON.
// Now supports: toolbar tools (radius, measure, cluster), basemap switching,
// locate-me pulse marker, and PNG snapshot export.
import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import maplibregl from 'maplibre-gl'
import { DEPARTMENT_MAP } from '../../config/constants'
import { MAP_TOOLS } from '../../hooks/useMapTools'

function facilitiesToGeoJSON(facilities) {
  return {
    type: 'FeatureCollection',
    features: facilities.map((f) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: f.position },
      properties: {
        id: f.id,
        name: f.name,
        departmentId: f.departmentId,
        categoryLabel: f.categoryLabel,
        status: f.status,
        gapScore: f.gapScore,
        color: DEPARTMENT_MAP[f.departmentId]?.color || '#546882',
      },
    })),
  }
}

// Generate a GeoJSON circle polygon approximation (for radius overlay)
function circleGeoJSON(center, radiusKm, steps = 64) {
  const R = 6371
  const [lng, lat] = center
  const coords = []
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const dLat = (radiusKm / R) * (180 / Math.PI)
    const dLng = dLat / Math.cos((lat * Math.PI) / 180)
    coords.push([
      lng + dLng * Math.sin(angle),
      lat + dLat * Math.cos(angle),
    ])
  }
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} }],
  }
}

function measureLineGeoJSON(points) {
  if (points.length < 2) {
    return { type: 'FeatureCollection', features: [] }
  }
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: points },
      properties: {},
    }],
  }
}

const MapView = forwardRef(function MapView({
  center = [85.4434, 25.1372],
  zoom = 10.4,
  facilities = [],
  colorBy = 'department', // 'department' | 'gap'
  onFacilityClick,
  onMapClick,          // propagated to parent for tool handling
  selectedId,
  showHeat = false,
  heatPoints = [],
  className = '',
  // Tool props
  activeTool = MAP_TOOLS.NONE,
  radiusCenter = null,
  radiusKm = 3,
  measurePoints = [],
  measureDistKm = null,
  clusterEnabled = false,
  basemapUrl,
}, ref) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const locMarkerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/positron'
  const [currentStyle, setCurrentStyle] = useState(basemapUrl || DEFAULT_STYLE)

  // Expose snapshot + flyTo to parent via ref
  useImperativeHandle(ref, () => ({
    snapshot() {
      const canvas = mapRef.current?.getCanvas()
      if (!canvas) return
      const a = document.createElement('a')
      a.download = `ndisp-map-${Date.now()}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    },
    flyTo(center, zoom) {
      mapRef.current?.flyTo({ center, zoom, duration: 900 })
    },
    locateUser() {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition((pos) => {
        const lngLat = [pos.coords.longitude, pos.coords.latitude]
        mapRef.current?.flyTo({ center: lngLat, zoom: 14, duration: 1000 })
        // Pulse marker
        if (locMarkerRef.current) locMarkerRef.current.remove()
        const el = document.createElement('div')
        el.className = 'locate-pulse'
        el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#1d7ab5;border:3px solid white;box-shadow:0 0 0 4px rgba(29,122,181,0.35);'
        locMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat(lngLat)
          .addTo(mapRef.current)
      })
    },
  }), [])

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: currentStyle,
      center,
      zoom,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 80, unit: 'metric' }), 'bottom-right')
    map.on('load', () => setReady(true))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Basemap switching — handles both string URLs and style objects (e.g. satellite raster)
  useEffect(() => {
    const map = mapRef.current
    const newStyle = basemapUrl || 'https://tiles.openfreemap.org/styles/positron'
    const isSame = JSON.stringify(newStyle) === JSON.stringify(currentStyle)
    if (!map || isSame) return
    setCurrentStyle(newStyle)
    setReady(false)
    map.setStyle(newStyle)
    map.once('styledata', () => setReady(true))
  }, [basemapUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cursor changes by tool
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (activeTool !== MAP_TOOLS.NONE) {
      map.getCanvas().style.cursor = 'crosshair'
    } else {
      map.getCanvas().style.cursor = ''
    }
  }, [activeTool])

  // Map click forwarding
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const handler = (e) => {
      if (activeTool !== MAP_TOOLS.NONE) {
        onMapClick?.(e.lngLat)
      }
    }
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [ready, activeTool, onMapClick])

  // Recenter when district/center changes
  useEffect(() => {
    if (mapRef.current && ready) {
      mapRef.current.flyTo({ center, zoom, duration: 900 })
    }
  }, [center, zoom, ready])

  const paintExpression = useCallback(() => {
    if (colorBy === 'gap') {
      return [
        'interpolate', ['linear'], ['get', 'gapScore'],
        0, '#1f7a54', 0.33, '#e07a2c', 0.66, '#c0392b', 1, '#8a1c11',
      ]
    }
    return ['get', 'color']
  }, [colorBy])

  // Facility points layer
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

    const geojson = facilitiesToGeoJSON(facilities)

    // Cluster source
    const clusterSrc = map.getSource('facilities-cluster')
    if (clusterSrc) {
      clusterSrc.setData(geojson)
    } else {
      map.addSource('facilities-cluster', {
        type: 'geojson', data: geojson,
        cluster: true, clusterMaxZoom: 14, clusterRadius: 40,
      })
      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'facilities-cluster',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#546882', 10, '#e07a2c', 30, '#c0392b'],
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 32],
          'circle-opacity': 0.88,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
        layout: { visibility: 'none' },
      })
      // Cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'facilities-cluster',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Noto Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          visibility: 'none',
        },
        paint: { 'text-color': '#ffffff' },
      })
    }

    // Plain source (unclustered)
    const src = map.getSource('facilities')
    if (src) {
      src.setData(geojson)
    } else {
      map.addSource('facilities', { type: 'geojson', data: geojson })
      map.addLayer({
        id: 'facility-halo',
        type: 'circle',
        source: 'facilities',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 10,
          'circle-color': paintExpression(),
          'circle-opacity': 0.18,
        },
      })
      map.addLayer({
        id: 'facility-points',
        type: 'circle',
        source: 'facilities',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['case', ['==', ['get', 'status'], 'inactive'], 4, 5.5],
          'circle-color': paintExpression(),
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      const popup = new maplibregl.Popup({ closeButton: false, offset: 12, maxWidth: '240px' })

      map.on('mouseenter', 'facility-points', (e) => {
        if (activeTool !== MAP_TOOLS.NONE) return
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features[0]
        const gap = (f.properties.gapScore * 100).toFixed(0)
        const gapColor = f.properties.gapScore > 0.66 ? '#c0392b' : f.properties.gapScore > 0.33 ? '#e07a2c' : '#1f7a54'
        popup
          .setLngLat(f.geometry.coordinates)
          .setHTML(
            `<div style="font-family:Inter,sans-serif;padding:2px 0;">
               <div style="font-weight:600;font-size:12.5px;color:#0b3558;">${f.properties.name}</div>
               <div style="font-size:11.5px;color:#546882;margin-top:2px;">${f.properties.categoryLabel}</div>
               <div style="margin-top:6px;display:flex;align-items:center;gap:6px;">
                 <span style="font-size:11px;color:${gapColor};font-weight:600;">Gap ${gap}%</span>
                 <span style="font-size:11px;color:#7488a0;">${f.properties.status}</span>
               </div>
             </div>`
          )
          .addTo(map)
      })
      map.on('mouseleave', 'facility-points', () => {
        if (activeTool !== MAP_TOOLS.NONE) return
        map.getCanvas().style.cursor = activeTool !== MAP_TOOLS.NONE ? 'crosshair' : ''
        popup.remove()
      })
      map.on('click', 'facility-points', (e) => {
        if (activeTool !== MAP_TOOLS.NONE) return
        const id = e.features[0].properties.id
        onFacilityClick?.(id)
      })
    }
  }, [facilities, ready, paintExpression, onFacilityClick, activeTool])

  // Cluster visibility toggle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !map.getLayer('clusters')) return
    const vis = clusterEnabled ? 'visible' : 'none'
    const ptVis = clusterEnabled ? 'none' : 'visible'
    map.setLayoutProperty('clusters', 'visibility', vis)
    map.setLayoutProperty('cluster-count', 'visibility', vis)
    map.setLayoutProperty('facility-points', 'visibility', ptVis)
    map.setLayoutProperty('facility-halo', 'visibility', ptVis)
  }, [clusterEnabled, ready])

  // Repaint color mode
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !map.getLayer('facility-points')) return
    map.setPaintProperty('facility-points', 'circle-color', paintExpression())
    map.setPaintProperty('facility-halo', 'circle-color', paintExpression())
  }, [colorBy, ready, paintExpression])

  // Selected facility highlight ring
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const selected = facilities.find((f) => f.id === selectedId)
    const data = {
      type: 'FeatureCollection',
      features: selected
        ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: selected.position }, properties: {} }]
        : [],
    }
    const src = map.getSource('selected-facility')
    if (src) {
      src.setData(data)
    } else {
      map.addSource('selected-facility', { type: 'geojson', data })
      map.addLayer({
        id: 'selected-facility-ring',
        type: 'circle',
        source: 'selected-facility',
        paint: {
          'circle-radius': 14,
          'circle-color': 'transparent',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#0b3558',
        },
      })
    }
  }, [selectedId, facilities, ready])

  // Radius overlay
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const data = radiusCenter
      ? circleGeoJSON(radiusCenter, radiusKm)
      : { type: 'FeatureCollection', features: [] }
    const src = map.getSource('radius-overlay')
    if (src) {
      src.setData(data)
    } else {
      map.addSource('radius-overlay', { type: 'geojson', data })
      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius-overlay',
        paint: { 'fill-color': '#1d7ab5', 'fill-opacity': 0.1 },
      })
      map.addLayer({
        id: 'radius-border',
        type: 'line',
        source: 'radius-overlay',
        paint: { 'line-color': '#1d7ab5', 'line-width': 2, 'line-dasharray': [3, 2] },
      })
    }
  }, [radiusCenter, radiusKm, ready])

  // Radius km changes without recenter
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !radiusCenter) return
    const src = map.getSource('radius-overlay')
    if (src) src.setData(circleGeoJSON(radiusCenter, radiusKm))
  }, [radiusKm, radiusCenter, ready])

  // Measure line overlay
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const data = measureLineGeoJSON(measurePoints)
    const src = map.getSource('measure-line')
    if (src) {
      src.setData(data)
    } else {
      map.addSource('measure-line', { type: 'geojson', data })
      map.addLayer({
        id: 'measure-line-layer',
        type: 'line',
        source: 'measure-line',
        paint: { 'line-color': '#8a4fc0', 'line-width': 2, 'line-dasharray': [4, 2] },
      })
    }

    // Endpoint dots
    const dots = {
      type: 'FeatureCollection',
      features: measurePoints.map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: p }, properties: {} })),
    }
    const dotSrc = map.getSource('measure-dots')
    if (dotSrc) {
      dotSrc.setData(dots)
    } else {
      map.addSource('measure-dots', { type: 'geojson', data: dots })
      map.addLayer({
        id: 'measure-dots-layer',
        type: 'circle',
        source: 'measure-dots',
        paint: {
          'circle-radius': 5, 'circle-color': '#8a4fc0',
          'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff',
        },
      })
    }

    // Distance label at midpoint
    const mid = measureDistKm !== null && measurePoints.length === 2
      ? {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [
                (measurePoints[0][0] + measurePoints[1][0]) / 2,
                (measurePoints[0][1] + measurePoints[1][1]) / 2,
              ],
            },
            properties: { label: `${measureDistKm} km` },
          }],
        }
      : { type: 'FeatureCollection', features: [] }
    const lblSrc = map.getSource('measure-label')
    if (lblSrc) {
      lblSrc.setData(mid)
    } else {
      map.addSource('measure-label', { type: 'geojson', data: mid })
      map.addLayer({
        id: 'measure-label-layer',
        type: 'symbol',
        source: 'measure-label',
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Noto Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, -1.2],
        },
        paint: { 'text-color': '#8a4fc0', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
      })
    }
  }, [measurePoints, measureDistKm, ready])

  // Optional heat/hotspot overlay
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const data = {
      type: 'FeatureCollection',
      features: showHeat
        ? heatPoints.map((h) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: h.position },
            properties: { weight: h.intensity },
          }))
        : [],
    }
    const src = map.getSource('hotspots')
    if (src) {
      src.setData(data)
    } else {
      map.addSource('hotspots', { type: 'geojson', data })
      map.addLayer(
        {
          id: 'hotspot-heat',
          type: 'heatmap',
          source: 'hotspots',
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': 0.9,
            'heatmap-radius': 45,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(31,122,84,0)', 0.3, 'rgba(224,122,44,0.55)',
              0.7, 'rgba(192,57,43,0.7)', 1, 'rgba(139,28,17,0.85)',
            ],
          },
        },
        'facility-halo'
      )
    }
  }, [showHeat, heatPoints, ready])

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="absolute inset-0 rounded-xl2 overflow-hidden" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-ink-50 rounded-xl2">
          <span className="text-[12.5px] text-ink-400">Loading map…</span>
        </div>
      )}
    </div>
  )
})

export default MapView

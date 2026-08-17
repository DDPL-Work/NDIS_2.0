// GIS map surface shared by all portals (LLD Vol 1 §10.3), powered by Leaflet.
// Engine re-implementation of the MapLibre surface: same props, same popups,
// same toolbar tools (radius, measure, cluster), basemap switching, locate-me
// pulse marker and PNG snapshot export.  Facilities are rendered as
// L.marker([latitude, longitude]) from backend [longitude, latitude].
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { MAP_TOOLS, attributionFor, measurePathKm } from '../../hooks/useMapTools'
import { createFacilityMarkers, createCatalogLayer, createSearchResultMarkers } from '../../services/LeafletLayerService'
import { ensureLeafletPlugins } from '../../services/leafletPlugins'
import { distanceMeters } from '../../utils/geo'

const DEFAULT_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const toLatLng = (position) => [position[1], position[0]]

const MEASURE_COLOR = '#8a4fc0'

// Google-Maps-style distance pill label.
function measureLabelHtml(text) {
  return `<span style="background:#ffffff;border:1px solid ${MEASURE_COLOR};color:${MEASURE_COLOR};border-radius:999px;padding:1px 6px;font-size:11px;font-weight:600;font-family:Inter,sans-serif;white-space:nowrap;box-shadow:0 1px 2px rgba(16,24,40,0.15);">${text}</span>`
}

// Meters for sub-kilometre paths, one decimal km below 10, whole km above —
// the same formatting Google Maps uses for the measure label.
function formatMeasure(km) {
  if (km == null || !Number.isFinite(km)) return null
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
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
  searchResults = [],
  onSearchResultOpen = () => {},
  onSearchResultRoute,   // Show Route action from the result marker popup
  className = '',
  onReady,             // additive: fires once the Leaflet map is initialised
  // Tool props
  activeTool = MAP_TOOLS.NONE,
  radiusCenter = null,
  radiusKm = 3,
  measurePoints = [],
  measureDistKm = null,
  clusterEnabled = false,
  basemapUrl,
  departmentColors = {},
  vectorLayers = [],
  route = null,          // { coordinates, origin, destination, mode } | null — exactly two endpoints
  onFacilityRouteTo,     // "Route to here" from a facility marker popup
  routeOriginKey = null, // route key of the current origin (popup "Start point" chip)
}, ref) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)              // Leaflet map instance
  const tileLayerRef = useRef(null)
  const facilitiesLayerRef = useRef(null)  // layerGroup | markerClusterGroup
  const selectedRingRef = useRef(null)
  const radiusRef = useRef(null)
  const measureRef = useRef({ line: null, dots: null, label: null, hoverLine: null, hoverLabel: null })
  const heatRef = useRef(null)
  const vectorLayerRef = useRef(null)
  const locMarkerRef = useRef(null)
  const searchLayerRef = useRef(null)
  const routeLayerRef = useRef(null)
  const [ready, setReady] = useState(false)
  // Live values for the catalog/facility layer closures — reading through refs
  // keeps "Start point"/"Route to here" fresh without recreating any Leaflet
  // layer when the route state changes (routing must never rebuild the map
  // layers).
  const routeOriginKeyRef = useRef(routeOriginKey)
  routeOriginKeyRef.current = routeOriginKey
  // leaflet.heat / leaflet.markercluster attach to a global `L`; loaded async
  // once window.L is available (see services/leafletPlugins.js).
  const [pluginsReady, setPluginsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ensureLeafletPlugins().then(() => { if (!cancelled) setPluginsReady(true) })
    return () => { cancelled = true }
  }, [])

  // Expose snapshot + flyTo + locateUser + the raw map to parents via ref
  useImperativeHandle(ref, () => ({
    get map() { return mapRef.current },
    snapshot() { exportSnapshot() },
    flyTo(nextCenter, nextZoom) {
      mapRef.current?.flyTo(toLatLng(nextCenter), nextZoom, { duration: 0.9 })
    },
    locateUser() {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition((pos) => {
        const lngLat = [pos.coords.longitude, pos.coords.latitude]
        mapRef.current?.flyTo(toLatLng(lngLat), 14, { duration: 1 })
        if (locMarkerRef.current) locMarkerRef.current.remove()
        const el = document.createElement('div')
        el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#1d7ab5;border:3px solid white;box-shadow:0 0 0 4px rgba(29,122,181,0.35);'
        locMarkerRef.current = L.marker(toLatLng(lngLat), { icon: L.divIcon({ className: '', html: el, iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(mapRef.current)
      })
    },
    showResult(result) {
      if (!result || !Array.isArray(result.position) || result.position.length < 2) return
      const map = mapRef.current
      if (!map) return
      map.flyTo([result.position[1], result.position[0]], 15, { duration: 0.8 })
      setTimeout(() => {
        const marker = searchLayerRef.current?.getLayers?.()?.find((item) => item.options?.spatialResultId === String(result.id))
        if (marker) marker.openPopup()
      }, 500)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  // Vector-only snapshot export (raster tiles are CORS-tainted, so the basemap
  // is intentionally omitted — overlays and markers are redrawn exactly).
  function exportSnapshot() {
    const map = mapRef.current
    if (!map) return
    const size = map.getSize()
    const output = document.createElement('canvas')
    output.width = size.x
    output.height = size.y
    const ctx = output.getContext('2d')
    ctx.fillStyle = '#eef1f5'
    ctx.fillRect(0, 0, output.width, output.height)
    const project = (position) => map.latLngToContainerPoint(L.latLng(position[1], position[0]))
    if (radiusRef.current && radiusCenter) {
      const p = project(radiusCenter)
      const metersPerPixel = typeof map.metersPerPixel === 'function' ? map.metersPerPixel(map.getZoom()) : 1
      ctx.beginPath(); ctx.arc(p.x, p.y, radiusKm * 1000 / (metersPerPixel || 1), 0, Math.PI * 2)
      ctx.strokeStyle = '#1d7ab5'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]); ctx.stroke()
    }
    if (measureRef.current.line && measurePoints.length >= 2) {
      ctx.setLineDash([4, 2]); ctx.strokeStyle = '#8a4fc0'; ctx.lineWidth = 2; ctx.beginPath()
      measurePoints.forEach((point, index) => {
        const p = project(point)
        if (index === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y)
      })
      ctx.stroke()
    }
    facilitiesLayerRef.current?.eachLayer?.((marker) => {
      if (marker.getLatLng && marker.options?.icon?.options?.html) {
        const p = map.latLngToContainerPoint(marker.getLatLng())
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = marker.options.icon.options.html.match(/#[0-9a-f]{3,6}/i)?.[0] || '#546882'
        ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke()
      }
    })
    const a = document.createElement('a')
    a.download = `ndisp-map-${Date.now()}.png`
    a.href = output.toDataURL('image/png')
    a.click()
  }

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: toLatLng(center),
      zoom,
      zoomControl: false,
    })
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.control.scale({ position: 'bottomright', imperial: false, maxWidth: 80 }).addTo(map)
    tileLayerRef.current = L.tileLayer(basemapUrl || DEFAULT_TILES, { maxZoom: 19, attribution: attributionFor(basemapUrl) }).addTo(map)
    mapRef.current = map
    setReady(true)
    onReady?.(map)
    return () => {
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the Leaflet surface sized when its container resizes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !containerRef.current) return
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Basemap switching
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const next = basemapUrl || DEFAULT_TILES
    if (tileLayerRef.current && tileLayerRef.current._url === next) return
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current)
    tileLayerRef.current = L.tileLayer(next, { maxZoom: 19, attribution: attributionFor(next) }).addTo(map)
  }, [basemapUrl])

  // Cursor changes by tool; double-click zoom is disabled while measuring so
  // a double-click finishes the measurement (Google Maps behaviour) instead of
  // zooming the map.
  useEffect(() => {
    const container = mapRef.current?.getContainer()
    if (!container) return
    container.style.cursor = activeTool !== MAP_TOOLS.NONE ? 'crosshair' : ''
    const map = mapRef.current
    if (!map) return
    if (activeTool === MAP_TOOLS.MEASURE) map.doubleClickZoom.disable()
    else map.doubleClickZoom.enable()
  }, [activeTool])

  // Tool clicks must work over GeoJSON boundaries as well as bare tiles.
  // Leaflet vector layers can consume the map's synthetic click event, so use
  // the map container's capture phase and translate the screen point through
  // Leaflet. This remains within the Leaflet/React lifecycle.
  useEffect(() => {
    const map = mapRef.current
    const container = map?.getContainer()
    if (!map || !container) return
    const handler = (event) => {
      if (activeTool === MAP_TOOLS.NONE) return
      if (event.target.closest?.('.leaflet-control, .leaflet-popup')) return
      const latlng = map.mouseEventToLatLng(event)
      onMapClick?.({ lng: latlng.lng, lat: latlng.lat })
    }
    container.addEventListener('click', handler, true)
    return () => container.removeEventListener('click', handler, true)
  }, [activeTool, onMapClick])

  // Recenter when district/center changes
  useEffect(() => {
    if (mapRef.current && ready) {
      mapRef.current.flyTo(toLatLng(center), zoom, { duration: 0.9 })
    }
  }, [center, zoom, ready])

  // Facility markers (with clustering toggle)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const valid = facilities.filter((item) => Array.isArray(item.position) && item.position.length >= 2)
    if (import.meta.env.DEV) console.info('[GIS diagnostics] Leaflet facility markers', { inputCount: facilities.length, renderedMarkerCount: valid.length })

    const markers = createFacilityMarkers(valid, {
      colorBy,
      departmentColors,
      activeTool,
      onFacilityClick,
      onFacilityRouteTo,
      getRouteOriginKey: () => routeOriginKeyRef.current,
      map,
    }).getLayers()

    let nextLayer
    if (clusterEnabled && pluginsReady && typeof L.markerClusterGroup === 'function') {
      nextLayer = L.markerClusterGroup({ maxClusterRadius: 40, disableClusteringAtZoom: 15, showCoverageOnHover: false })
      nextLayer.addLayers(markers)
    } else {
      nextLayer = L.layerGroup(markers)
    }
    if (facilitiesLayerRef.current) map.removeLayer(facilitiesLayerRef.current)
    facilitiesLayerRef.current = nextLayer
    map.addLayer(nextLayer)
  }, [facilities, departmentColors, ready, colorBy, onFacilityClick, activeTool, clusterEnabled, pluginsReady, onFacilityRouteTo])

  // Spatial-query result layer: cleared on every new search batch, markers are
  // drawn on top of the facility layer and the map fits the result bounds.
  // One result zooms directly onto it.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (searchLayerRef.current) { map.removeLayer(searchLayerRef.current); searchLayerRef.current = null }
    const valid = (searchResults || []).filter((item) => Array.isArray(item.position) && item.position.length >= 2)
    if (!valid.length) return
    const layer = createSearchResultMarkers(valid, { onOpenDetails: onSearchResultOpen, onShowRoute: onSearchResultRoute, map })
    searchLayerRef.current = layer
    map.addLayer(layer)
    const bounds = L.latLngBounds(valid.map((item) => toLatLng(item.position)))
    if (valid.length === 1) {
      map.setView(toLatLng(valid[0].position), 15, { animate: true })
    } else {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
    }
  }, [searchResults, ready, onSearchResultOpen, onSearchResultRoute])

  // Auto-fit to the visible facilities (current behaviour, kept identical)
  useEffect(() => {
    const map = mapRef.current
    const valid = facilities.filter((item) => Array.isArray(item.position) && item.position.length >= 2)
    if (!map || !ready || !valid.length) return
    const bounds = L.latLngBounds(valid.map((item) => toLatLng(item.position)))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
    if (import.meta.env.DEV) console.info('[GIS diagnostics] Leaflet map bounds', { visibleCount: valid.length })
  }, [facilities, ready])

  // Road route overlay — the ONLY layer this effect manages.  Facility
  // markers, search-result pins, catalog layers and boundaries are untouched.
  // A new route replaces the previous one; null clears it.  The map view is
  // never auto-fitted to the route (manual panning only) — an auto fit over a
  // bad/wide bounds set is what previously threw the map to world zoom.
  // STRICT TWO-POINT: origin circle, destination circle, road polyline — no
  // intermediate waypoint markers exist (multi-stop routing is not supported).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const group = routeLayerRef.current
    if (group) { map.removeLayer(group); routeLayerRef.current = null }
    const coordinates = route?.coordinates
    if (!Array.isArray(coordinates) || coordinates.length < 2) return
    // OSRM returns GeoJSON [lng, lat] pairs; Leaflet paths and bounds require
    // [lat, lng].  Converting exactly once keeps the polyline inside the local
    // area — a raw pass-through would render the route at swapped coordinates
    // far from Nalanda and drag the map view away from the route.
    const path = coordinates.map(toLatLng)

    const upper = L.layerGroup()
    const casing = L.polyline(path, { color: '#ffffff', weight: 8, opacity: 0.95 })
    const line = L.polyline(path, { color: '#0b3558', weight: 4.5, opacity: 0.9 })
    upper.addLayer(casing).addLayer(line)

    const ff = route.origin?.type === 'facility'
    if (route.origin?.lat != null && route.origin?.lng != null) {
      upper.addLayer(L.circleMarker([route.origin.lat, route.origin.lng], {
        radius: 7, color: '#ffffff', weight: 2, fillColor: ff ? '#1f7a54' : '#1d7ab5', fillOpacity: 1,
      }).bindTooltip(route.origin.name || (ff ? 'Start' : 'Your location'), { direction: 'top', offset: [0, -6] }))
    }
    if (route.destination?.lat != null && route.destination?.lng != null) {
      upper.addLayer(L.circleMarker([route.destination.lat, route.destination.lng], {
        radius: 7, color: '#ffffff', weight: 2, fillColor: '#e07a2c', fillOpacity: 1,
      }).bindTooltip(route.destination.name || 'Destination', { direction: 'top', offset: [0, -6] }))
    }

    routeLayerRef.current = upper
    map.addLayer(upper)
  }, [route, ready])

  // Backend GIS catalog layers (Point / LineString / Polygon / MultiPolygon
  // GeoJSON from the server, rendered untouched — no geometry transforms).
  // Display-only: boundaries and other GIS features support hover/identify
  // but never routing — only facilities are routable points.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const group = L.layerGroup()
    ;(vectorLayers || []).forEach((entry) => {
      if (!entry?.features?.length) return
      const layer = createCatalogLayer(entry, {
        layerName: entry.layerName,
        category: entry.category,
      })
      group.addLayer(layer)
    })
    if (vectorLayerRef.current) map.removeLayer(vectorLayerRef.current)
    vectorLayerRef.current = group
    if (group.getLayers().length) map.addLayer(group)
  }, [vectorLayers, ready])

  // Cluster visibility / plain vs clustered handled above with the markers.

  // Selected facility highlight ring
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (selectedRingRef.current) { map.removeLayer(selectedRingRef.current); selectedRingRef.current = null }
    const selected = facilities.find((f) => f.id === selectedId)
    if (selected && Array.isArray(selected.position)) {
      selectedRingRef.current = L.circleMarker(toLatLng(selected.position), {
        radius: 14,
        color: '#0b3558',
        weight: 2.5,
        fillColor: 'transparent',
        fillOpacity: 0,
      }).addTo(map)
    }
  }, [selectedId, facilities, ready])

  // Radius overlay
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (radiusRef.current) { map.removeLayer(radiusRef.current); radiusRef.current = null }
    if (radiusCenter && Array.isArray(radiusCenter)) {
      radiusRef.current = L.circle(toLatLng(radiusCenter), {
        radius: radiusKm * 1000,
        color: '#1d7ab5',
        weight: 2,
        dashArray: '3 2',
        fillColor: '#1d7ab5',
        fillOpacity: 0.1,
      }).addTo(map)
    }
  }, [radiusCenter, radiusKm, ready])

  // Measure overlay — multi-point Google-Maps-style path: dashed polyline
  // through every vertex, a dot per vertex, and a distance pill above the last
  // vertex once the path is complete.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const { line, dots, label } = measureRef.current
    if (line) map.removeLayer(line)
    if (dots) map.removeLayer(dots)
    if (label) map.removeLayer(label)
    measureRef.current.line = null
    measureRef.current.dots = null
    measureRef.current.label = null

    if (measurePoints.length >= 1) {
      const dotsLayer = L.layerGroup(measurePoints.map((point) => L.circleMarker(toLatLng(point), {
        radius: 5, color: MEASURE_COLOR, weight: 2, fillColor: MEASURE_COLOR, fillOpacity: 1,
      })))
      map.addLayer(dotsLayer)
      measureRef.current.dots = dotsLayer
    }
    if (measurePoints.length >= 2) {
      measureRef.current.line = L.polyline(measurePoints.map(toLatLng), {
        color: MEASURE_COLOR, weight: 2, dashArray: '4 2',
      }).addTo(map)
      if (measureDistKm !== null) {
        const last = toLatLng(measurePoints[measurePoints.length - 1])
        const iconSize = [58, 20]
        measureRef.current.label = L.marker(last, {
          icon: L.divIcon({
            className: '',
            html: measureLabelHtml(formatMeasure(measureDistKm)),
            iconSize,
            // pill sits just above the last vertex
            iconAnchor: [iconSize[0] / 2, iconSize[1] + 6],
          }),
          interactive: false,
          keyboard: false,
        }).addTo(map)
      }
    }
  }, [measurePoints, measureDistKm, ready])

  // Rubber-band preview: while the measure tool is active with at least one
  // vertex, a dashed segment follows the cursor from the last vertex and the
  // running total distance rides along in a pill — exactly like Google Maps.
  // Layers are mutated in place (no React state) so mousemove stays cheap.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || activeTool !== MAP_TOOLS.MEASURE) return

    const onMove = (event) => {
      const points = measurePoints
      if (!points.length) return
      const last = toLatLng(points[points.length - 1])
      const latlng = event.latlng
      const doneKm = measureDistKm ?? 0
      const runningKm = doneKm + distanceMeters(points[points.length - 1], [latlng.lng, latlng.lat]) / 1000
      const { hoverLine, hoverLabel } = measureRef.current
      if (!hoverLine) {
        measureRef.current.hoverLine = L.polyline([last, [latlng.lat, latlng.lng]], {
          color: MEASURE_COLOR, weight: 2, dashArray: '4 2', opacity: 0.85, interactive: false,
        }).addTo(map)
        measureRef.current.hoverLabel = L.marker([latlng.lat, latlng.lng], {
          icon: L.divIcon({ className: '', html: measureLabelHtml(formatMeasure(runningKm)) }),
          interactive: false,
          keyboard: false,
        }).addTo(map)
      } else {
        hoverLine.setLatLngs([last, [latlng.lat, latlng.lng]])
        hoverLabel.setLatLng([latlng.lat, latlng.lng])
        hoverLabel.setIcon(L.divIcon({ className: '', html: measureLabelHtml(formatMeasure(runningKm)) }))
      }
    }

    map.on('mousemove', onMove)
    return () => {
      map.off('mousemove', onMove)
      // A finished/deactivated measurement must not leave the preview behind.
      const { hoverLine, hoverLabel } = measureRef.current
      if (hoverLine) { map.removeLayer(hoverLine); measureRef.current.hoverLine = null }
      if (hoverLabel) { map.removeLayer(hoverLabel); measureRef.current.hoverLabel = null }
    }
  }, [activeTool, measurePoints, measureDistKm, ready])

  // Heat/hotspot overlay
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null }
    if (showHeat && heatPoints?.length && pluginsReady && typeof L.heatLayer === 'function') {
      heatRef.current = L.heatLayer(heatPoints.map((h) => [h.position[1], h.position[0], h.intensity || 0.5]), {
        radius: 45,
        blur: 20,
        minOpacity: 0.2,
        maxZoom: 17,
        gradient: {
          0.0: 'rgba(31,122,84,0)',
          0.3: 'rgba(224,122,44,0.55)',
          0.7: 'rgba(192,57,43,0.7)',
          1.0: 'rgba(139,28,17,0.85)',
        },
      }).addTo(map)
    }
  }, [showHeat, heatPoints, ready, pluginsReady])

  return (
    <div className={`relative z-0 ${className}`}>
      <div ref={containerRef} className="absolute inset-0 z-0 rounded-xl2 overflow-hidden" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-ink-50 rounded-xl2">
          <span className="text-[12.5px] text-ink-400">Loading map…</span>
        </div>
      )}
    </div>
  )
})

export default MapView

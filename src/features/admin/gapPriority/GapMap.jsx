import { useEffect, useRef, useState, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import clsx from 'clsx'
import Badge from '../../../components/ui/Badge'
import { backendGapApi } from '../../../api/gapApi'
import { ensureLeafletPlugins } from '../../../services/leafletPlugins'

const PRIORITY_COLORS = {
  P1: '#c0392b',
  P2: '#e07a2c',
  P3: '#0b3558',
  P4: '#1f7a54',
}

const PRIORITY_LABELS = {
  P1: 'P1 Critical',
  P2: 'P2 High',
  P3: 'P3 Medium',
  P4: 'P4 Low',
}

const PRIORITY_RADIUS = {
  P1: 14,
  P2: 12,
  P3: 10,
  P4: 8,
}

const PRIORITY_ORDER = { P1: 0, P2: 1, P3: 2, P4: 3 }

function priorityFromScore(score) {
  const s = Number(score)
  if (s >= 0.75) return 'P1'
  if (s >= 0.5) return 'P2'
  if (s >= 0.25) return 'P3'
  return 'P4'
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    const map = { '&': '&', '<': '<', '>': '>', '"': '"', "'": "'" }
    return map[ch]
  })
}

export default function GapMap({ districtId, center = [85.4434, 25.1372], zoom = 10.4, className, onFeatureClick, filters = {} }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())
  const clusterRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visiblePriorities, setVisiblePriorities] = useState({ P1: true, P2: true, P3: true, P4: true })
  const [layerMode, setLayerMode] = useState('markers')

  // Load map data from backend
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    backendGapApi.mapData(districtId, { ...filters, include_geometry: true })
      .then((data) => {
        if (cancelled) return
        renderMapData(data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Failed to load gap map data')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [districtId, filters])

  const renderMapData = async (data) => {
    if (!mapRef.current || !containerRef.current) return

    const map = mapRef.current
    await ensureLeafletPlugins()

    // Clear existing
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current)
      clusterRef.current = null
    }
    markersRef.current.clear()

    if (!data?.features?.length) return

    // Create marker cluster group
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: 15,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const children = cluster.getAllChildMarkers()
        const priorities = children.map((m) => m.options.priority).filter(Boolean)
        const topPriority = priorities.sort((a, b) => PRIORITY_ORDER[a] - PRIORITY_ORDER[b])[0] || 'P4'
        const color = PRIORITY_COLORS[topPriority]
        const count = cluster.getChildCount()

        return L.divIcon({
          html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">${count}</div>`,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })
      },
    })

    // Create markers
    data.features.forEach((feature) => {
      const props = feature.properties || {}
      const coords = feature.geometry?.coordinates
      if (!coords || coords.length < 2) return

      const [lng, lat] = coords
      const priority = props.priority || priorityFromScore(props.gapScore)
      const color = PRIORITY_COLORS[priority]
      const radius = PRIORITY_RADIUS[priority]

      const marker = L.circleMarker([lat, lng], {
        radius,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
        priority,
        entityType: props.entityType || 'facility',
        entityId: props.id,
      })

      // Popup content
      const popupContent = `
        <div style="font-family:Inter,sans-serif;min-width:200px;max-width:280px;padding:4px 0;">
          <div style="display:flex;items:center;gap:6px;margin-bottom:6px;">
            <span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${PRIORITY_LABELS[priority]}</span>
            <span style="font-size:11px;color:#7488a0;">${props.entityType || 'Facility'}</span>
          </div>
          <div style="font-weight:600;font-size:13px;color:#0b3558;margin-bottom:4px;">${escapeHtml(props.name || 'Unnamed')}</div>
          <div style="font-size:11px;color:#546882;margin-bottom:8px;">${escapeHtml(props.village || props.block || '')}</div>
          <div style="font-size:11px;color:#546882;margin-bottom:8px;">Gap score: ${props.gapScore != null ? Number(props.gapScore).toFixed(2) : '\u2014'}</div>
          ${props.reason ? `<div style="font-size:11px;color:#27364a;margin-bottom:8px;padding:6px;background:#f0f4f8;border-radius:4px;">${escapeHtml(props.reason)}</div>` : ''}
          <button data-action="details" data-id="${props.id}" style="width:100%;background:#0b3558;color:white;border:none;border-radius:6px;padding:6px;font-size:11px;font-weight:600;cursor:pointer;">View Details</button>
        </div>
      `

      marker.bindPopup(popupContent, { closeButton: false, offset: [0, -6], maxWidth: 300 })
      marker.on('popupopen', () => {
        const el = marker.getPopup().getElement()
        if (el) {
          el.querySelector('[data-action="details"]')?.addEventListener('click', () => {
            onFeatureClick?.({ type: props.entityType, id: props.id, priority, ...props })
          })
        }
      })

      // Only add if priority is visible
      if (visiblePriorities[priority]) {
        clusterGroup.addLayer(marker)
      }
      markersRef.current.set(props.id, { marker, priority })
    })

    clusterRef.current = clusterGroup
    map.addLayer(clusterGroup)

    // Fit bounds on first load
    if (data.bounds) {
      map.fitBounds(data.bounds, { padding: [48, 48], maxZoom: 14 })
    }
  }

  const togglePriority = (p) => {
    setVisiblePriorities((prev) => {
      const next = { ...prev, [p]: !prev[p] }
      // Update map layers
      if (clusterRef.current && mapRef.current) {
        markersRef.current.forEach(({ marker, priority }) => {
          if (priority === p) {
            if (next[p]) clusterRef.current.addLayer(marker)
            else clusterRef.current.removeLayer(marker)
          }
        })
      }
      return next
    })
  }

  const toLatLng = (position) => [position[1], position[0]]

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: toLatLng(center),
      zoom,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '\u00a9 OpenStreetMap contributors',
    }).addTo(map)

    mapRef.current = map
    setReady(true)

    // Add zoom control
    L.control.zoom({ position: 'topright' }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      clusterRef.current = null
    }
  }, [center, zoom])

  if (!ready) {
    return (
      <div ref={containerRef} className={clsx('rounded-xl border border-ink-100 bg-ink-50/50', className)} style={{ height: '400px' }}>
        <div className="flex items-center justify-center h-full text-ink-400">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div ref={containerRef} className={clsx('rounded-xl border border-alert-200 bg-alert-50', className)} style={{ height: '400px' }}>
        <div className="flex items-center justify-center h-full p-4 text-center text-alert-700">
          <p>Failed to load map: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('relative rounded-xl border border-ink-100 overflow-hidden', className)} style={{ height: '500px' }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* Priority Filter Panel */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-white/95 backdrop-blur rounded-xl border border-ink-100 p-2 shadow-lg">
        <div className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
          Priority filter
        </div>
        {['P1', 'P2', 'P3', 'P4'].map((p) => (
          <label key={p} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-ink-50 cursor-pointer">
            <input
              type="checkbox"
              checked={visiblePriorities[p]}
              onChange={() => togglePriority(p)}
              className="w-3.5 h-3.5 rounded border-ink-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[p] }} />
              <span className={clsx('font-medium', visiblePriorities[p] ? 'text-ink-900' : 'text-ink-400')}>{PRIORITY_LABELS[p]}</span>
            </span>
          </label>
        ))}
      </div>

      {/* Layer Mode Toggle */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur rounded-xl border border-ink-100 p-1.5 shadow-lg">
        {['markers', 'heatmap', 'choropleth'].map((mode) => (
          <button
            key={mode}
            onClick={() => setLayerMode(mode)}
            className={clsx(
              'px-2.5 py-1.5 rounded-lg text-[10.5px] font-medium transition',
              layerMode === mode ? 'bg-sky-100 text-sky-700' : 'text-ink-500 hover:bg-ink-50'
            )}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur rounded-xl border border-ink-100 p-3 shadow-lg">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 mb-2">Legend</div>
        <div className="flex flex-col gap-1.5">
          {['P1', 'P2', 'P3', 'P4'].map((p) => (
            <div key={p} className="flex items-center gap-2 text-[11px]">
              <div className="w-3 h-3 rounded-full border border-white/50 shadow-sm" style={{ background: PRIORITY_COLORS[p] }} />
              <span className={clsx('font-medium', visiblePriorities[p] ? 'text-ink-900' : 'text-ink-400')}>{PRIORITY_LABELS[p]}</span>
              <span className="text-ink-400 text-[10px]">({priorityCount(p)})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
        </div>
      )}
    </div>
  )

  function priorityCount(p) {
    if (!markersRef.current) return 0
    let count = 0
    markersRef.current.forEach(({ priority }) => { if (priority === p) count++ })
    return count
  }
}
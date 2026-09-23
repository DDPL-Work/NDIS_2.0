import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import clsx from 'clsx'
import { backendGapApi } from '../../../api/gapApi'
import { formatScorePercent } from '../../../utils/format'
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

const PRIORITY_RADIUS = { P1: 14, P2: 12, P3: 10, P4: 8 }
const PRIORITY_ORDER = { P1: 0, P2: 1, P3: 2, P4: 3 }

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    const map = { '&': '&', '<': '<', '>': '>', '"': '"', "'": "'" }
    return map[ch]
  })
}

function createCircleIcon(color, radius) {
  const size = radius * 2
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);pointer-events:none;"></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [radius, radius],
    popupAnchor: [0, -radius],
  })
}

export default function GapMap({ districtId, center = [25.1372, 85.4434], zoom = 10.4, className, onFeatureClick, filters = {} }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())
  const clusterRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visiblePriorities, setVisiblePriorities] = useState({ P1: true, P2: true, P3: true, P4: true })
  const [backendMarkerCount, setBackendMarkerCount] = useState({ P1: 0, P2: 0, P3: 0, P4: 0 })

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setBackendMarkerCount({ P1: 0, P2: 0, P3: 0, P4: 0 })

    backendGapApi.mapData(districtId, filters)
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
  }, [districtId, filters, ready])

  const renderMapData = async (data) => {
    if (!mapRef.current || !containerRef.current) return

    const map = mapRef.current
    await ensureLeafletPlugins()

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current)
      clusterRef.current = null
    }
    markersRef.current.forEach(({ marker }) => {
      if (map.hasLayer(marker)) map.removeLayer(marker)
    })
    markersRef.current.clear()

    const rawMarkers = data?.map_markers || []

    const markers = rawMarkers
      .map((m) => {
        const lat = Number(m.latitude)
        const lng = Number(m.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return null
        }
        return {
          id: m.id,
          name: m.name,
          category: m.category,
          department_code: m.department_code,
          department_name: m.department_name,
          latitude: lat,
          longitude: lng,
          gap_score: Number(m.gap_score),
          priority: String(m.priority || '').toUpperCase() || 'P4',
          color: m.color,
          reason: m.reason,
          recommended_action: m.recommended_action,
        }
      })
      .filter(Boolean)

    console.log('[GapMap DEBUG]', {
      apiCount: rawMarkers.length,
      normalizedCount: markers.length,
      mapExists: !!map,
      mapSize: map.getSize(),
    })

    if (!markers.length) {
      setBackendMarkerCount({ P1: 0, P2: 0, P3: 0, P4: 0 })
      return
    }

    const counts = { P1: 0, P2: 0, P3: 0, P4: 0 }
    markers.forEach((m) => { const p = m.priority; if (counts[p] !== undefined) counts[p]++ })
    setBackendMarkerCount(counts)

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

    let renderedCount = 0
    markers.forEach((m) => {
      const { latitude: lat, longitude: lng } = m
      const priority = m.priority
      const color = m.color || PRIORITY_COLORS[priority] || PRIORITY_COLORS.P4
      const radius = PRIORITY_RADIUS[priority] || 8

      const marker = L.marker([lat, lng], {
        icon: createCircleIcon(color, radius),
        priority,
        entityId: m.id,
      })

      const popupContent = `
        <div style="font-family:Inter,sans-serif;min-width:200px;max-width:280px;padding:4px 0;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${PRIORITY_LABELS[priority] || priority}</span>
            <span style="font-size:11px;color:#7488a0;">${escapeHtml(m.category || '')}</span>
          </div>
          <div style="font-weight:600;font-size:13px;color:#0b3558;margin-bottom:4px;">${escapeHtml(m.name || 'Unnamed')}</div>
          <div style="font-size:11px;color:#546882;margin-bottom:4px;">${escapeHtml(m.department_name || '')}</div>
          <div style="font-size:11px;color:#546882;margin-bottom:8px;">Gap score: ${m.gap_score != null ? formatScorePercent(m.gap_score) : '—'}</div>
          ${m.reason ? `<div style="font-size:11px;color:#27364a;margin-bottom:8px;padding:6px;background:#f0f4f8;border-radius:4px;">${escapeHtml(m.reason)}</div>` : ''}
          ${m.recommended_action ? `<div style="font-size:11px;color:#0b3558;margin-bottom:8px;padding:6px;background:#e8f4fd;border-radius:4px;font-weight:500;">${escapeHtml(m.recommended_action)}</div>` : ''}
          <button data-action="details" data-id="${m.id}" style="width:100%;background:#0b3558;color:white;border:none;border-radius:6px;padding:6px;font-size:11px;font-weight:600;cursor:pointer;">View Details</button>
        </div>
      `

      marker.bindPopup(popupContent, { closeButton: false, offset: [0, -radius], maxWidth: 300 })
      marker.on('popupopen', () => {
        const el = marker.getPopup().getElement()
        if (el) {
          el.querySelector('[data-action="details"]')?.addEventListener('click', () => {
            onFeatureClick?.({ id: m.id, name: m.name, gapScore: m.gap_score, priority, departmentCode: m.department_code, ...m })
          })
        }
      })

      if (visiblePriorities[priority]) {
        clusterGroup.addLayer(marker)
        renderedCount++
      }
      markersRef.current.set(m.id, { marker, priority })
    })

    clusterRef.current = clusterGroup
    map.addLayer(clusterGroup)

    const hasLayer = map.hasLayer(clusterGroup)
    console.log('[GapMap] filteredCount:', renderedCount, 'renderedCount:', renderedCount, 'hasLayer:', hasLayer)

    map.invalidateSize()

    if (markers.length > 0) {
      const bounds = L.latLngBounds(
        markers.map((m) => [m.latitude, m.longitude])
      )
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
    }

    requestAnimationFrame(() => {
      map.invalidateSize(true)
      const container = map.getContainer()
      console.log('[GapMap DOM]', {
        interactiveLayers: container.querySelectorAll('.leaflet-interactive').length,
        overlayPaths: container.querySelectorAll('.leaflet-overlay-pane path').length,
        markerIcons: container.querySelectorAll('.leaflet-marker-icon').length,
        markerPane: container.querySelectorAll('.leaflet-marker-pane *').length,
        overlayPane: container.querySelectorAll('.leaflet-overlay-pane *').length,
        mapSize: map.getSize(),
      })
    })
  }

  const togglePriority = (p) => {
    setVisiblePriorities((prev) => {
      const next = { ...prev, [p]: !prev[p] }
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '\u00a9 OpenStreetMap contributors',
    }).addTo(map)

    mapRef.current = map
    L.control.zoom({ position: 'topright' }).addTo(map)

    requestAnimationFrame(() => {
      map.invalidateSize()
      setReady(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
      clusterRef.current = null
    }
  }, [center, zoom])

  function legendCount(p) {
    return backendMarkerCount[p] ?? 0
  }

  return (
    <div className={clsx('relative rounded-xl border border-ink-100 overflow-hidden', className)} style={{ height: '500px' }}>
      <div ref={containerRef} className="absolute inset-0" />

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

      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur rounded-xl border border-ink-100 p-3 shadow-lg">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 mb-2">Legend</div>
        <div className="flex flex-col gap-1.5">
          {['P1', 'P2', 'P3', 'P4'].map((p) => (
            <div key={p} className="flex items-center gap-2 text-[11px]">
              <div className="w-3 h-3 rounded-full border border-white/50 shadow-sm" style={{ background: PRIORITY_COLORS[p] }} />
              <span className={clsx('font-medium', visiblePriorities[p] ? 'text-ink-900' : 'text-ink-400')}>{PRIORITY_LABELS[p]}</span>
              <span className="text-ink-400 text-[10px]">({legendCount(p)})</span>
            </div>
          ))}
        </div>
      </div>

      {!ready && (
        <div className="absolute inset-0 bg-ink-50/80 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
        </div>
      )}

      {ready && loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
        </div>
      )}

      {ready && error && (
        <div className="absolute inset-0 bg-alert-50/90 flex items-center justify-center z-20">
          <div className="text-center p-4 text-alert-700">
            <p className="text-[13px]">Failed to load map: {error}</p>
            <p className="text-[11px] text-alert-500 mt-1">Map data comes from the backend. Check your connection.</p>
          </div>
        </div>
      )}
    </div>
  )
}

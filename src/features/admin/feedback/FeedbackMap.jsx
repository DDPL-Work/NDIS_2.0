import { useEffect, useRef, useState, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import clsx from 'clsx'
import Badge from '../../../components/ui/Badge'
import { backendFeedbackApi } from '../../../api/feedbackApi'
import { ensureLeafletPlugins } from '../../../services/leafletPlugins'
import { useAuthStore } from '../../../app/store/authStore'

const DEFAULT_CENTER = [85.4434, 25.1372]
const EMPTY_FILTERS = {}

const RATING_COLORS = {
  1: '#c0392b',
  2: '#e07a2c',
  3: '#f0b429',
  4: '#2ecc71',
  5: '#1f7a54',
}

const RATING_LABELS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
}

function avgRatingColor(avg) {
  if (avg == null) return '#546882'
  if (avg >= 4.5) return RATING_COLORS[5]
  if (avg >= 3.5) return RATING_COLORS[4]
  if (avg >= 2.5) return RATING_COLORS[3]
  if (avg >= 1.5) return RATING_COLORS[2]
  return RATING_COLORS[1]
}

function avgRatingLabel(avg) {
  if (avg == null) return 'No data'
  if (avg >= 4.5) return 'Excellent'
  if (avg >= 3.5) return 'Good'
  if (avg >= 2.5) return 'Average'
  if (avg >= 1.5) return 'Poor'
  return 'Very Poor'
}

export default function FeedbackMap({ districtId, center = DEFAULT_CENTER, zoom = 10.4, className, onFeatureClick, filters = EMPTY_FILTERS }) {
  const user = useAuthStore((state) => state.user)
  const activeDistrictId = districtId ?? user?.districtId ?? 'nalanda'
  const filtersKey = JSON.stringify(filters)
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({})
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [level, setLevel] = useState('block') // 'district' | 'block' | 'village' | 'facility'
  const [colorBy, setColorBy] = useState('avgRating') // 'avgRating' | 'responseCount' | 'positivePct'
  const [visibleQuestions, setVisibleQuestions] = useState({})

  // Load map data from backend
  useEffect(() => {
    if (!ready) return undefined
    let cancelled = false
    setLoading(true)
    setError(null)

    backendFeedbackApi.getMapData({ district: activeDistrictId, ...filters, level, include_geometry: true })
      .then((data) => {
        if (cancelled) return
        renderMapData(data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Failed to load feedback map data')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [activeDistrictId, filtersKey, level, ready])

  const renderMapData = async (data) => {
    if (!mapRef.current || !containerRef.current) return

    const map = mapRef.current
    await ensureLeafletPlugins()

    // Clear existing layers
    Object.values(layersRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer)
    })
    layersRef.current = {}

    if (!data?.features?.length) return

    // Create layers by question or aggregate
    if (data.questions && data.questions.length > 0) {
      // Create a layer for each question
      data.questions.forEach((q) => {
        const layer = L.layerGroup()
        q.features?.forEach((feature) => {
          addFeatureToLayer(feature, layer, q.id)
        })
        layersRef.current[`question-${q.id}`] = layer
        if (visibleQuestions[q.id] !== false) map.addLayer(layer)
      })
    } else if (data.features) {
      // Single aggregate layer
      const layer = L.layerGroup()
      data.features.forEach((feature) => addFeatureToLayer(feature, layer))
      layersRef.current.aggregate = layer
      map.addLayer(layer)
    }

    // Fit bounds
    if (data.bounds) {
      map.fitBounds(data.bounds, { padding: [48, 48], maxZoom: 14 })
    }
  }

  const addFeatureToLayer = (feature, layer, questionId) => {
    const props = feature.properties || {}
    const coords = feature.geometry?.coordinates
    if (!coords || coords.length < 2) return

    const [lng, lat] = coords
    const avgRating = props.avgRating
    const responseCount = props.responseCount
    const positivePct = props.positivePct

    // Determine color based on colorBy setting
    let color, radius
    if (colorBy === 'avgRating') {
      color = avgRatingColor(avgRating)
      radius = Math.max(6, Math.min(18, (avgRating || 0) * 3.5))
    } else if (colorBy === 'responseCount') {
      const intensity = Math.min(1, (responseCount || 0) / 100)
      color = `hsl(${120 - intensity * 120}, 60%, 40%)` // green to red
      radius = Math.max(6, Math.min(20, 6 + responseCount * 0.2))
    } else {
      const intensity = (positivePct || 0) / 100
      color = `hsl(${intensity * 120}, 60%, 40%)` // red to green
      radius = Math.max(6, Math.min(20, 8 + (positivePct || 0) * 0.1))
    }

    const marker = L.circleMarker([lat, lng], {
      radius,
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
    })

    // Popup content
    const popupContent = `
      <div style="font-family:Inter,sans-serif;min-width:220px;max-width:300px;padding:4px 0;">
        <div style="font-weight:600;font-size:13px;color:#0b3558;margin-bottom:4px;">${escapeHtml(props.name || props.blockName || props.villageName || 'Location')}</div>
        <div style="font-size:11px;color:#546882;margin-bottom:8px;">${escapeHtml(props.blockName || props.villageName || props.districtName || '')}</div>
        <div style="display:flex;items:center;gap:8px;margin-bottom:8px;padding:6px;background:#f0f4f8;border-radius:4px;">
          <span style="font-size:11px;color:#546882;">Responses:</span>
          <span style="font-weight:600;color:#0b3558;">${responseCount || 0}</span>
        </div>
        ${avgRating != null ? `
        <div style="display:flex;items:center;gap:8px;margin-bottom:8px;padding:6px;background:#f0f4f8;border-radius:4px;">
          <span style="font-size:11px;color:#546882;">Avg Rating:</span>
          <span style="font-weight:600;color:${color};">${Number(avgRating).toFixed(1)} / 5</span>
          <span style="font-size:11px;color:${color};">${'★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating))}</span>
        </div>
        ` : ''}
        ${positivePct != null ? `
        <div style="display:flex;items:center;gap:8px;margin-bottom:8px;padding:6px;background:#f0f4f8;border-radius:4px;">
          <span style="font-size:11px;color:#546882;">Positive:</span>
          <span style="font-weight:600;color:#1f7a58;">${positivePct.toFixed(1)}%</span>
        </div>
        ` : ''}
        ${questionId ? `<div style="font-size:10px;color:#7488a0;margin-bottom:8px;">Question: ${escapeHtml(questionId)}</div>` : ''}
        <button data-action="details" data-id="${props.id}" style="width:100%;background:#0b3558;color:white;border:none;border-radius:6px;padding:6px;font-size:11px;font-weight:600;cursor:pointer;">View Details</button>
      </div>
    `

    marker.bindPopup(popupContent, { closeButton: false, offset: [0, -6], maxWidth: 300 })
    marker.on('popupopen', () => {
      const el = marker.getPopup().getElement()
      if (el) {
        el.querySelector('[data-action="details"]')?.addEventListener('click', () => {
          onFeatureClick?.({ ...props, questionId })
        })
      }
    })

    layer.addLayer(marker)
  }

  const toggleQuestion = (qId) => {
    setVisibleQuestions((prev) => {
      const next = { ...prev, [qId]: !prev[qId] }
      if (layersRef.current[`question-${qId}`] && mapRef.current) {
        if (next[qId]) mapRef.current.addLayer(layersRef.current[`question-${qId}`])
        else mapRef.current.removeLayer(layersRef.current[`question-${qId}`])
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
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    mapRef.current = map
    setReady(true)

    L.control.zoom({ position: 'topright' }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [center, zoom])

  return (
    <div className={clsx('relative rounded-xl border border-ink-100 overflow-hidden', className)} style={{ height: '500px' }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 bg-white/95 backdrop-blur rounded-xl border border-ink-100 p-2 shadow-lg">
        {/* Level Selector */}
        <div className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
          Level
        </div>
        {['district', 'block', 'village', 'facility'].map((l) => (
          <label key={l} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-ink-50 cursor-pointer">
            <input
              type="radio"
              name="feedback-map-level"
              checked={level === l}
              onChange={() => { setLevel(l); setLoading(true) }}
              className="w-3.5 h-3.5 rounded border-ink-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-[11px] font-medium">{l.charAt(0).toUpperCase() + l.slice(1)}</span>
          </label>
        ))}

        {/* Color By Selector */}
        <div className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400 border-t border-ink-100 pt-2 mt-1">
          Color By
        </div>
        {[
          { key: 'avgRating', label: 'Avg Rating', icon: '★' },
          { key: 'responseCount', label: 'Responses', icon: '📊' },
          { key: 'positivePct', label: 'Positive %', icon: '✓' },
        ].map((c) => (
          <label key={c.key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-ink-50 cursor-pointer">
            <input
              type="radio"
              name="feedback-map-colorby"
              checked={colorBy === c.key}
              onChange={() => setColorBy(c.key)}
              className="w-3.5 h-3.5 rounded border-ink-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="flex items-center gap-1.5 text-[11px]">{c.icon} {c.label}</span>
          </label>
        ))}

        {/* Question Toggles (when available) */}
        {Object.keys(visibleQuestions).length > 0 && (
          <div className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400 border-t border-ink-100 pt-2 mt-1">
            Questions
          </div>
        )}
        {Object.entries(visibleQuestions).map(([qId, visible]) => (
          <label key={qId} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-ink-50 cursor-pointer">
            <input
              type="checkbox"
              checked={visible}
              onChange={() => toggleQuestion(qId)}
              className="w-3.5 h-3.5 rounded border-ink-300 text-sky-600 focus:ring-sky-500"
            />
            <span className="text-[11px] truncate max-w-[160px]">{qId}</span>
          </label>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur rounded-xl border border-ink-100 p-3 shadow-lg">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 mb-2">Legend</div>
        <div className="flex flex-col gap-1.5 text-[11px]">
          {colorBy === 'avgRating' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: RATING_COLORS[1] }} />
                <span>1 – Very Poor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: RATING_COLORS[3] }} />
                <span>3 – Average</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: RATING_COLORS[5] }} />
                <span>5 – Excellent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-ink-200" style={{ background: '#546882' }} />
                <span>No data</span>
              </div>
            </>
          )}
          {colorBy === 'responseCount' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#2ecc71' }} />
                <span>Low responses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#f0b429' }} />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#c0392b' }} />
                <span>High responses</span>
              </div>
            </>
          )}
          {colorBy === 'positivePct' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#c0392b' }} />
                <span>Low positive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#f0b429' }} />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#2ecc71' }} />
                <span>High positive</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-alert-50/95 p-4 text-center text-alert-700">
          <p>Feedback map data is unavailable: {error}</p>
        </div>
      )}
      {loading && !error && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
        </div>
      )}
    </div>
  )
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    const map = { '&': '&', '<': '<', '>': '>', '"': '"', "'": "'" }
    return map[ch]
  })
}

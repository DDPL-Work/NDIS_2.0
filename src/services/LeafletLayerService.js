// Leaflet layer factory + popup generation (REF.html GIS rendering strategy,
// expressed as pure service functions; no DOM manipulation).
import L from 'leaflet'

// Category → colour palette (equivalent of REF.html CATEGORY_STYLES).  Only a
// presentation lookup — layer names/categories always come from the backend.
const CATEGORY_STYLES = {
  'Administrative & Boundaries': { color: '#38bdf8', fill: '#38bdf8' },
  'Health & Medical': { color: '#ef4444', fill: '#ef4444' },
  Education: { color: '#eab308', fill: '#eab308' },
  Transportation: { color: '#f97316', fill: '#f97316' },
  'Hydrology & Water': { color: '#06b6d4', fill: '#06b6d4' },
  'Environment & Land Use': { color: '#22c55e', fill: '#22c55e' },
  'Hazards & Climate': { color: '#d946ef', fill: '#d946ef' },
  'Civic & Infrastructure': { color: '#a855f7', fill: '#a855f7' },
  'Demographics & Admin': { color: '#818cf8', fill: '#818cf8' },
}

const FALLBACK_STYLE = { color: '#546882', fill: '#546882' }

export function styleForCategory(category = '', layerName = '') {
  const base = CATEGORY_STYLES[category] || FALLBACK_STYLE
  const isBoundary = /boundary|district|block/i.test(layerName)
  return {
    color: base.color,
    weight: isBoundary ? 2.5 : 1.5,
    opacity: 0.9,
    fillColor: base.fill,
    fillOpacity: isBoundary ? 0.08 : 0.4,
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
}

// Dynamic popup from backend properties — never hardcoded fields (REF.html
// showFeatureInfo()).  Title prefers feature_name, then common name keys.
export function catalogPopupHtml(properties = {}) {
  const props = properties || {}
  const title = props.feature_name || props.NAME || props.name || props.layer_name || 'Feature Details'
  const rows = Object.entries(props)
    .filter(([key]) => key !== 'feature_name' && key !== 'layer_name')
    .map(([key, value]) => {
      const text = value !== null && value !== undefined ? value : '-'
      return `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(text)}</td></tr>`
    })
    .join('')
  return `
    <div style="font-family:Inter,sans-serif;min-width:180px;max-width:min(280px,calc(100vw - 40px));">
      <div style="font-weight:600;font-size:12.5px;color:#0b3558;padding:0 0 4px;border-bottom:1px solid #e4e8ed;margin-bottom:6px;">${escapeHtml(title)}</div>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
        ${rows || '<tr><td style="color:#7488a0;">No attributes</td></tr>'}
      </table>
    </div>`
}

// Two-point route state of a routable point.  Exactly ONE origin and ONE
// destination exist at any time.  A point that already IS the origin shows a
// static "Start point" chip; every other routable point offers "Route to
// here", which sets OR REPLACES the destination — it never appends a third
// stop (multi-stop routing does not exist).
function routeActionHtml({ isOrigin, includeDetails = false }) {
  const chip = '<span data-action="origin-chip" style="flex:1;text-align:center;background:#eef1f5;color:#7488a0;border-radius:6px;padding:4px 0;font-size:11px;font-weight:600;cursor:default;">Start point</span>'
  const button = '<button data-action="route-to" style="flex:1;background:#1d7ab5;color:#fff;border:none;border-radius:6px;padding:4px 0;font-size:11px;font-weight:600;cursor:pointer;">Route to here</button>'
  const details = includeDetails
    ? '<button data-action="view-details" style="flex:1;background:#0b3558;color:#fff;border:none;border-radius:6px;padding:4px 0;font-size:11px;font-weight:600;cursor:pointer;">View Details</button>'
    : ''
  return `
    <div style="display:flex;gap:6px;margin-top:8px;padding-top:6px;border-top:1px solid #e4e8ed;">
      ${details}${isOrigin ? chip : button}
    </div>`
}

// L.geoJSON for a backend layer response (Point / LineString / Polygon /
// MultiPolygon) exactly like REF.html — no manual geometry transforms.
// Catalog layers are DISPLAY-ONLY: features support hover/identify (metadata
// tooltip) but never route.  Routing destinations must be explicitly selected
// facilities with real point coordinates — administrative boundaries,
// polygons, lines and derived geometry points are never routable here.
export function createCatalogLayer(geojson, {
  layerName = '',
  category = '',
} = {}) {
  const collection = geojson?.features ? geojson : { type: 'FeatureCollection', features: geojson?.features || [] }
  const style = styleForCategory(category, layerName)
  const layer = L.geoJSON(collection, {
    style() { return style },
    pointToLayer(_feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 6,
        fillColor: style.color,
        color: '#ffffff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.85,
      })
    },
    onEachFeature(feature, leafletLayer) {
      leafletLayer.bindTooltip(catalogPopupHtml(feature?.properties || {}), {
        sticky: true,
        direction: 'top',
        offset: [0, -6],
      })
    },
  })
  return layer
}

// Deterministic hash colour used when a department has no assigned colour —
// picks from a small set of well-spaced hues so co-located departments never
// render as near-identical shades on the map.
const FALLBACK_HUES = [214, 14, 152, 32, 267, 96, 322, 58, 182, 288, 128, 245]
export function colorForId(id) {
  let hash = 0
  for (const char of String(id || 'unknown')) hash = ((hash << 5) - hash) + char.charCodeAt(0)
  return `hsl(${FALLBACK_HUES[Math.abs(hash) % FALLBACK_HUES.length]} 58% 42%)`
}

export function facilityColor(facility, { colorBy = 'department', departmentColors = {} } = {}) {
  if (colorBy === 'gap') {
    if (facility.gapScore >= 0.66) return '#c0392b'
    if (facility.gapScore >= 0.33) return '#e07a2c'
    return '#1f7a54'
  }
  return departmentColors[String(facility.departmentId)] || colorForId(facility.departmentId)
}

// Lightweight hover popup (production NDISP behaviour).  Name, department,
// category, status and gap score only.  When route actions are enabled
// (getRouteOriginKey provided) the popup extends the same layout with the
// facility route actions — View Details + Route to here — so map facilities
// are first-class routable points without a separate design.
// STRICT TWO-POINT semantics: "Route to here" sets or replaces the single
// destination (never appends a stop); a facility that already IS the origin
// shows a static "Start point" chip instead.
export function facilityPopupHtml(facility, { routeOriginKey = null, enabled = false } = {}) {
  const gap = Number.isFinite(facility.gapScore) ? facility.gapScore : null
  const gapLabel = gap !== null ? ` · Gap ${Math.round(gap * 100)}%` : ''
  const gapColor = gap > 0.66 ? '#c0392b' : gap > 0.33 ? '#e07a2c' : '#1f7a54'
  const isOrigin = routeOriginKey != null && String(routeOriginKey) === `facility:${String(facility.id)}`
  const actionRow = enabled ? routeActionHtml({ isOrigin, includeDetails: true }) : ''
  return `
    <div style="font-family:Inter,sans-serif;min-width:220px;max-width:min(240px,calc(100vw - 40px));padding:2px 0;">
      <div style="font-weight:600;font-size:12.5px;color:#0b3558;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(facility.name || '')}</div>
      <div style="font-size:11.5px;color:#546882;margin-top:3px;">
        ${escapeHtml(facility.departmentName || '—')} · ${escapeHtml(facility.categoryLabel || '')}
      </div>
      <div style="font-size:11px;color:${gapLabel ? gapColor : '#7488a0'};margin-top:3px;text-transform:capitalize;">
        ${escapeHtml(facility.status || 'active')}${gapLabel}
      </div>
      ${actionRow}
    </div>`
}

function facilityIcon(color, { inactive = false } = {}) {
  const dot = inactive ? 8 : 11
  return L.divIcon({
    className: '',
    html: `<div style="width:${dot}px;height:${dot}px;border-radius:50%;background:${color};border:1.5px solid #ffffff;box-shadow:0 1px 3px rgba(11,53,88,0.35);"></div>`,
    iconSize: [dot, dot],
    iconAnchor: [dot / 2, dot / 2],
  })
}

// Per-map hover guard for the interactive facility popup.  One mousemove
// listener per map (never one per marker/layer rebuild), dropped on unload.
// Closing is decided by geometry, not by mouseout alone: the popup closes only
// once the cursor is clearly outside the popup and its anchor.  For facility
// markers the anchor region is ONE continuous hover region spanning the
// marker, the popup AND Leaflet's ~20px pointer-events:none tip corridor
// between them (see guard.closeIfLeft) — closing mid-transit would make the
// popup unreachable, the exact interaction bug this guard fixes.  For path
// layers (GIS lines/polygons) the anchor is a single point projected to screen
// space — the raw SVG element rect of a long line would span most of the map
// and pin the popup open.
// Map movement: exploring the map is drag-only.  The instant the map starts
// moving (drag, zoom, programmatic pan/fitBounds) any open hover popup is
// closed and hover interactions are suspended until the movement ends — a
// drag must never fight an open popup or pop one open mid-pan.
const FACILITY_HOVER_GUARDS = new WeakMap()
function ensureFacilityHoverGuard(map) {
  let guard = FACILITY_HOVER_GUARDS.get(map)
  if (guard) return guard
  guard = {
    active: false,
    popup: null,
    openMarker: null,
    anchorLatLng: null,
    dragging: false,
  }
  guard.closeIfLeft = (x, y) => {
    if (!guard.active || !guard.popup?.isOpen() || guard.dragging) return false
    const pad = 10
    const within = (rect, extraPad = pad) => rect && x >= rect.left - extraPad && x <= rect.right + extraPad && y >= rect.top - extraPad && y <= rect.bottom + extraPad
    const popupRect = guard.popup.getElement()?.getBoundingClientRect()
    if (within(popupRect)) return false
    if (guard.anchorLatLng) {
      // Path-layer anchor: small screen-space grace zone around the exact
      // destination point (popup anchor), so the corridor between the popup
      // and the line/polygon point stays traversable.
      const point = map.latLngToContainerPoint(guard.anchorLatLng)
      if (within({ left: point.x, right: point.x, top: point.y, bottom: point.y }, 14)) return false
      map.closePopup(guard.popup)
      guard.openMarker = null
      guard.anchorLatLng = null
      return true
    }
    // Facility marker: ONE continuous hover region — the union of the marker
    // rect and the popup rect, expanded by a 12px travel margin.  Leaflet
    // leaves a pointer-events:none corridor between the marker element and the
    // popup (tip + margin), so a naive outside-both-rects check closes the
    // popup while the cursor is simply walking from the marker into it.  The
    // union region keeps the popup open for that exact flight path and closes
    // it only once the cursor has genuinely left both.
    const markerRect = guard.openMarker?.getElement?.()?.getBoundingClientRect()
    if (markerRect && popupRect) {
      const margin = 12
      const left = Math.min(markerRect.left, popupRect.left) - margin
      const right = Math.max(markerRect.right, popupRect.right) + margin
      const top = Math.min(markerRect.top, popupRect.top) - margin
      const bottom = Math.max(markerRect.bottom, popupRect.bottom) + margin
      if (x >= left && x <= right && y >= top && y <= bottom) return false
    }
    map.closePopup(guard.popup)
    guard.openMarker = null
    guard.anchorLatLng = null
    return true
  }
  guard.handleMove = (event) => {
    const x = event.originalEvent?.clientX
    const y = event.originalEvent?.clientY
    if (x == null || y == null) return
    guard.closeIfLeft(x, y)
  }
  guard.onMoveStart = () => {
    if (guard.popup?.isOpen()) map.closePopup(guard.popup)
    guard.openMarker = null
    guard.anchorLatLng = null
  }
  guard.onDragStart = () => { guard.dragging = true }
  guard.onDragEnd = () => { guard.dragging = false }
  map.on('mousemove', guard.handleMove)
  map.on('movestart', guard.onMoveStart)
  map.on('dragstart', guard.onDragStart)
  map.on('dragend', guard.onDragEnd)
  map.on('unload', () => {
    map.off('mousemove', guard.handleMove)
    map.off('movestart', guard.onMoveStart)
    map.off('dragstart', guard.onDragStart)
    map.off('dragend', guard.onDragEnd)
  })
  FACILITY_HOVER_GUARDS.set(map, guard)
  return guard
}

// Shared interactive hover-popup lifecycle — used by facility markers AND
// routable GIS layer features so there is exactly one implementation.  One
// L.popup instance per caller; the per-map hover guard owns close decisions,
// so the cursor can travel from the marker into the popup without it closing.
// Action buttons are handled by ONE delegated click listener per popup element
// (see ensurePopupActions), so opens and setContent() refreshes never re-bind
// and never stack listeners.  `anchorLatLng` (a [lng, lat] pair) lets path
// layers — which have no getLatLng() — anchor the popup at their deterministic
// destination point.  Returns an object with `open(latlng)` / `refresh(latlng)`
// used by line/polygon click refinement; `refresh` re-anchors and re-renders
// content while the delegated action binding survives untouched.
function bindHoverPopup({ map, guard, popup, marker, anchorLatLng = null, content, actions = null, activeTool = 'none', getActiveTool = null }) {
  const toolActive = () => (getActiveTool ? getActiveTool() : activeTool) !== 'none'
  const anchorRef = { latlng: anchorLatLng ? L.latLng(anchorLatLng[1], anchorLatLng[0]) : null }
  const moveAnchor = (latlng) => {
    if (!latlng) return
    anchorRef.latlng = latlng
    if (guard) guard.anchorLatLng = latlng
  }
  const openPopup = () => {
    if (guard?.dragging) return
    const latlng = anchorRef.latlng || marker.getLatLng()
    if (guard) {
      guard.openMarker = marker
      guard.popup = popup
      guard.anchorLatLng = anchorRef.latlng
    }
    popup.setLatLng(latlng)
    popup.setContent(content())
    popup.openOn(map)
    ensurePopupActions(map, popup, guard, actions)
  }
  marker.on('mouseover', () => {
    if (toolActive()) return
    if (guard?.dragging) return // never pop popups while the map is being dragged
    openPopup()
  })
  marker.on('mouseout', (event) => {
    if (!popup.isOpen()) return
    if (!actions) {
      // Non-interactive popup: legacy hover-close, keeping the popup open
      // while the cursor is still over its content.
      if (event?.originalEvent?.relatedTarget && popup.getElement()?.contains(event.originalEvent.relatedTarget)) return
      map.closePopup(popup)
      return
    }
    // Interactive popup: mouseout alone must not close it — the cursor can be
    // mid-glide through the tip corridor towards the buttons.  Use the same
    // geometry check as the mousemove guard (also catches the marker moving
    // away under a stationary cursor during a map drag).
    const original = event.originalEvent
    if (guard && original && original.clientX != null && original.clientY != null) {
      guard.closeIfLeft(original.clientX, original.clientY)
    }
  })
  return {
    open: (latlng) => {
      moveAnchor(latlng)
      openPopup()
    },
    refresh: (latlng) => {
      moveAnchor(latlng)
      if (!popup.isOpen()) return
      popup.setLatLng(anchorRef.latlng || marker.getLatLng())
      popup.setContent(content())
      ensurePopupActions(map, popup, guard, actions)
    },
  }
}

// Popup action buttons are dispatched by ONE delegated click listener per
// popup element.  Leaflet reuses the same popup root element across open/close
// cycles AND a single L.popup instance is shared by every marker in the layer,
// so per-open binding (button.addEventListener on every openPopup()) would
// stack duplicate listeners (each click would run the action repeatedly),
// while a permanently bound listener must NOT capture the first marker's
// action closures.  The current actions object is therefore stored per popup
// instance on every open/refresh (POPUP_ACTIONS_CURRENT, a WeakMap) and
// resolved at CLICK time, so each marker's popup always runs ITS OWN
// View Details / Route to here handler for the facility being hovered — a
// popup button can never execute a different facility's handler.
// Clicks inside the popup are additionally isolated from the rest of the map:
// click-family events (click / mousedown / mouseup / dblclick / contextmenu /
// pointerdown / pointerup) are stopPropagation'd at the popup root, so they
// can never bubble into the map container's click pipeline (Leaflet's
// close-on-map-click, tool placement, ...) or reach the marker's own click
// handler — popup/button events therefore cannot trigger the marker's
// navigation handler, which stays reserved for direct marker presses.
// The listener and the isolation handlers die with the element (no global
// document listeners, no memory leak).
const POPUP_ACTIONS_BOUND = new WeakSet()   // popup element → delegated listener attached
const POPUP_ACTIONS_CURRENT = new WeakMap() // popup instance → actions for the currently displayed content

function ensurePopupActions(map, popup, guard, actions) {
  if (!actions || !popup) return
  POPUP_ACTIONS_CURRENT.set(popup, actions)
  const element = popup.getElement()
  if (!element || POPUP_ACTIONS_BOUND.has(element)) return
  POPUP_ACTIONS_BOUND.add(element)
  L.DomEvent.on(element, 'click mousedown mouseup dblclick contextmenu pointerdown pointerup', L.DomEvent.stopPropagation)
  element.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-action]')
    if (!button) return
    map.closePopup(popup)
    if (guard) guard.openMarker = null
    const handler = POPUP_ACTIONS_CURRENT.get(popup)?.[button.getAttribute('data-action')]
    if (typeof handler === 'function') handler()
  })
}

// Facilities → L.marker([latitude, longitude]) from backend [longitude, latitude].
// Hover shows a lightweight popup.  Click never opens the popup — it reports
// the whole facility object so the parent decides between citizen navigation
// (/citizen/facility/:slug) and the admin right-side panel.  When route actions
// are enabled (onFacilityRouteTo provided) the popup becomes interactive and
// adds View Details plus the two-point route action (Route to here / Start
// point chip — see facilityPopupHtml), never a multi-stop control; the marker
// click behaviour itself is never changed.
export function createFacilityMarkers(facilities, {
  colorBy = 'department',
  departmentColors = {},
  activeTool = 'none',
  onFacilityClick,
  onFacilityRouteTo = null,
  getRouteOriginKey = null,
  map,
} = {}) {
  const group = L.layerGroup()
  const withActions = typeof onFacilityRouteTo === 'function'
  const popup = map ? L.popup({
    closeButton: false,
    offset: [0, -6],
    maxWidth: 260,
    interactive: withActions,
    closeOnClick: false,
  }) : null
  const guard = map ? ensureFacilityHoverGuard(map) : null
  if (guard) {
    guard.active = withActions
    if (withActions) guard.popup = popup
  }
  facilities.forEach((facility) => {
    if (!Array.isArray(facility.position) || facility.position.length < 2) return
    const color = facilityColor(facility, { colorBy, departmentColors })
    const marker = L.marker([facility.position[1], facility.position[0]], {
      icon: facilityIcon(color, { inactive: facility.status === 'inactive' }),
      // Let measuring/radius clicks reach the map; standard facility clicks
      // retain their role-based behaviour (detail page / side panel).
      bubblingMouseEvents: activeTool !== 'none',
    })
    if (map && popup) {
      bindHoverPopup({
        map,
        guard,
        popup,
        marker,
        content: () => facilityPopupHtml(facility, {
          enabled: withActions,
          routeOriginKey: withActions ? (getRouteOriginKey ? getRouteOriginKey() : null) : null,
        }),
        actions: withActions ? {
          'view-details': () => onFacilityClick?.(facility),
          'route-to': () => onFacilityRouteTo?.(facility),
        } : null,
        activeTool,
      })
    }
    marker.on('click', () => {
      if (activeTool !== 'none') return
      if (popup?.isOpen()) map?.closePopup(popup)
      if (guard) guard.openMarker = null
      onFacilityClick?.(facility)
    })
    group.addLayer(marker)
  })
  return group
}

// Spatial-query result markers (backend_guide §11.1): bold pin so search hits
// stand apart from the underlying facility layer.  Popup lists Facility Name,
// Category, Department, Distance, Hazard Safe plus Open Details / Navigate.
export function searchResultPopupHtml(facility) {
  const km = facility.distanceKm != null
    ? facility.distanceKm
    : facility.distanceM != null ? (facility.distanceM / 1000) : null
  const distanceLabel = km != null ? `${km.toFixed(2)} km` : '—'
  const department = String(facility.departmentName || facility.department || 'Public service')
  const category = String(facility.categoryLabel || facility.category || 'Facility')
  const hazard = facility.hazardSafe
    ? '<span style="color:#1f7a54;font-weight:700;">Safe ✓</span>'
    : '<span style="color:#c0392b;font-weight:700;">Hazard ⚠</span>'
  return `
    <div style="font-family:Inter,sans-serif;min-width:170px;max-width:min(240px,calc(100vw - 40px));padding:2px 0;">
      <div style="font-weight:600;font-size:12.5px;color:#0b3558;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(facility.name || 'Spatial result')}</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:5px;">
        <tr><td style="color:#7488a0;padding:1px 0;">Category</td><td style="text-align:right;font-weight:600;color:#27364a;">${escapeHtml(category)}</td></tr>
        <tr><td style="color:#7488a0;padding:1px 0;">Department</td><td style="text-align:right;font-weight:600;color:#27364a;">${escapeHtml(department)}</td></tr>
        <tr><td style="color:#7488a0;padding:1px 0;">Distance</td><td style="text-align:right;font-weight:600;color:#27364a;">${distanceLabel}</td></tr>
        <tr><td style="color:#7488a0;padding:1px 0;">Hazard Safe</td><td style="text-align:right;">${hazard}</td></tr>
      </table>
      <div style="display:flex;gap:6px;margin-top:8px;padding-top:6px;border-top:1px solid #e4e8ed;">
        <button data-action="open-details" style="flex:1;background:#0b3558;color:#fff;border:none;border-radius:6px;padding:4px 0;font-size:11px;font-weight:600;cursor:pointer;">Open Details</button>
        <button data-action="show-route" style="flex:1;background:#1d7ab5;color:#fff;border:none;border-radius:6px;padding:4px 0;font-size:11px;font-weight:600;cursor:pointer;">Show Route</button>
        <button data-action="navigate" style="flex:1;background:#fff;color:#0b3558;border:1px solid #c9d2dc;border-radius:6px;padding:4px 0;font-size:11px;font-weight:600;cursor:pointer;">Navigate</button>
      </div>
    </div>`
}

// Spatial-query result markers + interactive popup.  Uses the same facility
// icon style so results blend into the map vocabulary, but keeps itself in a
// separate layer (parents clear it on new searches).
export function createSearchResultMarkers(results, {
  onOpenDetails,
  onShowRoute,
  map,
} = {}) {
  const group = L.layerGroup()
  results.forEach((facility) => {
    if (!Array.isArray(facility.position) || facility.position.length < 2) return
    const marker = L.marker([facility.position[1], facility.position[0]], {
      icon: facilityIcon('#1d7ab5', { inactive: false }),
      bubblingMouseEvents: false,
      spatialResultId: String(facility.id),
    })
    marker.bindPopup(searchResultPopupHtml(facility), {
      closeButton: false,
      offset: [0, -8],
      maxWidth: 260,
    })
    marker.on('popupopen', () => {
      const node = marker.getPopup()?.getElement()
      if (!node) return
      node.querySelector('[data-action="open-details"]')?.addEventListener('click', () => onOpenDetails?.(facility))
      node.querySelector('[data-action="show-route"]')?.addEventListener('click', () => onShowRoute?.(facility))
      node.querySelector('[data-action="navigate"]')?.addEventListener('click', () => {
        const position = facility.position
        const url = position
          ? `https://www.google.com/maps/dir/?api=1&destination=${position[1]},${position[0]}`
          : null
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
      })
    })
    marker.on('click', () => {
      if (map) {
        map.flyTo([facility.position[1], facility.position[0]], 15, { duration: 0.8 })
        setTimeout(() => marker.openPopup(), 500)
      }
    })
    group.addLayer(marker)
  })
  return group
}

// REF.html checkUrlParamsAndHighlight() pulse marker + popup (NDISP styling).
export function createPulseMarker(map, { lat, lng, name, facilityId }) {
  const icon = L.divIcon({
    className: 'ndisp-pulse-marker',
    html: `<div style="background:#c0392b;width:18px;height:18px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 15px #c0392b;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
  const marker = L.marker([lat, lng], { icon })
  marker.bindTooltip(`
    <div style="font-family:'Inter',sans-serif;padding:4px;">
      <h4 style="margin:0 0 4px 0;color:#0f172a;font-size:0.95rem;font-weight:700;">${escapeHtml(name || 'Selected Facility')}</h4>
      <p style="margin:0;font-size:0.8rem;color:#64748b;">Lat: ${Number(lat).toFixed(4)}, Lng: ${Number(lng).toFixed(4)}</p>
      ${facilityId ? `<p style="margin:4px 0 0 0;font-size:0.75rem;color:#3b82f6;font-weight:600;">Facility ID: #${escapeHtml(facilityId)}</p>` : ''}
    </div>`, { direction: 'top', offset: [0, -10] })
  marker.addTo(map)
  return marker
}

// Deterministic hash colour used when a department has no assigned colour.
export { colorForId as hashColor }

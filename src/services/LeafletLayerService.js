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
    <div style="font-family:Inter,sans-serif;min-width:180px;max-width:280px;">
      <div style="font-weight:600;font-size:12.5px;color:#0b3558;padding:0 0 4px;border-bottom:1px solid #e4e8ed;margin-bottom:6px;">${escapeHtml(title)}</div>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
        ${rows || '<tr><td style="color:#7488a0;">No attributes</td></tr>'}
      </table>
    </div>`
}

// L.geoJSON for a backend layer response (Point / LineString / Polygon /
// MultiPolygon) exactly like REF.html — no manual geometry transforms.
export function createCatalogLayer(geojson, { layerName = '', category = '' } = {}) {
  const collection = geojson?.features ? geojson : { type: 'FeatureCollection', features: geojson?.features || [] }
  const style = styleForCategory(category, layerName)
  return L.geoJSON(collection, {
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
      // Hover tooltip only — clicking a catalog feature never opens a popup
      // (click must stay free for the role-based facility action).
      leafletLayer.bindTooltip(catalogPopupHtml(feature.properties), {
        sticky: true,
        direction: 'top',
        offset: [0, -6],
      })
    },
  })
}

export function colorForId(id) {
  let hash = 0
  for (const char of String(id || 'unknown')) hash = ((hash << 5) - hash) + char.charCodeAt(0)
  return `hsl(${Math.abs(hash) % 360} 58% 42%)`
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
// category, status and gap score only — never buttons, links or scrolling.
// Popup content is derived from the mapped facility (backend fields only).
export function facilityPopupHtml(facility) {
  const gap = Number.isFinite(facility.gapScore) ? facility.gapScore : null
  const gapLabel = gap !== null ? ` · Gap ${Math.round(gap * 100)}%` : ''
  const gapColor = gap > 0.66 ? '#c0392b' : gap > 0.33 ? '#e07a2c' : '#1f7a54'
  return `
    <div style="font-family:Inter,sans-serif;min-width:150px;max-width:220px;padding:2px 0;">
      <div style="font-weight:600;font-size:12.5px;color:#0b3558;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(facility.name || '')}</div>
      <div style="font-size:11.5px;color:#546882;margin-top:3px;">
        ${escapeHtml(facility.departmentName || '—')} · ${escapeHtml(facility.categoryLabel || '')}
      </div>
      <div style="font-size:11px;color:${gapLabel ? gapColor : '#7488a0'};margin-top:3px;text-transform:capitalize;">
        ${escapeHtml(facility.status || 'active')}${gapLabel}
      </div>
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

// Facilities → L.marker([latitude, longitude]) from backend [longitude, latitude].
// Hover shows a lightweight popup; leaving closes it.  Click never opens the
// popup — it reports the whole facility object so the parent decides between
// citizen navigation (/citizen/facility/:slug) and the admin right-side panel.
export function createFacilityMarkers(facilities, {
  colorBy = 'department',
  departmentColors = {},
  activeTool = 'none',
  onFacilityClick,
  map,
} = {}) {
  const group = L.layerGroup()
  const popup = map ? L.popup({ closeButton: false, offset: [0, -6], maxWidth: 240, interactive: false }) : null
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
      marker.on('mouseover', () => {
        if (activeTool !== 'none') return
        popup.setLatLng(marker.getLatLng())
        popup.setContent(facilityPopupHtml(facility))
        popup.openOn(map)
      })
      marker.on('mouseout', () => {
        if (popup.isOpen()) map.closePopup(popup)
      })
    }
    marker.on('click', () => {
      if (activeTool !== 'none') return
      if (popup?.isOpen()) map?.closePopup(popup)
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
    <div style="font-family:Inter,sans-serif;min-width:170px;max-width:240px;padding:2px 0;">
      <div style="font-weight:600;font-size:12.5px;color:#0b3558;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(facility.name || 'Spatial result')}</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:5px;">
        <tr><td style="color:#7488a0;padding:1px 0;">Category</td><td style="text-align:right;font-weight:600;color:#27364a;">${escapeHtml(category)}</td></tr>
        <tr><td style="color:#7488a0;padding:1px 0;">Department</td><td style="text-align:right;font-weight:600;color:#27364a;">${escapeHtml(department)}</td></tr>
        <tr><td style="color:#7488a0;padding:1px 0;">Distance</td><td style="text-align:right;font-weight:600;color:#27364a;">${distanceLabel}</td></tr>
        <tr><td style="color:#7488a0;padding:1px 0;">Hazard Safe</td><td style="text-align:right;">${hazard}</td></tr>
      </table>
      <div style="display:flex;gap:6px;margin-top:8px;padding-top:6px;border-top:1px solid #e4e8ed;">
        <button data-action="open-details" style="flex:1;background:#0b3558;color:#fff;border:none;border-radius:6px;padding:4px 0;font-size:11px;font-weight:600;cursor:pointer;">Open Details</button>
        <button data-action="navigate" style="flex:1;background:#fff;color:#0b3558;border:1px solid #c9d2dc;border-radius:6px;padding:4px 0;font-size:11px;font-weight:600;cursor:pointer;">Navigate</button>
      </div>
    </div>`
}

// Spatial-query result markers + interactive popup.  Uses the same facility
// icon style so results blend into the map vocabulary, but keeps itself in a
// separate layer (parents clear it on new searches).
export function createSearchResultMarkers(results, {
  onOpenDetails,
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

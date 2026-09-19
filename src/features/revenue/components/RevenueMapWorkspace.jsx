// RevenueMapWorkspace — Enterprise Native Leaflet GIS Map Workspace for Tax & Revenue
import React, { useRef, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react'
import L from 'leaflet'
import { createRoot } from 'react-dom/client'
import PropertyPopup from './PropertyPopup'
import MapView from '../../../components/map/MapView'
import { MAP_TOOLS } from '../../../hooks/useMapTools'
import { useMapTools } from '../../../hooks/useMapTools'
import { Tooltip } from '../../../components/ui'
import { calculatePropertyBounds } from '../utils/propertyBounds'
import {
  Navigation, ZoomIn, ZoomOut, Home, Target, Ruler
} from 'lucide-react'

// Default Nalanda District center (WGS84 [lng, lat] for MapView) — used as fallback only
const DEFAULT_CENTER = [78.10110535859422, 30.306395466450653]
const DEFAULT_ZOOM = 14

const BASEMAP_URLS = {
  osm: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  cartodark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
}

export const RevenueMapWorkspace = forwardRef(function RevenueMapWorkspace({
  cadastralFeatures = [],
  selectedFeatureId = null,
  selectedFeature = null,
  onFeatureSelect,
  onCloseProperty,
  onPayProperty,
  onReceiptProperty,
  onPaymentSuccess,
  onMapClick,
  basemap = 'osm',
  onBasemapChange,
  className = '',
  height = '100%',
  showToolbar = true,
  showBasemap = true,
}, ref) {
  const mapRef = useRef(null)
  const tools = useMapTools()
  const { activeTool } = tools
  const popupRef = useRef(null)
  const popupRootRef = useRef(null)

  useImperativeHandle(ref, () => ({
    focusFeature(feature) {
      const map = mapRef.current?.map
      if (!map || !feature?.geometry) return
      const bounds = L.geoJSON(feature).getBounds()
      if (bounds.isValid()) {
        map.flyToBounds(bounds, {
          maxZoom: 18,
          paddingTopLeft: [72, 96],
          paddingBottomRight: [72, 120],
          duration: 1.2,
        })
      }
    },
  }), [])

  useEffect(() => {
    const map = mapRef.current?.map
    if (!map) return

    // Close existing popup immediately
    if (popupRef.current) {
      map.closePopup(popupRef.current)
      popupRef.current = null
    }

    // Defer root unmount to next microtask to avoid sync unmount during render
    const prevRoot = popupRootRef.current
    if (prevRoot) {
      queueMicrotask(() => {
        prevRoot.unmount()
      })
    }
    popupRootRef.current = null

    if (!selectedFeature?.geometry) return
    const bounds = L.geoJSON(selectedFeature).getBounds()
    if (!bounds.isValid()) return
    const node = document.createElement('div')
    const root = createRoot(node)
    const close = () => onCloseProperty?.()
    root.render(<PropertyPopup feature={selectedFeature} onClose={close} onPay={onPayProperty} onReceipt={onReceiptProperty} onPaymentSuccess={onPaymentSuccess} />)
    const popup = L.popup({ autoPan: true, closeButton: false, maxWidth: 390, minWidth: 320, className: 'ndisp-tax-property-popup' })
      .setLatLng(bounds.getCenter()).setContent(node)
    let opened = false
    const openPopup = () => {
      if (opened) return
      opened = true
      popup.openOn(map)
      popupRef.current = popup
    }
    map.once('moveend', openPopup)
    const fallbackTimer = window.setTimeout(openPopup, 1350)
    popupRootRef.current = root
    return () => {
      window.clearTimeout(fallbackTimer)
      map.off('moveend', openPopup)
      // Defer unmount to next microtask
      const rootToUnmount = popupRootRef.current
      if (rootToUnmount) {
        queueMicrotask(() => {
          rootToUnmount.unmount()
        })
      }
      if (popupRef.current === popup) popupRef.current = null
    }
  }, [selectedFeature, onCloseProperty, onPayProperty, onReceiptProperty])

  // Fit map to cadastral features on initial load
  const viewportInitializedRef = useRef(false)
  useEffect(() => {
    if (viewportInitializedRef.current) return
    if (!cadastralFeatures?.length) return

    const map = mapRef.current?.map
    if (!map) return

    try {
      // Filter features with valid geometry
      const validFeatures = cadastralFeatures.filter(f => f.geometry)
      if (validFeatures.length === 0) return

      // Calculate bounds from all valid features
      const bounds = calculatePropertyBounds(validFeatures)
      if (!bounds || !bounds.isValid()) return

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 16,
        duration: 1.0,
      })
      viewportInitializedRef.current = true
      console.debug('[RevenueMapWorkspace] Map fitted to cadastral property bounds')
    } catch (err) {
      console.warn('[RevenueMapWorkspace] Failed to fit map to cadastral bounds:', err)
    }
  }, [cadastralFeatures])

  const vectorLayers = useMemo(() => {
    if (!cadastralFeatures || !cadastralFeatures.length) return []
    return [{
      layerName: 'data_resi',
      category: 'revenue',
      geometryType: 'MultiPolygon',
      features: cadastralFeatures,
      style: (layerId, feature) => {
        const props = feature.properties || {}
        const isPaid = props.is_paid === true || props.is_paid === 1 || String(props.is_paid).toLowerCase() === 'true' || String(props.tax_status || props.status).toUpperCase() === 'PAID' || props.isPaid === true
        const isSelected = Boolean(
          selectedFeatureId && (
            String(selectedFeatureId) === String(feature.id) ||
            String(selectedFeatureId) === String(props.id) ||
            String(selectedFeatureId) === String(props.plot_no) ||
            String(selectedFeatureId) === `data_resi_${feature.id}`
          )
        )

        if (isSelected) {
          return { fillColor: isPaid ? '#22c55e' : '#ef4444', fillOpacity: 0.85, color: '#ffcc00', weight: 4 }
        }
        return {
          fillColor: isPaid ? '#22c55e' : '#ef4444',
          fillOpacity: isPaid ? 0.65 : 0.50,
          color: isPaid ? '#15803d' : '#b91c1c',
          weight: isPaid ? 2 : 1.5
        }
      }
      ,onFeatureClick: (feature) => {
        if (activeTool === MAP_TOOLS.NONE) onFeatureSelect?.(`data_resi_${feature.id}`, feature)
      }
    }]
  }, [cadastralFeatures, selectedFeatureId, onFeatureSelect, activeTool])

  return (
    <div className={`relative w-full h-full ${className}`} style={{ height }}>
      <MapView
        ref={mapRef}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        vectorLayers={vectorLayers}
        basemapUrl={BASEMAP_URLS[basemap] || BASEMAP_URLS.osm}
        onFacilityClick={(id) => onFeatureSelect?.(id)}
        onMapClick={(point) => {
          if (activeTool === MAP_TOOLS.NONE) onMapClick?.(point)
          else tools.handleMapClick(point)
        }}
        selectedId={selectedFeatureId}
        activeTool={activeTool}
        measurePoints={tools.measurePoints}
        measureDistKm={tools.measureDistKm}
        measureAreaSqm={tools.measureAreaSqm}
        measureMode={tools.measureMode}
        className="w-full h-full"
      />

      {showToolbar && (
        <div className="absolute top-20 left-4 z-20 flex flex-col gap-1 bg-white/90 backdrop-blur p-1 rounded-lg border border-slate-200 shadow-lg">
          <Tooltip content="Pan/Select">
            <button
              onClick={() => tools.selectTool(MAP_TOOLS.NONE)}
              className={`w-8 h-8 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 ${activeTool === MAP_TOOLS.NONE ? 'bg-blue-100 text-blue-600 font-bold' : ''}`}
            >
              <Navigation className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Measure Distance">
            <button
              onClick={() => tools.selectTool(MAP_TOOLS.MEASURE)}
              aria-label="Measure distance"
              className={`w-8 h-8 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 ${activeTool === MAP_TOOLS.MEASURE ? 'bg-blue-100 text-blue-600 font-bold' : ''}`}
            >
              <Ruler className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Measure Area">
            <button
              onClick={() => tools.selectTool(MAP_TOOLS.MEASURE_AREA)}
              aria-label="Measure area"
              className={`w-8 h-8 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 ${activeTool === MAP_TOOLS.MEASURE_AREA ? 'bg-blue-100 text-blue-600 font-bold' : ''}`}
            >
              <span className="text-xs font-bold">m²</span>
            </button>
          </Tooltip>

          <Tooltip content="Zoom In">
            <button
              onClick={() => {
                const m = mapRef.current?.map
                if (m) m.zoomIn()
              }}
              className="w-8 h-8 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Zoom Out">
            <button
              onClick={() => {
                const m = mapRef.current?.map
                if (m) m.zoomOut()
              }}
              className="w-8 h-8 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Reset View">
            <button
              onClick={() => mapRef.current?.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM)}
              className="w-8 h-8 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100"
            >
              <Home className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Locate Me">
            <button
              onClick={() => mapRef.current?.locateUser()}
              className="w-8 h-8 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100"
            >
              <Target className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      )}

      {(activeTool === MAP_TOOLS.MEASURE || activeTool === MAP_TOOLS.MEASURE_AREA || tools.measurePoints.length > 0) && (
        <div className="absolute bottom-12 left-4 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 bg-white/95 p-2 shadow-lg text-xs text-ink-700">
          <span className="font-semibold">{tools.measureMode === 'area' ? 'Area' : 'Distance'}: {tools.measureMode === 'area'
            ? (tools.measureAreaSqm == null ? 'Click at least 3 points' : tools.measureAreaSqm >= 1000000 ? `${(tools.measureAreaSqm / 1000000).toFixed(2)} km²` : `${tools.measureAreaSqm.toFixed(2)} m²`)
            : (tools.measureDistKm == null ? 'Click two or more points' : tools.measureDistKm >= 1 ? `${tools.measureDistKm.toFixed(2)} km` : `${Math.round(tools.measureDistKm * 1000)} m`)}</span>
          <button onClick={tools.removeLastMeasurePoint} disabled={!tools.measurePoints.length} className="rounded border border-ink-200 px-2 py-1 disabled:opacity-40">Undo</button>
          <button onClick={tools.finishMeasure} disabled={tools.measurePoints.length < (tools.measureMode === 'area' ? 3 : 2)} className="rounded border border-ink-200 px-2 py-1 disabled:opacity-40">Finish</button>
          <button onClick={tools.clearMeasure} className="rounded border border-ink-200 px-2 py-1">Clear</button>
        </div>
      )}

      {showBasemap && (
        <div className="absolute top-4 right-4 z-20 flex gap-1 bg-white/90 backdrop-blur p-1 rounded-lg border border-slate-200 shadow-md">
          {Object.keys(BASEMAP_URLS).map((bKey) => (
            <button
              key={bKey}
              onClick={() => onBasemapChange?.(bKey)}
              className={`px-2.5 py-1 text-xs font-semibold rounded uppercase transition-colors ${basemap === bKey ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {bKey}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

export default RevenueMapWorkspace

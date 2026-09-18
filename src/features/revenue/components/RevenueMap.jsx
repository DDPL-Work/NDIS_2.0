// Revenue & Property Intelligence — Revenue GIS Map
// GIS-first revenue command map using NDISP enterprise MapView

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import MapView from '../../../components/map/MapView'
import { useRevenueMap, usePropertySelection } from '../hooks'
import { REVENUE_GIS_LAYERS, REVENUE_MAP_STYLES, TAX_STATUS_COLORS, TAX_STATUS } from '../constants/revenueConstants'
import { MAP_TOOLS } from '../../../hooks/useMapTools'
import { formatCurrency, formatArea, truncate } from '../utils/revenueFormatters'
import { RevenueModeSelector } from './RevenueModeSelector'
import {
  RevenueMapToolbar,
  RevenueLayerManager,
  PropertyMapPopup,
  PropertyResultList,
  RevenueMapLegend,
} from './index'
import { RevenueFilters } from './RevenueFilters'
import { Button, Card, Tooltip, Select, Input, Badge } from '../../../components/ui'
import {
  Map, Filter, Layers, Download, RefreshCw, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, AlertCircle, Search, X, ChevronDown, ChevronUp,
  Eye, EyeOff, Target, Home, Ruler, Circle as CircleIcon, Crosshair,
  Navigation, ZoomIn, ZoomOut, HelpCircle, Layers as LayersIcon
} from 'lucide-react'

const DEFAULT_CENTER = [85.4434, 25.1372] // Nalanda
const DEFAULT_ZOOM = 10.4

function computeCentroid(geometry) {
  if (!geometry || !geometry.coordinates) return null
  const { type, coordinates } = geometry
  if (type === 'Point') return [coordinates[1], coordinates[0]]
  if (type === 'MultiPoint' && coordinates.length) return [coordinates[0][1], coordinates[0][0]]
  if (type === 'Polygon' && coordinates[0]?.length) {
    const ring = coordinates[0]
    const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length
    const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length
    return [lat, lng]
  }
  if (type === 'MultiPolygon' && coordinates[0]?.[0]?.length) {
    const ring = coordinates[0][0]
    const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length
    const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length
    return [lat, lng]
  }
  if (type === 'LineString' && coordinates.length) {
    const mid = Math.floor(coordinates.length / 2)
    return [coordinates[mid][1], coordinates[mid][0]]
  }
  return null
}

export function RevenueMap({
  selectedPropertyId: controlledSelectedId,
  onPropertySelect: controlledOnSelect,
  onPropertyClick,
  filters = {},
  className = '',
  height = 'calc(100vh - 160px)',
  showToolbar = true,
  showLayerManager = true,
  showLegend = true,
  showResultList = true,
  compact = false,
}) {
  const mapRef = useRef(null)
  const resultListRef = useRef(null)
  const popupRef = useRef(null)
  const layerPanelRef = useRef(null)
  const filterPanelRef = useRef(null)
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [hasFitBounds, setHasFitBounds] = useState(false)
  const [activeSearchTab, setActiveSearchTab] = useState('properties') // 'properties' | 'locations'
  const [searchResults, setSearchResults] = useState([])

  // Close panels on Escape key press or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowLayerPanel(false)
        setShowFilterPanel(false)
      }
    }
    const handleClickOutside = (e) => {
      if (layerPanelRef.current && !layerPanelRef.current.contains(e.target) && !e.target.closest('button[aria-label="Toggle layer panel"]')) {
        setShowLayerPanel(false)
      }
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target) && !e.target.closest('button[aria-label="Toggle filter panel"]')) {
        setShowFilterPanel(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Invalidate map size after panel toggle transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize?.()
    }, 150)
    return () => clearTimeout(timer)
  }, [showLayerPanel, showFilterPanel])

  const {
    mapState,
    selectedPropertyId: hookSelectedId,
    hoveredPropertyId,
    isLoading,
    error,
    propertiesData,
    gisData,
    clusterEnabled,
    visibleLayers,
    hasPermission,
    getLayerStyle,
    analyticalMode,
    heatPoints,
    setAnalyticalMode,
    setCenter,
    setZoom,
    setBasemap,
    toggleLayer,
    setActiveLayers,
    setShowHeatmap,
    setHeatmapType,
    setClusterEnabled,
    setFilters,
    selectProperty: hookSelectProperty,
    hoverProperty,
    clearHover,
    clearSelection,
    flyToProperty,
    fitBounds,
    loadProperties,
    loadGisData,
    refresh,
  } = useRevenueMap(filters)

  const selectedPropertyId = controlledSelectedId ?? hookSelectedId
  const onPropertySelect = controlledOnSelect ?? ((id) => { /* uncontrolled */ })

  useEffect(() => {
    if (controlledSelectedId !== undefined && controlledSelectedId !== hookSelectedId) {
      // Selection controlled externally
    }
  }, [controlledSelectedId, hookSelectedId])

  const { selectedProperty, handleMapSelect, handleListSelect } = usePropertySelection(
    propertiesData,
    selectedPropertyId,
    (id) => {
      if (controlledOnSelect) {
        controlledOnSelect(id)
      } else {
        if (id) {
          hookSelectProperty(id)
        } else {
          clearSelection()
        }
      }
    }
  )

  // Also search in gisData features for selected property (primary source)
  const selectedGisFeature = useMemo(() => {
    if (!selectedPropertyId || !gisData?.features?.length) return null
    return gisData.features.find(f => String(f.id) === String(selectedPropertyId))
  }, [selectedPropertyId, gisData])

  const selectedPropertyFromGis = useMemo(() => {
    if (!selectedGisFeature) return null
    const props = selectedGisFeature.properties || {}
    return {
      id: String(props.id || selectedGisFeature.id),
      plotNo: props.plotId || props.plot_no || '',
      ownerName: props.ownerName || props.owner_name || '',
      taxStatus: props.taxStatus || 'due',
      currentDemand: props.demand || 0,
      totalPaid: props.paid || 0,
      totalOutstanding: props.outstanding || 0,
      totalArrears: props.totalArrears || 0,
      latitude: selectedGisFeature.geometry ? computeCentroid(selectedGisFeature.geometry)?.[0] : 0,
      longitude: selectedGisFeature.geometry ? computeCentroid(selectedGisFeature.geometry)?.[1] : 0,
    }
  }, [selectedGisFeature])

  const effectiveSelectedProperty = selectedProperty || selectedPropertyFromGis

  // Load data on mount
  useEffect(() => {
    loadProperties()
    loadGisData()
  }, [])

  // PRIMARY: Build vector layers from gisData (cadastral GeoJSON)
  const vectorLayers = useMemo(() => {
    const features = gisData?.features
    if (!features?.length) return []

    const featuresByStatus = features.reduce((acc, feature) => {
      const status = feature.properties?.taxStatus || 'due'
      if (!acc[status]) acc[status] = []
      acc[status].push(feature)
      return acc
    }, {})

    return Object.entries(featuresByStatus).map(([status, feats]) => ({
      layerName: `properties_${status}`,
      category: 'revenue',
      geometryType: feats[0]?.geometry?.type || 'Polygon',
      features: feats,
      style: getLayerStyle,
    }))
  }, [gisData, getLayerStyle])

  // Build facility markers from gisData centroids (for click interaction)
  const facilityMarkers = useMemo(() => {
    const features = gisData?.features
    if (!features?.length) return []

    return features
      .map(f => {
        const centroid = computeCentroid(f.geometry)
        if (!centroid) return null
        const props = f.properties || {}
        return {
          id: String(props.id || f.id),
          name: props.plotId || props.plot_no || `Property ${f.id}`,
          position: [centroid[1], centroid[0]],
          department: 'revenue',
          type: 'property',
          taxStatus: props.taxStatus,
          currentDemand: props.demand,
          totalPaid: props.paid,
          totalOutstanding: props.outstanding,
          plotNo: props.plotId || '',
          ownerName: props.ownerName || '',
        }
      })
      .filter(Boolean)
  }, [gisData])

  // Fallback: markers from propertiesData if gisData has no features
  const fallbackMarkers = useMemo(() => {
    if (facilityMarkers.length > 0) return []
    if (!propertiesData?.data?.length) return []
    return propertiesData.data
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        id: p.id,
        name: p.plotNo || p.houseNo || `Property ${p.id}`,
        position: [p.longitude, p.latitude],
        department: 'revenue',
        type: 'property',
        taxStatus: p.taxStatus,
        currentDemand: p.currentDemand,
        totalPaid: p.totalPaid,
        totalOutstanding: p.totalOutstanding,
        plotNo: p.plotNo,
        ownerName: p.ownerName,
      }))
  }, [facilityMarkers, propertiesData])

  const activeMarkers = facilityMarkers.length > 0 ? facilityMarkers : fallbackMarkers

  // Auto-fit map to data bounds after first load
  useEffect(() => {
    if (hasFitBounds || !gisData?.features?.length || !mapRef.current) return
    const allCoords = []
    gisData.features.forEach(f => {
      if (!f.geometry?.coordinates) return
      const { type, coordinates } = f.geometry
      if (type === 'Polygon') {
        coordinates[0]?.forEach(c => allCoords.push(c))
      } else if (type === 'MultiPolygon') {
        coordinates.forEach(poly => poly[0]?.forEach(c => allCoords.push(c)))
      } else if (type === 'Point') {
        allCoords.push(coordinates)
      }
    })
    if (allCoords.length >= 2) {
      const lngs = allCoords.map(c => c[0])
      const lats = allCoords.map(c => c[1])
      const bounds = [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ]
      fitBounds(bounds)
      setHasFitBounds(true)
    }
  }, [gisData, hasFitBounds, fitBounds])

  const activeLayerIds = useMemo(() => {
    const ids = visibleLayers.map(l => l.id)
    if (ids.length > 0) return ids
    return ['paid', 'due', 'partial', 'arrears', 'property_parcels', 'paid_properties', 'due_properties', 'arrears_properties', 'partial_properties', 'high_value', '1_to_3_years', '3_to_5_years', 'above_5_years']
  }, [visibleLayers])

  // Event handlers
  const handleMapClick = useCallback((event) => {
    onPropertyClick?.(event)
  }, [onPropertyClick])

  const handleFacilityClick = useCallback((facility) => {
    handleMapSelect(facility.id)
  }, [handleMapSelect])

  const handleFacilityHover = useCallback((facility) => {
    hoverProperty(facility.id)
  }, [hoverProperty])

  const handleFacilityLeave = useCallback(() => {
    clearHover()
  }, [clearHover])

  const handleResultSelect = useCallback((property) => {
    handleListSelect(property.id)
    flyToProperty(property)
  }, [handleListSelect, flyToProperty])

  const handleRefresh = useCallback(() => {
    setHasFitBounds(false)
    refresh()
  }, [refresh])

  const handleExport = useCallback(() => {
    mapRef.current?.snapshot()
  }, [])

  const handleFlyToLocation = useCallback((type, id) => {
    if (type === 'district') {
      mapRef.current?.flyTo([25.1372, 85.4434], 10.4, { duration: 0.9 })
    } else if (type === 'block' && id) {
      const blockProperties = gisData?.features?.filter(f => f.properties?.blockId === id)
      if (blockProperties?.length) {
        const coords = blockProperties
          .map(f => computeCentroid(f.geometry))
          .filter(Boolean)
        if (coords.length) {
          const bounds = coords.reduce((b, c) => [
            [Math.min(b[0][0], c[0]), Math.min(b[0][1], c[1])],
            [Math.max(b[1][0], c[0]), Math.max(b[1][1], c[1])]
          ], [coords[0], coords[0]])
          fitBounds(bounds)
        }
      }
    }
  }, [gisData, fitBounds])

  const handleSearch = useCallback((query, result) => {
    if (result) {
      handleResultSelect(result)
    } else if (query) {
      // Client-side search in loaded properties
      const allProps = [...(gisData?.features || []), ...(propertiesData?.data || [])]
      const results = allProps.filter(p => {
        const props = p.properties || p
        const searchLower = query.toLowerCase()
        return (
          (props.id?.toString().includes(searchLower)) ||
          (props.plotId?.toString().toLowerCase().includes(searchLower)) ||
          (props.ownerName?.toLowerCase().includes(searchLower)) ||
          (props.blockName?.toString().toLowerCase().includes(searchLower)) ||
          (props.wardName?.toString().toLowerCase().includes(searchLower)) ||
          (props.villageName?.toString().toLowerCase().includes(searchLower))
        )
      }).slice(0, 20)
      setSearchResults(results.map(p => ({
        id: p.properties?.id || p.id,
        query: query,
        label: p.properties?.plotId || p.plotNo || `Property ${p.properties?.id || p.id}`,
        description: `${p.properties?.ownerName || p.ownerName || 'Unknown owner'} • ${p.properties?.blockName || p.blockName || ''} ${p.properties?.wardName || p.wardName || ''}`.trim(),
      })))
      setShowLayerPanel(false)
      setShowFilterPanel(false)
    }
  }, [gisData, propertiesData, handleResultSelect])

  const handleLayerToggle = useCallback((layerId) => {
    toggleLayer(layerId)
  }, [toggleLayer])

  const handleLayerOpacityChange = useCallback((layerId, opacity) => {
    // Update layer opacity
  }, [])

  const handleLayerStyleChange = useCallback((layerId, style) => {
    // Update layer style
  }, [])

  const handleLayerOrderChange = useCallback((layerIds) => {
    setActiveLayers(layerIds)
  }, [setActiveLayers])

  const handleRowAction = useCallback((action, property) => {
    switch (action) {
      case 'map':
        flyToProperty(property)
        break
      case 'view':
        onPropertySelect?.(property.id)
        break
    }
  }, [flyToProperty, onPropertySelect])

  const basemaps = {
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    cartodark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    cartolight: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  }

  const showPopup = selectedPropertyId && effectiveSelectedProperty

  const totalCount = propertiesData?.pagination?.count || propertiesData?.data?.length || gisData?.features?.length || 0

  // Filter handling
  const filterConfig = useMemo(() => {
    const taxStatuses = gisData?.features?.map(f => f.properties?.taxStatus).filter(Boolean) || []
    const blocks = gisData?.features?.map(f => f.properties?.blockId).filter(Boolean) || []
    return { taxStatuses: [...new Set(taxStatuses)], blocks: [...new Set(blocks)] }
  }, [gisData])

  return (
    <div className={`relative flex flex-col min-h-0 ${className}`} style={{ height }}>
      {/* Analytical Mode Selector Header */}
      <div className="z-30 w-full bg-white border-b border-ink-200 shadow-sm flex-shrink-0">
        <RevenueModeSelector
          activeMode={analyticalMode}
          onModeChange={setAnalyticalMode}
        />
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {/* Map View Toolbar */}
        {showToolbar && (
          <RevenueMapToolbar
            mapRef={mapRef}
            mapState={mapState}
            onMapStateChange={(updates) => {
              if (updates.center) setCenter(updates.center)
              if (updates.zoom) setZoom(updates.zoom)
              if (updates.basemap) setBasemap(updates.basemap)
            }}
            onToolChange={(tool) => {
              // Tool changes handled by MapView internally
            }}
            onSearch={handleSearch}
            onRefresh={handleRefresh}
            onExport={handleExport}
            onFlyToLocation={handleFlyToLocation}
            onLocateUser={() => {
              if (!navigator.geolocation) return
              navigator.geolocation.getCurrentPosition((pos) => {
                mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1 })
              })
            }}
            onToggleFullscreen={() => {
              // Fullscreen handled by parent or CSS
            }}
            activeTool={MAP_TOOLS.NONE}
            searchResults={searchResults}
            className="top-3 z-20"
          />
        )}

        <MapView
          ref={mapRef}
          center={mapState.center}
          zoom={mapState.zoom}
          facilities={activeMarkers}
          vectorLayers={vectorLayers}
          basemapUrl={basemaps[mapState.basemap]}
          onFacilityClick={handleFacilityClick}
          onFacilityHover={handleFacilityHover}
          onFacilityLeave={handleFacilityLeave}
          onMapClick={handleMapClick}
          selectedId={selectedPropertyId}
          showHeat={mapState.showHeatmap}
          heatPoints={heatPoints}
          clusterEnabled={clusterEnabled}
          className="rounded-xl"
          onReady={(map) => {
            if (!hasFitBounds && gisData?.features?.length) {
              // Fit bounds after map is ready with data
            }
          }}
        />

        {/* Layer Toggle Button (floating) */}
        <Tooltip content="Toggle Layer Panel">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className="absolute top-28 left-3 z-20 flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg shadow-md border border-ink-200 text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors"
            aria-label="Toggle layer panel"
          >
            <LayersIcon className="w-4 h-4" />
            Layers
            {showLayerPanel ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>

        {/* Filter Toggle Button (floating) */}
        <Tooltip content="Toggle Filter Panel">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="absolute top-28 right-3 z-20 flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg shadow-md border border-ink-200 text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors"
            aria-label="Toggle filter panel"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilterPanel ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>

        {/* Collapsible Layer Panel */}
        {showLayerPanel && (
          <div ref={layerPanelRef} className="absolute top-40 left-3 z-20 w-72 max-h-[480px] bg-white rounded-lg shadow-lg border border-ink-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-ink-100 bg-ink-50">
              <span className="text-xs font-semibold text-ink-700 uppercase tracking-wide">GIS Layers</span>
              <button
                onClick={() => setShowLayerPanel(false)}
                className="p-1 rounded hover:bg-ink-200 transition-colors"
                aria-label="Close layer panel"
              >
                <X className="w-3.5 h-3.5 text-ink-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[440px]">
              <RevenueLayerManager
                activeLayers={activeLayerIds}
                onLayerToggle={handleLayerToggle}
                onLayerStyleChange={handleLayerStyleChange}
                onLayerOpacityChange={handleLayerOpacityChange}
                onLayerOrderChange={handleLayerOrderChange}
                visibleLayers={visibleLayers}
                userRole={undefined}
                hasPermission={hasPermission}
                compact
              />
            </div>
          </div>
        )}

        {/* Collapsible Filter Panel */}
        {showFilterPanel && (
          <div ref={filterPanelRef} className="absolute top-40 right-3 z-20 w-80 max-h-[520px] bg-white rounded-lg shadow-lg border border-ink-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-ink-100 bg-ink-50">
              <span className="text-xs font-semibold text-ink-700 uppercase tracking-wide">GIS Filters</span>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="p-1 rounded hover:bg-ink-200 transition-colors"
                aria-label="Close filter panel"
              >
                <X className="w-3.5 h-3.5 text-ink-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[480px] p-3">
              <RevenueFilters
                filters={filters}
                onFiltersChange={setFilters}
                onSearch={(q) => handleSearch(q)}
                onClear={() => setFilters({})}
                showAdvanced
              />
            </div>
          </div>
        )}

        {/* Loading Indicator (Non-blocking pill) */}
        {isLoading && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur border border-ink-200 shadow-md px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium text-ink-700 pointer-events-auto">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span>Loading cadastral property data...</span>
          </div>
        )}

        {/* Data Error Toast (Non-blocking floating card) */}
        {error && !isLoading && !gisData?.features?.length && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 max-w-sm bg-white border border-red-200 shadow-xl rounded-xl p-3.5 flex items-start gap-3 pointer-events-auto">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-ink-900">Property data unavailable</h4>
              <p className="text-[11px] text-ink-500 mt-0.5 leading-snug">
                Unable to load cadastral property data from server.
              </p>
            </div>
            <Button variant="primary" size="xs" onClick={handleRefresh} className="shrink-0 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Empty State Banner (Non-blocking pill) */}
        {!isLoading && !error && !gisData?.features?.length && !propertiesData?.data?.length && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur border border-ink-200 shadow-md px-4 py-2 rounded-xl flex items-center gap-3 text-xs pointer-events-auto">
            <Filter className="w-4 h-4 text-ink-400 flex-shrink-0" />
            <span className="text-ink-700 font-medium">No cadastral properties match current filters.</span>
            <button
              onClick={() => setFilters({ financialYear: '2025-26' })}
              className="text-blue-600 font-semibold hover:underline ml-1"
            >
              Clear
            </button>
          </div>
        )}

        {/* Property Popup */}
        {showPopup && (
          <PropertyMapPopup
            ref={popupRef}
            property={effectiveSelectedProperty}
            onClose={() => onPropertySelect?.(null)}
            onAction={(action, property) => {
              onPropertySelect?.(null)
            }}
            className="animate-slide-up"
          />
        )}

        {/* Legend */}
        {showLegend && !isLoading && gisData?.features?.length > 0 && (
          <div className="absolute bottom-3 left-3 z-20">
            <RevenueMapLegend
              activeLayers={activeLayerIds}
              className=""
              compact
            />
          </div>
        )}

        {/* Scale & Attribution */}
        <div className="absolute bottom-1 right-3 z-10 text-[10px] text-ink-400 bg-white/70 px-1.5 py-0.5 rounded">
          © OpenStreetMap contributors
        </div>
      </div>

      {/* Result List Panel (hidden when Property Map Popup is active to prevent overlap) */}
      {showResultList && !showPopup && (activeMarkers.length > 0 || propertiesData?.data?.length > 0) && (
        <div className={`absolute bottom-3 right-3 z-20 w-80 max-h-[320px] ${compact ? 'w-64' : ''} transition-transform duration-200`}>
          <PropertyResultList
            ref={resultListRef}
            properties={propertiesData?.data || []}
            isLoading={isLoading}
            pagination={propertiesData?.pagination || { count: 0, next: null, previous: null }}
            page={1}
            totalPages={Math.ceil(totalCount / 20)}
            onPageChange={() => {}}
            onSelect={handleListSelect}
            onMapSelect={handleResultSelect}
            onRowAction={handleRowAction}
            compact={compact}
            showPagination={false}
            selectable
            title={`Results (${totalCount})`}
            showFilters={false}
            showExport={false}
          />
        </div>
      )}
    </div>
  )
}

export default RevenueMap
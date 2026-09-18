import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { REVENUE_GIS_LAYERS } from '../constants/revenueConstants'
import { useAuthStore } from '../../../app/store/authStore'
import { colorPropertyByMode, computeHeatPoints } from '../utils/revenueGisUtils'


const DEFAULT_CENTER = [85.4434, 25.1372]
const DEFAULT_ZOOM = 10.4
const STORAGE_KEY = 'ndisp_revenue_map_state'

export function useRevenueMap(initialFilters = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore(s => s.user)
  const userRole = user?.role

  const [mapState, setMapState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          center: parsed.center || DEFAULT_CENTER,
          zoom: parsed.zoom || DEFAULT_ZOOM,
          basemap: parsed.basemap || 'osm',
          activeLayers: parsed.activeLayers || REVENUE_GIS_LAYERS.filter(l => l.defaultVisible).map(l => l.id),
          showHeatmap: parsed.showHeatmap || false,
          heatmapType: parsed.heatmapType || 'collection',
        }
      }
    } catch (e) {
      console.warn('Failed to load map state from storage', e)
    }
    return {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      basemap: 'osm',
      activeLayers: REVENUE_GIS_LAYERS.filter(l => l.defaultVisible).map(l => l.id),
      showHeatmap: false,
      heatmapType: 'collection',
    }
  })

  const [filters, setFilters] = useState(() => {
    const propertyId = searchParams.get('property')
    return { ...initialFilters, ...(propertyId ? { propertyId } : {}) }
  })

  const [selectedPropertyId, setSelectedPropertyId] = useState(() => searchParams.get('property'))
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [propertiesData, setPropertiesData] = useState(null)
  const [gisData, setGisData] = useState(null)
  const [clusterEnabled, setClusterEnabled] = useState(false)

  const abortControllerRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapState))
    } catch (e) {
      console.warn('Failed to save map state', e)
    }
  }, [mapState])

  useEffect(() => {
    const propertyId = searchParams.get('property')
    if (propertyId !== selectedPropertyId) {
      setSelectedPropertyId(propertyId)
    }
  }, [searchParams, selectedPropertyId])

  const updateMapState = useCallback((updatesOrFn) => {
    setMapState(prev => {
      const updates = typeof updatesOrFn === 'function' ? updatesOrFn(prev) : updatesOrFn
      return { ...prev, ...updates }
    })
  }, [])

  const setCenter = useCallback((center) => {
    updateMapState({ center })
  }, [updateMapState])

  const setZoom = useCallback((zoom) => {
    updateMapState({ zoom })
  }, [updateMapState])

  const setBasemap = useCallback((basemap) => {
    updateMapState({ basemap })
  }, [updateMapState])

  const toggleLayer = useCallback((layerId) => {
    setMapState(prev => ({
      ...prev,
      activeLayers: prev.activeLayers.includes(layerId)
        ? prev.activeLayers.filter(id => id !== layerId)
        : [...prev.activeLayers, layerId]
    }))
  }, [])

  const setActiveLayers = useCallback((layers) => {
    updateMapState({ activeLayers: layers })
  }, [updateMapState])

  const setShowHeatmap = useCallback((show) => {
    updateMapState({ showHeatmap: show })
  }, [updateMapState])

  const setHeatmapType = useCallback((type) => {
    updateMapState({ heatmapType: type })
  }, [updateMapState])

  // setClusterEnabled is already available from useState

  // setFilters is already available from useState
  // Use updateFilters for the function version
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const selectProperty = useCallback((propertyId) => {
    if (propertyId === selectedPropertyId) {
      setSelectedPropertyId(null)
      setSearchParams({})
    } else {
      setSelectedPropertyId(propertyId)
      setSearchParams({ property: propertyId })
    }
  }, [selectedPropertyId, setSearchParams])

  const hoverProperty = useCallback((propertyId) => {
    setHoveredPropertyId(propertyId)
  }, [])

  const clearHover = useCallback(() => {
    setHoveredPropertyId(null)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedPropertyId(null)
    setSearchParams({})
  }, [setSearchParams])

  const flyToProperty = useCallback(async (property) => {
    if (!property) return
    const coords = property.geometry?.coordinates ||
      (property.latitude && property.longitude ? [property.longitude, property.latitude] : null)
    if (coords) {
      updateMapState({
        center: [coords[1], coords[0]],
        zoom: Math.max(mapState.zoom, 16)
      })
      selectProperty(property.id)
    }
  }, [mapState.zoom, updateMapState, selectProperty])

  const fitBounds = useCallback((bounds) => {
    // bounds: [[minLat, minLng], [maxLat, maxLng]]
    // This would be handled by MapView's fitBounds
    // Store for MapView to consume
    updateMapState({ fitBounds: bounds })
  }, [updateMapState])

  const propertiesAbortRef = useRef(null)
  const gisAbortRef = useRef(null)

  const loadProperties = useCallback(async (loadFilters = {}) => {
    if (propertiesAbortRef.current) {
      propertiesAbortRef.current.abort()
    }
    propertiesAbortRef.current = new AbortController()

    try {
      const { propertyTaxApi } = await import('../api/propertyTaxApi.js')
      const response = await propertyTaxApi.fetchTaxList({ ...filters, ...loadFilters })
      setPropertiesData(response)
      return response?.data || []
    } catch (err) {
      if (err.name !== 'AbortError') {
        if (import.meta.env.DEV) console.warn('[REVENUE TAX] Tax list fetch error (non-fatal for GIS map)', err)
        return []
      }
    }
  }, [filters])

  const loadGisData = useCallback(async (loadFilters = {}) => {
    if (gisAbortRef.current) {
      gisAbortRef.current.abort()
    }
    gisAbortRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    try {
      const { cadastralGisApi } = await import('../api/cadastralGisApi.js')
      const response = await cadastralGisApi.fetchCadastralLayer({ ...filters, ...loadFilters })
      setGisData(response)
      return response
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load cadastral GIS layer')
      }
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const refresh = useCallback(() => {
    loadProperties()
    loadGisData()
  }, [loadProperties, loadGisData])

  const hasPermission = useCallback((permission) => {
    if (!permission) return true
    const rolePermissions = {
      revenue_admin: ['*'],
      revenue_officer: ['view', 'edit'],
      revenue_inspector: ['view', 'inspect'],
      dm: ['*'],
      adm: ['*'],
      district_collector: ['*'],
      state_admin: ['*'],
      citizen: ['view_own']
    }
    const perms = rolePermissions[userRole] || []
    return perms.includes('*') || perms.includes(permission)
  }, [userRole])

  const visibleLayers = useMemo(() => {
    return REVENUE_GIS_LAYERS.filter(layer => {
      if (!mapState.activeLayers.includes(layer.id)) return false
      if (layer.requiredPermission && !hasPermission(layer.requiredPermission)) return false
      return true
    })
  }, [mapState.activeLayers, hasPermission])

  const [analyticalMode, setAnalyticalMode] = useState('PROPERTY')

  const heatPoints = useMemo(() => {
    if (!gisData?.features) return []
    const props = gisData.features.map(f => f.properties)
    return computeHeatPoints(props, analyticalMode)
  }, [gisData, analyticalMode])

  const getLayerStyle = useCallback((layerId, feature) => {
    const featId = feature?.id || feature?.properties?.id || feature?.properties?.plot_no
    const isSelected = Boolean(
      selectedPropertyId && (
        String(featId) === String(selectedPropertyId) ||
        String(feature?.properties?.id) === String(selectedPropertyId) ||
        String(feature?.properties?.plot_no) === String(selectedPropertyId) ||
        `data_resi_${feature?.id}` === String(selectedPropertyId)
      )
    )
    const isHovered = Boolean(hoveredPropertyId && String(featId) === String(hoveredPropertyId))

    const hexColor = colorPropertyByMode(feature?.properties, analyticalMode)

    const style = {
      fillColor: hexColor,
      color: hexColor,
      fillOpacity: 0.6,
      weight: 2
    }

    if (isSelected) {
      return { ...style, color: '#ffcc00', weight: 4, fillOpacity: 0.85 }
    }
    if (isHovered) {
      return { ...style, weight: style.weight + 1, fillOpacity: 0.8 }
    }

    return style
  }, [selectedPropertyId, hoveredPropertyId, analyticalMode])

  return {
    mapState,
    filters,
    selectedPropertyId,
    hoveredPropertyId,
    isLoading,
    error,
    propertiesData,
    gisData,
    clusterEnabled,
    visibleLayers,
    analyticalMode,
    heatPoints,
    setAnalyticalMode,
    hasPermission,
    getLayerStyle,
    updateMapState,
    setCenter,
    setZoom,
    setBasemap,
    toggleLayer,
    setActiveLayers,
    setShowHeatmap,
    setHeatmapType,
    setClusterEnabled,
    setFilters,
    selectProperty,
    hoverProperty,
    clearHover,
    clearSelection,
    flyToProperty,
    fitBounds,
    loadProperties,
    loadGisData,
    refresh,
  }
}
// Revenue & Property Intelligence — Revenue Map Toolbar
// Toolbar for the revenue map with search, tools, basemap selector, and measurements

import { useState, useRef, useEffect } from 'react'
import { MAP_TOOLS } from '../../../hooks/useMapTools'
import {
  Search, MapPin, Navigation, ZoomIn, ZoomOut, Home,
  Maximize2, Minimize2, Layers, Filter, Ruler, Circle,
  Crosshair, Target, RefreshCw, Download, Eye, EyeOff,
  ChevronDown, ChevronUp, HelpCircle, MousePointer, Ruler as RulerIcon
} from 'lucide-react'
import { Button, Card, Select, Input, Tooltip } from '../../../components/ui'

const BASEMAPS = {
  osm: { label: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap' },
  satellite: { label: 'ESRI Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '© Esri' },
  topo: { label: 'ESRI Topo', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', attribution: '© Esri' },
  cartolight: { label: 'Carto Voyager', url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attribution: '© CARTO' },
}

const SEARCH_PLACEHOLDERS = [
  'Search by property ID, plot number...',
  'Search by owner name...',
  'Search by ward/block/village...',
  'Search by assessment ID...',
]

export function RevenueMapToolbar({
  mapRef,
  mapState,
  onMapStateChange,
  onToolChange,
  onSearch,
  onRefresh,
  onExport,
  onFlyToLocation,
  onLocateUser,
  onToggleFullscreen,
  isFullscreen = false,
  activeTool = MAP_TOOLS.NONE,
  searchResults = [],
  selectedSearchResult = null,
  className = '',
}) {
  const [basemap, setBasemap] = useState(mapState.basemap || 'osm')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showBasemapPicker, setShowBasemapPicker] = useState(false)
  const [showToolMenu, setShowToolMenu] = useState(false)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [measurements, setMeasurements] = useState([])
  const searchInputRef = useRef(null)
  const basemapPickerRef = useRef(null)
  const toolMenuRef = useRef(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const currentBasemap = BASEMAPS[basemap] || BASEMAPS.osm

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
      if (basemapPickerRef.current && !basemapPickerRef.current.contains(event.target)) {
        setShowBasemapPicker(false)
      }
      if (toolMenuRef.current && !toolMenuRef.current.contains(event.target)) {
        setShowToolMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setBasemap(mapState.basemap || 'osm')
  }, [mapState.basemap])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim())
      setShowSearchResults(true)
    }
  }

  const handleSearchResultSelect = (result) => {
    onSearch?.(result.query || result.id, result)
    setSearchQuery(result.label || result.id)
    setShowSearchResults(false)
  }

  const handleBasemapChange = (newBasemap) => {
    setBasemap(newBasemap)
    onMapStateChange?.({ basemap: newBasemap })
    setShowBasemapPicker(false)
  }

  const handleToolSelect = (tool) => {
    onToolChange?.(tool)
    setShowToolMenu(false)
  }

  const handleMeasureComplete = (measurement) => {
    setMeasurements(prev => [...prev, measurement])
    setShowMeasurements(true)
  }

  const handleClearMeasurements = () => {
    setMeasurements([])
    setShowMeasurements(false)
  }

  const handleExportMap = () => {
    mapRef.current?.snapshot()
  }

  const handleLocateUser = () => {
    onLocateUser?.()
  }

  const handleFlyToDistrict = () => {
    onFlyToLocation?.('district')
  }

  const handleFlyToBlock = (blockId) => {
    onFlyToLocation?.('block', blockId)
  }

  const renderQuickActions = () => {
    if (isFullscreen) return null
    return (
      <div className="flex flex-wrap gap-2 bg-white border border-ink-200 rounded-lg p-2">
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <span>Quick Fly-to:</span>
          <Select
            value=""
            onValueChange={(v) => v && handleFlyToBlock(v)}
            options={[
              { value: '', label: 'Select Block...' },
              { value: 'silao', label: 'Silao Block' },
              { value: 'biharsharif', label: 'Bihar Sharif Block' },
              { value: 'harnaut', label: 'Harnaut Block' },
            ]}
            placeholder="Fly to Block..."
            className="w-40"
          />
          <button
            onClick={handleFlyToDistrict}
            className="px-3 py-1.5 text-xs bg-ink-100 text-ink-700 rounded hover:bg-ink-200 transition-colors"
          >
            District View
          </button>
        </div>

        <div className="flex-1" />

        {activeTool !== MAP_TOOLS.NONE && (
          <ActiveToolIndicator activeTool={activeTool} onDeactivate={() => handleToolSelect(MAP_TOOLS.NONE)} />
        )}
      </div>
    )
  }

  return (
    <div className={`absolute left-3 right-3 z-20 flex flex-col gap-2 ${className.includes('top-') ? '' : 'top-3'} ${className}`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap gap-2 justify-between">
        {/* Left: Search & Tools */}
        <div className="flex flex-wrap gap-2">
          {/* Search Box */}
          <div className="relative">
            <form onSubmit={handleSearch} className="flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSearchFocused(true)
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder={SEARCH_PLACEHOLDERS[Math.floor(Math.random() * SEARCH_PLACEHOLDERS.length)]}
                className="w-64 sm:w-80 pl-10 pr-4 py-2 bg-white border border-ink-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Search properties"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); onSearch?.('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-600"
                  aria-label="Clear search"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && searchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 w-auto min-w-[320px] max-h-60 overflow-y-auto bg-white border border-ink-200 rounded-lg shadow-lg py-1" style={{ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearchResultSelect(result)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-ink-50 flex items-center gap-2 border-b border-ink-100 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 truncate">{result.label}</p>
                      <p className="text-xs text-ink-500 truncate">{result.description}</p>
                    </div>
                  </button>
                ))}
                {searchResults.length === 0 && searchQuery && (
                  <div className="px-3 py-4 text-center text-sm text-ink-500">
                    No results for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tool Buttons */}
          <div className="flex items-center gap-1 bg-white border border-ink-200 rounded-lg p-1" ref={toolMenuRef}>
            {/* Navigation Tools */}
            <Tooltip content="Pan (V)">
              <button
                onClick={() => handleToolSelect(MAP_TOOLS.NONE)}
                className={`p-2 rounded transition-colors ${activeTool === MAP_TOOLS.NONE ? 'bg-blue-100 text-blue-700' : 'text-ink-500 hover:bg-ink-100'}`}
                aria-label="Pan tool"
              >
                <Navigation className="w-5 h-5" />
              </button>
            </Tooltip>

            <Tooltip content="Selection Tool (S)">
              <button
                onClick={() => handleToolSelect(MAP_TOOLS.SELECTION)}
                className={`p-2 rounded transition-colors ${activeTool === MAP_TOOLS.SELECTION ? 'bg-blue-100 text-blue-700' : 'text-ink-500 hover:bg-ink-100'}`}
                aria-label="Selection tool"
              >
                <MousePointer className="w-5 h-5" />
              </button>
            </Tooltip>

            <Tooltip content="Measure Distance (M)">
              <button
                onClick={() => handleToolSelect(MAP_TOOLS.MEASURE)}
                className={`p-2 rounded transition-colors ${activeTool === MAP_TOOLS.MEASURE ? 'bg-blue-100 text-blue-700' : 'text-ink-500 hover:bg-ink-100'}`}
                aria-label="Measure tool"
              >
                <RulerIcon className="w-5 h-5" />
              </button>
            </Tooltip>

            <Tooltip content="Radius Query (R)">
              <button
                onClick={() => handleToolSelect(MAP_TOOLS.RADIUS)}
                className={`p-2 rounded transition-colors ${activeTool === MAP_TOOLS.RADIUS ? 'bg-blue-100 text-blue-700' : 'text-ink-500 hover:bg-ink-100'}`}
                aria-label="Radius tool"
              >
                <Circle className="w-5 h-5" />
              </button>
            </Tooltip>

            <Tooltip content="Spatial Query">
              <button
                onClick={() => handleToolSelect(MAP_TOOLS.QUERY)}
                className={`p-2 rounded transition-colors ${activeTool === MAP_TOOLS.QUERY ? 'bg-blue-100 text-blue-700' : 'text-ink-500 hover:bg-ink-100'}`}
                aria-label="Spatial query tool"
              >
                <Filter className="w-5 h-5" />
              </button>
            </Tooltip>

            <div className="w-px h-6 bg-ink-200 mx-1" />

            {/* Zoom Controls */}
            <Tooltip content="Zoom In (+)">
              <button
                onClick={() => mapRef.current?.flyTo(mapRef.current.getCenter(), mapRef.current.getZoom() + 1, { duration: 0.5 })}
                className="p-2 rounded text-ink-500 hover:bg-ink-100 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </Tooltip>

            <Tooltip content="Zoom Out (-)">
              <button
                onClick={() => mapRef.current?.flyTo(mapRef.current.getCenter(), mapRef.current.getZoom() - 1, { duration: 0.5 })}
                className="p-2 rounded text-ink-500 hover:bg-ink-100 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
            </Tooltip>

            <Tooltip content="Reset View (Home)">
              <button
                onClick={() => {
                  mapRef.current?.flyTo([25.1372, 85.4434], 10.4, { duration: 0.9 })
                  onMapStateChange?.({ center: [85.4434, 25.1372], zoom: 10.4 })
                }}
                className="p-2 rounded text-ink-500 hover:bg-ink-100 transition-colors"
                aria-label="Reset view to district"
              >
                <Home className="w-5 h-5" />
              </button>
            </Tooltip>

            <Tooltip content="Locate Me">
              <button
                onClick={handleLocateUser}
                className="p-2 rounded text-ink-500 hover:bg-ink-100 transition-colors"
                aria-label="Locate user"
              >
                <Target className="w-5 h-5" />
              </button>
            </Tooltip>

            <div className="w-px h-6 bg-ink-200 mx-1" />

            {/* Basemap Selector Dropdown */}
            <div className="relative" ref={basemapPickerRef}>
              <Tooltip content="Basemap">
                <button
                  onClick={() => setShowBasemapPicker(!showBasemapPicker)}
                  className="p-2 rounded text-ink-500 hover:bg-ink-100 transition-colors flex items-center gap-1"
                  aria-label="Select basemap"
                >
                  <Layers className="w-5 h-5" />
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              {showBasemapPicker && (
                <div className="absolute top-full left-0 mt-1 z-40 w-48 bg-white border border-ink-200 rounded-lg shadow-lg py-1">
                  {Object.entries(BASEMAPS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleBasemapChange(key)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${basemap === key ? 'bg-blue-50 text-blue-700' : 'text-ink-700 hover:bg-ink-50'}`}
                    >
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: key === 'topo' ? '#d97706' : key === 'satellite' ? '#2d5a27' : '#4a90d9' }} />
                      <span>{config.label}</span>
                      {basemap === key && <Eye className="w-4 h-4 text-blue-600 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tool Menu Dropdown */}
            <div className="relative" ref={toolMenuRef}>
              <Tooltip content="Tools">
                <button
                  onClick={() => setShowToolMenu(!showToolMenu)}
                  className="p-2 rounded text-ink-500 hover:bg-ink-100 transition-colors"
                  aria-label="Tools"
                >
                  <Filter className="w-5 h-5" />
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              {showToolMenu && (
                <div className="absolute top-full left-0 mt-1 z-40 w-48 bg-white border border-ink-200 rounded-lg shadow-lg py-1">
                  {[
                    { id: MAP_TOOLS.NONE, label: 'Pan', icon: Navigation },
                    { id: MAP_TOOLS.SELECTION, label: 'Selection Tool', icon: MousePointer },
                    { id: MAP_TOOLS.MEASURE, label: 'Measure Distance', icon: RulerIcon },
                    { id: MAP_TOOLS.RADIUS, label: 'Radius Query', icon: Circle },
                    { id: MAP_TOOLS.QUERY, label: 'Spatial Query', icon: Filter },
                  ].map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${activeTool === tool.id ? 'bg-blue-50 text-blue-700' : 'text-ink-700 hover:bg-ink-50'}`}
                    >
                      <tool.icon className="w-4 h-4" />
                      <span>{tool.label}</span>
                      {activeTool === tool.id && <Crosshair className="w-4 h-4 text-blue-600 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Map Controls */}
        <div className="flex items-center gap-1">
          {/* Measurements Panel Toggle */}
          {(measurements.length > 0 || showMeasurements) && (
            <Tooltip content="Measurements">
              <div className="relative">
                <button
                  onClick={() => setShowMeasurements(!showMeasurements)}
                  className={`p-2 rounded transition-colors ${showMeasurements ? 'bg-blue-100 text-blue-700' : 'text-ink-500 hover:bg-ink-100'}`}
                  aria-label="Show measurements"
                >
                  <RulerIcon className="w-5 h-5" />
                  {measurements.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {measurements.length}
                    </span>
                  )}
                </button>
                {showMeasurements && (
                  <div className="absolute top-full right-0 mt-1 z-40 w-72 bg-white border border-ink-200 rounded-lg shadow-lg py-1">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <h3 className="font-medium text-ink-900">Measurements</h3>
                      {measurements.length > 0 && (
                        <button
                          onClick={handleClearMeasurements}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {measurements.length === 0 ? (
                      <p className="text-sm text-ink-500 text-center py-4 px-2">No measurements yet. Use the Measure tool.</p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1 px-2">
                        {measurements.map((m, idx) => (
                          <div key={idx} className="p-2 bg-ink-50 rounded text-xs flex items-center justify-between">
                            <span className="font-medium text-ink-900">{m.label || `Measurement ${idx + 1}`}</span>
                            <span className="text-ink-700">{m.distance}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Tooltip>
          )}

          {/* Fullscreen Toggle */}

          <Tooltip content={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded text-ink-500 hover:bg-ink-100 transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </Tooltip>

          {/* Export */}
          <Tooltip content="Export Map Image">
            <button
              onClick={handleExportMap}
              className="p-2 rounded text-ink-500 hover:bg-ink-100 transition-colors"
              aria-label="Export map"
            >
              <Download className="w-5 h-5" />
            </button>
          </Tooltip>

          {/* Refresh */}
          <Tooltip content="Refresh Data">
            <button
              onClick={onRefresh}
              className="p-2 rounded text-ink-500 hover:bg-ink-100 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </Tooltip>

          {/* Help */}
          <Tooltip content="GIS Shortcuts & Help">
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 rounded text-ink-500 hover:bg-ink-100 transition-colors"
              aria-label="Map Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Quick Actions Bar - shown when not fullscreen */}
      {isFullscreen ? null : renderQuickActions()}

      {/* GIS Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-ink-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-ink-900 text-white">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Revenue GIS Help & Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded text-ink-400 hover:text-white hover:bg-white/10"
                aria-label="Close help"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs text-ink-700 max-h-[400px] overflow-y-auto">
              <div className="space-y-1.5">
                <h4 className="font-bold text-ink-900 uppercase tracking-wider text-[10px]">Navigation & View</h4>
                <div className="flex justify-between py-1 border-b border-ink-100">
                  <span>Pan Map</span>
                  <span className="font-mono bg-ink-100 px-1.5 rounded">V</span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink-100">
                  <span>Select Property Feature</span>
                  <span className="font-mono bg-ink-100 px-1.5 rounded">S</span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink-100">
                  <span>Zoom In / Out</span>
                  <span className="font-mono bg-ink-100 px-1.5 rounded">+ / -</span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink-100">
                  <span>Reset District View</span>
                  <span className="font-mono bg-ink-100 px-1.5 rounded">Home</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-ink-900 uppercase tracking-wider text-[10px]">Spatial Analysis Tools</h4>
                <div className="flex justify-between py-1 border-b border-ink-100">
                  <span>Measure Distance</span>
                  <span className="font-mono bg-ink-100 px-1.5 rounded">M</span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink-100">
                  <span>Radius Deficit Circle</span>
                  <span className="font-mono bg-ink-100 px-1.5 rounded">R</span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink-100">
                  <span>Spatial Polygon Query</span>
                  <span className="font-mono bg-ink-100 px-1.5 rounded">Filter</span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink-100">
                  <span>Deactivate Active Tool</span>
                  <span className="font-mono bg-ink-100 px-1.5 rounded">Esc</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-ink-50 border-t border-ink-200 flex justify-end">
              <Button size="xs" variant="primary" onClick={() => setShowHelpModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActiveToolIndicator({ activeTool, onDeactivate }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm">
      <span className="font-medium">Active Tool:</span>
      <span className="text-xs">
        {(() => {
          if (activeTool === MAP_TOOLS.SELECTION) return 'Selection Tool'
          if (activeTool === MAP_TOOLS.MEASURE) return 'Measure Distance'
          if (activeTool === MAP_TOOLS.RADIUS) return 'Radius Query'
          if (activeTool === MAP_TOOLS.QUERY) return 'Spatial Query'
          return ''
        })()}
      </span>
      <button
        onClick={onDeactivate}
        className="ml-2 p-0.5 rounded hover:bg-blue-100"
        aria-label="Deactivate tool"
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default RevenueMapToolbar
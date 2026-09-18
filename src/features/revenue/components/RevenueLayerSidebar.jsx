// RevenueLayerSidebar — GIS Layer Sidebar matching tax_revenue.html
import { useState, useMemo, useCallback, useEffect } from 'react'
import { Button, Input, Badge } from '../../../components/ui'
import {
  Search, Eye, EyeOff, ChevronDown, ChevronRight,
  Loader2, Map, HeartPulse, GraduationCap, Navigation, Droplet,
  TreePine, AlertTriangle, Building, Users, Layers,
  X, Filter
} from 'lucide-react'

const CATEGORY_STYLES = {
  'Administrative & Boundaries': { color: '#38bdf8', fill: '#38bdf8', icon: Map },
  'Health & Medical': { color: '#ef4444', fill: '#ef4444', icon: HeartPulse },
  'Education': { color: '#eab308', fill: '#eab308', icon: GraduationCap },
  'Transportation': { color: '#f97316', fill: '#f97316', icon: Navigation },
  'Hydrology & Water': { color: '#06b6d4', fill: '#06b6d4', icon: Droplet },
  'Environment & Land Use': { color: '#22c55e', fill: '#22c55e', icon: TreePine },
  'Hazards & Climate': { color: '#d946ef', fill: '#d946ef', icon: AlertTriangle },
  'Civic & Infrastructure': { color: '#a855f7', fill: '#a855f7', icon: Building },
  'Demographics & Admin': { color: '#818cf8', fill: '#818cf8', icon: Users },
}

const DEFAULT_CATEGORIES = [
  'Administrative & Boundaries',
  'Health & Medical',
  'Education',
  'Transportation',
  'Hydrology & Water',
  'Environment & Land Use',
  'Hazards & Climate',
  'Civic & Infrastructure',
  'Demographics & Admin',
]

export function RevenueLayerSidebar({
  catalog = {},
  activeLayers = {},
  onLayerToggle,
  onShowDefaults,
  onClearMap,
  isLoading = false,
  className = '',
  width = 380,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(['Administrative & Boundaries'])
  const [loadingLayers, setLoadingLayers] = useState({})

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return DEFAULT_CATEGORIES
    const query = searchQuery.toLowerCase()
    return DEFAULT_CATEGORIES.filter(cat =>
      cat.toLowerCase().includes(query) ||
      Object.keys(catalog).some(c => c.toLowerCase().includes(query))
    )
  }, [searchQuery, catalog])

  const handleCategoryClick = useCallback((category) => {
    setExpandedCategories(prev => prev.includes(category)
      ? prev.filter(c => c !== category)
      : [...prev, category]
    )
  }, [])

  const handleLayerToggle = useCallback((layerName, checked) => {
    setLoadingLayers(prev => ({ ...prev, [layerName]: true }))
    onLayerToggle?.(layerName, checked)
    // Simulate loading state
    setTimeout(() => setLoadingLayers(prev => ({ ...prev, [layerName]: false })), 500)
  }, [onLayerToggle])

  const handleShowDefaults = useCallback(() => {
    onShowDefaults?.()
  }, [onShowDefaults])

  const handleClearMap = useCallback(() => {
    onClearMap?.()
  }, [onClearMap])

  return (
    <aside
      className={`sidebar h-full bg-slate-900 border-r border-slate-800 flex flex-col ${className}`}
      style={{ width }}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header p-4 border-b border-slate-800 flex flex-col gap-3">
        {/* Search Layers */}
        <div className="search-box relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            type="text"
            id="search-layers"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search layers (e.g. Hospital, Block)..."
            className="w-full bg-slate-800 border border-slate-700 pl-10 pr-4 py-2 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Actions: Default Layers, Clear Map */}
        <div className="sidebar-actions flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShowDefaults}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
          >
            <Eye className="w-3.5 h-3.5" />
            Default Layers
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearMap}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Clear Map
          </Button>
        </div>
      </div>

      {/* Categories Accordion */}
      <div className="layers-content flex-1 overflow-y-auto p-3 space-y-2">
        {Object.keys(catalog).length === 0 && !isLoading ? (
          <div className="p-8 text-center text-slate-500">
            <Layers className="w-12 h-12 mx-auto mb-2 text-slate-600" />
            <p className="text-sm">No GIS catalog loaded</p>
            <p className="text-xs text-slate-600 mt-1">Click "Default Layers" to load base layers</p>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="p-4 text-center text-slate-500">
                <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-spin" />
                <p className="text-sm">Loading GIS catalog...</p>
              </div>
            )}

            {filteredCategories.map((catName, idx) => {
              const layers = catalog[catName] || []
              const style = CATEGORY_STYLES[catName] || { color: '#94a3b8', icon: Layers }
              const Icon = style.icon
              const isExpanded = expandedCategories.includes(catName)
              const activeCount = layers.filter(l => activeLayers[l.layer_name]).length

              return (
                <div key={catName} className="category-group border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50">
                  <button
                    onClick={() => handleCategoryClick(catName)}
                    className={`category-header w-full flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 transition-colors ${isExpanded ? 'border-b border-slate-700 text-blue-400' : ''}`}
                  >
                    <div className="category-title flex items-center gap-2">
                      <Icon className="w-5 h-5" style={{ color: style.color }} />
                      <span className="font-medium text-sm">{catName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-slate-800 border-slate-700 text-slate-400">
                        {layers.length}
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="layer-list p-2 space-y-1 max-h-96 overflow-y-auto">
                      {layers.map((layer) => {
                        const isActive = activeLayers[layer.layer_name]
                        const isLoading = loadingLayers[layer.layer_name]

                        return (
                          <button
                            key={layer.layer_name}
                            onClick={() => handleLayerToggle(layer.layer_name, !isActive)}
                            className={`layer-item w-full flex items-center justify-between p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-900/30 border border-blue-900/50' : 'hover:bg-slate-800/50'}`}
                          >
                            <div className="layer-left flex items-center gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                className="layer-checkbox w-4 h-4 accent-blue-500 cursor-pointer"
                                checked={isActive}
                                onChange={(e) => handleLayerToggle(layer.layer_name, e.target.checked)}
                              />
                              <label className="layer-label text-sm text-white truncate" title={layer.display_name}>
                                {layer.display_name}
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700 text-slate-400">
                                {layer.feature_count || 0}
                              </Badge>
                              {isLoading && (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                      {layers.length === 0 && (
                        <div className="p-4 text-center text-slate-500 text-sm">
                          No layers in this category
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {filteredCategories.length === 0 && searchQuery && (
              <div className="p-8 text-center text-slate-500">
                <Filter className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">No categories match "{searchQuery}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

export default RevenueLayerSidebar
import { useState, useMemo, useCallback, useRef } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff, SlidersHorizontal, Palette, Layers, Filter, Lock, Unlock } from 'lucide-react'
import { Card, Button, Select, Badge, Tooltip } from '../../../components/ui'
import { REVENUE_GIS_LAYERS, TAX_STATUS_COLORS } from '../constants/revenueConstants'

function hasRole(userRole, requiredRole) {
  if (!requiredRole) return true
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
  return perms.includes('*') || perms.includes(requiredRole)
}

const LAYER_CATEGORIES = [
  { id: 'base', label: 'Base Layers', icon: Layers, order: 1 },
  { id: 'status', label: 'Tax Status', icon: Filter, order: 2 },
  { id: 'analytics', label: 'Analytics', icon: SlidersHorizontal, order: 3 },
  { id: 'heatmap', label: 'Heatmaps', icon: Palette, order: 4 },
  { id: 'actions', label: 'Actions', icon: Filter, order: 5 },
]

export function RevenueLayerManager({
  activeLayers,
  onLayerToggle,
  onLayerStyleChange,
  onLayerOpacityChange,
  onLayerOrderChange,
  visibleLayers,
  userRole,
  hasPermission,
  className = '',
  compact = false,
}) {
  const [expandedCategories, setExpandedCategories] = useState(['base', 'status'])
  const [activeOpacityLayer, setActiveOpacityLayer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showStyleEditor, setShowStyleEditor] = useState(null)

  const layersByCategory = useMemo(() => {
    const filtered = REVENUE_GIS_LAYERS.filter(layer => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return layer.label.toLowerCase().includes(query) || layer.id.toLowerCase().includes(query)
      }
      return true
    })

    const grouped = {}
    filtered.forEach(layer => {
      if (!grouped[layer.category]) grouped[layer.category] = []
      grouped[layer.category].push(layer)
    })

    return LAYER_CATEGORIES
      .map(cat => ({
        ...cat,
        layers: grouped[cat.id] || []
      }))
      .filter(cat => cat.layers.length > 0)
  }, [searchQuery])

  const toggleCategory = useCallback((categoryId) => {
    setExpandedCategories(prev => prev.includes(categoryId)
      ? prev.filter(id => id !== categoryId)
      : [...prev, categoryId]
    )
  }, [])

  const handleLayerToggle = useCallback((layerId) => {
    const canToggle = !hasPermission || hasPermission(`layer.${layerId}.toggle`)
    if (canToggle) {
      onLayerToggle?.(layerId)
    }
  }, [onLayerToggle, hasPermission])

  const handleOpacityChange = useCallback((layerId, opacity) => {
    onLayerOpacityChange?.(layerId, opacity)
  }, [onLayerOpacityChange])

  const handleStyleChange = useCallback((layerId, style) => {
    onLayerStyleChange?.(layerId, style)
  }, [onLayerStyleChange])

  const canViewLayer = useCallback((layer) => {
    if (layer.requiredPermission && !hasPermission?.(layer.requiredPermission)) return false
    if (layer.requiredRole && !hasRole(userRole, layer.requiredRole)) return false
    return true
  }, [userRole, hasPermission])

  const getLayerStylePreview = useCallback((layer) => {
    if (layer.category === 'heatmap') return null
    if (layer.color) {
      return { backgroundColor: layer.color }
    }
    if (layer.id.startsWith('properties_')) {
      const status = layer.id.replace('properties_', '')
      return { backgroundColor: TAX_STATUS_COLORS[status] || '#94a3b8' }
    }
    return null
  }, [])

  const renderLayerItem = (layer) => {
    const isActive = activeLayers.includes(layer.id)
    const canView = canViewLayer(layer)
    const isLocked = layer.locked || (layer.requiredPermission && !hasPermission?.(layer.requiredPermission))
    const isStyleable = layer.category !== 'heatmap' && layer.category !== 'base'

    return (
      <div
        key={layer.id}
        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-ink-50'} ${!canView ? 'opacity-50' : ''} ${compact ? 'py-1' : ''}`}
        style={{ opacity: isLocked ? 0.6 : 1 }}
      >
        {/* Visibility Toggle */}
        <Tooltip content={isLocked ? 'Permission required' : (isActive ? 'Hide layer' : 'Show layer')}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => !isLocked && handleLayerToggle(layer.id)}
              disabled={isLocked}
              className="w-4 h-4 text-blue-600 border-ink-300 rounded focus:ring-blue-500 disabled:opacity-50"
              aria-label={layer.label}
            />
            <span className="flex items-center gap-2 flex-1 min-w-0">
              {/* Style Preview */}
              {getLayerStylePreview(layer) && (
                <div
                  className="w-3 h-3 rounded border"
                  style={{
                    ...getLayerStylePreview(layer),
                    borderColor: getLayerStylePreview(layer).backgroundColor,
                    opacity: 0.8
                  }}
                />
              )}
              <span className={`text-sm truncate ${isLocked ? 'text-ink-400' : 'text-ink-900'}`}>
                {layer.label}
              </span>
              {layer.badge && <Badge variant="outline" className="text-xs">{layer.badge}</Badge>}
            </span>
          </label>
        </Tooltip>

        {/* Opacity Slider */}
        {isActive && layer.adjustableOpacity !== false && !compact && (
          <div className="relative">
            <Tooltip content="Adjust Opacity">
              <button
                type="button"
                onClick={() => setActiveOpacityLayer(activeOpacityLayer === layer.id ? null : layer.id)}
                className="p-1.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
                aria-label="Adjust opacity"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </Tooltip>
            {activeOpacityLayer === layer.id && (
              <div className="absolute right-0 top-full mt-1 p-2 w-44 bg-white border border-ink-200 rounded shadow-lg z-30">
                <label className="block text-xs font-medium text-ink-700 mb-1">Opacity ({layer.currentOpacity || 100}%)</label>
                <input
                  type="range"
                  value={layer.currentOpacity || 100}
                  onChange={(e) => handleOpacityChange(layer.id, Number(e.target.value))}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Style Editor */}
        {isActive && isStyleable && !compact && (
          <Tooltip content="Edit Style">
            <button
              onClick={() => setShowStyleEditor(layer.id)}
              className="p-1.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
              aria-label="Edit layer style"
            >
              <Palette className="w-4 h-4" />
            </button>
          </Tooltip>
        )}

        {/* Lock Indicator */}
        {isLocked && (
          <Tooltip content="Layer locked - requires permission">
            <Lock className="w-4 h-4 text-ink-300" />
          </Tooltip>
        )}
      </div>
    )
  }

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {REVENUE_GIS_LAYERS
          .filter(l => canViewLayer(l) && activeLayers.includes(l.id))
          .slice(0, 8)
          .map(layer => (
            <Tooltip key={layer.id} content={layer.label}>
              <button
                onClick={() => handleLayerToggle(layer.id)}
                className={`p-1.5 rounded transition-colors ${activeLayers.includes(layer.id) ? 'bg-blue-100 text-blue-700' : 'bg-white border border-ink-300 text-ink-500 hover:bg-ink-50'}`}
                aria-label={layer.label}
                aria-pressed={activeLayers.includes(layer.id)}
              >
                {layer.color && (
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: layer.color }} />
                )}
                {layer.id.startsWith('properties_') && !layer.color && (
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: TAX_STATUS_COLORS[layer.id.replace('properties_', '')] || '#94a3b8' }} />
                )}
              </button>
            </Tooltip>
          ))}
        {activeLayers.length > 8 && (
          <Tooltip content={`${activeLayers.length - 8} more layers`}>
            <button className="p-1.5 rounded bg-ink-100 text-ink-500 text-xs font-medium">
              +{activeLayers.length - 8}
            </button>
          </Tooltip>
        )}
      </div>
    )
  }

  return (
    <div className={`${className} flex flex-col gap-2`}>
      {/* Search & Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search layers..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-ink-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1">
          <Tooltip content="Expand All">
            <button
              onClick={() => setExpandedCategories(LAYER_CATEGORIES.map(c => c.id))}
              className="p-1.5 rounded text-ink-500 hover:bg-ink-100"
              aria-label="Expand all"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Collapse All">
            <button
              onClick={() => setExpandedCategories([])}
              className="p-1.5 rounded text-ink-500 hover:bg-ink-100"
              aria-label="Collapse all"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Layer Categories */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {layersByCategory.map(category => (
          <div key={category.id} className="border border-ink-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between p-3 bg-ink-50 border-b border-ink-100 hover:bg-ink-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`transition-transform ${expandedCategories.includes(category.id) ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-4 h-4 text-ink-500" />
                </span>
                <category.icon className="w-5 h-5 text-ink-600" />
                <span className="font-medium text-ink-900">{category.label}</span>
                <Badge variant="outline" className="text-xs">
                  {category.layers.filter(l => activeLayers.includes(l.id)).length} / {category.layers.length}
                </Badge>
              </div>
              <span className="text-xs text-ink-400 transition-transform">
                {expandedCategories.includes(category.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {expandedCategories.includes(category.id) && (
              <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
                {category.layers.map(renderLayerItem)}
              </div>
            )}
          </div>
        ))}

        {/* No Results */}
        {layersByCategory.every(c => c.layers.length === 0) && searchQuery && (
          <div className="p-8 text-center text-ink-500">
            <Filter className="w-12 h-12 mx-auto mb-2 text-ink-300" />
            <p>No layers match "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="pt-2 border-t border-ink-200 flex flex-wrap gap-2">
        <Tooltip content="Show All Layers">
          <button
            onClick={() => onLayerToggle?.(REVENUE_GIS_LAYERS.filter(l => !l.locked && canViewLayer(l)).map(l => l.id))}
            className="flex-1 px-3 py-2 text-sm border border-ink-300 rounded-lg text-ink-700 hover:bg-ink-50 transition-colors"
          >
            <Eye className="w-4 h-4 mr-1" />
            Show All
          </button>
        </Tooltip>
        <Tooltip content="Hide All Layers">
          <button
            onClick={() => onLayerToggle?.([])}
            className="flex-1 px-3 py-2 text-sm border border-ink-300 rounded-lg text-ink-700 hover:bg-ink-50 transition-colors"
          >
            <EyeOff className="w-4 h-4 mr-1" />
            Hide All
          </button>
        </Tooltip>
        <Tooltip content="Reset to Defaults">
          <button
            onClick={() => onLayerToggle?.(REVENUE_GIS_LAYERS.filter(l => l.defaultVisible).map(l => l.id))}
            className="flex-1 px-3 py-2 text-sm border border-ink-300 rounded-lg text-ink-700 hover:bg-ink-50 transition-colors"
          >
            <Layers className="w-4 h-4 mr-1" />
            Reset Defaults
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

export default RevenueLayerManager
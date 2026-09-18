// Revenue & Property Intelligence — Revenue Map Legend
// Legend component for collection/arrears/demand heatmaps

import { useState, useMemo } from 'react'
import { Card, Badge, Tooltip } from '../../../components/ui'
import { ChevronDown, ChevronUp, Filter, Circle, Square, HelpCircle, MapPin, Palette, Layers } from 'lucide-react'
import { REVENUE_GIS_LAYERS, REVENUE_MAP_STYLES, TAX_STATUS, TAX_STATUS_LABELS, TAX_STATUS_COLORS, ARREARS_AGING } from '../constants/revenueConstants'

const LEGEND_SECTIONS = [
  {
    id: 'tax_status',
    label: 'Tax Status',
    icon: Filter,
    items: [
      { key: 'paid', label: TAX_STATUS_LABELS.paid, color: REVENUE_MAP_STYLES.paid.fillColor, borderColor: REVENUE_MAP_STYLES.paid.color },
      { key: 'due', label: TAX_STATUS_LABELS.due, color: REVENUE_MAP_STYLES.due.fillColor, borderColor: REVENUE_MAP_STYLES.due.color },
      { key: 'partial', label: TAX_STATUS_LABELS.partial, color: REVENUE_MAP_STYLES.partial.fillColor, borderColor: REVENUE_MAP_STYLES.partial.color },
      { key: 'arrears', label: TAX_STATUS_LABELS.arrears, color: REVENUE_MAP_STYLES.arrears.fillColor, borderColor: REVENUE_MAP_STYLES.arrears.color },
      { key: 'exempt', label: TAX_STATUS_LABELS.exempt, color: REVENUE_MAP_STYLES.exempt?.fillColor || '#3b82f6', borderColor: REVENUE_MAP_STYLES.exempt?.color || '#1d4ed8' },
      { key: 'disputed', label: TAX_STATUS_LABELS.disputed, color: REVENUE_MAP_STYLES.disputed?.fillColor || '#a855f7', borderColor: REVENUE_MAP_STYLES.disputed?.color || '#7e22ce' },
    ]
  },
  {
    id: 'arrears_aging',
    label: 'Arrears Aging',
    icon: Circle,
    items: ARREARS_AGING.map(bucket => ({
      key: bucket.id,
      label: bucket.label,
      color: bucket.color,
      borderColor: bucket.color,
    }))
  },
  {
    id: 'special',
    label: 'Special Categories',
    icon: MapPin,
    items: [
      { key: 'high_value', label: 'High Value Properties', color: REVENUE_MAP_STYLES.high_value.fillColor, borderColor: REVENUE_MAP_STYLES.high_value.color },
      { key: 'revenue_gap', label: 'Revenue Gap Areas', color: REVENUE_MAP_STYLES.revenue_gap.fillColor, borderColor: REVENUE_MAP_STYLES.revenue_gap.color },
    ]
  },
  {
    id: 'base',
    label: 'Base Layers',
    icon: Layers,
    items: [
      { key: 'property_parcels', label: 'Property Parcels', color: REVENUE_MAP_STYLES.property_parcels.fillColor, borderColor: REVENUE_MAP_STYLES.property_parcels.color, shape: 'polygon' },
    ]
  },
]

function LegendSection({ section, activeLayers, expandedSections, setExpandedSections, renderLegendItem }) {
  const isExpanded = expandedSections.includes(section.id)
  const hasActiveItems = section.items.some(item => activeLayers.includes(`${item.key}_properties`) || activeLayers.includes(item.key))

  if (!hasActiveItems) return null

  const toggleOpen = () => {
    setExpandedSections(prev => isExpanded ? prev.filter(id => id !== section.id) : [...prev, section.id])
  }

  return (
    <div key={section.id} className="border-b border-ink-100 last:border-0 pb-1">
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between p-1.5 rounded hover:bg-ink-50 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-900">
          <section.icon className="w-3.5 h-3.5 text-ink-500" />
          <span>{section.label}</span>
          <Badge variant="outline" className="text-[10px]">
            {section.items.filter(i => activeLayers.includes(`${i.key}_properties`) || activeLayers.includes(i.key)).length} / {section.items.length}
          </Badge>
        </div>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-ink-400" /> : <ChevronDown className="w-3.5 h-3.5 text-ink-400" />}
      </button>
      {isExpanded && (
        <div className="pt-1 space-y-1 pl-2">
          {section.items
            .filter(item => activeLayers.includes(`${item.key}_properties`) || activeLayers.includes(item.key))
            .map(item => renderLegendItem(item, section.id))
          }
        </div>
      )}
    </div>
  )
}


export function RevenueMapLegend({
  activeLayers = [],
  className = '',
  compact = false,
  position = 'bottom-left',
  showCollapsible = true,
  onLayerToggle,
}) {
  const [expandedSections, setExpandedSections] = useState(['tax_status'])

  const filteredSections = useMemo(() => {
    return LEGEND_SECTIONS.map(section => ({
      ...section,
      items: section.items.filter(item => activeLayers.includes(`${item.key}_properties`) || activeLayers.includes(item.key))
    })).filter(section => section.items.length > 0)
  }, [activeLayers])

  const allItems = useMemo(() => {
    return LEGEND_SECTIONS.flatMap(section =>
      section.items
        .filter(item => activeLayers.includes(`${item.key}_properties`) || activeLayers.includes(item.key))
        .map(item => ({ ...item, section: section.label }))
    )
  }, [activeLayers])

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => prev.includes(sectionId)
      ? prev.filter(id => id !== sectionId)
      : [...prev, sectionId]
    )
  }

  const renderLegendItem = (item, sectionId) => {
    const isPolygon = item.shape === 'polygon' || sectionId === 'tax_status' || sectionId === 'base'
    const isActive = activeLayers.includes(`${item.key}_properties`) || activeLayers.includes(item.key)

    return (
      <div
        key={item.key}
        className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-ink-50'}`}
      >
        <Tooltip content={`${isActive ? 'Visible' : 'Hidden'}`}>
          {isActive && (
            <span className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true">✓</span>
          )}
        </Tooltip>
        <div
          className={`flex-shrink-0 ${isPolygon ? 'w-5 h-5 rounded border' : 'w-5 h-5 rounded-full'}`}
          style={{
            backgroundColor: item.color,
            borderColor: item.borderColor,
            borderWidth: isPolygon ? 1 : 0,
            opacity: 0.85,
          }}
        />
        <span className="text-xs text-ink-700 truncate flex-1">{item.label}</span>
        {isActive && (
          <span className="text-[10px] text-green-600 font-medium">ON</span>
        )}
      </div>
    )
  }

  if (compact) {
    return (
      <Card className={`${className} w-48 shadow-lg`}>
        <div className="p-2 border-b border-ink-200 flex items-center justify-between">
          <h4 className="text-xs font-medium text-ink-900 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Legend
          </h4>
          <span className="text-[10px] text-ink-500">{activeLayers.length} active</span>
        </div>
        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
          {allItems.length === 0 ? (
            <p className="text-xs text-ink-500 text-center py-2">No active layers</p>
          ) : (
            <>
              {allItems.map(item => (
                <div key={item.key} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{
                      backgroundColor: item.color,
                      borderColor: item.borderColor,
                      opacity: 0.85,
                    }}
                  />
                  <span className="text-ink-700 truncate flex-1">{item.label}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${className} w-64 shadow-lg ${showCollapsible ? '' : 'overflow-hidden'}`}>
      <div className="p-2 border-b border-ink-200 flex items-center justify-between">
        <h4 className="text-xs font-medium text-ink-900 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          Map Legend
        </h4>
        <span className="text-[10px] text-ink-500">{activeLayers.length} layers active</span>
      </div>

      <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
        {filteredSections.length === 0 ? (
          <div className="text-center py-4 text-ink-500 text-xs">
            <Layers className="w-8 h-8 mx-auto mb-1 text-ink-300" />
            <p>No active layers to show in legend</p>
            <p className="text-[10px]">Enable layers from Layer Manager</p>
          </div>
) : (
            filteredSections.map(section => (
              <LegendSection
                key={section.id}
                section={section}
                activeLayers={activeLayers}
                expandedSections={expandedSections}
                setExpandedSections={setExpandedSections}
                renderLegendItem={renderLegendItem}
              />
            ))
          )}
      </div>

      {/* Legend Help */}
      <div className="p-2 border-t border-ink-200">
        <Tooltip content="Legend shows only active layers. Enable layers from Layer Manager to see more items.">
          <button className="w-full flex items-center justify-center gap-1 text-[10px] text-ink-400 hover:text-ink-600">
            <HelpCircle className="w-3 h-3" />
            Legend Help
          </button>
        </Tooltip>
      </div>
    </Card>
  )
}

export function RevenueMapLegendHorizontal({
  activeLayers = [],
  className = '',
  showTitle = true,
}) {
  const items = useMemo(() => {
    return LEGEND_SECTIONS.flatMap(section =>
      section.items
        .filter(item => activeLayers.includes(`${item.key}_properties`) || activeLayers.includes(item.key))
        .map(item => ({ ...item, section: section.label }))
    )
  }, [activeLayers])

  return (
    <Card className={`${className} w-full shadow-lg`}>
      {showTitle && (
        <div className="p-3 border-b border-ink-200 flex items-center justify-between">
          <h4 className="text-sm font-medium text-ink-900 flex items-center gap-1">
            <Layers className="w-4 h-4" />
            Legend
          </h4>
          <span className="text-xs text-ink-500">{items.length} active layers</span>
        </div>
      )}
      <div className="p-3">
        <div className="flex flex-wrap gap-3">
          {items.length === 0 ? (
            <span className="text-sm text-ink-500">No active layers</span>
          ) : (
            items.map(item => (
              <div key={item.key} className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded border flex-shrink-0"
                  style={{
                    backgroundColor: item.color,
                    borderColor: item.borderColor,
                    opacity: 0.85,
                  }}
                />
                <span className="text-xs text-ink-700 whitespace-nowrap">{item.label}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}

export default RevenueMapLegend
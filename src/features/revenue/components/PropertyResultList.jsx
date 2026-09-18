import { useState, useMemo, useCallback, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, MapPin, Filter, Download, RefreshCw, Eye, Map, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { Card, Button, Badge, Select, Input, Skeleton, DataTable, Pagination, Tooltip } from '../../../components/ui'
import { TAX_STATUS_LABELS, TAX_STATUS_COLORS, PROPERTY_TYPES, FINANCIAL_YEARS } from '../constants/revenueConstants'
import { formatCurrency, formatArea, formatIndianNumber, truncate, formatDate } from '../utils/revenueFormatters'

const COLUMNS = [
  { key: 'plotNo', header: 'Plot No', render: p => <span className="font-mono text-ink-900">{p.plotNo || '—'}</span>, width: 100 },
  { key: 'houseNo', header: 'House/Unit', render: p => <span className="text-ink-700">{p.houseNo || p.unitNo || '—'}</span>, width: 90 },
  { key: 'ownerName', header: 'Owner', render: p => <span className="text-ink-900 truncate max-w-[150px]">{p.ownerName || '—'}</span>, width: 150 },
  { key: 'propertyType', header: 'Type', render: p => <Badge variant="outline" className="text-xs">{p.propertyType}</Badge>, width: 80 },
  { key: 'taxStatus', header: 'Status', render: p => (
    <Badge className="text-xs" style={{
      backgroundColor: `${TAX_STATUS_COLORS[p.taxStatus] || '#94a3b8'}15`,
      color: TAX_STATUS_COLORS[p.taxStatus] || '#94a3b8',
      borderColor: `${TAX_STATUS_COLORS[p.taxStatus] || '#94a3b8'}40`
    }}>
      {TAX_STATUS_LABELS[p.taxStatus] || p.taxStatus}
    </Badge>
  ), width: 80 },
  { key: 'currentDemand', header: 'Demand', render: p => <span className="text-ink-900">{formatCurrency(p.currentDemand, { compact: true })}</span>, width: 80 },
  { key: 'totalPaid', header: 'Paid', render: p => <span className="text-green-700">{formatCurrency(p.totalPaid, { compact: true })}</span>, width: 80 },
  { key: 'totalOutstanding', header: 'Outstanding', render: p => <span className="text-red-700">{formatCurrency(p.totalOutstanding, { compact: true })}</span>, width: 90 },
  { key: 'totalArrears', header: 'Arrears', render: p => <span className="text-red-700 font-medium">{formatCurrency(p.totalArrears, { compact: true })}</span>, width: 80 },
  { key: 'location', header: 'Location', render: p => <span className="text-ink-600 text-xs truncate max-w-[120px]">{[p.villageName, p.wardName, p.blockName].filter(Boolean).join(', ')}</span>, width: 120 },
  { key: 'actions', header: '', render: p => (
    <div className="flex gap-1 justify-center">
      <button className="p-1.5 rounded text-ink-500 hover:bg-ink-100 hover:text-ink-700" aria-label="View on map" title="View on map"><MapPin className="w-4 h-4" /></button>
      <button className="p-1.5 rounded text-ink-500 hover:bg-ink-100 hover:text-ink-700" aria-label="View details" title="View details"><Eye className="w-4 h-4" /></button>
    </div>
  ), width: 60 },
]

const COLUMNS_COMPACT = [
  { key: 'plotNo', header: 'Plot', render: p => <span className="font-mono text-ink-900">{p.plotNo || '—'}</span> },
  { key: 'ownerName', header: 'Owner', render: p => <span className="text-ink-900 truncate max-w-[120px]">{p.ownerName || '—'}</span> },
  { key: 'propertyType', header: 'Type', render: p => <Badge variant="outline" className="text-xs">{p.propertyType}</Badge> },
  { key: 'taxStatus', header: 'Status', render: p => (
    <Badge className="text-xs" style={{
      backgroundColor: `${TAX_STATUS_COLORS[p.taxStatus] || '#94a3b8'}15`,
      color: TAX_STATUS_COLORS[p.taxStatus] || '#94a3b8',
      borderColor: `${TAX_STATUS_COLORS[p.taxStatus] || '#94a3b8'}40`
    }}>
      {TAX_STATUS_LABELS[p.taxStatus] || p.taxStatus}
    </Badge>
  )},
  { key: 'totalArrears', header: 'Arrears', render: p => <span className="text-red-700 font-medium">{formatCurrency(p.totalArrears, { compact: true })}</span> },
  { key: 'actions', header: '', render: p => (
    <div className="flex gap-1 justify-center">
      <button className="p-1 rounded text-ink-500 hover:bg-ink-100" aria-label="View on map" title="View on map"><MapPin className="w-3.5 h-3.5" /></button>
    </div>
  )},
]

export function PropertyResultList({
  properties = [],
  isLoading = false,
  pagination = { count: 0, next: null, previous: null },
  page = 1,
  totalPages = 1,
  onPageChange,
  onSelect,
  onMapSelect,
  onRowAction,
  compact = false,
  showPagination = true,
  selectable = true,
  selectedIds = [],
  onSelectionChange,
  className = '',
  title = 'Properties',
  showFilters = true,
  filters = {},
  onFiltersChange,
  showExport = true,
  onExport,
}) {
  const [sortConfig, setSortConfig] = useState({ key: 'totalArrears', direction: 'desc' })
  const [density, setDensity] = useState('comfortable')
  const [showColumns, setShowColumns] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState({})

  const columns = compact ? COLUMNS_COMPACT : COLUMNS

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const sortedProperties = useMemo(() => {
    if (!properties.length) return []
    return [...properties].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      const dir = sortConfig.direction === 'asc' ? 1 : -1
      if (typeof aVal === 'string') return dir * aVal.localeCompare(bVal)
      return dir * (aVal - bVal)
    })
  }, [properties, sortConfig])

  const totalCount = pagination.count || properties.length

  const handleRowClick = useCallback((property) => {
    onSelect?.(property.id)
    onMapSelect?.(property)
  }, [onSelect, onMapSelect])

  const handleAction = useCallback((action, property, event) => {
    event.stopPropagation()
    onRowAction?.(action, property)
  }, [onRowAction])

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      onSelectionChange?.(sortedProperties.map(p => p.id))
    } else {
      onSelectionChange?.([])
    }
  }, [sortedProperties, onSelectionChange])

  const handleRowSelect = useCallback((id, checked) => {
    if (checked) {
      onSelectionChange?.([...selectedIds, id])
    } else {
      onSelectionChange?.(selectedIds.filter(id => id !== id))
    }
  }, [selectedIds, onSelectionChange])

  const allSelected = selectedIds.length > 0 && selectedIds.length === sortedProperties.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < sortedProperties.length

  if (isLoading && (!properties || properties.length === 0)) {
    return (
      <Card className={className}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-ink-900">{title}</h3>
            <span className="text-sm text-ink-500">{totalCount} properties</span>
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-ink-200">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-ink-900">{title}</h3>
          <Badge variant="outline" className="text-xs">{formatIndianNumber(totalCount)}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Density Selector */}
          <Select
            value={density}
            onValueChange={setDensity}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'spacious', label: 'Spacious' },
            ]}
            className="w-36"
            placeholder="Density"
          />

          {/* Column Visibility */}
          <div className="relative">
            <Tooltip content="Columns">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 p-2"
                onClick={() => setShowColumns(!showColumns)}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Columns</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </Tooltip>

            {showColumns && (
              <div className="absolute right-0 top-full mt-1 p-2 w-48 bg-white border border-ink-200 rounded shadow-lg z-30">
                <label className="block text-xs font-medium text-ink-700 mb-2">Visible Columns</label>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {columns.map(col => (
                    <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={columnVisibility[col.key] !== false}
                        onChange={e => setColumnVisibility(prev => ({ ...prev, [col.key]: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-ink-300 rounded"
                      />
                      <span className="text-xs text-ink-700 truncate">{col.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          {showExport && (
            <Tooltip content="Export Results">
              <Button variant="outline" size="sm" onClick={onExport} className="gap-1">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </Tooltip>
          )}

          {/* Refresh */}
          <Tooltip content="Refresh">
            <Button variant="ghost" size="sm" className="p-2" aria-label="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Table */}
      <div className={`overflow-x-auto ${compact ? 'h-[calc(100%-120px)]' : ''}`}>
        <DataTable
          data={sortedProperties}
          columns={columns.filter(c => columnVisibility[c.key] !== false)}
          keyField="id"
          onRowClick={selectable ? handleRowClick : undefined}
          striped
          hoverable
          density={density}
          sortConfig={sortConfig}
          onSort={handleSort}
          selection={selectable ? {
            selectedIds,
            onSelect: handleRowSelect,
            selectAll: allSelected,
            onSelectAll: handleSelectAll,
            indeterminate: someSelected,
          } : undefined}
          rowActions={onRowAction ? (row => [
            { label: 'View on Map', icon: MapPin, action: () => onRowAction('map', row) },
            { label: 'View Details', icon: Eye, action: () => onRowAction('view', row) },
            { label: 'Open in GIS', icon: Map, action: () => onRowAction('gis', row) },
          ]) : undefined}
          emptyState={properties.length === 0 ? (
            <div className="text-center py-12 text-ink-500">
              <Filter className="w-12 h-12 mx-auto mb-2 text-ink-300" />
              <p>No properties found matching your criteria</p>
            </div>
          ) : undefined}
        />
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="p-3 border-t border-ink-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-500">
              Page {page} of {totalPages} • {formatIndianNumber(totalCount)} total
            </span>
            <Select
              value={20}
              onValueChange={() => {}}
              options={[
                { value: 10, label: '10 per page' },
                { value: 20, label: '20 per page' },
                { value: 50, label: '50 per page' },
                { value: 100, label: '100 per page' },
              ]}
              className="w-40 ml-2"
              placeholder="Per page"
            />
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            showFirstLast
            maxButtons={5}
          />
        </div>
      )}

      {/* Selected Count Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 border-t border-ink-200 bg-blue-50 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.length} of {formatIndianNumber(totalCount)} selected
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onSelectionChange?.([])}>
              Clear Selection
            </Button>
            <Button variant="primary" size="sm" onClick={() => onRowAction?.('bulk_action', selectedIds)}>
              Bulk Action
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default PropertyResultList
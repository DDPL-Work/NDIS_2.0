// Revenue & Property Intelligence — Property Registry Page
// Property search, list, and GIS map

import { useState } from 'react'
import { useTaxList } from '../hooks/useTaxList'
import { usePropertyGIS } from '../hooks'
import { RevenueMap, RevenueFilters, PropertyDrawer, RevenueActionMenu, PaymentDialog } from '../components'
import { Card, Button, Input, Badge, DataTable } from '../../../components/ui'
import { Search, MapPin, Filter, Download, RefreshCw, Eye, Map, CreditCard } from 'lucide-react'
import { PROPERTY_TYPES, TAX_STATUS, TAX_STATUS_LABELS, TAX_STATUS_COLORS } from '../constants/revenueConstants'
import { formatCurrency, formatArea, formatIndianNumber, truncate } from '../utils/revenueFormatters'


export function PropertyRegistryPage() {
  const [filters, setFilters] = useState({
    financialYear: '2025-26',
    searchQuery: '',
  })
  const [selectedPropertyId, setSelectedPropertyId] = useState(null)
  const [viewMode, setViewMode] = useState('split') // 'split', 'map', 'list'
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data: propertiesData, isLoading, refetch } = useTaxList({
    ...filters,
    page,
    pageSize,
  })


  const { data: gisData, isLoading: gisLoading } = usePropertyGIS(filters)

  const properties = propertiesData?.data || []
  const pagination = propertiesData?.pagination || { count: 0, next: null, previous: null }

  const handleSearch = (query) => {
    setFilters(prev => ({ ...prev, searchQuery: query, page: 1 }))
  }

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({ financialYear: '2025-26', searchQuery: '' })
  }

  const totalPages = Math.ceil(pagination.count / pageSize)

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'all' && v !== '2025-26').length

  return (
    <div className="h-full flex flex-col bg-ink-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border-b border-ink-200">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Property Registry</h1>
          <p className="text-sm text-ink-500">
            {formatIndianNumber(pagination.count)} properties • FY {filters.financialYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <RevenueFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
              onSearch={handleSearch}
              onClear={handleClearFilters}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'map' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="gap-1"
            >
              <Map className="w-4 h-4" />
              Map
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'split' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('split')}
              className="gap-1"
            >
              <MapPin className="w-4 h-4" />
              Split
            </Button>
            <Button variant="outline" size="sm" onClick={refetch} className="gap-1">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="primary" size="sm" className="gap-1">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="sm:hidden p-4 border-b border-ink-200 bg-white">
        <RevenueFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          showAdvanced={true}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'map' && (
          <RevenueMap
            filters={filters}
            selectedPropertyId={selectedPropertyId}
            onPropertySelect={setSelectedPropertyId}
            height="100%"
          />
        )}

        {viewMode === 'list' && (
          <PropertyListView
            properties={properties}
            isLoading={isLoading}
            pagination={pagination}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onSelect={setSelectedPropertyId}
          />
        )}

        {viewMode === 'split' && (
          <div className="h-full flex">
            {/* Map Panel */}
            <div className="w-1/2 h-full border-r border-ink-200">
              <RevenueMap
                filters={filters}
                selectedPropertyId={selectedPropertyId}
                onPropertySelect={setSelectedPropertyId}
                height="100%"
              />
            </div>

            {/* List Panel */}
            <div className="w-1/2 h-full flex flex-col overflow-hidden">
              <div className="p-3 border-b border-ink-200 bg-white flex items-center justify-between">
                <h3 className="font-medium text-ink-900">Properties ({formatIndianNumber(pagination.count)})</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={refetch}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PropertyListView
                  properties={properties}
                  isLoading={isLoading}
                  pagination={pagination}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  onSelect={setSelectedPropertyId}
                  compact
                />
              </div>
            </div>
          </div>
        )}

        {/* Property Drawer */}
        <PropertyDrawer
          property={properties.find(p => p.id === selectedPropertyId)}
          isOpen={!!selectedPropertyId}
          onClose={() => setSelectedPropertyId(null)}
          onAction={(action, property) => handlePropertyAction(action, property)}
        />
      </div>
    </div>
  )

  function handlePropertyAction(action, property) {
    switch (action) {
      case 'view_tax':
      case 'view_tax_history':
        // Navigate to assessment page with property context
        break
      case 'schedule_inspection':
        // Open inspection scheduling modal
        break
      case 'reassess':
      case 'initiate_reassessment':
        // Navigate to reassessment page
        break
      case 'issue_notice':
      case 'issue_tax_notice':
        // Open notice issuance modal
        break
      case 'recovery':
      case 'create_recovery':
        // Navigate to arrears/recovery page
        break
      case 'add_priority':
        // Add to priority locations
        break
      case 'escalate':
        // Escalate to DM
        break
      case 'open_gis':
        // Open in full GIS view
        break
      case 'export':
        // Export property data
        break
      case 'print':
        // Print property details
        break
      case 'audit':
        // Show audit trail
        break
    }
  }
}

function PropertyListView({
  properties,
  isLoading,
  pagination,
  page,
  totalPages,
  onPageChange,
  onSelect,
  compact = false,
}) {
  if (isLoading && properties.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 mb-2" />
        ))}
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-500">
        <p>No properties found matching your criteria</p>
      </div>
    )
  }

  const columns = [
    { key: 'plotNo', header: 'Plot No', render: p => <span className="font-mono text-ink-900">{p.plotNo || '—'}</span> },
    { key: 'houseNo', header: 'House/Unit', render: p => <span className="text-ink-700">{p.houseNo || p.unitNo || '—'}</span> },
    { key: 'ownerName', header: 'Owner', render: p => <span className="text-ink-900 truncate max-w-[150px]">{p.ownerName || '—'}</span> },
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
    { key: 'currentDemand', header: 'Demand', render: p => <span className="text-ink-900">{formatCurrency(p.currentDemand, { compact: true })}</span> },
    { key: 'totalPaid', header: 'Paid', render: p => <span className="text-green-700">{formatCurrency(p.totalPaid, { compact: true })}</span> },
    { key: 'totalOutstanding', header: 'Outstanding', render: p => <span className="text-red-700">{formatCurrency(p.totalOutstanding, { compact: true })}</span> },
    { key: 'totalArrears', header: 'Arrears', render: p => <span className="text-red-700 font-medium">{formatCurrency(p.totalArrears, { compact: true })}</span> },
    { key: 'location', header: 'Location', render: p => <span className="text-ink-600 text-xs truncate max-w-[120px]">{[p.villageName, p.wardName, p.blockName].filter(Boolean).join(', ')}</span> },
  ]

  return (
    <div className={`${compact ? 'h-full' : ''}`}>
      <DataTable
        data={properties}
        columns={columns}
        keyField="id"
        onRowClick={onSelect}
        striped
        hoverable
        className={compact ? 'h-full' : ''}
      />
      {totalPages > 1 && (
        <div className="p-3 border-t border-ink-200 bg-white flex items-center justify-between">
          <span className="text-sm text-ink-500">
            Page {page} of {totalPages} • {formatIndianNumber(pagination.count)} total
          </span>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            showFirstLast
            maxButtons={5}
          />
        </div>
      )}
    </div>
  )
}

export default PropertyRegistryPage
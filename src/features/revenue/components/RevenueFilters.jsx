// Revenue & Property Intelligence — Revenue Filters
// Filter bar for property search and dashboard filtering

import { useState } from 'react'
import { Select, Button, Input, Badge } from '../../../components/ui'
import { Search, Filter, X, MapPin, Calendar, Building2, DollarSign } from 'lucide-react'
import { FINANCIAL_YEARS, PROPERTY_TYPES, TAX_STATUS, TAX_STATUS_LABELS, TAX_STATUS_COLORS } from '../constants/revenueConstants'

export function RevenueFilters({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  className = '',
  showAdvanced = false,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvanced)

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  const handleFilterChange = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value })
  }

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'all').length

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Primary Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by plot no, owner name, mobile..."
            className="w-full pl-10 pr-4 py-2 border border-ink-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Button type="submit" className="px-4 py-2">
          <Search className="w-4 h-4 mr-1" />
          Search
        </Button>
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setSearchQuery(''); onSearch?.('') }}
            className="p-2"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </form>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label={FINANCIAL_YEARS.find(fy => fy.id === filters.financialYear)?.label || 'All Years'}
          icon={Calendar}
          active={!!filters.financialYear}
          onClick={() => handleFilterChange('financialYear', '')}
          onRemove={() => handleFilterChange('financialYear', '')}
        />
        <FilterChip
          label={PROPERTY_TYPES.find(t => t.id === filters.propertyType)?.label || 'All Types'}
          icon={Building2}
          active={!!filters.propertyType}
          onClick={() => handleFilterChange('propertyType', '')}
          onRemove={() => handleFilterChange('propertyType', '')}
        />
        <FilterChip
          label={filters.taxStatus ? TAX_STATUS_LABELS[filters.taxStatus] : 'All Status'}
          icon={DollarSign}
          active={!!filters.taxStatus}
          color={filters.taxStatus ? TAX_STATUS_COLORS[filters.taxStatus] : undefined}
          onClick={() => handleFilterChange('taxStatus', '')}
          onRemove={() => handleFilterChange('taxStatus', '')}
        />
        <FilterChip
          label={filters.blockName ? `${filters.blockName}` : 'All Blocks'}
          icon={MapPin}
          active={!!filters.blockId}
          onClick={() => handleFilterChange('blockId', '')}
          onRemove={() => handleFilterChange('blockId', '')}
        />
      </div>

      {/* Advanced Filters Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        className="w-fit"
      >
        <Filter className="w-4 h-4 mr-1" />
        Advanced Filters {activeFilterCount > 0 && (
          <Badge className="ml-1">{activeFilterCount}</Badge>
        )}
        {!showAdvancedFilters ? <span>▼</span> : <span>▲</span>}
      </Button>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-3 bg-ink-50 rounded-lg border border-ink-200">
          <Select
            label="Financial Year"
            value={filters.financialYear || ''}
            onValueChange={v => handleFilterChange('financialYear', v)}
            options={[{ value: '', label: 'All Years' }, ...FINANCIAL_YEARS.map(fy => ({ value: fy.id, label: fy.label }))]}
            placeholder="Select FY"
          />
          <Select
            label="Property Type"
            value={filters.propertyType || ''}
            onValueChange={v => handleFilterChange('propertyType', v)}
            options={[{ value: '', label: 'All Types' }, ...PROPERTY_TYPES.map(t => ({ value: t.id, label: t.label }))]}
            placeholder="Select Type"
          />
          <Select
            label="Tax Status"
            value={filters.taxStatus || ''}
            onValueChange={v => handleFilterChange('taxStatus', v)}
            options={[
              { value: '', label: 'All Status' },
              ...Object.entries(TAX_STATUS).map(([key, value]) => ({ value, label: TAX_STATUS_LABELS[value] })),
            ]}
            placeholder="Select Status"
          />
          <Select
            label="Block"
            value={filters.blockId || ''}
            onValueChange={v => handleFilterChange('blockId', v)}
            options={[
              { value: '', label: 'All Blocks' },
              { value: 'silao', label: 'Silao' },
              { value: 'biharsharif', label: 'Bihar Sharif' },
              { value: 'harnaut', label: 'Harnaut' },
            ]}
            placeholder="Select Block"
          />
          <Select
            label="Ward"
            value={filters.wardId || ''}
            onValueChange={v => handleFilterChange('wardId', v)}
            options={[{ value: '', label: 'All Wards' }]}
            placeholder="Select Ward"
            disabled={!filters.blockId}
          />
          <Select
            label="Village"
            value={filters.villageId || ''}
            onValueChange={v => handleFilterChange('villageId', v)}
            options={[{ value: '', label: 'All Villages' }]}
            placeholder="Select Village"
            disabled={!filters.wardId}
          />
        </div>
      )}

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="w-fit text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4 mr-1" />
          Clear All Filters
        </Button>
      )}
    </div>
  )
}

function FilterChip({ label, icon: Icon, active, onClick, onRemove, color }) {
  return (
    <Button
      variant={active ? 'secondary' : 'outline'}
      size="sm"
      className="gap-1 h-8 px-3"
      onClick={onClick}
    >
      {active && onRemove ? (
        <>
          <Icon className="w-3.5 h-3.5" style={{ color: color || 'currentColor' }} />
          <span className="text-xs">{label}</span>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRemove() }}
            className="ml-1 p-0.5 rounded hover:bg-black/10"
            aria-label="Remove filter"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      ) : (
        <>
          <Icon className="w-3.5 h-3.5" style={{ color: color || 'currentColor' }} />
          <span className="text-xs">{label}</span>
        </>
      )}
    </Button>
  )
}

export default RevenueFilters
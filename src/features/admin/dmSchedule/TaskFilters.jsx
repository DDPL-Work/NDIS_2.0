import { Search, X } from 'lucide-react'
import Select from '../../../components/ui/Select'
import Button from '../../../components/ui/Button'
import { TASK_TYPES, TASK_STATUSES, PRIORITY_LEVELS, FILTER_PRESETS, FILTER_PRESET_LABELS, TASK_TYPE_LABELS, TASK_STATUS_LABELS, PRIORITY_LABELS } from './constants'

export default function TaskFilters({
  filterPreset, setFilterPreset,
  typeFilter, setTypeFilter,
  statusFilter, setStatusFilter,
  priorityFilter, setPriorityFilter,
  searchQuery, setSearchQuery,
  onReset,
}) {
  const hasActiveFilters =
    filterPreset !== FILTER_PRESETS.ALL ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    searchQuery.trim()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search facility, task or department..."
          className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-[13px] text-ink-800 placeholder-ink-400 focus:border-saffron-500 focus:outline-none focus:ring-1 focus:ring-saffron-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-400 hover:text-ink-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Preset filter */}
      <Select
        value={filterPreset}
        onChange={setFilterPreset}
        options={Object.entries(FILTER_PRESET_LABELS).map(([value, label]) => ({ value, label }))}
        className="w-full sm:w-40"
      />

      {/* Type filter */}
      <Select
        value={typeFilter}
        onChange={setTypeFilter}
        options={[
          { value: 'all', label: 'All actions' },
          ...Object.entries(TASK_TYPE_LABELS).map(([value, label]) => ({ value, label })),
        ]}
        className="w-full sm:w-44"
      />

      {/* Status filter */}
      <Select
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { value: 'all', label: 'All statuses' },
          ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({ value, label })),
        ]}
        className="w-full sm:w-36"
      />

      {/* Priority filter */}
      <Select
        value={priorityFilter}
        onChange={setPriorityFilter}
        options={[
          { value: 'all', label: 'All priorities' },
          ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
        ]}
        className="w-full sm:w-36"
      />

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" icon={X} onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  )
}

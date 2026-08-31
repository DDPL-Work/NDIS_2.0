import { useState, useMemo, useEffect } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, MapPin, Building2, Users, Award } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { backendGapApi } from '../../../api/gapApi'

const PRIORITY_META = {
  P1: { label: 'P1 Critical', tone: 'alert' },
  P2: { label: 'P2 High', tone: 'saffron' },
  P3: { label: 'P3 Medium', tone: 'sky' },
  P4: { label: 'P4 Low', tone: 'leaf' },
}

export default function Ranking({ districtId, initialType = 'facility', onSelect, filters: externalFilters, onFilterChange }) {
  const [type] = useState(initialType)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'gapScore', direction: 'desc' })
  const [localFilters, setLocalFilters] = useState({ priority: '', search: '', department: '' })
  const [page, setPage] = useState(1)
  const pageSize = 25

  const filters = externalFilters || localFilters
  const setFilters = onFilterChange || setLocalFilters

  // Load rankings from GET /gap-priority/ → results array
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const params = {}
    if (districtId) params.district = districtId
    if (filters.department) params.department = filters.department
    if (filters.priority) params.priority = filters.priority

    backendGapApi.list(params)
      .then((result) => {
        if (cancelled) return
        setData(result.results || [])
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Failed to load rankings')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [districtId, filters.department, filters.priority])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Sorted & filtered data — all from backend
  const processedData = useMemo(() => {
    let result = [...data]

    // Client-side search (backend doesn't support text search)
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter((item) =>
        (item.name || '').toLowerCase().includes(q) ||
        (item.departmentCode || '').toLowerCase().includes(q)
      )
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      if (aVal == null) aVal = -Infinity
      if (bVal == null) bVal = -Infinity
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [data, filters.search, sortConfig])

  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = processedData.slice((page - 1) * pageSize, page * pageSize)

  // Unique departments from backend data
  const departments = useMemo(() => {
    const depts = new Map()
    data.forEach((item) => {
      if (item.departmentCode) {
        depts.set(item.departmentCode, item.departmentCode)
      }
    })
    return [...depts.entries()]
  }, [data])

  if (loading) {
    return (
      <div className="rounded-xl border border-ink-100 bg-white p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent mx-auto mb-2" />
        <p className="text-ink-500">Loading rankings…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-alert-200 bg-alert-50 p-6 text-center text-alert-700">
        <p className="text-[13px]">Failed to load rankings: {error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => { setError(null); setPage(1) }}>Retry</Button>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-8 text-center">
        <Award className="mx-auto text-ink-300 mb-2" size={32} />
        <p className="text-[13px] text-ink-500">No gap data available</p>
        <p className="text-[11px] text-ink-400 mt-1">The backend did not return any ranked locations for the current filters.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white overflow-hidden">
      {/* Header + Controls */}
      <div className="border-b border-ink-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-ink-950">Ranked Locations</h3>
            <p className="text-[11px] text-ink-500">{processedData.length} total · Showing {paginatedData.length}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-300" size={14} />
              <input
                type="text"
                placeholder="Search name, department…"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-56 pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-ink-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-2.5 py-1.5 rounded-lg border border-ink-200 bg-white text-[11px] text-ink-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="">All priorities</option>
              {Object.entries(PRIORITY_META).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
            {departments.length > 0 && (
              <select
                value={filters.department || ''}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg border border-ink-200 bg-white text-[11px] text-ink-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">All departments</option>
                {departments.map(([code]) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]" role="grid">
          <thead>
            <tr className="bg-ink-50/50 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-left">
                <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-ink-700">
                  Name
                  {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left">Department</th>
              <th className="px-3 py-2 text-right">
                <button onClick={() => handleSort('gapScore')} className="flex items-center justify-end gap-1 hover:text-ink-700">
                  Gap Score
                  {sortConfig.key === 'gapScore' && (sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                </button>
              </th>
              <th className="px-3 py-2 text-center">
                <button onClick={() => handleSort('priority')} className="flex items-center justify-center gap-1 hover:text-ink-700">
                  Priority
                  {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left">Reason Codes</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {paginatedData.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-ink-50/50 transition cursor-pointer" onClick={() => onSelect?.(item)}>
                <td className="px-3 py-2.5 text-ink-500 font-mono tabular-nums">#{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-ink-900 truncate max-w-[240px]">{item.name || '—'}</div>
                </td>
                <td className="px-3 py-2.5 text-ink-600 truncate max-w-[140px]">{item.departmentCode || '—'}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums font-medium text-ink-800">
                  {item.gapScore != null ? Number(item.gapScore).toFixed(1) : '—'}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {item.priority && (
                    <Badge tone={PRIORITY_META[item.priority]?.tone || 'ink'} className="text-[10px]">
                      {PRIORITY_META[item.priority]?.label || item.priority}
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2.5 text-ink-500 text-[10.5px] truncate max-w-[160px]">
                  {(item.reasonCodes || []).join(', ') || '—'}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect?.(item) }}
                    className="text-sky-600 hover:text-sky-900 text-[11px] font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && (
          <div className="p-8 text-center text-ink-500">No results match your filters.</div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-ink-100 px-4 py-3 flex items-center justify-between">
            <p className="text-[11px] text-ink-500">
              Page {page} of {totalPages} · {processedData.length} total
            </p>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={12} />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={12} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

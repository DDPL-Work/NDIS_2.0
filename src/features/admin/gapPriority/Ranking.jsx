import { useState, useMemo, useEffect } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter, Search, Download, MapPin, Building2, Users, Award } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { backendGapApi } from '../../../api/gapApi'

const PRIORITY_META = {
  P1: { label: 'P1 Critical', tone: 'alert' },
  P2: { label: 'P2 High', tone: 'saffron' },
  P3: { label: 'P3 Medium', tone: 'sky' },
  P4: { label: 'P4 Low', tone: 'leaf' },
}

const TYPE_CONFIG = {
  facility: { label: 'Facilities', icon: Building2, keyField: 'id', nameField: 'name', locationFields: ['village', 'block'] },
  village: { label: 'Villages', icon: MapPin, keyField: 'villageId', nameField: 'village', locationFields: ['block'] },
  block: { label: 'Blocks', icon: Award, keyField: 'blockId', nameField: 'block', locationFields: [] },
}

export default function Ranking({ districtId, initialType = 'facility', onSelect }) {
  const [type, setType] = useState(initialType)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'priorityScore', direction: 'desc' })
  const [filters, setFilters] = useState({ priority: '', search: '', department: '' })
  const [page, setPage] = useState(1)
  const pageSize = 25

  // Load rankings
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    backendGapApi.rankings(districtId, { type, limit: 500 })
      .then((res) => {
        if (cancelled) return
        setData(res.items || res.rankings || res.data || [])
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [districtId, type])

  // Sort handler
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Sorted & filtered data
  const processedData = useMemo(() => {
    let result = [...data]

    // Filter by priority
    if (filters.priority) {
      result = result.filter((item) => item.priority === filters.priority)
    }

    // Filter by department
    if (filters.department) {
      result = result.filter((item) => item.departmentId === filters.department)
    }

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter((item) =>
        (item.name || '').toLowerCase().includes(q) ||
        (item.village || '').toLowerCase().includes(q) ||
        (item.block || '').toLowerCase().includes(q)
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
  }, [data, filters, sortConfig])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = processedData.slice((page - 1) * pageSize, page * pageSize)

  // Unique departments for filter
  const departments = useMemo(() => {
    const depts = new Map()
    data.forEach((item) => {
      if (item.departmentId && item.departmentName) {
        depts.set(item.departmentId, item.departmentName)
      }
    })
    return [...depts.entries()]
  }, [data])

  const config = TYPE_CONFIG[type]

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
        <p>Failed to load rankings: {error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-8 text-center">
        <Award className="mx-auto text-ink-300 mb-2" size={32} />
        <p className="text-ink-500">No {config.label.toLowerCase()} found in the current data.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white overflow-hidden">
      {/* Header + Controls */}
      <div className="border-b border-ink-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <config.icon className="text-sky-600" size={20} />
            <div>
              <h3 className="text-[14px] font-semibold text-ink-950">Top {config.label}</h3>
              <p className="text-[11px] text-ink-500">{processedData.length} total · Showing {paginatedData.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type tabs */}
            <div className="flex bg-ink-50 rounded-lg p-0.5" role="tablist">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={type === key}
                  onClick={() => { setType(key); setPage(1) }}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition ${type === key ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-300" size={14} />
                <input
                  type="text"
                  placeholder="Search name, village, block…"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="w-56 pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-ink-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
                className="px-2.5 py-1.5 rounded-lg border border-ink-200 bg-white text-[11px] text-ink-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">All priorities</option>
                {Object.entries(PRIORITY_META).map(([key, meta]) => (
                  <option key={key} value={key}><Badge tone={meta.tone} className="text-[10px]">{meta.label}</Badge></option>
                ))}
              </select>
              {departments.length > 0 && (
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value, page: 1 })}
                  className="px-2.5 py-1.5 rounded-lg border border-ink-200 bg-white text-[11px] text-ink-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="">All departments</option>
                  {departments.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              )}
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <Download size={12} /> Export
              </Button>
            </div>
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
                  {config.label.slice(0, -1)}
                  {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left">Location</th>
              <th className="px-3 py-2 text-left">Department</th>
              <th className="px-3 py-2 text-right">
                <button onClick={() => handleSort('gapScore')} className="flex items-center justify-end gap-1 hover:text-ink-700">
                  Gap Score
                  {sortConfig.key === 'gapScore' && (sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                </button>
              </th>
              <th className="px-3 py-2 text-right">
                <button onClick={() => handleSort('priorityScore')} className="flex items-center justify-end gap-1 hover:text-ink-700">
                  Priority Score
                  {sortConfig.key === 'priorityScore' && (sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                </button>
              </th>
              <th className="px-3 py-2 text-center">
                <button onClick={() => handleSort('priority')} className="flex items-center justify-center gap-1 hover:text-ink-700">
                  Priority
                  {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                </button>
              </th>
              <th className="px-3 py-2 text-right">
                <button onClick={() => handleSort('population')} className="flex items-center justify-end gap-1 hover:text-ink-700">
                  <Users size={10} /> Population
                  {sortConfig.key === 'population' && (sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                </button>
              </th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {paginatedData.map((item, idx) => (
              <tr key={item[config.keyField] || item.id || idx} className="hover:bg-ink-50/50 transition cursor-pointer" onClick={() => onSelect?.(item)}>
                <td className="px-3 py-2.5 text-ink-500 font-mono tabular-nums">#{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-ink-900 truncate max-w-[200px]">{item.name || item.village || item.block || '—'}</div>
                  {item.categoryLabel && <div className="text-[10.5px] text-ink-400 truncate max-w-[200px]">{item.categoryLabel}</div>}
                </td>
                <td className="px-3 py-2.5 text-ink-600">
                  <div>{item.village || item.block || '—'}</div>
                  {item.block && item.village && item.block !== item.village && (
                    <div className="text-[10.5px] text-ink-400">{item.block}</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-ink-600 truncate max-w-[140px]">{item.departmentName || '—'}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums font-medium text-ink-800">
                  {item.gapScore != null ? Number(item.gapScore).toFixed(2) : '—'}
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold text-sky-700">
                  {item.priorityScore != null ? Number(item.priorityScore).toFixed(3) : item.score != null ? Number(item.score).toFixed(3) : '—'}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {item.priority && (
                    <Badge tone={PRIORITY_META[item.priority]?.tone || 'ink'} className="text-[10px]">{PRIORITY_META[item.priority]?.label || item.priority}</Badge>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-500">
                  {item.population != null ? Number(item.population).toLocaleString('en-IN') : '—'}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-ink-100 px-4 py-3 flex items-center justify-between">
          <p className="text-[11px] text-ink-500">
            Page {page} of {totalPages} · {processedData.length} total
          </p>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setPage(p - 1)} disabled={page === 1}>
              <ChevronLeft size={12} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p + 1)} disabled={page === totalPages}>
              <ChevronRight size={12} />
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
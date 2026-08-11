import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MapPin, Search, ShieldCheck, ShieldAlert, X } from 'lucide-react'
import { useSpatialQuery } from '../../hooks/useSpatialQuery'
import { getGISSuggestions } from '../engine/GISSuggestionEngine'

const RADIUS_OPTIONS = [
  { value: '10', label: '10 km' },
  { value: '5', label: '5 km' },
  { value: '2', label: '2 km' },
  { value: '20', label: '20 km' },
]

function HazardBadge({ safe }) {
  return safe ? (
    <span className="flex items-center gap-0.5 rounded-full bg-leaf-50 px-1.5 py-0.5 text-[10px] font-semibold text-leaf-700"><ShieldCheck size={9} /> Safe</span>
  ) : (
    <span className="flex items-center gap-0.5 rounded-full bg-alert-50 px-1.5 py-0.5 text-[10px] font-semibold text-alert-600"><ShieldAlert size={9} /> Hazard</span>
  )
}

// One shared AI GIS search box.  Every portal (citizen, department, executive,
// DM situation matrix, admin) renders this same component and therefore calls
// the same backend /api/spatial-query/ service — no portal-local search logic.
export default function GISSearchPanel({ facilities = [], center, user, allowedDepartments, onResults, onResultClick, onShowRoute, onClearRoute, routeActiveId, routeLoading = false, onRouteStart, onRouteDestination, routeStartId, routeDestinationId, compact = false, bare = false }) {
  const { results, loading, error, runSearch, clear } = useSpatialQuery({ user })
  const [query, setQuery] = useState('')
  const [radius, setRadius] = useState('10')
  const [lastQuery, setLastQuery] = useState('')
  const suggestions = useMemo(() => getGISSuggestions(query), [query])

  const run = async (value = query) => {
    const term = String(value || '').trim()
    setQuery(term)
    if (!term) {
      clear()
      setLastQuery('')
      onResults?.(null)
      return
    }
    const data = await runSearch(term, { radius: Number(radius) || 10, limit: 10 })
    setLastQuery(term)
    onResults?.({ query: term, results: data.results || [], totalFound: data.totalFound || 0 })
  }

  // AI assistant (and any global dispatch) triggers the same shared path.
  useEffect(() => {
    const ask = (event) => { if (event?.detail) run(event.detail) }
    window.addEventListener('ndisp-gis-ask', ask)
    return () => window.removeEventListener('ndisp-gis-ask', ask)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className={`input-field ${bare ? '!h-8 !text-xs' : ''} !pl-9 ${loading ? 'pr-9' : ''}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="Ask GIS: nearest PHC, hospitals near me, water tank…"
            disabled={loading}
          />
          {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-saffron-600" />}
        </div>
        {!bare && (
          <select aria-label="Search radius" value={radius} onChange={(e) => setRadius(e.target.value)} className="input-field !w-[75px] !px-2 text-xs" disabled={loading}>
            {RADIUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        )}
        <button aria-label="Run GIS query" onClick={() => run()} disabled={loading} className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900 text-white hover:bg-ink-800 disabled:opacity-50">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </div>

      {!bare && (
        <div className="flex gap-1 flex-wrap">
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => run(item)} disabled={loading} className="text-[11px] px-2 py-1 rounded-full bg-ink-100 text-ink-600 hover:bg-ink-200 disabled:opacity-50">
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Docked result panel — identical cards in every portal */}
      {!bare && lastQuery && (
        <div className="rounded-lg border border-ink-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-2.5 py-1.5">
            <span className="text-[11px] font-semibold text-ink-700">
              {error ? 'Search failed' : `${results.length} result${results.length === 1 ? '' : 's'} for “${lastQuery}”`}
            </span>
            <button aria-label="Clear results" onClick={() => { clear(); setLastQuery(''); onResults?.(null) }} className="rounded-md p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
              <X size={12} />
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {error ? (
              <p className="px-3 py-4 text-center text-[11.5px] text-alert-600">Unable to perform spatial search.</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-4 text-center text-[11.5px] text-ink-400">No matching facilities found.</p>
            ) : (
              <ul className="divide-y divide-ink-50">
{results.map((row) => {
                  const routeActive = String(routeActiveId) === String(row.id)
                  const canPick = Boolean(onRouteStart || onRouteDestination)
                  const isStart = routeStartId != null && routeStartId === String(row.id)
                  const isDestination = routeDestinationId != null && routeDestinationId === String(row.id)
                  const distanceLabel = row.distanceKm != null ? `${row.distanceKm.toFixed(2)} km` : row.distanceM != null ? `${(row.distanceM / 1000).toFixed(2)} km` : ''
                  return (
                    <li key={row.id} className="flex items-center gap-1.5 px-2.5 py-1.5">
                      <button
                        type="button"
                        onClick={() => onResultClick?.(row)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left hover:bg-ink-50/60"
                      >
                        <MapPin size={13} className="shrink-0 text-sky-600" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-semibold text-ink-900">{row.name}</span>
                          <span className="block truncate text-[10.5px] text-ink-500">{row.categoryLabel} · {row.departmentName}</span>
                        </span>
                        <span className="shrink-0 flex items-center gap-1.5">
                          <span className="text-[10.5px] text-ink-500" title="Straight-line distance from search origin">{distanceLabel}</span>
                          <HazardBadge safe={row.hazardSafe} />
                        </span>
                      </button>
                      {canPick && isStart && (
                        <span className="shrink-0 rounded-md bg-leaf-50 px-2 py-1 text-[10px] font-semibold text-leaf-700" title="Selected as route start">Start</span>
                      )}
                      {canPick && isDestination && (
                        <span className="shrink-0 rounded-md bg-alert-50 px-2 py-1 text-[10px] font-semibold text-alert-600" title="Selected as route destination">Dest</span>
                      )}
{canPick && !isStart && !isDestination && (
                        <button
                          type="button"
                          disabled={routeLoading}
                          onClick={() => (routeStartId == null ? onRouteStart?.(row) : onRouteDestination?.(row))}
                          title={routeStartId == null ? 'Set this facility as the route start' : 'Set this facility as the route destination'}
                          className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors disabled:opacity-50 ${routeStartId == null ? 'text-ink-600 hover:bg-ink-100' : 'text-leaf-700 hover:bg-leaf-50'}`}
                        >
                          {routeStartId == null ? 'Start From Here' : 'Route To Here'}
                        </button>
                      )}
                      {onShowRoute && (
                        <button
                          type="button"
                          disabled={routeLoading && !routeActive}
                          onClick={() => (routeActive ? onClearRoute?.() : onShowRoute(row))}
                          className={`shrink-0 rounded-md px-2 py-1 text-[10.5px] font-semibold transition-colors disabled:opacity-50 ${routeActive ? 'bg-ink-100 text-ink-700 hover:bg-ink-200' : 'text-sky-700 hover:bg-sky-50'}`}
                        >
                          {routeActive ? 'Clear Route' : 'Show Route'}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
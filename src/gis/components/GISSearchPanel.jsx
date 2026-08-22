import { useEffect, useMemo, useState } from 'react'
import { Loader2, MapPin, Search, ShieldCheck, ShieldAlert, X } from 'lucide-react'
import { useSpatialQuery } from '../../hooks/useSpatialQuery'
import { getGISSuggestions } from '../engine/GISSuggestionEngine'

const RADIUS_OPTIONS = [
  { value: '10', label: '10 km' },
  { value: '5', label: '5 km' },
  { value: '2', label: '2 km' },
  { value: '20', label: '20 km' },
  // { value: '5000', label: '5000 km' }
]

// Category shortcuts shown while the box is focused but empty.  Each one runs
// the real spatial query — never a mock — so an empty result set stays honest.
const SUGGESTION_SHORTCUTS = [
  'Nearby hospitals',
  'Schools near me',
  'Water facilities near me',
  'Banks in my area',
  'Government offices',
  'Complaints near me',
]

function HazardBadge({ safe }) {
  return safe ? (
    <span className="flex items-center gap-0.5 rounded-full bg-leaf-50 px-1.5 py-0.5 text-[10px] font-semibold text-leaf-700"><ShieldCheck size={9} /> Safe</span>
  ) : (
    <span className="flex items-center gap-0.5 rounded-full bg-alert-50 px-1.5 py-0.5 text-[10px] font-semibold text-alert-600"><ShieldAlert size={9} /> Hazard</span>
  )
}

// Readable distance label: < 1 km → metres, 1 km+ → one decimal.  Uses the
// backend-provided distance only (distance_km preferred, distance_m fallback).
function formatDistance(row) {
  if (row.distanceKm != null && Number.isFinite(Number(row.distanceKm))) {
    const km = Number(row.distanceKm)
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
  }
  if (row.distanceM != null && Number.isFinite(Number(row.distanceM))) {
    const meters = Number(row.distanceM)
    return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
  }
  return ''
}

// One shared AI GIS search box.  Every portal (citizen, department, executive,
// DM situation matrix, admin) renders this same component and therefore calls
// the same backend /api/spatial-query/ service — no portal-local search logic.
export default function GISSearchPanel({ user, onResults, onResultClick, onShowRoute, onClearRoute, routeActiveId, routeLoading = false, onRouteStart, onRouteDestination, routeStartId, routeDestinationId, bare = false, showSuggestions = true }) {
  const { results, loading, error, runSearch, clear } = useSpatialQuery({ user })
  const [query, setQuery] = useState('')
  const [radius, setRadius] = useState('10')
  const [lastQuery, setLastQuery] = useState('')
  const [focused, setFocused] = useState(false)
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
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            data-tour="citizen-map-search"
            className={`input-field ${bare ? '!h-8 !text-xs' : ''} !pl-9 ${loading ? 'pr-9' : ''}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            placeholder="Search places, services or facilities"
            disabled={loading}
            aria-expanded={focused && !query.trim()}
            aria-label="Search places, services or facilities"
          />
          {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-saffron-600" />}
          {/* Category shortcuts while focused & empty — real searches only */}
          {showSuggestions && focused && !query.trim() && !loading && (
            <div className="ndisp-suggest absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-popover">
              <p className="px-3 pt-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">Try searching for</p>
              {SUGGESTION_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut}
                  type="button"
                  onClick={() => run(shortcut)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] font-medium text-ink-700 hover:bg-ink-50"
                >
                  <MapPin size={12} className="shrink-0 text-sky-600" />
                  {shortcut}
                </button>
              ))}
            </div>
          )}
        </div>
        {!bare && (
          <select aria-label="Search radius" data-tour="citizen-map-radius" value={radius} onChange={(e) => setRadius(e.target.value)} className="input-field !w-[75px] !px-2 text-xs" disabled={loading}>
            {RADIUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        )}
        <button aria-label="Run GIS query" onClick={() => run()} disabled={loading} className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900 text-white hover:bg-ink-800 disabled:opacity-50">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </div>

      {!bare && showSuggestions && (
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
        <div className="rounded-lg border border-ink-100 bg-white shadow-sm" data-tour="citizen-map-results">
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
                  const distanceLabel = formatDistance(row)
                  return (
                    <li key={row.id} className="px-2.5 py-2">
                      <button
                        type="button"
                        onClick={() => onResultClick?.(row)}
                        className="flex w-full items-start gap-2 rounded-md px-1 py-1 text-left hover:bg-ink-50/60"
                      >
                        <MapPin size={13} className="mt-0.5 shrink-0 text-sky-600" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-semibold leading-snug text-ink-900 line-clamp-2" title={row.name}>{row.name}</span>
                          <span className="block text-[10.5px] leading-snug text-ink-500 line-clamp-1">{row.categoryLabel}{row.departmentName ? ` · ${row.departmentName}` : ''}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {distanceLabel && (
                              <span className="text-[11px] font-medium text-ink-600" title="Straight-line distance from search origin">{distanceLabel}</span>
                            )}
                            <HazardBadge safe={row.hazardSafe} />
                            {canPick && isStart && (
                              <span className="rounded-md bg-leaf-50 px-1.5 py-0.5 text-[10px] font-semibold text-leaf-700" title="Selected as route start">Start</span>
                            )}
                            {canPick && isDestination && (
                              <span className="rounded-md bg-alert-50 px-1.5 py-0.5 text-[10px] font-semibold text-alert-600" title="Selected as route destination">Dest</span>
                            )}
                          </span>
                        </span>
                      </button>
                      {(canPick && !isStart && !isDestination) || onShowRoute ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-[22px]">
                          {canPick && !isStart && !isDestination && (
                            <button
                              type="button"
                              disabled={routeLoading}
                              onClick={() => (routeStartId == null ? onRouteStart?.(row) : onRouteDestination?.(row))}
                              data-tour="citizen-map-start-route"
                              title={routeStartId == null ? 'Set this facility as the route start' : 'Set this facility as the route destination'}
                              className="rounded-md border border-ink-200 px-2 py-1 text-[10.5px] font-semibold transition-colors disabled:opacity-50 text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                            >
                              {routeStartId == null ? 'Start From Here' : 'Route To Here'}
                            </button>
                          )}
                          {onShowRoute && (
                            <button
                              type="button"
                              disabled={routeLoading && !routeActive}
                              onClick={() => (routeActive ? onClearRoute?.() : onShowRoute(row))}
                              data-tour="citizen-map-show-route"
                              className={`rounded-md px-2 py-1 text-[10.5px] font-semibold transition-colors disabled:opacity-50 ${routeActive ? 'bg-ink-100 text-ink-700 hover:bg-ink-200' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
                            >
                              {routeActive ? 'Clear Route' : 'Show Route'}
                            </button>
                          )}
                        </div>
                      ) : null}
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

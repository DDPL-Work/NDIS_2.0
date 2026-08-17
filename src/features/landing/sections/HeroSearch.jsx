import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Loader2, MapPin, Navigation, Search, TrendingUp } from 'lucide-react'
import { spatialQueryService } from '../../../services/spatialQueryService'
import LandingCta from '../LandingCta'

// QUERY_CHIPS run the same public backend spatial-query the Explore Map uses
// (authenticated: false, 5-minute client cache). Navigation items link through
// LandingCta, which serves signed-in users the real citizen route and
// anonymous visitors an in-page section or the login page.
const QUERY_CHIPS = [
  { label: 'Nearest Hospital', query: 'Nearest hospital' },
  { label: 'Nearest School', query: 'Nearest school' },
  { label: 'Water Tank', query: 'Water tank' },
  { label: 'Report a Road Problem', query: 'Road problems' },
]

const NAV_CHIPS = [
  { label: 'Register Complaint', to: '/citizen/register' },
  { label: 'Track Complaint', to: '/citizen/track' },
  { label: 'Explore Facilities', to: '/citizen/map' },
  { label: 'Government Schemes', to: '/citizen/schemes' },
]

const POPULAR = [
  { label: 'Nearest Hospital', hint: 'Search health facilities', query: 'Nearest hospital' },
  { label: 'Nearest School', hint: 'Search education facilities', query: 'Nearest school' },
  { label: 'Register Complaint', hint: 'Create your account to report', to: '/citizen/register' },
  { label: 'Track Complaint', hint: 'Follow your request', to: '/citizen/track' },
  { label: 'Explore Facilities', hint: 'Open the district map', to: '/citizen/map' },
]

const PLACEHOLDERS = [
  'Find the nearest hospital',
  'Report a road problem',
  'Find a school near you',
  'Track my complaint',
  'Find government services',
]

export default function HeroSearch({ externalQuery = null }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [phIndex, setPhIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const runSearch = useCallback(async (term) => {
    const q = String(term || '').trim()
    if (!q) return
    setQuery(q)
    setBusy(true)
    setError(null)
    try {
      const data = await spatialQueryService.search(q, { radius: 15, limit: 5 })
      setResults(data)
    } catch (err) {
      setError(err?.message || 'Search is temporarily unavailable. Please try again.')
      setResults(null)
    } finally {
      setBusy(false)
    }
  }, [])

  // Requests from elsewhere on the page (quick actions, scenarios, markers)
  // funnel into the same public search — one engine, one cache.
  useEffect(() => {
    if (externalQuery) runSearch(externalQuery)
  }, [externalQuery, runSearch])

  // Slow placeholder rotation; pauses while the input is focused.
  useEffect(() => {
    if (focused) return
    const timer = setInterval(() => setPhIndex((index) => (index + 1) % PLACEHOLDERS.length), 3800)
    return () => clearInterval(timer)
  }, [focused])

  const placeholder = focused ? 'What can we help you find?' : PLACEHOLDERS[phIndex]

  return (
    <div className="relative w-full" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
      <form
        className="relative"
        onSubmit={(event) => { event.preventDefault(); runSearch(query) }}
        role="search"
        aria-label="Search district services"
      >
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          aria-label="What can we help you find?"
          className="w-full rounded-2xl border border-ink-200 bg-white py-4 pl-11 pr-28 text-[15px] text-ink-900 shadow-card outline-none placeholder:text-ink-400 focus:border-saffron-400 focus-visible:ring-2 focus-visible:ring-saffron-500/30"
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-ink-950 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}Search
        </button>
      </form>

      {focused && !query.trim() && (
        <div className="absolute inset-x-0 top-full z-20 mt-2" aria-label="Popular searches">
          <div className="rounded-2xl border border-ink-100 bg-white p-2 shadow-popover">
            <p className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
              <TrendingUp size={12} />Popular searches
            </p>
            {POPULAR.map((item) => (
              item.query ? (
                <button
                  key={item.label}
                  onClick={() => { setFocused(false); runSearch(item.query) }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-saffron-50"
                >
                  <span>
                    <span className="block text-[13px] font-semibold text-ink-900">{item.label}</span>
                    <span className="block text-[11.5px] text-ink-400">{item.hint}</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-saffron-600" />
                </button>
              ) : (
                <LandingCta
                  key={item.label}
                  to={item.to}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-saffron-50"
                >
                  <span>
                    <span className="block text-[13px] font-semibold text-ink-900">{item.label}</span>
                    <span className="block text-[11.5px] text-ink-400">{item.hint}</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-saffron-600" />
                </LandingCta>
              )
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Try these searches">
        <span className="text-[12px] font-medium text-ink-500">Try:</span>
        {QUERY_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => runSearch(chip.query)}
            disabled={busy}
            className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink-700 transition-colors hover:border-saffron-400 hover:bg-saffron-50 hover:text-saffron-800 disabled:opacity-60"
          >
            {chip.label}
          </button>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-ink-200 sm:block" />
        {NAV_CHIPS.map((chip) => (
          <LandingCta key={chip.label} to={chip.to} className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink-700 transition-colors hover:border-leaf-400 hover:bg-leaf-50 hover:text-leaf-700">
            {chip.label}
          </LandingCta>
        ))}
      </div>

      {busy && <p className="mt-3 text-[12.5px] text-ink-500">Searching nearby services…</p>}
      {error && <p className="mt-3 rounded-xl border border-alert-200 bg-alert-50 px-3.5 py-2.5 text-[12.5px] text-alert-600">{error}</p>}

      {results && !busy && !error && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-popover">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
            <p className="text-[12.5px] font-semibold text-ink-800">Nearby results for “{results.queryInfo?.query || query}”</p>
            <LandingCta to="/citizen/map" className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"><Navigation size={12} />Open Map</LandingCta>
          </div>
          {(results.results || []).length === 0 ? (
            <p className="px-4 py-4 text-[12.5px] text-ink-500">No matching places found nearby right now.</p>
          ) : (
            <ul className="max-h-72 divide-y divide-ink-50 overflow-y-auto">
              {results.results.map((row) => {
                const km = row.distanceKm != null ? `${row.distanceKm.toFixed(1)} km` : null
                return (
                  <li key={row.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-saffron-50 text-saffron-600"><MapPin size={15} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink-900">{row.name}</span>
                      <span className="block truncate text-[11.5px] text-ink-500">{row.categoryLabel}{row.departmentName ? ` · ${row.departmentName}` : ''}</span>
                    </span>
                    {km && <span className="shrink-0 rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-600">{km}</span>}
                  </li>
                )
              })}
            </ul>
          )}
          <p className="border-t border-ink-100 px-4 py-2 text-[11px] text-ink-400">Results are for information only. Sign in to view details and report issues.</p>
        </div>
      )}
    </div>
  )
}

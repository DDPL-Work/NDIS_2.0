import { ArrowLeftRight, Flag, Loader2, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import { ROUTE_MODES } from '../../hooks/useRoute'

// Floating route card shown over the map.  Handles three states for both
// routing modes: facility-to-facility selection (start/destination picked but
// not yet routed), in-flight, error, and the active route summary.
//
// Distances are always labeled: search cards show the spatial-query distance;
// this card shows ROAD distance from the routing engine — the two values are
// different concepts and are never merged.
export default function RouteSummary({ status, mode, route, startFacility, destinationFacility, errorMessage, onShowShortest, onSwap, onClear }) {
  const ff = mode === ROUTE_MODES.FACILITY_TO_FACILITY
  const pickActive = ff && status === 'idle' && (startFacility || destinationFacility)

  if (status === 'idle' && !pickActive) return null

  if (pickActive) {
    return (
      <div className="pointer-events-auto w-[260px] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
        <div className="flex items-start justify-between gap-2 border-b border-ink-100 bg-ink-900 px-3.5 py-2">
          <div className="min-w-0">
            <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-400">Route between facilities</div>
            <div className="mt-0.5 truncate text-[12.5px] font-semibold text-white">{startFacility?.name || '—'}</div>
          </div>
          <button onClick={onClear} aria-label="Cancel facility selection" className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white"><X size={14} /></button>
        </div>
        <div className="space-y-1 px-3.5 py-2.5 text-[12px]">
          <div className="flex items-center gap-2"><Flag size={12} className="shrink-0 text-leaf-600" /><span className="w-10 text-[10px] font-semibold uppercase tracking-wide text-ink-400">To</span><span className="truncate font-medium text-ink-800">{destinationFacility?.name || 'Choose a destination facility'}</span></div>
          {!destinationFacility && <p className="pt-1 text-[11px] text-ink-500">Tap &quot;Route To Here&quot; on another facility result to set the destination.</p>}
        </div>
        <div className="flex gap-2 border-t border-ink-100 px-2.5 py-2">
          <Button size="sm" variant="primary" icon={Flag} disabled={!destinationFacility} onClick={onShowShortest} className="flex-1">Show Shortest Route</Button>
          {startFacility && destinationFacility && <Button size="sm" variant="ghost" icon={ArrowLeftRight} onClick={onSwap} title="Swap start and destination">Swap</Button>}
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-[12px] font-medium text-ink-700 shadow-lg">
        <Loader2 size={14} className="animate-spin text-saffron-600" />
        {ff ? 'Calculating shortest route…' : 'Calculating route…'}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="pointer-events-auto max-w-[270px] rounded-xl border border-alert-200 bg-white px-3.5 py-2.5 shadow-lg">
        <p className="text-[11px] text-alert-700">{errorMessage || 'Unable to calculate a road route.'}</p>
        <Button size="sm" variant="ghost" onClick={onClear} className="mt-1.5 !text-[11px]">Dismiss</Button>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto w-[260px] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
      <div className="flex items-start justify-between gap-2 border-b border-ink-100 bg-ink-900 px-3.5 py-2">
        <div className="min-w-0">
          <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-400">{ff ? 'Route between facilities' : 'Route to'}</div>
          <div className="truncate text-[12.5px] font-semibold text-white">{ff && startFacility ? `${startFacility.name} → ${route?.destination?.name || 'Facility'}` : (route?.destination?.name || 'Facility')}</div>
        </div>
        <button onClick={onClear} aria-label="Clear route" className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white"><X size={14} /></button>
      </div>
      <div className="space-y-1 px-3.5 py-2.5 text-[12px]">
        {ff && (
          <div className="flex items-center gap-2 pb-1 text-[11px] text-ink-500">
            <span className="font-medium text-ink-800 truncate">From: {route?.origin?.name || startFacility?.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Road distance</span><span className="font-semibold text-ink-900">{route.distanceKm} km</span></div>
        <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Estimated time</span><span className="text-ink-700">{route.durationMinutes} min</span></div>
      </div>
      <div className="flex gap-2 border-t border-ink-100 px-2.5 py-2">
        <Button size="sm" variant="outline" icon={X} onClick={onClear} className="flex-1">Clear Route</Button>
        {ff && <Button size="sm" variant="ghost" icon={ArrowLeftRight} onClick={onSwap} title="Swap start and destination">Swap</Button>}
      </div>
    </div>
  )
}
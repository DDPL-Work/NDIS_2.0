import { Loader2, Navigation, X } from 'lucide-react'
import Button from '../../components/ui/Button'

function TargetRow({ label, target }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-14 shrink-0 pt-px text-[10px] font-semibold uppercase tracking-wide text-ink-400">{label}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium text-ink-800">{target?.name || '—'}</div>
        {target?.sub ? <div className="truncate text-[10px] text-ink-400">{target.sub}</div> : null}
      </div>
    </div>
  )
}

// Floating route card shown over the map.  Represents exactly TWO endpoints —
// origin + destination — in four states: picked-but-not-calculated (idle),
// in-flight, error, and the active route summary with totals from the routing
// response.  Road distance comes from the routing engine; spatial-query cards
// show the search distance — two different concepts, never merged.
export default function RouteSummary({ status, route, origin = null, destination = null, errorMessage, onCalculate, onClear }) {
  const hasOrigin = origin != null
  const hasDestination = destination != null
  const routeLocked = status === 'loading'
  const canCalculate = hasOrigin && hasDestination && !routeLocked
  const idle = status === 'idle'

  if (idle && !hasOrigin && !hasDestination) return null

  if (idle) {
    return (
      <div className="pointer-events-auto w-[min(280px,calc(100vw-32px))] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
        <div className="flex items-start justify-between gap-2 border-b border-ink-100 bg-ink-900 px-3.5 py-2">
          <div className="min-w-0">
            <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-400">Route</div>
            <div className="mt-0.5 truncate text-[12.5px] font-semibold text-white">
              {hasOrigin && hasDestination ? `${origin.name} → ${destination.name}` : (hasOrigin ? origin.name : '—')}
            </div>
          </div>
          <button onClick={onClear} aria-label="Cancel route" className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white"><X size={14} /></button>
        </div>
        <div className="space-y-2 px-3.5 py-2.5 text-[12px]">
          <TargetRow label="From" target={origin} />
          <TargetRow label="To" target={destination} />
          {(!hasOrigin || !hasDestination) && (
            <p className="pt-0.5 text-[11px] text-ink-500">
              {!hasOrigin && !hasDestination ? 'Pick a start point to build the route.' : hasOrigin ? 'Route to a destination to build the route.' : 'Set a start point to build the route.'}
            </p>
          )}
          <div className="flex items-center justify-between border-t border-ink-100 pt-1.5 text-[11px] text-ink-500">
            <span>Origin → destination</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Tap start to route on roads</span>
          </div>
        </div>
        <div className="flex gap-2 border-t border-ink-100 px-2.5 py-2">
          <Button size="sm" variant="primary" icon={Navigation} disabled={!canCalculate} onClick={onCalculate} className="flex-1">Start Route</Button>
          <Button size="sm" variant="outline" icon={X} onClick={onClear} className="flex-1">Clear</Button>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-[12px] font-medium text-ink-700 shadow-lg">
        <Loader2 size={14} className="animate-spin text-saffron-600" />
        Calculating route…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="pointer-events-auto w-[min(270px,calc(100vw-32px))] rounded-xl border border-alert-200 bg-white px-3.5 py-2.5 shadow-lg">
        <p className="text-[11px] text-alert-700">{errorMessage || 'Unable to calculate a road route.'}</p>
        <Button size="sm" variant="ghost" onClick={onClear} className="mt-1.5 !text-[11px]">Dismiss</Button>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto w-[min(280px,calc(100vw-32px))] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
      <div className="flex items-start justify-between gap-2 border-b border-ink-100 bg-ink-900 px-3.5 py-2">
        <div className="min-w-0">
          <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-400">Route</div>
          <div className="truncate text-[12.5px] font-semibold text-white">{origin?.name || '—'} → {destination?.name || '—'}</div>
        </div>
        <button onClick={onClear} aria-label="Clear route" className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white"><X size={14} /></button>
      </div>
      <div className="space-y-2 px-3.5 py-2.5 text-[12px]">
        <TargetRow label="From" target={origin} />
        <TargetRow label="To" target={destination} />
        <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Road distance</span>
          <span className="text-ink-700">{route.distanceKm != null ? `${route.distanceKm} km` : '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Estimated time</span>
          <span className="text-ink-700">{route.durationMinutes != null ? `${route.durationMinutes} min` : '—'}</span>
        </div>
      </div>
      <div className="flex gap-2 border-t border-ink-100 px-2.5 py-2">
        <Button size="sm" variant="primary" icon={Navigation} onClick={onCalculate} className="flex-1">Recalculate</Button>
        <Button size="sm" variant="outline" icon={X} onClick={onClear} className="flex-1">Clear Route</Button>
      </div>
    </div>
  )
}
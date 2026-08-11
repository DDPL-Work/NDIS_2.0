import { ArrowLeftRight, Bookmark, ExternalLink, Flag, Navigation, Route, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import { formatCoord } from '../../utils/geo'

const STATUS_TONE = { active: 'positive', operational: 'positive', resolved: 'positive', closed: 'positive', inactive: 'neutral', scheduled: 'neutral', delayed: 'alert', missed: 'alert', assigned: 'info', urgent: 'alert' }

export default function GISInfoCard({ item, bookmarked = false, onClose, onBookmark, onOpen, onShowRoute, onClearRoute, routeActive = false, routeLoading = false, onRouteStart, onRouteDestination, onSwap, startFacility, destinationFacility }) {
  if (!item) return null
  const position = item.position || item.location?.position
  const directionsUrl = position ? `https://www.google.com/maps/dir/?api=1&destination=${position[1]},${position[0]}` : null
  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
      <div className="flex items-start justify-between gap-3 bg-ink-900 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{item.categoryLabel || item.type || 'Spatial feature'}</div>
          <div className="truncate text-sm font-semibold text-white">{item.name || item.title}</div>
        </div>
        <button onClick={onClose} className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white" aria-label="Close"><X size={15} /></button>
      </div>
      <div className="space-y-2.5 px-4 py-3 text-[12px]">
        <div className="flex items-center justify-between"><Info label="Status" /><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${(STATUS_TONE[item.status || item.state] || 'neutral') === 'alert' ? 'bg-alert-50 text-alert-600' : 'bg-ink-100 text-ink-700'}`}>{item.status || item.state || 'Active'}</span></div>
        <div className="flex items-center justify-between gap-3"><Info label="Department" /><span className="truncate">{item.departmentName || item.departmentId || 'Public service'}</span></div>
        <div className="flex items-center justify-between gap-3"><Info label="Coordinates" /><span className="font-mono text-[10px] text-ink-600">{position ? formatCoord(position) : '—'}</span></div>
        <div className="flex items-center justify-between gap-3"><Info label="Reference" /><span className="kbd-mono text-[10px] text-ink-500">{item.id}</span></div>
        {item.distanceM != null && <div className="flex items-center justify-between" title="Straight-line distance from search origin"><Info label="Straight-line" /><span>{(item.distanceM / 1000).toFixed(1)} km</span></div>}
        <div className="flex items-center justify-between"><Info label="Bookmark" /><span className="flex items-center gap-1.5"><Bookmark size={13} className={bookmarked ? 'fill-saffron-500 text-saffron-500' : 'text-ink-400'} />{bookmarked ? 'Saved' : 'Tap star to save'}</span></div>
      </div>
      <div className="flex gap-2 border-t border-ink-100 px-4 py-3">
        <Button size="sm" variant="outline" icon={ExternalLink} onClick={() => onOpen?.(item)}>View</Button>
        {directionsUrl && <Button size="sm" icon={Navigation} as="a" href={directionsUrl} target="_blank" rel="noreferrer">Navigate</Button>}
        {onShowRoute && (
          <Button
            size="sm"
            variant={routeActive ? 'outline' : 'primary'}
            icon={routeActive ? X : Route}
            loading={routeLoading && !routeActive}
            disabled={routeLoading && !routeActive}
            onClick={() => (routeActive ? onClearRoute?.() : onShowRoute?.(item))}
            className="whitespace-nowrap"
          >
            {routeActive ? 'Clear Route' : 'Show Route'}
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={Bookmark} onClick={() => onBookmark?.(item)} className="ml-auto">{bookmarked ? 'Saved' : 'Save'}</Button>
      </div>
      {(onRouteStart || onRouteDestination) && (
        <div className="flex gap-2 border-t border-ink-100 bg-ink-50/50 px-4 py-2.5">
          {startFacility && String(startFacility.id) === String(item.id) ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-leaf-600 px-2.5 py-1.5 text-[11px] font-semibold text-white"><Flag size={12} /> Start selected</span>
          ) : destinationFacility && String(destinationFacility.id) === String(item.id) ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-alert-500 px-2.5 py-1.5 text-[11px] font-semibold text-white"><Flag size={12} /> Destination</span>
          ) : (
            <>
              <Button size="sm" variant="outline" icon={Flag} disabled={routeLoading} onClick={() => (startFacility ? onRouteDestination?.(item) : onRouteStart?.(item))} className="whitespace-nowrap">
                {startFacility ? 'Route To Here' : 'Start From Here'}
              </Button>
              {startFacility && destinationFacility && <Button size="sm" variant="ghost" icon={ArrowLeftRight} onClick={onSwap} title="Swap start and destination">Swap</Button>}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Info({ label }) { return <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{label}</span> }
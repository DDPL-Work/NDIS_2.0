import { ArrowLeftRight, Bookmark, ExternalLink, Flag, MapPin, Navigation, Route, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import { formatCoord } from '../../utils/geo'

const STATUS_TONE = { active: 'positive', operational: 'positive', resolved: 'positive', closed: 'positive', inactive: 'neutral', scheduled: 'neutral', delayed: 'alert', missed: 'alert', assigned: 'info', urgent: 'alert' }

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

// Right-rail feature detail panel for the GIS workspace. It replaces the
// floating GISInfoCard with a structured, scrollable side surface: every field
// the card showed is preserved, grouped into Location / Safety / Reference
// sections, plus the same routing and bookmark actions.
export default function GISFeaturePanel({ item, bookmarked = false, onClose, onBookmark, onOpen, onShowRoute, onClearRoute, routeActive = false, routeLoading = false, onRouteStart, onRouteDestination, onSwap, startFacility, destinationFacility }) {
  if (!item) return null
  const position = item.position || item.location?.position
  const directionsUrl = position ? `https://www.google.com/maps/dir/?api=1&destination=${position[1]},${position[0]}` : null
  const statusKey = item.status || item.state
  const tone = STATUS_TONE[statusKey] || 'neutral'
  const updatedAt = formatDate(item.updatedAt || item.createdAt)
  const distanceKm = item.distanceM != null ? item.distanceM / 1000 : item.distanceKm

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3 bg-ink-900 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{item.categoryLabel || item.type || 'Spatial feature'}</div>
          <div className="truncate text-sm font-semibold text-white">{item.name || item.title}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => onBookmark?.(item)} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark feature'} title={bookmarked ? 'Remove bookmark' : 'Bookmark feature'} className="rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white"><Bookmark size={14} className={bookmarked ? 'fill-saffron-400 text-saffron-400' : ''} /></button>
          <button onClick={onClose} aria-label="Deselect feature" title="Deselect" className="rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white"><X size={15} /></button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 text-[12px]">
        <div className="flex items-center justify-between gap-3"><Info label="Status" /><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${tone === 'alert' ? 'bg-alert-50 text-alert-600' : 'bg-ink-100 text-ink-700'}`}>{statusKey || 'Active'}</span></div>
        <div className="flex items-center justify-between gap-3"><Info label="Department" /><span className="truncate">{item.departmentName || item.departmentId || 'Public service'}</span></div>

        <SectionTitle label="Location" />
        {position && <div className="flex items-center justify-between gap-3"><Info label="Coordinates" /><span className="font-mono text-[10px] text-ink-600">{formatCoord(position)}</span></div>}
        {item.district && <div className="flex items-center justify-between gap-3"><Info label="District" /><span className="truncate">{item.district}</span></div>}
        {item.block && <div className="flex items-center justify-between gap-3"><Info label="Block" /><span className="truncate">{item.block}</span></div>}
        {item.village && <div className="flex items-center justify-between gap-3"><Info label="Village" /><span className="truncate">{item.village}</span></div>}
        {item.address && <div className="flex items-center justify-between gap-3"><Info label="Address" /><span className="max-w-[70%] truncate">{item.address}</span></div>}
        {distanceKm != null && <div className="flex items-center justify-between" title="Straight-line distance from search origin"><Info label="Straight-line" /><span>{(Number(distanceKm)).toFixed(1)} km</span></div>}

        <SectionTitle label="Safety & condition" />
        <div className="flex items-center justify-between gap-3"><Info label="Hazard Safe" />
          <span className="font-semibold">
            {item.hazardSafe != null ? (item.hazardSafe ? <span className="text-leaf-600">Safe</span> : <span className="text-alert-600">Hazard</span>) : <span className="text-ink-400">—</span>}
          </span>
        </div>
        {item.condition && <div className="flex items-center justify-between gap-3"><Info label="Condition" /><span className="capitalize">{item.condition}</span></div>}
        {item.priority && <div className="flex items-center justify-between gap-3"><Info label="Priority" /><span className="capitalize">{item.priority}</span></div>}
        {item.lifecycleState && <div className="flex items-center justify-between gap-3"><Info label="Lifecycle" /><span className="capitalize">{item.lifecycleState}</span></div>}
        {item.gapScore != null && <div className="flex items-center justify-between gap-3"><Info label="Gap score" /><span>{(Number(item.gapScore) * 100).toFixed(0)}%</span></div>}

        <SectionTitle label="Reference" />
        <div className="flex items-center justify-between gap-3"><Info label="ID" /><span className="kbd-mono text-[10px] text-ink-500">{item.id}</span></div>
        {item.source && <div className="flex items-center justify-between gap-3"><Info label="Source" /><span className="capitalize">{item.source}</span></div>}
        {updatedAt && <div className="flex items-center justify-between gap-3"><Info label="Updated" /><span>{updatedAt}</span></div>}
      </div>

      {(onRouteStart || onRouteDestination) && (
        <div className="flex shrink-0 items-center gap-2 border-t border-ink-100 bg-ink-50/50 px-4 py-2.5">
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

      <div className="flex shrink-0 flex-wrap gap-2 border-t border-ink-100 px-4 py-3">
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
    </div>
  )
}

function SectionTitle({ label }) {
  return <div className="flex items-center gap-1.5 pt-1"><MapPin size={12} className="text-saffron-600" /><span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{label}</span><span className="h-px flex-1 bg-ink-100" /></div>
}

function Info({ label }) { return <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-ink-400">{label}</span> }

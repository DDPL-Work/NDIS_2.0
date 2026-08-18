// CitizenFacilitySheet — in-map facility detail for the citizen portal.
// Desktop: right-side drawer (380px) sliding in; mobile: bottom sheet capped
// at 70dvh above the bottom navigation.  Every action is real and supported:
//   Show Route   -> existing OSRM routing flow on the map
//   Directions   -> Google Maps turn-by-turn (external link)
//   View Details -> full Facility Detail page
//   Report Issue -> pre-filled complaint registration for this facility
// Deliberately no Save/Share: the backend has no such actions, so fake buttons
// are never rendered.
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Footprints, MapPin, Navigation, PenLine, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Icon from '../../components/ui/Icon'
import { createFacilitySlug } from '../../utils/createFacilitySlug'

// Readable distance label using backend-provided values only
// (distance_km preferred, distance_m fallback).
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

function formatWalk(walkMin) {
  if (walkMin == null || !Number.isFinite(walkMin)) return null
  if (walkMin < 1) return '< 1 min walk'
  if (walkMin < 60) return `~${Math.round(walkMin)} min walk`
  return `~${(walkMin / 60).toFixed(1)} h walk`
}

export default function CitizenFacilitySheet({ facility, deptMap = {}, walkMin, onShowRoute, onClose }) {
  const navigate = useNavigate()
  if (!facility) return null

  const position = facility.position
  const hasPosition = Array.isArray(position) && position.length >= 2
  const department = deptMap[facility.departmentId]
  const distanceLabel = formatDistance(facility)
  const walkLabel = formatWalk(walkMin)

  function handleDirections() {
    if (!hasPosition) return
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${position[1]},${position[0]}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  function handleShowRoute() {
    onShowRoute?.(facility)
    onClose?.()
  }

  function handleViewDetails() {
    const slug = facility.slug || createFacilitySlug(facility) || String(facility.id)
    navigate(`/citizen/facility/${slug}`)
  }

  return (
    <div
      role="dialog"
      aria-label={facility.name}
      className="ndisp-sheet-responsive fixed inset-x-0 bottom-16 lg:bottom-auto lg:inset-y-0 lg:right-0 z-[150] flex max-h-[70dvh] lg:max-h-none flex-col overflow-hidden rounded-t-2xl lg:rounded-none border-t lg:border-l border-ink-100 bg-white shadow-2xl lg:w-[380px]"
    >
      <div className="flex items-start justify-between gap-2 border-b border-ink-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {facility.categoryLabel && <Badge tone="info">{facility.categoryLabel}</Badge>}
            {department && (
              <Badge tone="neutral" className="flex items-center gap-1">
                {department.icon && <Icon name={department.icon} size={10} />}
                {department.label}
              </Badge>
            )}
            {facility.hazardSafe != null && (
              <Badge tone={facility.hazardSafe ? 'positive' : 'alert'}>{facility.hazardSafe ? 'Safe' : 'Hazard'}</Badge>
            )}
          </div>
          <h2 className="mt-1.5 text-[15.5px] font-semibold leading-snug text-ink-950">{facility.name}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close facility details"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {facility.village && (
          <p className="flex items-center gap-1.5 text-[12.5px] text-ink-600">
            <MapPin size={13} className="shrink-0 text-ink-400" />
            {facility.village}
          </p>
        )}
        {(distanceLabel || walkLabel) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            {distanceLabel && <span className="font-medium text-ink-700">{distanceLabel} away</span>}
            {walkLabel && (
              <span className="flex items-center gap-1 font-medium text-leaf-700">
                <Footprints size={12} /> {walkLabel}
              </span>
            )}
          </div>
        )}

        {!hasPosition && (
          <p className="mt-3 rounded-xl border border-ink-100 bg-ink-50/60 p-3 text-[12px] text-ink-500">
            Location coordinates are not available for this facility, so routing and directions cannot be shown.
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-ink-100 p-3">
        <div className="flex gap-2">
          <Button className="flex-1" icon={Navigation} disabled={!hasPosition} onClick={handleShowRoute}>
            Show Route
          </Button>
          <Button variant="outline" className="flex-1" icon={ExternalLink} disabled={!hasPosition} onClick={handleDirections}>
            Directions
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleViewDetails}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-[12px] font-semibold text-ink-700 transition-colors hover:bg-ink-50"
          >
            <MapPin size={13} /> View Details
          </button>
          <button
            onClick={() => navigate(`/citizen/report/${facility.id}`)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-alert-200 bg-alert-50 px-3 py-2 text-[12px] font-semibold text-alert-700 transition-colors hover:bg-alert-100"
          >
            <PenLine size={13} /> Report Issue
          </button>
        </div>
      </div>
    </div>
  )
}
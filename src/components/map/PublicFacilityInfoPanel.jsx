// PublicFacilityInfoPanel — right-side facility inspection panel for
// the public Explore Map. Shows only public-facing facility information
// without any administrative workflows or internal data.
import { X, MapPin, Navigation, ExternalLink } from 'lucide-react'
import GapScoreRing from '../ui/GapScoreRing'
import StatusBadge from '../ui/StatusBadge'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { formatDate } from '../../utils/format'
import { DEPARTMENT_MAP } from '../../config/constants'
import Icon from '../../components/ui/Icon'

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-ink-500 shrink-0">{label}</span>
      <span className="text-ink-800 font-medium text-right">{children}</span>
    </div>
  )
}

function departmentForFacility(facility) {
  return DEPARTMENT_MAP[facility.departmentId] || {
    label: facility.departmentName || 'Department',
    color: '#546882',
    icon: 'Building2',
  }
}

export default function PublicFacilityInfoPanel({ facility, onClose }) {
  if (!facility) return null

  const department = departmentForFacility(facility)

  return (
    <>
      <div className="w-full max-w-[360px] shrink-0 card overflow-y-auto animate-slide-in-right shadow-xl">
        <div className="flex items-start justify-between p-4 border-b border-ink-100">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-ink-950 leading-snug truncate">{facility.name}</h3>
            <p className="text-[12px] text-ink-500 mt-0.5 truncate">{facility.categoryLabel}</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 ml-2 shrink-0" aria-label="Close facility details">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Gap score ring — only if explicitly public */}
          {facility.gapScore != null && facility.gapScorePublic === true && (
            <div className="flex items-center gap-4">
              <GapScoreRing score={facility.gapScore} size={64} strokeWidth={7} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Coverage score</p>
                <p className="text-[13px] font-semibold text-ink-900 mt-0.5">
                  {facility.gapScore >= 0.66 ? 'High deficit' : facility.gapScore >= 0.33 ? 'Moderate' : 'Well served'}
                </p>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="space-y-2 text-[12.5px]">
            <Row label="Status">
              <StatusBadge status={facility.status} />
            </Row>
            <Row label="Department">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: department.color }} />
                {department.label}
              </span>
            </Row>
            <Row label="Village">{facility.village || '—'}</Row>
            <Row label="Block">{facility.raw?.block_name || facility.village || '—'}</Row>
            <Row label="Geo-tagged">
              <span className={facility.position ? 'text-leaf-600 font-medium' : 'text-ink-400'}>
                {facility.position ? '✓ Yes' : 'No'}
              </span>
            </Row>
          </div>

          {/* Coordinates */}
          {facility.position && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1 flex items-center gap-1.5">
                <MapPin size={11} /> Coordinates
              </p>
              <p className="kbd-mono text-[11px] text-ink-600">
                {facility.position[1].toFixed(5)}°N, {facility.position[0].toFixed(5)}°E
              </p>
            </div>
          )}

          {/* Public actions */}
          <div className="pt-2 border-t border-ink-100 space-y-2">
            <Button
              variant="primary"
              className="w-full justify-center gap-2"
              icon={ExternalLink}
              onClick={() => window.open(`/citizen/facility/${facility.slug || facility.id}`, '_blank')}
            >
              View Full Details
            </Button>
            {facility.position && (
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                icon={Navigation}
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.position[1]},${facility.position[0]}`
                  window.open(url, '_blank')
                }}
              >
                Get Directions
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
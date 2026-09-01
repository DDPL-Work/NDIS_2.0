// Shared facility summary displayed at the top of every action modal.
// Facility-type agnostic Ã¢â‚¬â€ uses whatever data the backend provides.

import Badge from '../../../components/ui/Badge'
import { PRIORITY_BAND_TONES } from './constants'

export default function FacilityActionSummary({ facility }) {
  if (!facility) return null

  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-[14px] font-semibold text-ink-900">{facility.name}</h4>
        <Badge tone="neutral">{facility.category}</Badge>
        {facility.priority && (
          <Badge tone={PRIORITY_BAND_TONES[facility.priority.band] || 'neutral'} dot>
            {facility.priority.band} Ã¢â‚¬â€ {facility.priority.bandLabel}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px]">
        {facility.district && (
          <div><span className="text-ink-500">Location: </span><span className="text-ink-800 font-medium">{[facility.village, facility.block, facility.district].filter(Boolean).join(', ')}</span></div>
        )}
        {facility.gapScore != null && (
          <div><span className="text-ink-500">Gap score: </span><span className="text-ink-800 font-medium">{Math.round(facility.gapScore * 100)}%</span></div>
        )}
        {facility.department && (
          <div><span className="text-ink-500">Department: </span><span className="text-ink-800 font-medium">{facility.department}</span></div>
        )}
        {facility.status && (
          <div><span className="text-ink-500">Status: </span><span className="text-ink-800 font-medium">{facility.status}</span></div>
        )}
      </div>
      {facility.recommendedAction && (
        <p className="text-[12px] text-ink-600 mt-1">
          <span className="font-medium text-ink-700">Recommended action: </span>{facility.recommendedAction}
        </p>
      )}
      {facility.reason && (
        <p className="text-[12px] text-ink-600">
          <span className="font-medium text-ink-700">Issue: </span>{facility.reason}
        </p>
      )}
    </div>
  )
}

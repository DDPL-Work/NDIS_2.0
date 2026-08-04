import { MapPin, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import { DEPARTMENT_MAP } from '../../config/constants'
import GapScoreRing from '../../components/ui/GapScoreRing'
import Badge from '../../components/ui/Badge'

export default function FacilityCard({ facility, onClick, active }) {
  const dept = DEPARTMENT_MAP[facility.departmentId]
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left rounded-xl2 border px-3.5 py-3 transition-colors',
        active ? 'border-ink-900 bg-ink-50' : 'border-ink-100 bg-white hover:border-ink-200 hover:bg-ink-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: dept?.color }} />
            <span className="text-[11px] font-medium text-ink-500 truncate">{dept?.label} · {facility.categoryLabel}</span>
          </div>
          <p className="text-[13.5px] font-semibold text-ink-950 truncate">{facility.name}</p>
          <p className="text-[11.5px] text-ink-500 flex items-center gap-1 mt-0.5"><MapPin size={11} />{facility.village}</p>
        </div>
        <GapScoreRing score={facility.gapScore} size={38} strokeWidth={4} />
      </div>
      <div className="flex items-center gap-1.5 mt-2.5">
        <Badge tone={facility.status === 'active' ? 'positive' : facility.status === 'inactive' ? 'negative' : 'warning'}>{facility.status.replace('_', ' ')}</Badge>
        {facility.confidence > 0.85 && (
          <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-400"><ShieldCheck size={11} /> Verified location</span>
        )}
      </div>
    </button>
  )
}

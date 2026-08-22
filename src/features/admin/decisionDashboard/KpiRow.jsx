import clsx from 'clsx'
import { Flame, MapPin, AlertTriangle, ClipboardCheck } from 'lucide-react'
import SectionCard from './SectionCard'
import Provenance from './Provenance'
import { formatDateTime } from '../../../utils/format'

const ICONS = {
  critical_gaps: Flame,
  high_priority_locations: MapPin,
  facilities_at_risk: AlertTriangle,
  projects_pending_action: ClipboardCheck,
}

// Section A — the critical signal row.  Each card is a live decision entry
// point (never decorative): clicking drills into the section that explains it.
export default function KpiRow({ kpis, facilitiesLoadedAt, onDrill }) {
  if (!kpis || !kpis.length) return null
  return (
    <SectionCard
      title="What requires my attention"
      subtitle="Critical signals across the district — every number is clickable and traced to its source."
      foot={<Provenance source="GET /api/facilities/ · /api/complaints/ · /api/proposals/ · /api/projects/summary/" definition="Composite of district-wide collections; per-KPI definitions below." updatedAt={facilitiesLoadedAt ? formatDateTime(facilitiesLoadedAt) : undefined} />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = ICONS[kpi.key] || Flame
          return (
            <button
              key={kpi.key}
              onClick={() => onDrill?.(kpi)}
              className="group text-left rounded-xl border border-ink-100 bg-ink-50/40 p-4 transition hover:border-ink-200 hover:bg-white hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <div className="flex items-center justify-between">
                <span className="eyebrow">{kpi.label}</span>
                <div className={clsx('grid h-7 w-7 place-items-center rounded-md', {
                  'bg-alert-50 text-alert-600': kpi.tone === 'alert',
                  'bg-saffron-100 text-saffron-700': kpi.tone === 'saffron',
                  'bg-sky-100 text-sky-700': kpi.tone === 'sky',
                  'bg-ink-100 text-ink-700': kpi.tone === 'ink',
                })}>
                  <Icon size={14} />
                </div>
              </div>
              <div className="mt-1.5 text-2xl font-display font-semibold text-ink-950">{kpi.value}</div>
              {kpi.sub && <p className="text-[11.5px] text-ink-500 mt-1">{kpi.sub}</p>}
              <p className="mt-2 text-[11px] text-sky-700 opacity-0 transition group-hover:opacity-100 flex items-center gap-1">
                Drill down →
              </p>
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}
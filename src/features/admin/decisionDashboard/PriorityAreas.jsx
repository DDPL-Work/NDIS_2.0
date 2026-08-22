import { Users, MapPin, Building2, ArrowRight } from 'lucide-react'
import SectionCard from './SectionCard'
import Provenance from './Provenance'
import GapScoreRing from '../../../components/ui/GapScoreRing'
import Badge from '../../../components/ui/Badge'
import { gapTier, GAP_TIERS, GAP_CRITICAL } from './priorityScoring'

const SOURCE_META = {
  'gap-heuristic': { label: 'Spatial gap', tone: 'alert' },
  'citizen-complaints': { label: 'Citizen reports', tone: 'saffron' },
  'planning-pipeline': { label: 'Planning', tone: 'sky' },
}

// Section C — the priority areas list.  Every row answers the DM's question:
// WHERE (location), HOW URGENT (priority level + score), WHY (reason/components),
// WHO (department), HOW MANY PEOPLE (affected population where known) and WHAT
// NEXT (recommended action).  Clicking a row selects it on the situation map.
export default function PriorityAreas({ areas, onSelect, loadedAt }) {
  const criticalCount = areas.filter((a) => a.priorityLevel === 'critical').length
  return (
    <SectionCard
      id="priority-areas"
      title="Priority areas"
      subtitle={`${areas.length} locations require attention${criticalCount ? ` — ${criticalCount} critical` : ''}. Derived from facilities, complaints and the planning pipeline.`}
      action={loadedAt && <Badge tone="ink" className="kbd-mono">tier ≥ {Math.round(GAP_CRITICAL * 100)}%</Badge>}
      foot={<Provenance source="GET /api/facilities/ · /api/complaints/ · /api/proposals/" definition="Composite score per location: gap heuristic, complaint pressure or planning pressure (see each card)." updatedAt={loadedAt} />}
    >
      {!areas.length ? (
        <p className="text-[13px] text-ink-500 py-6 text-center">No priority locations found in the current data.</p>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 ${areas.length === 1 ? 'max-w-xl' : ''}`}>
          {areas.map((area) => {
            const tier = gapTier(area.score)
            const tierMeta = GAP_TIERS[tier] || GAP_TIERS.low
            const source = SOURCE_META[area.source] || SOURCE_META['gap-heuristic']
            return (
              <button
                key={area.id}
                onClick={() => onSelect(area)}
                className="group text-left rounded-xl border border-ink-100 bg-white p-4 transition hover:border-ink-200 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <Badge tone={source.tone}>{source.label}</Badge>
                      <Badge tone={tierMeta.tone}>#{area.rank} · {tierMeta.label}</Badge>
                    </div>
                    <h3 className="text-[13.5px] font-semibold text-ink-950 leading-snug">{area.title}</h3>
                    <p className="text-[11.5px] text-ink-500 mt-0.5 flex items-center gap-1">
                      <MapPin size={11} /> {area.village || area.block || 'Location not specified'}
                    </p>
                  </div>
                  <GapScoreRing score={area.score} size={44} strokeWidth={6} />
                </div>

                <div className="mt-3 space-y-1.5 text-[11.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-500 flex items-center gap-1"><Users size={11} /> Affected population</span>
                    <span className="text-ink-800 font-medium">
                      {area.affectedPopulation != null ? Number(area.affectedPopulation).toLocaleString('en-IN') : 'Not available'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-500 flex items-center gap-1"><Building2 size={11} /> Department</span>
                    <span className="text-ink-800 font-medium truncate">{area.departmentName || '—'}</span>
                  </div>
                </div>

                <p className="mt-3 rounded-lg bg-ink-50/60 px-2.5 py-2 text-[11.5px] text-ink-600 leading-snug">
                  <span className="font-semibold text-ink-700">Why: </span>
                  {area.scoreComponents?.slice(0, 2).map((c) => `${c.label} ${c.value}`).join(' · ')}
                </p>

                <p className="mt-2 text-[11.5px] text-sky-700 font-medium flex items-center gap-1">
                  {(area.recommendedAction || 'Review this location and determine the next action.').split(';')[0]} <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                </p>
              </button>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

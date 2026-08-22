// Generic priority system (§7/§9) — every department renders the SAME priority
// model: band (P1–P4), score, contributing indicators, reason, evidence and
// recommended action.  Priority thresholds come from the config, disclosed in
// the UI.  Entities with no computable priority are listed as "no data".
import { useMemo } from 'react'
import { Target } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import Provenance from '../../admin/decisionDashboard/Provenance'
import { formatDateTime } from '../../../utils/format'

const bandTone = (band) => (band === 'P1' ? 'negative' : band === 'P2' ? 'warning' : band === 'P3' ? 'info' : 'neutral')
const bandOrder = { P1: 0, P2: 1, P3: 2, P4: 3 }

export default function PrioritySection({ plan, loadedAt, onSelectEntity }) {
  const rows = useMemo(() => {
    const ranked = plan?.ranked || []
    const withScore = ranked.filter((r) => r.priority.score !== null)
    const withoutScore = ranked.filter((r) => r.priority.score === null)
    const sorted = [...withScore].sort((a, b) => bandOrder[a.priority.band] - bandOrder[b.priority.band] || b.priority.score - a.priority.score)
    return { sorted, withoutScore }
  }, [plan])

  if (!plan?.entities?.length) {
    return (
      <Card>
        <CardHeader title="Priority locations" subtitle={plan?.config.departmentName} />
        <CardBody>
          <EmptyState icon={Target} title="No entities to rank" description="No entity groups are configured for this department, or no records exist in the backend for the configured categories/layers." />
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Priority locations"
        subtitle={`Why each location matters — ${plan.config.terminology?.entities || 'entities'} ranked by the config-driven priority model.`}
      />
      <CardBody>
        <div className="space-y-2">
          {rows.sorted.map(({ entity, priority, rank }) => (
            <button
              key={entity.id}
              onClick={() => onSelectEntity?.(entity)}
              className="w-full text-left rounded-lg border border-ink-100 hover:border-ink-200 hover:shadow-sm transition p-3 flex flex-wrap items-center gap-3"
            >
              <div className="min-w-[44px] text-center">
                <div className="text-xl font-display font-semibold text-ink-950">{priority.band}</div>
                <div className="text-[10px] text-ink-400 uppercase tracking-wide">{priority.bandLabel}</div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink-900 truncate">{entity.name}</p>
                <p className="text-[12px] text-ink-500 truncate">{entity.categoryLabel} · {entity.village || entity.block || 'no location'}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="info">Score {priority.score}</Badge>
                  {priority.components.filter((c) => c.available).slice(0, 3).map((c) => (
                    <Badge key={c.key} tone="neutral">{c.label}: {Math.round(c.raw * 100)}%</Badge>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onSelectEntity?.(entity) }}>Explain →</Button>
            </button>
          ))}

          {rows.withoutScore.length > 0 && (
            <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-3">
              <p className="text-[12.5px] font-semibold text-ink-700 mb-1">No computable priority — {rows.withoutScore.length} {plan.config.terminology?.entities || 'entities'}</p>
              <p className="text-[11.5px] text-ink-500">Every priority component depends on data the backend does not currently serve for these records (gap score, hazard exposure, population or entity type). Components are excluded rather than zeroed — no score is fabricated.</p>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-ink-100">
          <Provenance
            source="GET /api/facilities/ · GET /api/gis/layers/ (population, hazard)"
            definition={`Score = weighted components (${plan.config.priority?.components?.map((c) => c.label).join(', ')}) normalised by available weight. Bands: ${plan.config.priority?.bands?.map((b) => `${b.band} ${b.bandLabel} ≥${b.min}`).join(' · ')}. Configured in departmentConfigs.js.`}
            updatedAt={loadedAt ? formatDateTime(loadedAt) : undefined}
          />
        </div>
      </CardBody>
    </Card>
  )
}
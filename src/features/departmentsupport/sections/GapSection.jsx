// Generic gap analysis (§8) — dimensions come from the department config, never
// hardcoded.  Coverage and accessibility are REAL derived figures; indicator-
// driven dimensions report reporting share when attributes exist and "Data not
// available" + required source otherwise.
import { AlertTriangle, CheckCircle2, CircleSlash } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Provenance from '../../admin/decisionDashboard/Provenance'
import { formatDateTime } from '../../../utils/format'

export default function GapSection({ plan, loadedAt }) {
  const gaps = plan?.gaps || []

  return (
    <Card>
      <CardHeader
        title="Gap analysis"
        subtitle={`Gap dimensions configured for ${plan?.config.departmentName} — only dimensions the config declares are shown.`}
      />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {gaps.map((gap) => (
            <div key={gap.key} className="rounded-lg border border-ink-100 p-3.5 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-900">{gap.label}</p>
                  <p className="text-[11.5px] text-ink-500">{gap.description}</p>
                </div>
                {gap.status === 'computed'
                  ? <Badge tone="positive" dot><CheckCircle2 size={11} /> derived</Badge>
                  : <Badge tone="neutral" dot><CircleSlash size={11} /> no data</Badge>}
              </div>

              {gap.status === 'computed' ? (
                <div className="text-[12.5px] text-ink-700">
                  <p className="font-medium">{gap.displayValue}</p>
                  {gap.affectedBlocks?.length > 0 && (
                    <div className="mt-2 max-h-28 overflow-y-auto rounded-md bg-ink-50 p-2 space-y-1">
                      <p className="text-[11px] font-semibold text-ink-600 uppercase tracking-wide">Affected locations</p>
                      {gap.affectedBlocks.slice(0, 10).map((block) => (
                        <p key={block.name} className="flex items-center justify-between text-[11.5px]">
                          <span className="truncate">{block.name}</span>
                          <span className="kbd-mono shrink-0">{block.population.toLocaleString()} pop · {block.distanceKm ?? '?'} km</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {gap.segments && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(gap.segments).map(([segment, count]) => (
                        <Badge key={segment} tone={segment === 'Poor' ? 'negative' : segment === 'Moderate' ? 'warning' : 'positive'}>{segment}: {count}</Badge>
                      ))}
                    </div>
                  )}
                  {gap.indicators && gap.indicators.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {gap.indicators.map((indicator) => (
                        <Badge key={indicator.key} tone={indicator.reporting > 0 ? 'positive' : 'neutral'}>{indicator.label}: {indicator.reporting}/{gap.indicators[0]?.reporting !== undefined ? (plan?.entities?.length || 0) : ''}{indicator.reporting > 0 ? ` entities` : ' — no data'}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[12px] text-ink-500 space-y-1">
                  <p className="flex items-center gap-1.5"><AlertTriangle size={13} className="text-saffron-500" /> Data not available</p>
                  <p className="text-[11.5px]">Requires: <span className="kbd-mono break-all">{gap.requiredSource || gap.source || 'no data contract'}</span></p>
                  {gap.detail && <p className="text-[11px]">{gap.detail}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
        {gaps.length === 0 && <p className="text-[12.5px] text-ink-500">No gap dimensions configured for this department.</p>}

        <div className="mt-3 pt-3 border-t border-ink-100">
          <Provenance
            source="GET /api/facilities/ · GET /api/gis/layers/ (population, roads) · department telemetry endpoints"
            definition="Coverage = census blocks within the configured service distance. Accessibility = census block distance to nearest road (Good ≤1 km, Moderate ≤3 km, Poor >3 km). Indicator dimensions report real attribute presence or their required endpoint."
            updatedAt={loadedAt ? formatDateTime(loadedAt) : undefined}
          />
        </div>
      </CardBody>
    </Card>
  )
}
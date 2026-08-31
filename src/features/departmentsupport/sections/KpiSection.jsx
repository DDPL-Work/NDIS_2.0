// Generic KPI summary — config-driven KPI cards.  Telemetry KPIs show backend
// indicator values when available, "No data available" + the exact dependency
// otherwise.  Never fabricates a number.
import { Activity, Building2, Users, Target, Database } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import Badge from '../../../components/ui/Badge'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Provenance from '../../admin/decisionDashboard/Provenance'
import { formatDateTime } from '../../../utils/format'

const KPI_ICONS = {
  'entity-count': Building2,
  'coverage-pct': Users,
  'high-priority': Target,
  'reporting-pct': Activity,
}

export default function KpiSection({ plan, loadedAt }) {
  const kpis = plan?.kpis || []
  const cards = kpis.map((kpi) => ({
    ...kpi,
    icon: KPI_ICONS[kpi.kind] || Database,
    tone: kpi.status === 'loaded'
      ? 'positive'
      : kpi.status === 'computed'
        ? (kpi.kind === 'high-priority' ? 'alert' : 'ink')
        : 'neutral',
  }))

  return (
    <Card>
      <CardHeader
        title="Department KPI summary"
        subtitle="Real and derived figures only — backend indicator values are shown when available."
      />
      <CardBody>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {cards.map((kpi) => (
            <div key={kpi.key} className="relative">
              <StatCard
                label={kpi.label}
                value={kpi.displayValue}
                icon={kpi.icon}
                tone={kpi.tone}
                sub={kpi.status === 'unavailable' ? kpi.detail?.slice(0, 80) : undefined}
              />
              {kpi.status === 'unavailable' && (
                <div className="absolute -top-1 -right-1"><Badge tone="neutral">no data</Badge></div>
              )}
              {kpi.status === 'loaded' && (
                <div className="absolute -top-1 -right-1"><Badge tone="positive">live</Badge></div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-ink-100">
          <Provenance
            source={plan?.backendIndicators?.source
              ? `GET /api/facilities/ · GET /api/gis/layers/ · ${plan.backendIndicators.source}`
              : 'GET /api/facilities/ · GET /api/gis/layers/ (population, roads) · department telemetry endpoints'}
            definition="Counts are real entity records. Coverage = census population within the configured service distance (Haversine). Priority = config-weighted components. Telemetry KPIs show backend indicator values when the endpoint returns data."
            updatedAt={loadedAt ? formatDateTime(loadedAt) : undefined}
          />
        </div>
      </CardBody>
    </Card>
  )
}

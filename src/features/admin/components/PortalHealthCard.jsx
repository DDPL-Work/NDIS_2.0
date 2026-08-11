import { Activity } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'

// Reference rows for the reference card; values are only ever rendered when a
// real source reports them. The deployed backend exposes no uptime/p95
// telemetry endpoint, so an explicit unavailable state is shown instead of
// fabricated production metrics.
const HEALTH_ROWS = [
  { key: 'uptime', label: 'Uptime (pilot target 99.5%)', value: null, unit: '%' },
  { key: 'mapTileP95', label: 'Map tile p95', value: null, unit: '' },
  { key: 'apiP95', label: 'API p95 (spatial)', value: null, unit: '' },
]

export default function PortalHealthCard() {
  return (
    <Card>
      <CardHeader title="Portal health" subtitle="Availability & performance" />
      <CardBody className="space-y-2.5">
        {HEALTH_ROWS.map((row) => (
          <div key={row.key} className="flex justify-between text-[12.5px]">
            <span className="text-ink-500">{row.label}</span>
            <span className="font-semibold text-ink-800">{row.value == null ? '—' : `${row.value}${row.unit}`}</span>
          </div>
        ))}
        <p className="flex items-start gap-1.5 pt-2 text-[11px] text-ink-400 leading-snug border-t border-ink-100">
          <Activity size={12} className="mt-0.5 shrink-0" />
          Telemetry is not exposed by the deployed backend — these metrics appear once a monitoring API is configured.
        </p>
      </CardBody>
    </Card>
  )
}
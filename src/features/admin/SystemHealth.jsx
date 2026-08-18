// System Health & Gateway Monitor — Vol 1 §8.7.
// BACKEND GAP: no platform telemetry endpoint is exposed by the backend, so
// this screen renders the honest gap state instead of fabricated metrics.
import { Server, RefreshCw, Activity } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'

export default function SystemHealth() {
  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · Vol 1 §8.7"
        title="Microservices platform health & API gateway"
        description="Platform telemetry (uptime, latency, throughput, per-service health) is not exposed by the backend yet."
        action={
          <Button icon={RefreshCw} variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        }
      />

      <div className="px-6 pb-8">
        <Card>
          <CardHeader title="Microservices Diagnostics Catalog" subtitle="Telemetry source availability" />
          <CardBody>
            <EmptyState
              icon={Server}
              title="Platform telemetry unavailable"
              description="No endpoint for service health, latency or throughput exists in the backend API catalog. This panel will render live diagnostics once the telemetry API is published."
            />
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-ink-50 border border-ink-200 px-4 py-3 text-[12px] text-ink-600">
              <Activity size={14} className="text-ink-400" />
              API surface checked against <span className="font-mono">backend_next_guide.md</span> — no health/telemetry route is documented.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
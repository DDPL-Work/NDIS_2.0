import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import { Sparkles, Landmark, Award, ShieldAlert, Clock, Eye } from 'lucide-react'
import { formatDateTime } from '../../../utils/format'

export default function GovernanceTab({ csat, rankings, auditLogs }) {
  const csatColumns = [
    { key: 'deptLabel', label: 'Department Sector', render: (r) => <span className="font-semibold text-ink-900">{r.deptLabel}</span> },
    { key: 'rating', label: 'Citizen Rating', render: (r) => <span className="font-mono font-bold text-saffron-600">{r.rating} / 5.0</span> },
    { key: 'reviews', label: 'Reviews Count', render: (r) => r.reviews.toLocaleString('en-IN') },
  ]

  const rankColumns = [
    { key: 'rank', label: 'Rank', render: (r) => <span className="font-bold text-ink-950 font-mono">#{r.rank}</span> },
    { key: 'block', label: 'Block Subdivision', render: (r) => <span className="font-semibold text-ink-900">{r.block}</span> },
    { key: 'score', label: 'SLA Score', render: (r) => <span className="font-mono text-leaf-700 font-bold">{r.score}%</span> },
    { key: 'status', label: 'Index Status', render: (r) => <Badge tone={r.score >= 90 ? 'positive' : 'warning'}>{r.score >= 90 ? 'EXCELLENT' : 'ON TRACK'}</Badge> },
  ]

  const auditColumns = [
    { key: 'timestamp', label: 'Timestamp', render: (r) => <span className="font-mono text-[11px] text-ink-400">{formatDateTime(r.timestamp)}</span> },
    { key: 'actorName', label: 'Action Actor', render: (r) => <span>{r.actorName} ({r.actorRole})</span> },
    { key: 'action', label: 'Event Action', render: (r) => <Badge tone="info">{r.action}</Badge> },
    { key: 'newValue', label: 'Outcome Value', render: (r) => <span className="font-mono">{r.newValue}</span> },
  ]

  return (
    <div className="space-y-6">
      {/* CSAT & rankings list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Citizen CSAT (Module 14) */}
        <Card>
          <CardHeader title="Citizen Satisfaction (CSAT) Index" subtitle="Department ratings computed from resolution reviews" icon={Award} />
          <CardBody className="!p-0">
            <DataTable columns={csatColumns} rows={csat} />
          </CardBody>
        </Card>

        {/* Block Rankings (Module 15) */}
        <Card>
          <CardHeader title="Block Subdivision Performance Matrix" subtitle="SLA resolution performance scorecards" icon={Sparkles} />
          <CardBody className="!p-0">
            <DataTable columns={rankColumns} rows={rankings} />
          </CardBody>
        </Card>
      </div>

      {/* Enterprise Audit Logs (Module 16) */}
      <Card>
        <CardHeader title="Platform Audit Trail Center" subtitle="Complete ledger of workflow state actions, approvals and budget releases" icon={Landmark} />
        <CardBody className="!p-0 max-h-[300px] overflow-y-auto">
          <DataTable columns={auditColumns} rows={auditLogs.slice(0, 10)} />
        </CardBody>
      </Card>
    </div>
  )
}

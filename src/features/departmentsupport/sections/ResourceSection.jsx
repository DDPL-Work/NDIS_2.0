// Generic resource / capacity status — indicator-by-indicator reporting share
// across the department's entities.  Unavailable indicators show the exact
// attribute keys / endpoint required to become live (§15).
import { Database } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Provenance from '../../admin/decisionDashboard/Provenance'
import { formatDateTime } from '../../../utils/format'

export default function ResourceSection({ plan, loadedAt }) {
  const indicators = plan?.reporting?.indicators || []
  const entities = plan?.entities || []
  const endpoints = plan?.endpoints || []

  return (
    <Card>
      <CardHeader
        title={`Resource / capacity status — ${plan?.config.terminology?.entities || 'entities'}`}
        subtitle="Reporting share is real: how many entities carry a value for each indicator today."
      />
      <CardBody>
        {indicators.length === 0 ? (
          <EmptyState icon={Database} title="No indicators configured" description="Define indicators in departmentConfigs.js to render the resource status table." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-400 border-b border-ink-100">
                  <th className="py-2 pr-3 font-semibold">Indicator</th>
                  <th className="py-2 pr-3 font-semibold">Reporting</th>
                  <th className="py-2 pr-3 font-semibold">Share</th>
                  <th className="py-2 font-semibold">Required source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {indicators.map((indicator) => (
                  <tr key={indicator.key}>
                    <td className="py-2 pr-3 font-medium text-ink-800">{indicator.label}</td>
                    <td className="py-2 pr-3">
                      {indicator.reporting > 0
                        ? <Badge tone="positive">{indicator.reporting}/{entities.length}</Badge>
                        : <Badge tone="neutral">Data not available</Badge>}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-ink-100 overflow-hidden">
                          <div className="h-full rounded-full bg-leaf-500" style={{ width: `${indicator.reportingShare}%` }} />
                        </div>
                        <span className="kbd-mono text-[11px] text-ink-500">{indicator.reportingShare}%</span>
                      </div>
                    </td>
                    <td className="py-2 text-[11px] text-ink-400">
                      <span className="kbd-mono break-all">{indicator.attributeFields?.join(', ') || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {endpoints.length > 0 && (
          <div className="mt-3 rounded-lg border border-ink-100 bg-ink-50/50 p-3">
            <p className="text-[12px] font-semibold text-ink-700 mb-1.5">Telemetry contracts for {plan?.config.departmentName}</p>
            <div className="flex flex-wrap gap-1.5">
              {endpoints.map((endpoint) => (
                <Badge key={endpoint.endpoint} tone={endpoint.status === 'available' ? 'positive' : 'neutral'}>
                  {endpoint.label} · <span className="kbd-mono">{endpoint.endpoint}</span> · {endpoint.status === 'available' ? 'live' : 'not deployed'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-ink-100">
          <Provenance
            source="GET /api/facilities/ attributes + department telemetry endpoint probes"
            definition="Each indicator resolves real attribute keys on every entity; an indicator with zero reporting is marked Data not available with the keys the backend must provide."
            updatedAt={loadedAt ? formatDateTime(loadedAt) : undefined}
          />
        </div>
      </CardBody>
    </Card>
  )
}
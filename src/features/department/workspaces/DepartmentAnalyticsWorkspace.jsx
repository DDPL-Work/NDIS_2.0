import { useMemo } from 'react'
import { BarChart2, Clock, Users, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '../../../components/ui/PageHeader'
import StatCard from '../../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { useAsync } from '../../../hooks/useAsync'
import { backendDashboardApi } from '../../../api/dashboardApi'

export default function DepartmentAnalyticsWorkspace() {
  const { dept, kpis } = useDepartment()

  const { data: dashboard } = useAsync(
    () => backendDashboardApi.department({ department: dept.id }),
    [dept.id]
  )

  const trendData = useMemo(() => {
    const items = dashboard?.monthlyTrend || dashboard?.trend || []
    if (!items.length) return []
    return items.map((m) => ({
      month: m.month || m.label || '',
      complaints: m.total || m.complaints || 0,
      resolved: m.resolved || 0,
      slaPct: m.slaPct ?? m.sla_compliance ?? null,
    }))
  }, [dashboard])

  const totalTickets = kpis.total || 0
  const resolved = kpis.resolved || 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Analytics Engine · ${dept.code}`}
        title={`${dept.label} Sector Analytics & Scorecards`}
        description="Performance scorecards, resolution trend telemetry, SLA breach analysis, and officer evaluation metrics."
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-4 gap-3.5">
        <StatCard label="Target SLA Met" value={`${kpis.slaPct}%`} icon={Clock} tone="leaf" sub="Target ≥ 85%" />
        <StatCard label="Total Complaints" value={totalTickets} icon={Activity} tone="ink" sub={`${resolved} resolved`} />
        <StatCard label="SLA Breached" value={kpis.slaBreached || 0} icon={Clock} tone="alert" sub="Requires attention" />
        <StatCard label="Escalated" value={kpis.escalated || 0} icon={Users} tone="saffron" sub="DM intervention" />
      </div>

      <div className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Monthly Resolution Volume" subtitle={trendData.length ? 'Historical performance trend' : 'No trend data available'} icon={BarChart2} />
          <CardBody>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="complaints" fill="#94a3b8" name="Total" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="resolved" fill="#22c55e" name="Resolved" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-[12.5px] text-ink-400">
                No trend data available from backend.
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Department Performance" subtitle="Key operational metrics" icon={BarChart2} />
          <CardBody>
            <div className="space-y-4">
              <MetricBar label="Resolution Rate" value={totalTickets ? Math.round((resolved / totalTickets) * 100) : 0} />
              <MetricBar label="SLA Compliance" value={kpis.slaPct || 0} />
              <MetricBar label="Pending" value={totalTickets ? Math.round(((kpis.pending || 0) / totalTickets) * 100) : 0} />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function MetricBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-[11.5px] mb-1">
        <span className="text-ink-600">{label}</span>
        <span className="font-medium text-ink-800">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
        <div className="h-full rounded-full bg-leaf-500 transition-all" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  )
}

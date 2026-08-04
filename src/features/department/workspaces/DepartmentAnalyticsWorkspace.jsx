import { useMemo } from 'react'
import { BarChart2, TrendingUp, ShieldCheck, Clock, Users, Activity, Award } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import PageHeader from '../../../components/ui/PageHeader'
import StatCard from '../../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import { useDepartment } from '../framework/DepartmentContext'

const SAMPLE_TREND_DATA = [
  { month: 'Feb', complaints: 14, resolved: 12, slaPct: 88 },
  { month: 'Mar', complaints: 18, resolved: 15, slaPct: 83 },
  { month: 'Apr', complaints: 22, resolved: 20, slaPct: 91 },
  { month: 'May', complaints: 16, resolved: 15, slaPct: 94 },
  { month: 'Jun', complaints: 25, resolved: 21, slaPct: 84 },
  { month: 'Jul', complaints: 19, resolved: 18, slaPct: 95 },
]

export default function DepartmentAnalyticsWorkspace() {
  const { dept, kpis } = useDepartment()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Analytics Engine · ${dept.code}`}
        title={`${dept.label} Sector Analytics & Scorecards`}
        description="Performance scorecards, resolution trend telemetry, SLA breach analysis, and officer evaluation metrics."
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-4 gap-3.5">
        <StatCard label="Target SLA Met" value={`${kpis.slaPct}%`} icon={Clock} tone="leaf" sub="Target ≥ 85%" />
        <StatCard label="Resolution Velocity" value="4.2 Hours" icon={TrendingUp} tone="sky" sub="Avg Resolution Time" />
        <StatCard label="Citizen CSAT Rating" value="4.8 / 5" icon={Award} tone="saffron" sub="Verified Feedback" />
        <StatCard label="Active Field Inspectors" value="8 Inspectors" icon={Users} tone="ink" sub="100% Mobile Active" />
      </div>

      <div className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Monthly Resolution Volume & SLA %" subtitle="Historical performance trend" icon={BarChart2} />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={SAMPLE_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="complaints" fill="#c0392b" name="Total Complaints" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#1f7a54" name="Resolved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="SLA Compliance Rate Trend (%)" subtitle="Target 85% benchmark line" icon={TrendingUp} />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={SAMPLE_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="slaPct" stroke="#1d7ab5" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

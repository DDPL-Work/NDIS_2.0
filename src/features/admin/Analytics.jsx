// Analytics page — budget utilization, coverage trends, deficit detection summary.
// LLD Vol 3 §18: district-level analytics for DM/ADM/State Admin.
// Data: getBudgetUtilization + getBudgetTimeline + getDepartmentKpis.
import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import GapScoreRing from '../../components/ui/GapScoreRing'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAsync } from '../../hooks/useAsync'
import { analyticsApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { DEPARTMENTS, DEPARTMENT_MAP, DISTRICTS } from '../../config/constants'
import { formatCurrencyINR, formatPercent } from '../../utils/format'
import Icon from '../../components/ui/Icon'
import { TrendingUp, BarChart2, PieChart } from 'lucide-react'

const CHART_TABS = [
  { value: 'budget', label: 'Budget utilization', icon: BarChart2 },
  { value: 'coverage', label: 'Coverage trends', icon: TrendingUp },
  { value: 'gap', label: 'Gap score matrix', icon: PieChart },
]

export default function Analytics() {
  const user = useAuthStore((s) => s.user)
  const districtId = user?.districtId || 'nalanda'
  const district = DISTRICTS.find((d) => d.id === districtId)
  const [activeChart, setActiveChart] = useState('budget')

  const { data: budgetData, loading: loadingBudget } = useAsync(
    () => analyticsApi.getBudgetUtilization(districtId), [districtId]
  )
  const { data: kpis, loading: loadingKpis } = useAsync(
    () => analyticsApi.getDepartmentKpis(districtId), [districtId]
  )
  const { data: timeline, loading: loadingTimeline } = useAsync(
    () => analyticsApi.getBudgetTimeline(districtId), [districtId]
  )

  // Augment budget data with department metadata
  const chartBudget = budgetData?.map((d) => ({
    name: DEPARTMENT_MAP[d.departmentId]?.label.split(' ')[0],
    label: DEPARTMENT_MAP[d.departmentId]?.label,
    color: DEPARTMENT_MAP[d.departmentId]?.color,
    Sanctioned: Math.round(d.sanctioned / 100000),
    Utilized: Math.round(d.utilized / 100000),
    pct: Math.round((d.utilized / d.sanctioned) * 100),
  })) || []

  const totalSanctioned = budgetData?.reduce((s, d) => s + d.sanctioned, 0) || 0
  const totalUtilized = budgetData?.reduce((s, d) => s + d.utilized, 0) || 0

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · Vol 3 §18"
        title="Analytics & Reporting"
        description={`District-level budget utilization, coverage trends, and deficit scores for ${district?.label}.`}
      />

      {/* KPI strip */}
      <div className="px-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {loadingBudget
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : (
            <>
              <StatCard
                label="Total sanctioned"
                value={formatCurrencyINR(totalSanctioned)}
                icon={BarChart2}
                tone="ink"
                sub="FY 2025-26"
              />
              <StatCard
                label="Total utilized"
                value={formatCurrencyINR(totalUtilized)}
                icon={TrendingUp}
                tone="leaf"
                sub={`${((totalUtilized / totalSanctioned) * 100).toFixed(0)}% of sanctioned`}
              />
              <StatCard
                label="Departments reported"
                value={budgetData?.length || 0}
                icon={PieChart}
                tone="saffron"
                sub="All 6 pilot sectors"
              />
              <StatCard
                label="Avg. gap score"
                value={kpis ? (kpis.reduce((s, k) => s + k.avgGapScore, 0) / kpis.length).toFixed(2) : '—'}
                icon={TrendingUp}
                tone="alert"
                sub="Across all departments"
              />
            </>
          )}
      </div>

      {/* Chart tab switcher */}
      <div className="px-6 mt-6">
        <div className="flex gap-1 p-1 bg-ink-100 rounded-xl w-fit">
          {CHART_TABS.map(({ value, label, icon: TabIcon }) => (
            <button
              key={value}
              onClick={() => setActiveChart(value)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                activeChart === value ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <TabIcon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 mt-4 pb-8 space-y-4">
        {/* Budget Utilization Bar Chart */}
        {activeChart === 'budget' && (
          <>
            <Card>
              <CardHeader title="Budget utilization by department" subtitle="In ₹ Lakhs — sanctioned vs. utilized" />
              <CardBody>
                {loadingBudget ? (
                  <div className="h-64 flex items-center justify-center text-ink-400 text-[12.5px]">Loading…</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartBudget} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7488a0' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#7488a0' }} unit=" L" />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e7ec' }}
                        formatter={(v, n) => [`₹${v} L`, n]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11.5 }} />
                      <Bar dataKey="Sanctioned" fill="#e2e7f0" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Utilized" radius={[3, 3, 0, 0]}>
                        {chartBudget.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardBody>
            </Card>

            {/* Utilization % cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {chartBudget.map((d) => {
                const dept = DEPARTMENT_MAP[d.label.split(' ')[0]?.toLowerCase()] || DEPARTMENTS.find((dep) => dep.label === d.label)
                const isLow = d.pct < 40
                const isHigh = d.pct >= 80
                return (
                  <div key={d.name} className="card !p-3 text-center">
                    <div
                      className="grid h-8 w-8 place-items-center rounded-lg text-white mx-auto mb-2"
                      style={{ background: d.color }}
                    >
                      <Icon name={DEPARTMENTS.find((dep) => dep.label.startsWith(d.name))?.icon || 'Building2'} size={15} />
                    </div>
                    <p className="text-[11.5px] text-ink-500 leading-tight">{d.name}</p>
                    <p
                      className="text-[20px] font-display font-semibold mt-1"
                      style={{ color: isLow ? '#c0392b' : isHigh ? '#1f7a54' : '#e07a2c' }}
                    >
                      {d.pct}%
                    </p>
                    <p className="text-[10.5px] text-ink-400">utilized</p>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Coverage Trends Line Chart */}
        {activeChart === 'coverage' && (
          <Card>
            <CardHeader
              title="Coverage trend by department"
              subtitle="Monthly coverage % over the last 7 months"
            />
            <CardBody>
              {loadingKpis ? (
                <div className="h-64 flex items-center justify-center text-ink-400 text-[12.5px]">Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={kpis?.[0]?.trend || []}
                    margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7488a0' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#7488a0' }} unit="%" />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e7ec' }}
                      formatter={(v) => [`${v}%`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: 11.5 }} />
                    {kpis?.map((k) => {
                      const dept = DEPARTMENT_MAP[k.departmentId]
                      return (
                        <Line
                          key={k.departmentId}
                          type="monotone"
                          data={k.trend}
                          dataKey="value"
                          name={dept.label}
                          stroke={dept.color}
                          strokeWidth={2}
                          dot={{ r: 3, fill: dept.color }}
                          activeDot={{ r: 5 }}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>
        )}

        {/* Gap Score Matrix */}
        {activeChart === 'gap' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingKpis
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : kpis?.map((k) => {
                const dept = DEPARTMENT_MAP[k.departmentId]
                return (
                  <Card key={k.departmentId}>
                    <CardBody>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: dept.color }}>
                          <Icon name={dept.icon} size={16} />
                        </div>
                        <div>
                          <p className="text-[13.5px] font-semibold text-ink-950">{dept.label}</p>
                          <p className="text-[11.5px] text-ink-500">{k.facilityCount} facilities · {k.geoTaggedPct}% geo-tagged</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div>
                            <p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Coverage</p>
                            <p className="text-[18px] font-display font-semibold text-ink-950">{formatPercent(k.coveragePct)}</p>
                          </div>
                          <div>
                            <p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Budget used</p>
                            <p className="text-[18px] font-display font-semibold text-ink-950">{formatPercent(k.budgetUtilizedPct)}</p>
                          </div>
                        </div>
                        <GapScoreRing score={k.avgGapScore} size={72} strokeWidth={7} />
                      </div>
                    </CardBody>
                  </Card>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

// Analytics page — budget utilization, coverage trends, deficit detection summary.
// LLD Vol 3 §18: district-level analytics for DM/ADM/State Admin.
// Data: useAnalyticsData → GET /api/departments/ + per-department facilities
// (shared facility cache; gap scores from the neighbourhood model). Budget
// utilized / history metrics are backend gaps here — the UI shows explicit
// "not available" states instead of fabricated figures.
import { useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import GapScoreRing from '../../components/ui/GapScoreRing'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAnalyticsData } from '../../hooks/useAnalyticsData'
import { useAuthStore } from '../../app/store/authStore'
import { DISTRICTS } from '../../config/constants'
import { formatCurrencyINR } from '../../utils/format'
import Icon from '../../components/ui/Icon'
import { TrendingUp, BarChart2, PieChart, Inbox, AlertTriangle } from 'lucide-react'

const CHART_TABS = [
  { value: 'budget', label: 'Budget utilization', icon: BarChart2 },
  { value: 'coverage', label: 'Coverage trends', icon: TrendingUp },
  { value: 'gap', label: 'Gap score matrix', icon: PieChart },
]

export default function Analytics() {
  const user = useAuthStore((s) => s.user)
  const districtId = user?.districtId || 'nalanda'
  const districtLabel = DISTRICTS.find((d) => d.id === districtId)?.label || 'Nalanda'
  const [activeChart, setActiveChart] = useState('budget')

  const { data: model, loading, error, refetch } = useAnalyticsData(districtId)
  const rows = model?.rows || []
  const summary = model || { departmentsReported: 0, totalDepartments: 0 }

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · Vol 3 §18"
        title="Analytics & Reporting"
        description={`District-level budget utilization, coverage trends, and deficit scores for ${districtLabel}.`}
      />

      {/* KPI strip */}

      <div className="px-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : (
            <>
              <StatCard
                label="Total sanctioned"
                value={summary.totalSanctioned != null ? formatCurrencyINR(summary.totalSanctioned) : '—'}
                icon={BarChart2}
                tone="ink"
                sub="No budget API in backend"
              />
              <StatCard
                label="Total utilized"
                value={summary.totalUtilized != null ? formatCurrencyINR(summary.totalUtilized) : '—'}
                icon={TrendingUp}
                tone="leaf"
                sub="Budget API not provided"
              />
              <StatCard
                label="Departments reported"
                value={summary.departmentsReported}
                icon={PieChart}
                tone="saffron"
                sub={`of ${summary.totalDepartments} registered sectors`}
              />
              <StatCard
                label="Avg. gap score"
                value={summary.avgGapScore != null ? summary.avgGapScore.toFixed(2) : '—'}
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

      {/* Error state — the page keeps tabs usable; only the section shows the problem */}
      {error && !loading && (
        <div className="px-6 mt-4">
          <div className="card p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-alert-50 text-alert-600">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-ink-900">Could not load analytics data</p>
                <p className="text-[12px] text-ink-500">Departments or facilities for {districtLabel} were not returned by the backend.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
          </div>
        </div>
      )}

      <div className="px-6 mt-4 pb-8 space-y-4">
        {/* Budget Utilization */}
        {activeChart === 'budget' && (
          <Card>
            <CardHeader title="Budget utilization by department" subtitle="In ₹ Lakhs — sanctioned vs. utilized" />
            <CardBody>
              {loading ? (
                <div className="h-64 flex items-center justify-center text-ink-400 text-[12.5px]">Loading…</div>
              ) : (
                <DataUnavailable
                  title="Budget utilization is not available yet"
                  note="The deployed backend exposes no sanctioned/utilized budget endpoints (schemes & budgets are documented backend gaps). This page does not fabricate figures — once the backend provides the API, the chart and utilization cards appear here automatically."
                />
              )}
            </CardBody>
          </Card>
        )}

        {/* Coverage Trends */}
        {activeChart === 'coverage' && (
          <Card>
            <CardHeader
              title="Coverage trend by department"
              subtitle="Monthly coverage % over the last 7 months"
            />
            <CardBody>
              {loading ? (
                <div className="h-64 flex items-center justify-center text-ink-400 text-[12.5px]">Loading…</div>
              ) : (
                <DataUnavailable
                  title="Monthly coverage history is not available yet"
                  note="Coverage is derived from current facility geometry (gap score → (1 − gap) × 100), and the backend stores no historical geometry. A 7-month trend would require a dedicated history endpoint; the current per-department coverage is shown in the Gap score matrix tab."
                />
              )}
            </CardBody>
          </Card>
        )}

        {/* Gap Score Matrix */}
        {activeChart === 'gap' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : rows.map((row) => (
                <Card key={row.id}>
                  <CardBody>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: row.color }}>
                        <Icon name={row.icon} size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-ink-950 truncate">{row.name}</p>
                        <p className="text-[11.5px] text-ink-500">
                          {row.facilityCount} facilities{row.geoTaggedPct == null ? '' : ` · ${row.geoTaggedPct}% geo-tagged`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Coverage</p>
                          <p className="text-[18px] font-display font-semibold text-ink-950">
                            {row.coveragePct == null ? '—' : `${row.coveragePct}%`}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Budget used</p>
                          <p className="text-[18px] font-display font-semibold text-ink-950">—</p>
                        </div>
                      </div>
                      {row.gapScore == null ? (
                        <div
                          className="grid place-items-center rounded-full bg-ink-50 text-[15px] font-semibold text-ink-400"
                          style={{ width: 72, height: 72 }}
                          title="No positioned facilities to score coverage"
                        >
                          —
                        </div>
                      ) : (
                        <GapScoreRing score={row.gapScore} size={72} strokeWidth={7} />
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Honest empty/flag state — same visual language as the executive overview's
// "no data" panels (icon + title + note). Never renders NaN/undefined/0
// placeholders that would look like real values.
function DataUnavailable({ title, note }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-ink-100 text-ink-400 mb-2.5">
        <Inbox size={18} />
      </div>
      <p className="text-[13px] font-semibold text-ink-700">{title}</p>
      <p className="text-[12px] text-ink-500 mt-1 max-w-md mx-auto">{note}</p>
    </div>
  )
}
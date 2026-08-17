// State Rollup — cross-district KPI comparison for State Admin role.
// LLD Vol 1 §1.4, Vol 3 §18: visible only to state_admin persona.
// Compares all pilot + phase-2 districts on gap score, coverage, budget, and grievances.
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import GapScoreRing from '../../components/ui/GapScoreRing'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAsync } from '../../hooks/useAsync'
import { analyticsApi } from '../../services/api'
import { DISTRICTS, DEPARTMENTS, DEPARTMENT_MAP } from '../../config/constants'
import { formatNumber, formatPercent, formatCurrencyINR } from '../../utils/format'
import Icon from '../../components/ui/Icon'
import { Globe2, TrendingDown, Building2, ClipboardCheck } from 'lucide-react'

// Load summary for every district in parallel
function useAllDistricts() {
  const { data: d0 } = useAsync(() => analyticsApi.getDistrictSummary('nalanda'), [])
  const { data: d1 } = useAsync(() => analyticsApi.getDistrictSummary('rajgir'), [])
  const { data: d2 } = useAsync(() => analyticsApi.getDistrictSummary('patna'), [])
  const { data: d3 } = useAsync(() => analyticsApi.getDistrictSummary('gaya'), [])
  return [d0, d1, d2, d3].filter(Boolean)
}

function useAllKpis() {
  const { data: k0 } = useAsync(() => analyticsApi.getDepartmentKpis('nalanda'), [])
  const { data: k1 } = useAsync(() => analyticsApi.getDepartmentKpis('rajgir'), [])
  return { nalanda: k0, rajgir: k1 }
}

const DISTRICT_COLORS = {
  nalanda: '#0b3558',
  rajgir: '#1f7a54',
  patna: '#e07a2c',
  gaya: '#8a4fc0',
}

export default function StateRollup() {
  const allSummaries = useAllDistricts()
  const kpis = useAllKpis()
  const [selectedDistrict, setSelectedDistrict] = useState('nalanda')

  const loading = allSummaries.length < 2

  // Bar chart data: each district is a group
  const comparisonData = DISTRICTS.map((d) => {
    const s = allSummaries.find((x) => x?.districtId === d.id)
    return {
      name: d.label,
      districtId: d.id,
      'Gap score (×100)': s ? Math.round(s.avgGapScore * 100) : null,
      'Grievance SLA%': s?.grievanceClosureSlaPct ?? null,
      'Approval days': s?.approvalCycleDays ?? null,
      facilities: s?.totalFacilities ?? 0,
      color: DISTRICT_COLORS[d.id],
      phase: d.phase,
    }
  })

  // Radar chart — department-level comparison nalanda vs rajgir
  const radarData = DEPARTMENTS.map((dept) => {
    const nk = kpis.nalanda?.find((k) => k.departmentId === dept.id)
    const rk = kpis.rajgir?.find((k) => k.departmentId === dept.id)
    return {
      dept: dept.label.split(' ')[0],
      Nalanda: nk ? Math.round(nk.coveragePct) : 0,
      Rajgir: rk ? Math.round(rk.coveragePct) : 0,
    }
  })

  const selectedSummary = allSummaries.find((s) => s?.districtId === selectedDistrict)

  return (
    <div>
      <PageHeader
        eyebrow="State Admin · Vol 1 §1.4"
        title="Cross-district KPIs"
        description="Aggregated view across all pilot and phase-2 districts for the State Admin role."
      />

      {/* KPI strip — state totals */}
      <div className="px-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Total facilities (all districts)"
              value={formatNumber(allSummaries.reduce((s, d) => s + (d?.totalFacilities || 0), 0))}
              icon={Building2}
              tone="ink"
              sub="Pilot + Phase 2"
            />
            <StatCard
              label="State avg. gap score"
              value={(allSummaries.reduce((s, d) => s + (d?.avgGapScore || 0), 0) / (allSummaries.length || 1)).toFixed(2)}
              icon={TrendingDown}
              tone="alert"
              sub="Lower is better"
            />
            <StatCard
              label="Grievance SLA avg."
              value={formatPercent(allSummaries.reduce((s, d) => s + (d?.grievanceClosureSlaPct || 0), 0) / (allSummaries.length || 1))}
              icon={ClipboardCheck}
              tone="leaf"
              sub="Target ≥70%"
            />
            <StatCard
              label="Avg. approval cycle"
              value={`${(allSummaries.reduce((s, d) => s + (d?.approvalCycleDays || 0), 0) / (allSummaries.length || 1)).toFixed(1)}d`}
              icon={Globe2}
              tone="saffron"
              sub="Target ≤5 days"
            />
          </>
        )}
      </div>

      <div className="px-6 mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* District comparison cards */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Districts</h3>
          {DISTRICTS.map((d) => {
            const s = allSummaries.find((x) => x?.districtId === d.id)
            const isPilot = d.phase === 'Pilot'
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDistrict(d.id)}
                className={`card w-full text-left !p-4 transition-all ${selectedDistrict === d.id ? 'ring-2 ring-ink-900' : 'hover:border-ink-300'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink-950">{d.label}</p>
                    <p className="text-[11.5px] text-ink-500">{d.state}</p>
                  </div>
                  <Badge tone={isPilot ? 'positive' : 'info'}>{d.phase}</Badge>
                </div>
                {s ? (
                  <div className="flex items-center gap-3">
                    <GapScoreRing score={s.avgGapScore} size={44} strokeWidth={5} />
                    <div className="text-[11.5px] text-ink-600 space-y-0.5">
                      <p><span className="font-medium text-ink-800">{formatNumber(s.totalFacilities)}</span> facilities</p>
                      <p>SLA: <span className="font-medium text-ink-800">{formatPercent(s.grievanceClosureSlaPct)}</span></p>
                      <p>Approval: <span className="font-medium text-ink-800">{s.approvalCycleDays}d</span></p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11.5px] text-ink-400 italic">Data loading…</p>
                )}
              </button>
            )
          })}
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Gap score comparison bar chart */}
          <Card>
            <CardHeader title="District comparison" subtitle="Gap score × 100, Grievance SLA %, Approval cycle (days)" />
            <CardBody>
              {loading ? (
                <div className="h-52 flex items-center justify-center text-ink-400 text-[12.5px]">Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={comparisonData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7488a0' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#7488a0' }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e7ec' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11.5 }} />
                    <Bar dataKey="Gap score (×100)" fill="#c0392b" radius={[3, 3, 0, 0]} opacity={0.85} />
                    <Bar dataKey="Grievance SLA%" fill="#1f7a54" radius={[3, 3, 0, 0]} opacity={0.85} />
                    <Bar dataKey="Approval days" fill="#e07a2c" radius={[3, 3, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>

          {/* Radar: department coverage Nalanda vs Rajgir */}
          <Card>
            <CardHeader title="Pilot district coverage radar" subtitle="Department coverage % — Nalanda vs. Rajgir" />
            <CardBody>
              {!kpis.nalanda ? (
                <div className="h-52 flex items-center justify-center text-ink-400 text-[12.5px]">Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e4e7ec" />
                    <PolarAngleAxis dataKey="dept" tick={{ fontSize: 11, fill: '#7488a0' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#7488a0' }} />
                    <Radar name="Nalanda" dataKey="Nalanda" stroke="#0b3558" fill="#0b3558" fillOpacity={0.2} />
                    <Radar name="Rajgir" dataKey="Rajgir" stroke="#1f7a54" fill="#1f7a54" fillOpacity={0.2} />
                    <Legend wrapperStyle={{ fontSize: 11.5 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e7ec' }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>

          {/* Selected district department breakdown */}
          {selectedSummary && (
            <Card>
              <CardHeader
                title={`${DISTRICTS.find((d) => d.id === selectedDistrict)?.label} — detail`}
                subtitle="Department KPI breakdown"
              />
              <CardBody className="!p-0">
                {(kpis[selectedDistrict] || []).map((k) => {
                  const dept = DEPARTMENT_MAP[k.departmentId]
                  return (
                    <div key={k.departmentId} className="flex items-center gap-4 px-5 py-3 border-b border-ink-50 last:border-0">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: dept.color }}>
                        <Icon name={dept.icon} size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-ink-900">{dept.label}</p>
                        <p className="text-[11px] text-ink-500">{formatNumber(k.facilityCount)} facilities · {k.openProposals} proposals · {k.openGrievances} grievances</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11.5px] text-ink-500">Coverage</p>
                        <p className="text-[13.5px] font-semibold text-ink-900">{formatPercent(k.coveragePct)}</p>
                      </div>
                      <GapScoreRing score={k.avgGapScore} size={36} strokeWidth={4} />
                    </div>
                  )
                })}
                {!kpis[selectedDistrict] && (
                  <p className="px-5 py-4 text-[12px] text-ink-400 italic">Department-level data only available for pilot districts.</p>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

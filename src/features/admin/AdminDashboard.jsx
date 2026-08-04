import { Building2, ClipboardCheck, Timer, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import GapScoreRing from '../../components/ui/GapScoreRing'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import TrendChart from '../../components/charts/TrendChart'
import Icon from '../../components/ui/Icon'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAsync } from '../../hooks/useAsync'
import { analyticsApi, workflowApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { DEPARTMENT_MAP, DISTRICTS } from '../../config/constants'
import { formatNumber, formatPercent } from '../../utils/format'
import StatusBadge from '../../components/ui/StatusBadge'

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const districtId = user?.districtId || 'nalanda'
  const district = DISTRICTS.find((d) => d.id === districtId)

  const { data: summary, loading: loadingSummary } = useAsync(() => analyticsApi.getDistrictSummary(districtId), [districtId])
  const { data: kpis, loading: loadingKpis } = useAsync(() => analyticsApi.getDepartmentKpis(districtId), [districtId])
  const { data: proposals } = useAsync(() => workflowApi.listProposals({ districtId, state: 'under_review' }), [districtId])
  const { data: recommendations } = useAsync(() => analyticsApi.getRecommendations(districtId), [districtId])

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal"
        title={`${district?.label} District — Situation Overview`}
        description="Cross-department deficit view, approval pipeline health and AI-generated recommendations, in one place."
      />

      <div className="px-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {loadingSummary
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : (
            <>
              <StatCard label="Total facilities" value={formatNumber(summary.totalFacilities)} icon={Building2} tone="ink" sub={`${summary.geoTaggedPct}% geo-tagged`} />
              <StatCard label="Avg. gap score" value={summary.avgGapScore.toFixed(2)} icon={AlertTriangle} tone="saffron" sub="Lower is better served" />
              <StatCard label="Approval cycle time" value={`${summary.approvalCycleDays}d`} icon={Timer} tone="leaf" delta={summary.approvalCycleDays <= 5 ? 12 : -8} sub="Target: ≤ 5 days" />
              <StatCard label="Grievance closure (SLA)" value={formatPercent(summary.grievanceClosureSlaPct)} icon={ClipboardCheck} tone="sky" sub="Target: ≥ 70% within 14 days" />
            </>
          )}
      </div>

      <div className="px-6 mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Department coverage"
              subtitle="Gap score & facility coverage by sector"
              action={<Link to="/admin/situation-matrix" className="text-[12px] font-semibold text-ink-600 hover:text-ink-900 flex items-center gap-1">Situation Matrix <ArrowRight size={13} /></Link>}
            />
            <CardBody className="!py-2">
              {loadingKpis && <div className="py-6"><SkeletonCard /></div>}
              {!loadingKpis && (
                <div className="divide-y divide-ink-50">
                  {kpis.map((k) => {
                    const dept = DEPARTMENT_MAP[k.departmentId] || { label: k.departmentId, color: '#1d7ab5', icon: 'Building2' }
                    return (
                      <Link key={k.departmentId} to={`/department/${k.departmentId}`} className="flex items-center gap-4 py-3 hover:bg-ink-50 px-2 rounded-xl transition-colors">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: dept.color }}>
                          <Icon name={dept.icon} size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-ink-900">{dept.label}</p>
                          <p className="text-[11.5px] text-ink-500">{formatNumber(k.facilityCount)} facilities · {k.openProposals} open proposals · {k.openGrievances} open grievances</p>
                        </div>
                        <div className="w-24 hidden md:block">
                          <TrendChart data={k.trend} height={40} color={dept.color} />
                        </div>
                        <GapScoreRing score={k.avgGapScore} size={40} strokeWidth={4} />
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Proposals awaiting your review"
              subtitle="Under DM/ADM review"
              action={<Link to="/admin/approvals" className="text-[12px] font-semibold text-ink-600 hover:text-ink-900 flex items-center gap-1">All approvals <ArrowRight size={13} /></Link>}
            />
            <CardBody className="!p-0">
              {(proposals || []).slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-ink-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink-900 truncate">{p.title}</p>
                    <p className="text-[11.5px] text-ink-500 kbd-mono">{p.id}</p>
                  </div>
                  <StatusBadge status={p.state} />
                </div>
              ))}
              {(proposals || []).length === 0 && <p className="px-5 py-6 text-[12.5px] text-ink-400">Nothing waiting on your review right now.</p>}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="GIS Decision Support" subtitle="Top ranked recommendations" icon={Sparkles} />
            <CardBody className="!p-0">
              {(recommendations || []).slice(0, 4).map((r) => (
                <div key={r.id} className="px-5 py-3 border-b border-ink-50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-medium text-ink-900 leading-snug">{r.title}</p>
                    <Badge tone={r.priority === 'high' ? 'negative' : r.priority === 'medium' ? 'warning' : 'neutral'}>{r.priority}</Badge>
                  </div>
                  <p className="text-[11px] text-ink-400 mt-1">Confidence {(r.confidence * 100).toFixed(0)}%</p>
                </div>
              ))}
              <div className="px-5 py-3">
                <Button as={Link} to="/admin/recommendations" variant="ghost" size="sm" className="w-full justify-center">View all recommendations</Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Portal health" subtitle="Availability & performance" />
            <CardBody className="space-y-2.5">
              <div className="flex justify-between text-[12.5px]"><span className="text-ink-500">Uptime (pilot target 99.5%)</span><span className="font-semibold text-leaf-600">{summary?.uptime ?? '—'}%</span></div>
              <div className="flex justify-between text-[12.5px]"><span className="text-ink-500">Map tile p95</span><span className="font-semibold text-ink-800">1.4s</span></div>
              <div className="flex justify-between text-[12.5px]"><span className="text-ink-500">API p95 (spatial)</span><span className="font-semibold text-ink-800">640ms</span></div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

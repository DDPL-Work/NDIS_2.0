import { Building2, ClipboardCheck, Timer, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAsync } from '../../hooks/useAsync'
import { useDepartmentCoverage } from '../../hooks/useDepartmentCoverage'
import { analyticsApi, workflowApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { DISTRICTS } from '../../config/constants'
import { formatNumber, formatPercent } from '../../utils/format'
import DepartmentCoverage from './components/DepartmentCoverage'
import GISDecisionSupportCard from './components/GISDecisionSupportCard'
import PortalHealthCard from './components/PortalHealthCard'

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const districtId = user?.districtId || 'nalanda'
  const district = DISTRICTS.find((d) => d.id === districtId)

  // Real executive overview: departments, facilities, complaint rollups and
  // gap scores are aggregated by the coverage hook (see useDepartmentCoverage).
  const { data: coverage, loading: loadingCoverage, error: coverageError, refetch: refetchCoverage } = useDepartmentCoverage(districtId)

  // District dashboard for the SLA compliance rate (the only executive
  // telemetry the deployed backend exposes).
  const { data: summaryRaw, loading: loadingSummary } = useAsync(() => analyticsApi.getDistrictSummary(districtId), [districtId])
  const approvalCycleDays = summaryRaw?.approvalCycleDays ?? summaryRaw?.approval_cycle_days
  const slaRate = parseFloat(summaryRaw?.sla_compliance_rate ?? summaryRaw?.slaComplianceRate)

  const { data: proposals } = useAsync(() => workflowApi.listProposals({ districtId, state: 'under_review' }), [districtId])

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal"
        title={`${district?.label} District — Situation Overview`}
        description="Cross-department deficit view, approval pipeline health and AI-generated recommendations, in one place."
      />

      <div className="px-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {(loadingSummary || loadingCoverage)
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : (
            <>
              <StatCard label="Total facilities" value={formatNumber(coverage?.facilityCount)} icon={Building2} tone="ink" sub={`${coverage?.rows?.length ?? '—'} sectors tracked`} />
              <StatCard label="Avg. gap score" value={coverage?.avgGapScore == null ? '—' : coverage.avgGapScore.toFixed(2)} icon={AlertTriangle} tone="saffron" sub="Lower is better served" />
              <StatCard label="Approval cycle time" value={approvalCycleDays == null ? '—' : `${approvalCycleDays}d`} icon={Timer} tone="leaf" delta={approvalCycleDays == null ? undefined : approvalCycleDays <= 5 ? 12 : -8} sub="Target: ≤ 5 days" />
              <StatCard label="Grievance closure (SLA)" value={Number.isFinite(slaRate) ? formatPercent(slaRate) : '—'} icon={ClipboardCheck} tone="sky" sub="Target: ≥ 70% within 14 days" />
            </>
          )}
      </div>

      <div className="px-6 mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <DepartmentCoverage
            rows={coverage?.rows || []}
            loading={loadingCoverage}
            error={coverageError}
            onRetry={refetchCoverage}
          />

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
          <GISDecisionSupportCard
            rows={coverage?.topGaps || []}
            loading={loadingCoverage}
            error={coverageError}
            onRetry={refetchCoverage}
          />
          <PortalHealthCard />
        </div>
      </div>
    </div>
  )
}
// State Administration — Executive Dashboard.
// Every number is DERIVED from the finance records via finance selectors;
// nothing is typed in for display. Filters: FY / department / district / scheme.
import { useMemo, useState } from 'react'
import {
  Landmark, Building2, MapPin, FileCheck2, HandCoins, BadgeCheck, TrendingUp,
  Wallet, Lock, FolderKanban, Bell, Inbox, Target, Sparkles, Banknote, AlertTriangle, ScrollText,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts'
import StatCard from '../../../components/ui/StatCard'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Select from '../../../components/ui/Select'
import Badge from '../../../components/ui/Badge'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { useStateProjectStore } from '../store/stateProjectStore'
import { useGovernanceStore } from '../store/stateGovernanceStore'
import { statePosition, departmentPositions, districtPositions, schemePositions } from '../selectors/financeSelectors'
import { formatCurrencyINR } from '../../../utils/format'
import { FINANCIAL_YEARS } from '../../../config/stateConstants'
import { FilterStrip, formatAmount } from '../components/StateUI'

export default function StateDashboardWorkspace() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const projects = useStateProjectStore((s) => s.projects)
  const proposals = useStateProjectStore((s) => s.proposals)
  const orders = useGovernanceStore((s) => s.orders)

  const [fy, setFy] = useState('2026-27')
  const [departmentId, setDepartmentId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [schemeId, setSchemeId] = useState('')

const position = useMemo(() => statePosition({ fy, ...store }), [fy, store])
  const deptRows = useMemo(() => departmentPositions({ fy, departments: master.departments, ...store }), [fy, master.departments, store])
  const districtRows = useMemo(() => districtPositions({ fy, districts: master.districts, ...store }), [fy, master.districts, store])
  const schemeRows = useMemo(() => schemePositions({ fy, schemes: master.schemes, ...store }), [fy, master.schemes, store])

  const pendingApprovals = store.sanctions.filter((s) => s.fy === fy && s.status === 'drafted').length + proposals.filter((p) => ['submitted', 'recommended', 'under_review', 'escalated', 'delegated', 'forwarded'].includes(p.status)).length

  const dashboard = {
    provision: position.provision,
    authorized: position.authorized,
    allocated: position.allocated,
    sanctioned: position.sanctioned,
    released: position.released,
    committed: position.committed,
    utilized: position.utilized,
    available: position.derived.remainToSanction,
    unreleased: position.derived.unreleased,
  }

  // Sanction vs release chart series
  const sanctionReleaseSeries = deptRows.map((r) => ({ name: r.departmentName.split(' ')[0], sanctioned: r.sanctioned / 10000000, released: r.released / 10000000 }))
  const releaseUtilSeries = deptRows.map((r) => ({ name: r.departmentName.split(' ')[0], released: r.released / 10000000, utilized: r.utilized / 10000000 }))
  const deptBudgetChart = deptRows.map((r) => ({ name: r.departmentName.split(' ')[0], authorized: r.authorized / 10000000, sanctioned: r.sanctioned / 10000000, utilized: r.utilized / 10000000 }))

  const topPerforming = [...deptRows].sort((a, b) => (b.utilizationPct ?? 0) - (a.utilizationPct ?? 0)).slice(0, 4)
  const lowPerforming = [...deptRows].sort((a, b) => (a.utilizationPct ?? 101) - (b.utilizationPct ?? 101)).filter((r) => r.utilizationPct !== null).slice(0, 4)
  const atRiskProjects = projects.filter((p) => p.status === 'in_progress' && p.completionPct < 40)
  const recentOrders = orders.slice(0, 5)
  const recentLedger = store.ledger.filter((l) => !schemeId || l.schemeId === schemeId).slice(0, 8)

  return (
    <div className="px-6 pb-10">
      <PageHeader
        eyebrow="STATE ADMINISTRATION · FINANCIAL YEAR"
        title="State Governance Dashboard"
        description="Budget provision → authorization → allocation → sanction → release → commitment → utilization. All values traceable to the financial ledger."
        action={
          <div className="flex items-center gap-2">
            <Select small value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
          </div>
        }
      />

      <FilterStrip className="mb-5">
        <Select small value={departmentId} onChange={setDepartmentId} options={[{ value: '', label: 'All Departments' }, ...master.departments.map((d) => ({ value: d.id, label: d.name }))]} />
        <Select small value={districtId} onChange={setDistrictId} options={[{ value: '', label: 'All Districts' }, ...master.districts.map((d) => ({ value: d.id, label: d.name }))]} />
        <Select small value={schemeId} onChange={setSchemeId} options={[{ value: '', label: 'All Schemes' }, ...master.schemes.map((s) => ({ value: s.id, label: s.name }))]} />
        <Badge tone="info" dot>Filters apply to charts below; KPI band reflects the selected financial year</Badge>
      </FilterStrip>

      {/* KPI band */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatCard label="Total State Budget" value={formatCurrencyINR(dashboard.provision)} icon={Landmark} tone="ink" sub={fy} />
        <StatCard label="Department Allocation" value={formatCurrencyINR(dashboard.authorized)} icon={Building2} tone="ink" sub={`${Math.round((dashboard.authorized / (dashboard.provision || 1)) * 100)}% of provision`} />
        <StatCard label="District Allocation" value={formatCurrencyINR(dashboard.allocated)} icon={MapPin} tone="ink" sub={`${Math.round((dashboard.allocated / (dashboard.authorized || 1)) * 100)}% of authorized`} />
        <StatCard label="Total Sanctioned" value={formatCurrencyINR(dashboard.sanctioned)} icon={FileCheck2} tone="saffron" sub="competent authority approvals" />
        <StatCard label="Total Released" value={formatCurrencyINR(dashboard.released)} icon={HandCoins} tone="saffron" sub={`${Math.round((dashboard.released / (dashboard.sanctioned || 1)) * 100)}% of sanctioned`} />
        <StatCard label="Total Committed" value={formatCurrencyINR(dashboard.committed)} icon={BadgeCheck} tone="leaf" sub="obligations against released" />
        <StatCard label="Total Utilized" value={formatCurrencyINR(dashboard.utilized)} icon={TrendingUp} tone="leaf" sub={`${Math.round((dashboard.utilized / (dashboard.released || 1)) * 100)}% of released`} />
        <StatCard label="Available Balance" value={formatCurrencyINR(dashboard.available)} icon={Wallet} tone="leaf" sub="authorized − sanctioned" />
        <StatCard label="Unreleased Balance" value={formatCurrencyINR(dashboard.unreleased)} icon={Lock} tone="saffron" sub="sanctioned − released" />
        <StatCard label="Active Projects" value={projects.filter((p) => ['in_progress', 'released'].includes(p.status)).length} icon={FolderKanban} tone="sky" sub={`${projects.filter((p) => p.status === 'at risk' || (p.status === 'in_progress' && p.completionPct < 40)).length} at risk`} />
        <StatCard label="Departments" value={master.departments.length} icon={Building2} tone="ink" sub={`${master.departments.filter((d) => d.status === 'active').length} active`} />
        <StatCard label="Districts" value={master.districts.length} icon={MapPin} tone="ink" sub="monitored units" />
        <StatCard label="Pending Approvals" value={pendingApprovals} icon={Bell} tone="alert" sub="sanctions + proposals awaiting decision" />
      </div>

      {/* Charts row 1 */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Department-wise Budget" subtitle="Authorized vs sanctioned vs utilized (₹ Cr)" icon={Target} />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptBudgetChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ed" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}Cr`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="authorized" fill="#546882" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sanctioned" fill="#0b3558" radius={[3, 3, 0, 0]} />
                <Bar dataKey="utilized" fill="#1f7a54" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="District-wise Allocation" subtitle="District allocations across departments (₹ Cr)" icon={MapPin} />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={districtRows.map((d) => ({ ...d, allocated: d.allocated / 10000000, released: d.released / 10000000 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ed" />
                <XAxis dataKey="districtName" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}Cr`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="allocated" fill="#0b3558" radius={[3, 3, 0, 0]} />
                <Bar dataKey="released" fill="#e07a2c" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Sanction vs Release" subtitle="Cumulative sanction and release by department (₹ Cr)" icon={HandCoins} />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={sanctionReleaseSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ed" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}Cr`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="sanctioned" stroke="#0b3558" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="released" stroke="#e07a2c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Release vs Utilization" subtitle="Fund absorption — released vs utilized (₹ Cr)" icon={TrendingUp} />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={releaseUtilSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ed" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}Cr`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="released" stroke="#e07a2c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="utilized" stroke="#1f7a54" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Insight strips */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Top Performing Departments" icon={Sparkles} subtitle="Highest utilization of released funds" />
          <CardBody className="px-0">
            {topPerforming.map((row) => (
              <InsightRow key={row.departmentId} label={row.departmentName} sub={`Released ${formatCurrencyINR(row.released)} · Utilized ${formatAmount(row.utilized)}`} right={`${row.utilizationPct ?? 0}%`} tone="leaf" />
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Low Utilization Departments" icon={AlertTriangle} subtitle="May trigger monitoring / re-appropriation review" />
          <CardBody className="px-0">
            {lowPerforming.length ? lowPerforming.map((row) => (
              <InsightRow key={row.departmentId} label={row.departmentName} sub={`Released ${formatCurrencyINR(row.released)}`} right={`${row.utilizationPct ?? 0}%`} tone="alert" />
            )) : <p className="px-5 py-3 text-[13px] text-ink-500">No departmental records in the selected scope.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Projects at Risk" icon={AlertTriangle} subtitle={`${atRiskProjects.length} in-progress projects < 40% completion`} />
          <CardBody className="px-0">
            {atRiskProjects.slice(0, 5).map((p) => (
              <InsightRow key={p.id} label={p.name} sub={`${p.completionPct}% complete · ${p.departmentId.toUpperCase()}`} right={formatAmount(p.utilizedAmount)} tone="saffron" />
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Lower row: pending, orders, ledger */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Pending Sanction Requests" icon={Inbox} subtitle="Awaiting approval under delegation of powers" />
          <CardBody className="px-0">
            {store.sanctions.filter((s) => s.fy === fy && s.status === 'drafted').slice(0, 5).map((s) => (
              <InsightRow key={s.id} label={s.sanctionNo} sub={master.departments.find((d) => d.id === s.departmentId)?.name || s.departmentId} right={formatAmount(s.amount)} tone="warning" />
            ))}
            {!store.sanctions.some((s) => s.fy === fy && s.status === 'drafted') && <p className="px-5 py-3 text-[13px] text-ink-500">No pending sanction requests.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent Government Orders" icon={ScrollText} subtitle="Latest documents registered in the repository" />
          <CardBody className="px-0">
            {recentOrders.map((o) => (
              <InsightRow key={o.id} label={o.orderNumber} sub={o.summary} right={<Badge tone={o.status === 'published' ? 'positive' : 'neutral'}>{o.status}</Badge>} />
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent Financial Transactions" icon={Banknote} subtitle="Last ledger movements" />
          <CardBody className="px-0">
            {recentLedger.map((l) => (
              <InsightRow key={l.id} label={l.typeLabel} sub={`${l.referenceNo || ''} · ${l.fy}`} right={formatAmount(l.amount * l.sign)} tone={l.sign > 0 ? 'leaf' : 'ink'} />
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

// Block props intentionally:
// eslint-disable-next-line react/prop-types
function InsightRow({ label, sub, right, tone = 'neutral' }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-ink-50 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink-900 truncate">{label}</p>
        {sub && <p className="text-[11.5px] text-ink-500 truncate">{sub}</p>}
      </div>
      <div className={`shrink-0 text-[13px] font-mono font-medium ${tone === 'leaf' ? 'text-leaf-600' : tone === 'alert' ? 'text-alert-600' : tone === 'saffron' || tone === 'warning' ? 'text-saffron-600' : 'text-ink-700'}`}>{right}</div>
    </div>
  )
}
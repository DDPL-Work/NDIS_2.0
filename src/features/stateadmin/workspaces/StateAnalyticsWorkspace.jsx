// State Analytics workspace (P7).
//   trends      → monthly cumulative movement from the financial ledger
//   utilization → department / district absorption of released funds
//   pipeline    → sanctions + proposals + project health funnels
//   schemes     → scheme-wise sanction → release → utilization
// Every series is derived from the finance stores; nothing is typed in.
import { useMemo, useState } from 'react'
import {
  TrendingUp, Gauge, GitBranch, Network, AlertTriangle, FileCheck2, HandCoins,
  Sparkles, Download, ArrowUpRight, Wallet,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Select from '../../../components/ui/Select'
import Badge from '../../../components/ui/Badge'
import Tabs from '../../../components/ui/Tabs'
import EmptyState from '../../../components/ui/EmptyState'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { useStateProjectStore } from '../store/stateProjectStore'
import { departmentPositions, districtPositions, schemePositions, statePosition } from '../selectors/financeSelectors'
import { useStatePermission } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { FINANCIAL_YEARS, PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from '../../../config/stateConstants'
import { FilterStrip, formatAmount } from '../components/StateUI'

const MONTHS = [
  { code: 4, label: 'Apr' },
  { code: 5, label: 'May' },
  { code: 6, label: 'Jun' },
  { code: 7, label: 'Jul' },
  { code: 8, label: 'Aug' },
  { code: 9, label: 'Sep' },
  { code: 10, label: 'Oct' },
  { code: 11, label: 'Nov' },
  { code: 12, label: 'Dec' },
  { code: 1, label: 'Jan' },
  { code: 2, label: 'Feb' },
  { code: 3, label: 'Mar' },
]

const PIE_COLORS = ['#0b3558', '#e07a2c', '#1f7a54', '#0891b2', '#7c3aed', '#dc2626', '#94a3b8']

export default function StateAnalyticsWorkspace() {
  const [tab, setTab] = useState('trends')
  const canExport = useStatePermission('report.export')
  const pushToast = useUiStore((s) => s.pushToast)
  return (
    <div className="px-6 pb-10">
      <PageHeader
        eyebrow="STATE ADMIN · MONITORING · ANALYTICS"
        title="State Analytics"
        description="Trends, utilisation and pipeline analysis derived live from the financial ledger, approvals and the project registry."
        action={canExport && (
          <button type="button" onClick={() => pushToast('Report export moved to Reports & Exports.', 'info')} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink-700 hover:bg-ink-50">
            <Download size={14} /> Export
          </button>
        )}
      />
      <Tabs tabs={[
        { value: 'trends', label: 'Financial Trends' },
        { value: 'utilization', label: 'Utilization' },
        { value: 'pipeline', label: 'Approval Pipeline' },
        { value: 'schemes', label: 'Scheme Analysis' },
      ]} active={tab} onChange={setTab} />
      {tab === 'trends' && <TrendsTab />}
      {tab === 'utilization' && <UtilizationTab />}
      {tab === 'pipeline' && <PipelineTab />}
      {tab === 'schemes' && <SchemesTab />}
    </div>
  )
}

function useAnalyticsBase() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const projects = useStateProjectStore((s) => s.projects)
  const proposals = useStateProjectStore((s) => s.proposals)
  const [fy, setFy] = useState('2026-27')
  return { store, master, projects, proposals, fy, setFy }
}

function TrendsTab() {
  const { store, fy, setFy } = useAnalyticsBase()

  const monthly = useMemo(() => {
    const entries = store.ledger.filter((l) => l.fy === fy)
    const byMonth = MONTHS.map((m) => ({
      label: m.label, sanctioned: 0, released: 0, utilized: 0,
    }))
    entries.forEach((l) => {
      const d = new Date(l.timestamp)
      const month = MONTHS.findIndex((m) => m.code === d.getMonth() + 1)
      if (month === -1) return
      if (l.type === 'SANCTION') byMonth[month].sanctioned += l.amount
      if (l.type === 'FUND_RELEASE') byMonth[month].released += l.amount
      if (l.type === 'EXPENDITURE') byMonth[month].utilized += l.amount
    })
    let cSan = 0, cRel = 0, cUti = 0
    return byMonth.map((m) => {
      cSan += m.sanctioned; cRel += m.released; cUti += m.utilized
      const toCr = (n) => Math.round(n / 10000000 * 100) / 100
      return { ...m, sanctioned: toCr(m.sanctioned), released: toCr(m.released), utilized: toCr(m.utilized), cumSanctioned: toCr(cSan), cumReleased: toCr(cRel), cumUtilized: toCr(cUti) }
    })
  }, [store.ledger, fy])

  const active = monthly.filter((m) => m.sanctioned + m.released + m.utilized > 0)
  const totals = active.reduce((acc, m) => ({ sanctioned: acc.sanctioned + m.sanctioned, released: acc.released + m.released, utilized: acc.utilized + m.utilized }), { sanctioned: 0, released: 0, utilized: 0 })

  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-ink-700">Ledger movement by month — {fy}</span>
        <Select small value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Monthly Inflow" subtitle="Sanctioned / released / utilized per month (₹ Cr)" icon={TrendingUp} />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ed" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}Cr`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sanctioned" fill="#0b3558" radius={[3, 3, 0, 0]} />
                <Bar dataKey="released" fill="#e07a2c" radius={[3, 3, 0, 0]} />
                <Bar dataKey="utilized" fill="#1f7a54" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Cumulative Progress" subtitle="Running totals through the financial year (₹ Cr)" icon={ArrowUpRight} />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ed" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}Cr`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="cumSanctioned" name="Cum. Sanctioned" stroke="#0b3558" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cumReleased" name="Cum. Released" stroke="#e07a2c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cumUtilized" name="Cum. Utilized" stroke="#1f7a54" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Monthly Movement Register" subtitle="Sanction → release → utilization by month (₹ Cr)" icon={Gauge} />
        <CardBody className="p-0">
          {active.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No ledger movement in this FY" />
          ) : (
            <DataTable
              columns={[
                { key: 'label', label: 'Month' },
                { key: 'sanctioned', label: 'Sanctioned', render: (r) => formatAmount(r.sanctioned * 10000000) },
                { key: 'released', label: 'Released', render: (r) => formatAmount(r.released * 10000000) },
                { key: 'utilized', label: 'Utilized', render: (r) => formatAmount(r.utilized * 10000000) },
                { key: 'cumSanctioned', label: 'Cum. Sanctioned', render: (r) => `${r.cumSanctioned} Cr` },
                { key: 'cumReleased', label: 'Cum. Released', render: (r) => `${r.cumReleased} Cr` },
                { key: 'cumUtilized', label: 'Cum. Utilized', render: (r) => `${r.cumUtilized} Cr` },
              ]}
              rows={active}
              keyField="label"
            />
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sanctioned (FY)' , value: totals.sanctioned, tone: 'ink' },
          { label: 'Total Released (FY)', value: totals.released, tone: 'saffron' },
          { label: 'Total Utilized (FY)', value: totals.utilized, tone: 'leaf' },
        ].map((t) => (
          <Card key={t.label}><CardBody>
            <p className="text-[11px] uppercase tracking-wide text-ink-400">{t.label}</p>
            <p className={`mt-1 font-mono text-[18px] font-semibold ${t.tone === 'leaf' ? 'text-leaf-600' : t.tone === 'saffron' ? 'text-saffron-600' : 'text-ink-900'}`}>{t.value} Cr</p>
          </CardBody></Card>
        ))}
      </div>
    </div>
  )
}

function UtilizationTab() {
  const { store, master, fy, setFy } = useAnalyticsBase()
  const deptRows = useMemo(() => departmentPositions({ fy, departments: master.departments, ...store }), [fy, master.departments, store])
  const districtRows = useMemo(() => districtPositions({ fy, districts: master.districts, ...store }), [fy, master.districts, store])

  const ranked = [...deptRows].filter((r) => r.utilizationPct !== null).sort((a, b) => b.utilizationPct - a.utilizationPct)
  const laggards = [...deptRows].filter((r) => r.utilizationPct !== null).sort((a, b) => a.utilizationPct - b.utilizationPct).slice(0, 5)

  return (
    <div className="mt-5 space-y-4">
      <FilterStrip className="mb-5">
        <span className="text-[12.5px] font-semibold text-ink-700">Department & district absorption of released funds</span>
        <Select small value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
      </FilterStrip>

      <Card>
        <CardHeader title="Department Utilization" subtitle="Utilized vs released — all departments (₹ Cr, sorted by %) " icon={Gauge} />
        <CardBody className="p-0">
          {ranked.length === 0 ? (
            <EmptyState icon={Gauge} title="No utilization records" />
          ) : (
            <DataTable
              columns={[
                { key: 'departmentName', label: 'Department' },
                { key: 'released', label: 'Released', render: (r) => formatAmount(r.released) },
                { key: 'utilized', label: 'Utilized', render: (r) => formatAmount(r.utilized) },
                { key: 'utilizationPct', label: 'Utilization', render: (r) => (
                  <span className="flex items-center gap-2">
                    <div className="h-1.5 w-28 rounded-full bg-ink-100">
                      <div className={`h-1.5 rounded-full ${r.utilizationPct >= 60 ? 'bg-leaf-500' : r.utilizationPct >= 30 ? 'bg-saffron-500' : 'bg-alert-500'}`} style={{ width: `${r.utilizationPct}%` }} />
                    </div>
                    <span className="font-mono text-[12px]">{r.utilizationPct}%</span>
                  </span>
                ) },
              ]}
              rows={ranked}
              keyField="departmentId"
            />
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Low Utilization" icon={AlertTriangle} subtitle="Departments with absorption below average — monitoring focus" />
          <CardBody className="p-0">
            <div className="space-y-2.5 p-4">
              {laggards.map((r) => (
                <div key={r.departmentId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink-900">{r.departmentName}</p>
                    <p className="text-[11.5px] text-ink-500">Released {formatAmount(r.released)} · Utilized {formatAmount(r.utilized)}</p>
                  </div>
                  <Badge tone={r.utilizationPct >= 30 ? 'saffron' : 'negative'}>{r.utilizationPct}%</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="District-wise Release" subtitle="Released amounts per district (₹ Cr)" icon={Sparkles} />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={districtRows.map((d) => ({ ...d, released: Math.round(d.released / 10000000 * 100) / 100 }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ed" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}Cr`} />
                <YAxis type="category" dataKey="districtName" width={86} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="released" fill="#e07a2c" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function PipelineTab() {
  const { store, projects, proposals } = useAnalyticsBase()

  const sanctionStage = [
    { name: 'Drafted', value: store.sanctions.filter((s) => s.status === 'drafted').length },
    { name: 'Escalated', value: store.sanctions.filter((s) => s.status === 'escalated').length },
    { name: 'Approved', value: store.sanctions.filter((s) => s.status === 'approved').length },
  ]
  const releaseStage = [
    { name: 'Drafted', value: store.fundReleases.filter((r) => r.status === 'drafted').length },
    { name: 'Approved', value: store.fundReleases.filter((r) => r.status === 'approved').length },
  ]
  const proposalStage = [
    { name: 'Submitted', value: proposals.filter((p) => p.status === 'submitted').length },
    { name: 'Under Review', value: proposals.filter((p) => ['under_review', 'recommended', 'delegated', 'forwarded'].includes(p.status)).length },
    { name: 'Escalated', value: proposals.filter((p) => p.status === 'escalated').length },
    { name: 'Returned', value: proposals.filter((p) => ['returned', 'clarification_required'].includes(p.status)).length },
    { name: 'Sanctioned', value: proposals.filter((p) => ['sanctioned', 'approved'].includes(p.status)).length },
  ]

  const statusCounts = Object.values(PROJECT_STATUS_LABELS).map((label) => {
    const key = Object.keys(PROJECT_STATUS_LABELS).find((k) => PROJECT_STATUS_LABELS[k] === label)
    return { name: label, value: projects.filter((p) => p.status === key).length }
  }).filter((s) => s.value > 0)

  const atRisk = projects.filter((p) => p.status === 'in_progress' && p.completionPct < 40).length
  const completed = projects.filter((p) => ['completed', 'closed'].includes(p.status)).length

  return (
    <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader title="Sanction Pipeline" subtitle="Sanctions by stage — amount moves on approval" icon={FileCheck2} />
        <CardBody>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sanctionStage} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={(e) => `${e.name} ${e.value}`}>
                {sanctionStage.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Fund Release Pipeline" subtitle="Drafted vs approved releases" icon={HandCoins} />
        <CardBody>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={releaseStage} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={(e) => `${e.name} ${e.value}`}>
                {releaseStage.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Proposal Pipeline" subtitle="Project proposals by decision state" icon={GitBranch} />
        <CardBody>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={proposalStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ed" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Project Health" subtitle={`${atRisk} at risk · ${completed} completed · status mix`} icon={Network} />
        <CardBody>
          {statusCounts.length === 0 ? (
            <EmptyState icon={Network} title="No projects registered" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name} ${e.value}`}>
                  {statusCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="In-flight Projects" subtitle="Progress of active implementations" icon={Network} />
        <CardBody className="p-0">
          {projects.filter((p) => ['in_progress', 'proposed', 'under_review'].includes(p.status)).length === 0 ? (
            <EmptyState icon={Network} title="No in-flight projects" />
          ) : (
            <DataTable
              columns={[
                { key: 'id', label: 'Project', render: (r) => <span className="font-mono text-[11.5px]">{r.id}</span> },
                { key: 'name', label: 'Name' },
                { key: 'status', label: 'Status', render: (r) => <Badge tone={PROJECT_STATUS_TONE[r.status]}>{PROJECT_STATUS_LABELS[r.status] || r.status}</Badge> },
                { key: 'completionPct', label: 'Completion', render: (r) => (
                  <span className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-ink-100">
                      <div className={`h-1.5 rounded-full ${r.completionPct >= 60 ? 'bg-leaf-500' : r.completionPct >= 30 ? 'bg-saffron-500' : 'bg-alert-500'}`} style={{ width: `${Math.min(100, r.completionPct)}%` }} />
                    </div>
                    <span className="font-mono text-[12px]">{r.completionPct}%</span>
                  </span>
                ) },
                { key: 'utilizedAmount', label: 'Utilized', render: (r) => formatAmount(r.utilizedAmount) },
              ]}
              rows={projects.filter((p) => ['in_progress', 'proposed', 'under_review'].includes(p.status))}
              keyField="id"
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function SchemesTab() {
  const { store, master, fy, setFy } = useAnalyticsBase()
  const schemeRows = useMemo(() => schemePositions({ fy, schemes: master.schemes, ...store }), [fy, master.schemes, store])
  const ranked = [...schemeRows].sort((a, b) => (b.utilizationPct ?? -1) - (a.utilizationPct ?? -1))

  return (
    <div className="mt-5 space-y-4">
      <FilterStrip className="mb-5">
        <span className="text-[12.5px] font-semibold text-ink-700">Scheme-wise financial movement</span>
        <Select small value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
      </FilterStrip>

      <Card>
        <CardHeader title="Scheme-wise Sanction → Release → Utilization" subtitle="Absorption of released funds per scheme (₹ Cr)" icon={Wallet} />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ranked.map((r) => ({ ...r, sanctioned: Math.round(r.sanctioned / 10000000 * 100) / 100, released: Math.round(r.released / 10000000 * 100) / 100, utilized: Math.round(r.utilized / 10000000 * 100) / 100 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ed" />
              <XAxis dataKey="schemeName" tick={{ fontSize: 10 }} interval={0} angle={-20} height={60} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}Cr`} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sanctioned" fill="#0b3558" radius={[3, 3, 0, 0]} />
              <Bar dataKey="released" fill="#e07a2c" radius={[3, 3, 0, 0]} />
              <Bar dataKey="utilized" fill="#1f7a54" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Scheme Register" subtitle="All figures in ₹" icon={Sparkles} />
        <CardBody className="p-0">
          {ranked.length === 0 ? (
            <EmptyState icon={Sparkles} title="No scheme records" />
          ) : (
            <DataTable
              columns={[
                { key: 'schemeId', label: 'Scheme', render: (r) => <span className="font-mono text-[11.5px]">{r.schemeId}</span> },
                { key: 'schemeName', label: 'Name' },
                { key: 'sanctioned', label: 'Sanctioned', render: (r) => formatAmount(r.sanctioned) },
                { key: 'released', label: 'Released', render: (r) => formatAmount(r.released) },
                { key: 'utilized', label: 'Utilized', render: (r) => formatAmount(r.utilized) },
                { key: 'utilizationPct', label: 'Utilization', render: (r) => r.utilizationPct === null ? <span className="text-ink-400">—</span> : <Badge tone={r.utilizationPct >= 60 ? 'positive' : r.utilizationPct >= 30 ? 'saffron' : 'negative'}>{r.utilizationPct}%</Badge> },
              ]}
              rows={ranked}
              keyField="schemeId"
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}
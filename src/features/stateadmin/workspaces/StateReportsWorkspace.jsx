// Reports & Exports workspace (P7).
// A catalog of report templates — each generates a live preview from the
// finance/governance/project stores and exports to CSV or JSON.
// Export requires report.export; viewing requires report.view.
import { useMemo, useState } from 'react'
import { FileText, FileDown, FileJson } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Select from '../../../components/ui/Select'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { useStateProjectStore } from '../store/stateProjectStore'
import { useGovernanceStore } from '../store/stateGovernanceStore'
import { departmentPositions, districtPositions } from '../selectors/financeSelectors'
import { useStatePermission } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { FINANCIAL_YEARS, DOCUMENT_TYPE_LABELS, PROJECT_STATUS_LABELS } from '../../../config/stateConstants'
import { formatAmount } from '../components/StateUI'
import Icon from '../../../components/ui/Icon'

const REPORT_DEFS = [
  { id: 'budget', title: 'Budget Position Report', icon: 'Landmark', description: 'Department-wise provision, authorization, sanction, release and available balance.' },
  { id: 'sanctions', title: 'Sanction Register', icon: 'FileCheck2', description: 'All financial sanctions with status and approving authority.' },
  { id: 'releases', title: 'Fund Release Register', icon: 'HandCoins', description: 'Approved and pending fund releases, backed by sanction numbers.' },
  { id: 'ledger', title: 'Financial Ledger', icon: 'BookOpenCheck', description: 'Every financial transaction in the ledger for the selected FY.' },
  { id: 'utilization', title: 'Utilization Report', icon: 'Gauge', description: 'Released vs utilized, department-wise absorption rates.' },
  { id: 'districts', title: 'District Allocation Report', icon: 'MapPin', description: 'District-wise allocation and release across departments.' },
  { id: 'projects', title: 'Project Registry Report', icon: 'FolderKanban', description: 'Registered projects with sanctioned amounts and completion.' },
  { id: 'proposals', title: 'Proposal Register Report', icon: 'GitBranch', description: 'Project proposals with decision state and workflow reference.' },
  { id: 'orders', title: 'Government Orders Report', icon: 'ScrollText', description: 'Orders with verification, signature and versioning status.' },
  { id: 'audit', title: 'Audit Trail Report', icon: 'BookMarked', description: 'Immutable event log with hash signatures.' },
]

const COLUMNS = {
  budget: [
    { key: 'name', label: 'Department' },
    { key: 'authorized', label: 'Authorized', render: (r) => formatAmount(r.authorized) },
    { key: 'allocated', label: 'Allocated', render: (r) => formatAmount(r.allocated) },
    { key: 'sanctioned', label: 'Sanctioned', render: (r) => formatAmount(r.sanctioned) },
    { key: 'released', label: 'Released', render: (r) => formatAmount(r.released) },
    { key: 'utilized', label: 'Utilized', render: (r) => formatAmount(r.utilized) },
    { key: 'available', label: 'Available', render: (r) => formatAmount(r.available) },
  ],
  sanctions: [
    { key: 'sanctionNo', label: 'Sanction No' },
    { key: 'department', label: 'Department' },
    { key: 'scheme', label: 'Scheme' },
    { key: 'amount', label: 'Amount', render: (r) => formatAmount(r.amount) },
    { key: 'goNumber', label: 'GO Ref' },
    { key: 'approvedBy', label: 'Approved By' },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'approved' ? 'positive' : r.status === 'escalated' ? 'warning' : 'neutral'}>{r.status}</Badge> },
  ],
  releases: [
    { key: 'releaseNo', label: 'Release No' },
    { key: 'sanctionId', label: 'Against Sanction' },
    { key: 'department', label: 'Department' },
    { key: 'amount', label: 'Amount', render: (r) => formatAmount(r.amount) },
    { key: 'approvedBy', label: 'Approved By' },
    { key: 'goNumber', label: 'GO Ref' },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'approved' ? 'positive' : 'neutral'}>{r.status}</Badge> },
  ],
  ledger: [
    { key: 'txId', label: 'Tx ID' },
    { key: 'type', label: 'Type', render: (r) => <Badge tone="neutral">{r.type}</Badge> },
    { key: 'referenceNo', label: 'Reference' },
    { key: 'amount', label: 'Amount', render: (r) => formatAmount(r.amount) },
    { key: 'sign', label: 'Side', render: (r) => (r.sign > 0 ? 'Credit' : 'Debit') },
    { key: 'department', label: 'Department' },
    { key: 'timestamp', label: 'Timestamp', render: (r) => formatDateTime(r.timestamp) },
  ],
  utilization: [
    { key: 'name', label: 'Department' },
    { key: 'released', label: 'Released', render: (r) => formatAmount(r.released) },
    { key: 'utilized', label: 'Utilized', render: (r) => formatAmount(r.utilized) },
    { key: 'pct', label: 'Utilization %', render: (r) => (r.pct === null ? '—' : `${r.pct}%`) },
    { key: 'flag', label: 'Flag', render: (r) => (r.pct === null ? '—' : r.pct < 30 ? <Badge tone="negative">Low</Badge> : r.pct < 60 ? <Badge tone="saffron">Watch</Badge> : <Badge tone="positive">Healthy</Badge>) },
  ],
  districts: [
    { key: 'name', label: 'District' },
    { key: 'allocated', label: 'Allocated', render: (r) => formatAmount(r.allocated) },
    { key: 'released', label: 'Released', render: (r) => formatAmount(r.released) },
  ],
  projects: [
    { key: 'id', label: 'Project ID' },
    { key: 'name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'cost', label: 'Estimated Cost', render: (r) => formatAmount(r.cost) },
    { key: 'sanctionedAmount', label: 'Sanctioned', render: (r) => (r.sanctionedAmount ? formatAmount(r.sanctionedAmount) : '—') },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.tone}>{PROJECT_STATUS_LABELS[r.status] || r.status}</Badge> },
    { key: 'completionPct', label: 'Completion', render: (r) => `${r.completionPct}%` },
  ],
  proposals: [
    { key: 'id', label: 'Proposal ID' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'department', label: 'Department' },
    { key: 'cost', label: 'Estimated Cost', render: (r) => formatAmount(r.cost) },
    { key: 'workflowId', label: 'Workflow' },
    { key: 'status', label: 'Status', render: (r) => <Badge tone="neutral">{PROJECT_STATUS_LABELS[r.status] || r.status}</Badge> },
  ],
  orders: [
    { key: 'orderNumber', label: 'Order No' },
    { key: 'type', label: 'Type', render: (r) => <Badge tone="neutral">{DOCUMENT_TYPE_LABELS[r.type] || r.type}</Badge> },
    { key: 'summary', label: 'Summary' },
    { key: 'amount', label: 'Amount', render: (r) => (r.amount ? formatAmount(r.amount) : '—') },
    { key: 'version', label: 'Version' },
    { key: 'verificationStatus', label: 'Verification', render: (r) => <Badge tone={r.verificationStatus === 'verified' ? 'positive' : 'warning'}>{r.verificationStatus}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'published' ? 'positive' : 'neutral'}>{r.status}</Badge> },
  ],
  audit: [
    { key: 'id', label: 'Event ID' },
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Entity' },
    { key: 'entityId', label: 'Entity ID' },
    { key: 'actor', label: 'Actor' },
    { key: 'timestamp', label: 'Timestamp', render: (r) => formatDateTime(r.timestamp) },
    { key: 'status', label: 'Status', render: (r) => <Badge tone="positive">{r.status}</Badge> },
  ],
}

export default function StateReportsWorkspace() {
  const [activeId, setActiveId] = useState('budget')
  const def = REPORT_DEFS.find((r) => r.id === activeId)
  return (
    <div className="px-6 pb-10">
      <PageHeader eyebrow="STATE ADMIN · MONITORING · REPORTS" title="Reports & Exports" description="Generate financial, governance and monitoring reports from live state data. Every report can be exported as CSV or JSON for downstream systems." />
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <div className="space-y-1.5">
          {REPORT_DEFS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveId(r.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${activeId === r.id ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-100 bg-white text-ink-700 hover:bg-ink-50'}`}
            >
              <Icon name={r.icon} size={15} className="shrink-0" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium leading-tight">{r.title}</span>
                <span className={`block text-[10.5px] leading-tight ${activeId === r.id ? 'text-ink-300' : 'text-ink-400'}`}>CSV · JSON export</span>
              </span>
            </button>
          ))}
        </div>
        <ReportPreview def={def} />
      </div>
    </div>
  )
}

function ReportPreview({ def }) {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const projects = useStateProjectStore((s) => s.projects)
  const proposals = useStateProjectStore((s) => s.proposals)
  const orders = useGovernanceStore((s) => s.orders)
  const pushToast = useUiStore((s) => s.pushToast)
  const canExport = useStatePermission('report.export')
  const [fy, setFy] = useState('2026-27')

  const { rows, columns } = useMemo(() => ({
    rows: run({ id: def.id, fy, store, master, projects, proposals, orders }),
    columns: COLUMNS[def.id],
  }), [def.id, fy, store, master, projects, proposals, orders])

  const downloadCSV = () => {
    const header = columns.map((c) => c.label).join(',')
    const lines = rows.map((r) => columns.map((c) => {
      const v = c.render ? stripTags(c.render(r)) : r[c.key]
      return `"${String(v ?? '').replace(/"/g, '""')}"`
    }).join(','))
    const blob = new Blob([`\uFEFF${[header, ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8' })
    triggerDownload(blob, `${def.id}-${fy}.csv`)
    pushToast(`${def.title} exported as CSV.`, 'success')
  }

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    triggerDownload(blob, `${def.id}-${fy}.json`)
    pushToast(`${def.title} exported as JSON.`, 'success')
  }

  return (
    <Card>
      <CardHeader
        title={def.title}
        subtitle={def.description}
        icon={() => <Icon name={def.icon} size={16} />}
        action={
          <div className="flex items-center gap-2">
            <Select small value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
            {canExport && (
              <>
                <Button size="sm" variant="outline" icon={FileDown} onClick={downloadCSV}>CSV</Button>
                <Button size="sm" variant="outline" icon={FileJson} onClick={downloadJSON}>JSON</Button>
              </>
            )}
          </div>
        }
      />
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <EmptyState icon={FileText} title="No records for this report" description="Try a different financial year or add records in the relevant workspace." />
        ) : (
          <DataTable columns={columns} rows={rows} keyField="__key" />
        )}
      </CardBody>
    </Card>
  )
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function stripTags(node) {
  if (node == null || typeof node === 'number' || typeof node === 'boolean') return String(node ?? '')
  if (typeof node === 'string') return node.replace(/<[^>]*>/g, '').trim()
  return ''
}

function run({ id, fy, store, master, projects, proposals, orders }) {
  const deptName = (d) => master.departments.find((x) => x.id === d)?.name || d || '—'
  const schemeName = (s) => master.schemes.find((x) => x.id === s)?.name || s || '—'
  let idx = 0
  const keyed = (row) => ({ __key: `row-${id}-${fy}-${idx++}`, ...row })

  if (id === 'budget') {
    return departmentPositions({ fy, departments: master.departments, ...store })
      .map((r) => keyed({ name: r.departmentName, authorized: r.authorized, allocated: r.allocated, sanctioned: r.sanctioned, released: r.released, utilized: r.utilized, available: r.remainToSanction }))
  }
  if (id === 'sanctions') {
    return store.sanctions.filter((s) => s.fy === fy).map((s) => keyed({ sanctionNo: s.sanctionNo, department: deptName(s.departmentId), scheme: schemeName(s.schemeId), amount: s.amount, goNumber: s.goNumber || '—', approvedBy: s.approvedBy || '—', status: s.status }))
  }
  if (id === 'releases') {
    return store.fundReleases.filter((r) => r.fy === fy).map((r) => keyed({ releaseNo: r.releaseNo, sanctionId: r.sanctionId || '—', department: deptName(r.departmentId), amount: r.amount, approvedBy: r.approvedBy || '—', goNumber: r.goNumber || '—', status: r.status }))
  }
  if (id === 'ledger') {
    return store.ledger.filter((l) => l.fy === fy).map((l) => keyed({ txId: l.txId, type: l.type, referenceNo: l.referenceNo || '—', amount: l.amount, sign: l.sign, department: deptName(l.departmentId), timestamp: l.timestamp }))
  }
  if (id === 'utilization') {
    return departmentPositions({ fy, departments: master.departments, ...store })
      .map((r) => keyed({ name: r.departmentName, released: r.released, utilized: r.utilized, pct: r.utilizationPct }))
  }
  if (id === 'districts') {
    return districtPositions({ fy, districts: master.districts, ...store })
      .map((r) => keyed({ name: r.districtName, allocated: r.allocated, released: r.released }))
  }
  if (id === 'projects') {
    return projects.map((p) => keyed({ id: p.id, name: p.name, department: deptName(p.departmentId), cost: p.estimatedCost, sanctionedAmount: p.sanctionedAmount ?? 0, status: p.status, tone: 'neutral', completionPct: p.completionPct }))
  }
  if (id === 'proposals') {
    return proposals.map((p) => keyed({ id: p.id, purpose: p.purpose, department: deptName(p.departmentId), cost: p.estimatedCost, workflowId: p.workflowId, status: p.status }))
  }
  if (id === 'orders') {
    return orders.filter((o) => o.fy === fy).map((o) => keyed({ orderNumber: o.orderNumber, type: o.type, summary: o.summary, amount: o.amount, version: `v${o.version}`, verificationStatus: o.verificationStatus, status: o.status }))
  }
  if (id === 'audit') {
    return store.auditLogs.slice(0, 500).map((a) => keyed({ id: a.id, action: a.action, entity: a.entity, entityId: a.entityId, actor: a.actor, timestamp: a.timestamp, status: a.status }))
  }
  return []
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
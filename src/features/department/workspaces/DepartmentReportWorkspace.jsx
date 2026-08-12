import { useMemo, useState } from 'react'
import { Download, FileDown, FileText } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { Card, CardBody } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { useCurrentUser } from '../identity/hooks/useAuthorization'
import { useAsync } from '../../../hooks/useAsync'
import { useDataVersion, DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { useUiStore } from '../../../app/store/uiStore'
import { backendReportApi } from '../../../api/reportApi'
import { backendDepartmentApi } from '../../../api/departmentApi'
import { formatDate } from '../../../utils/format'

const inputClass = 'w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500'

// Category choices are the backend's own (verified via serializer metadata);
// `type` values below are the generate-action vocabulary from guide §8.2.
const REPORT_TYPES = [
  { type: 'sla_audit', label: 'SLA Audit' },
  { type: 'asset_audit', label: 'Asset Audit' },
  { type: 'grievance', label: 'Grievance Log' },
  { type: 'workflow', label: 'Workflow Audit' },
]

const departmentPk = (user) => {
  const raw = (user && typeof user.department === 'object' && user.department) ? (user.department.id ?? user.department.departmentId) : (user?.department ?? user?.departmentId)
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export default function DepartmentReportWorkspace() {
  const { dept } = useDepartment()
  const user = useCurrentUser()
  const pushToast = useUiStore((s) => s.pushToast)
  const reportsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.REPORTS] || 0)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [downloadId, setDownloadId] = useState(null)
  const deptPk = useMemo(() => departmentPk(user), [user])

  const listFetcher = useMemo(() => () => backendReportApi.list(deptPk ? { department: deptPk } : {}), [deptPk])
  const { data: reports, loading, error, refetch } = useAsync(listFetcher, [deptPk, reportsVersion])

  const { data: departments } = useAsync(() => backendDepartmentApi.list(), [])

  const download = async (report) => {
    setDownloadId(report.id)
    setActionError(null)
    try {
      const { blob, filename } = await backendReportApi.download(report.id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename || `${report.code}.${(report.format || 'pdf').toLowerCase()}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      pushToast(`Report ${report.code} downloaded.`, 'success')
    } catch (e) { pushToast(`Download failed: ${e.message}`, 'error') } finally { setDownloadId(null) }
  }

  const generate = async (event) => {
    event.preventDefault()
    const payload = { type: reportType, department: Number(departmentId) }
    if (!payload.department || !Number.isFinite(payload.department)) { pushToast('Select a department.', 'error'); return }
    setGenerating(true)
    setActionError(null)
    try {
      const result = await backendReportApi.generate(payload)
      pushToast(`Report ${result.report.code} generated${result.message ? ` — ${result.message}` : ''}.`, 'success')
      setGenerateOpen(false)
    } catch (e) { setActionError(e) } finally { setGenerating(false) }
  }

  const [reportType, setReportType] = useState(REPORT_TYPES[0].type)
  const [departmentId, setDepartmentId] = useState(deptPk ? String(deptPk) : '')

  const columns = [
    { key: 'code', label: 'Report Code', render: (r) => <span className="kbd-mono text-[12px] font-bold text-ink-900">{r.code}</span> },
    { key: 'title', label: 'Report Title', render: (r) => <span className="font-semibold text-ink-900">{r.title}</span> },
    { key: 'category', label: 'Category', render: (r) => <Badge tone="info">{r.category}</Badge> },
    { key: 'departmentName', label: 'Department', render: (r) => r.departmentName || '—' },
    { key: 'generatedAt', label: 'Generated Date', render: (r) => <span className="font-mono text-[11.5px]">{r.generatedAt ? formatDate(r.generatedAt) : '—'}</span> },
    { key: 'size', label: 'Size', render: (r) => <span className="font-mono text-[11.5px] text-ink-500">{r.fileSize}</span> },
    {
      key: 'action',
      label: 'Download',
      render: (r) => (
        <Button size="xs" variant="outline" icon={Download} disabled={downloadId === r.id} onClick={() => download(r)}>
          {downloadId === r.id ? 'Downloading…' : `Export ${r.format || 'PDF'}`}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Report Center · ${dept.code}`}
        title={`${dept.label} Report Generation & Export Center`}
        description="Backend-generated SLA, asset, grievance and workflow audit reports."
        action={<Button size="sm" icon={FileDown} onClick={() => { setActionError(null); setGenerateOpen(true) }}>Generate On-Demand Report</Button>}
      />
      <div className="px-6">
        <div className="card">
          {error ? (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm text-red-700">{error.status === 401 || error.status === 403 ? 'You are not authorized to access report records.' : `Unable to load reports: ${error.message}`}</p>
              {error.status !== 401 && error.status !== 403 && <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>}
            </div>
          ) : loading && !reports ? (
            <p className="px-4 py-4 text-sm text-ink-500">Loading reports…</p>
          ) : (
            <DataTable columns={columns} rows={reports || []} emptyLabel="No reports generated yet" />
          )}
        </div>
      </div>
      <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate on-demand report" width="max-w-md" footer={<>
        <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
        <Button type="submit" form="report-generate" variant="positive" icon={FileText} disabled={generating}>{generating ? 'Generating…' : 'Generate report'}</Button>
      </>}>
        <form id="report-generate" onSubmit={generate} className="space-y-3">
          {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{actionError.message}</div>}
          <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Report type</label><select className={inputClass} value={reportType} onChange={(e) => setReportType(e.target.value)}>{REPORT_TYPES.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}</select></div>
          <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Department</label><select className={inputClass} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}><option value="">Select department</option>{(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <p className="text-xs text-ink-500">The backend issues the report code, title and format. Generated reports appear in the list above.</p>
        </form>
      </Modal>
    </div>
  )
}
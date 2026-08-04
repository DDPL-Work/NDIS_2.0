import { useState } from 'react'
import { FileDown, Download, Clock, ShieldCheck, Filter, FileText, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { useDepartment } from '../framework/DepartmentContext'
import { useUiStore } from '../../../app/store/uiStore'

export default function DepartmentReportWorkspace() {
  const { dept } = useDepartment()
  const pushToast = useUiStore((s) => s.pushToast)

  const [reportsList] = useState([
    { id: 'REP-001', name: `${dept.label} Monthly Sector SLA Audit`, type: 'SLA Audit', generatedAt: '2026-08-01', size: '2.4 MB', format: 'PDF' },
    { id: 'REP-002', name: `${dept.label} Asset Geotag Verification Log`, type: 'Asset Audit', generatedAt: '2026-08-03', size: '4.1 MB', format: 'CSV' },
    { id: 'REP-003', name: `${dept.label} Citizen Grievances & Resolution Summary`, type: 'Grievance Log', generatedAt: '2026-08-04', size: '1.8 MB', format: 'PDF' },
  ])

  function handleDownload(report) {
    pushToast(`Downloading ${report.name} (${report.format})…`, 'info')
  }

  const columns = [
    { key: 'id', label: 'Report Code', render: (r) => <span className="kbd-mono text-[12px] font-bold text-ink-900">{r.id}</span> },
    { key: 'name', label: 'Report Title', render: (r) => <span className="font-semibold text-ink-900">{r.name}</span> },
    { key: 'type', label: 'Category', render: (r) => <Badge tone="info">{r.type}</Badge> },
    { key: 'generatedAt', label: 'Generated Date', render: (r) => <span className="font-mono text-[11.5px]">{r.generatedAt}</span> },
    { key: 'size', label: 'Size', render: (r) => <span className="font-mono text-[11.5px] text-ink-500">{r.size}</span> },
    {
      key: 'action',
      label: 'Download',
      render: (r) => (
        <Button size="xs" variant="outline" icon={Download} onClick={() => handleDownload(r)}>
          Export {r.format}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Report Center · ${dept.code}`}
        title={`${dept.label} Report Generation & Export Center`}
        description="Generate on-demand spatial, asset, SLA, and workflow audit reports."
        action={
          <Button size="sm" icon={FileDown} onClick={() => pushToast('Generating Custom Sector Report…', 'info')}>
            Generate On-Demand Report
          </Button>
        }
      />

      <div className="px-6">
        <div className="card">
          <DataTable columns={columns} rows={reportsList} />
        </div>
      </div>
    </div>
  )
}

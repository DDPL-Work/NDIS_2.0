import { useState } from 'react'
import { FileText, ShieldCheck, Download, Upload, Eye, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { useDepartment } from '../framework/DepartmentContext'
import { useUiStore } from '../../../app/store/uiStore'

export default function DepartmentDocumentWorkspace() {
  const { dept } = useDepartment()
  const pushToast = useUiStore((s) => s.pushToast)

  const [documentsList] = useState([
    { id: 'DOC-101', name: `${dept.label} Sadar Hospital Calibration Certificate.pdf`, category: 'Inspection Reports', version: 'v1.4', geotagged: true, ocrStatus: 'Verified', signatureStatus: 'Digitally Signed' },
    { id: 'DOC-102', name: `${dept.label} Oxygen Plant Maintenance Directive.pdf`, category: 'Civil Surgeon Directives', version: 'v2.0', geotagged: true, ocrStatus: 'Verified', signatureStatus: 'Digitally Signed' },
  ])

  const columns = [
    { key: 'id', label: 'Doc Code', render: (r) => <span className="kbd-mono text-[12px] font-bold text-ink-900">{r.id}</span> },
    { key: 'name', label: 'Document Name', render: (r) => <span className="font-semibold text-ink-900">{r.name}</span> },
    { key: 'category', label: 'Category', render: (r) => <Badge tone="info">{r.category}</Badge> },
    { key: 'version', label: 'Version', render: (r) => <span className="font-mono text-[11.5px] text-ink-500">{r.version}</span> },
    { key: 'ocrStatus', label: 'OCR Status', render: (r) => <Badge tone="positive">{r.ocrStatus}</Badge> },
    { key: 'signatureStatus', label: 'Digital Sign', render: (r) => <span className="text-leaf-700 font-semibold text-[11.5px] flex items-center gap-1"><ShieldCheck size={13} /> {r.signatureStatus}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Document Repository · ${dept.code}`}
        title={`${dept.label} Geo-Tagged Document Library`}
        description="Geo-tagged documents, OCR verification, version history, and digital signatures."
        action={
          <Button size="sm" icon={Upload} onClick={() => pushToast('Simulating Document Upload & Geotag OCR scan…', 'info')}>
            Upload New Document
          </Button>
        }
      />

      <div className="px-6">
        <div className="card">
          <DataTable columns={columns} rows={documentsList} />
        </div>
      </div>
    </div>
  )
}

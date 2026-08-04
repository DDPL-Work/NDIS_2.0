import { useState } from 'react'
import { FileDown, FileText, FileSpreadsheet, Map as MapIcon } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useUiStore } from '../../app/store/uiStore'
import { analyticsApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { useAsync } from '../../hooks/useAsync'
import BudgetBarChart from '../../components/charts/BudgetBarChart'

const REPORT_TYPES = [
  { id: 'kpi-dashboard', label: 'District KPI dashboard', icon: FileText, format: 'PDF' },
  { id: 'facility-register', label: 'Facility register (all departments)', icon: FileSpreadsheet, format: 'Excel' },
  { id: 'proposal-audit', label: 'Proposal & approval audit trail', icon: FileText, format: 'PDF' },
  { id: 'gis-layers', label: 'GIS layer export', icon: MapIcon, format: 'GeoJSON' },
]

export default function AdminReports() {
  const user = useAuthStore((s) => s.user)
  const pushToast = useUiStore((s) => s.pushToast)
  const [busy, setBusy] = useState(null)
  const { data: budget } = useAsync(() => analyticsApi.getBudgetUtilization(user?.districtId), [user?.districtId])

  async function requestExport(id) {
    setBusy(id)
    await new Promise((r) => setTimeout(r, 1000))
    setBusy(null)
    pushToast('Export queued via svc-reporting — you will be notified when ready.', 'info')
  }

  return (
    <div>
      <PageHeader eyebrow="Admin Portal · FR-XC-03" title="Reports & exports" description="Multi-format reporting: PDF, Excel, CSV and GIS export of district dashboards." />
      <div className="px-6 pb-8 space-y-6">
        <Card>
          <CardHeader title="Budget utilization by department" subtitle="Sanctioned vs. utilized, current fiscal year" />
          <CardBody>{budget ? <BudgetBarChart data={budget} /> : <div className="h-64" />}</CardBody>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {REPORT_TYPES.map((r) => (
            <Card key={r.id}>
              <CardBody className="flex items-center gap-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-700"><r.icon size={17} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink-950">{r.label}</p>
                  <p className="text-[11.5px] text-ink-500">{r.format} export</p>
                </div>
                <Button size="sm" variant="outline" icon={FileDown} loading={busy === r.id} onClick={() => requestExport(r.id)}>Export</Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

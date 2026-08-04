import { Wrench, CheckCircle2, AlertTriangle } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { useProjectEngine } from '../../../app/store/projectEngine'
import { useUiStore } from '../../../app/store/uiStore'

export default function DepartmentMaintenanceWorkspace() {
  const { dept, maintenanceTasks, assets } = useDepartment()
  const completeMaintenance = useProjectEngine((s) => s.completeMaintenance)
  const pushToast = useUiStore((s) => s.pushToast)
  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[11px] font-bold">{r.id}</span> },
    { key: 'title', label: 'Task', render: (r) => <span className="font-semibold">{r.title}</span> },
    { key: 'assetId', label: 'Asset', render: (r) => assets.find((a) => a.id === r.assetId)?.name || r.assetId },
    { key: 'type', label: 'Type', render: (r) => <Badge tone={r.type === 'emergency' ? 'negative' : 'info'}>{r.type.toUpperCase()}</Badge> },
    { key: 'dueDate', label: 'Due', render: (r) => <span className="font-mono">{r.dueDate}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'completed' ? 'positive' : r.status === 'missed' ? 'negative' : 'warning'}>{r.status.toUpperCase()}</Badge> },
    { key: 'action', label: '', render: (r) => r.status !== 'completed' && !r.id.startsWith('MNT-BASE-') && <Button size="xs" icon={CheckCircle2} onClick={(e) => { e.stopPropagation(); completeMaintenance(r.id, 'Closed from maintenance scheduler.'); pushToast('Maintenance record completed.', 'success') }}>Complete</Button> },
  ]
  const missed = maintenanceTasks.filter((task) => task.status === 'missed').length
  return <div className="space-y-6 pb-8">
    <PageHeader eyebrow={`Asset Reliability · ${dept.code}`} title={`${dept.label} Maintenance Scheduler`} description="Preventive, corrective, emergency and predictive maintenance tasks generated from the asset lifecycle." />
    {missed > 0 && <div className="mx-6 p-3 rounded-xl border border-alert-200 bg-alert-50 text-alert-900 text-sm flex gap-2"><AlertTriangle size={17} /> {missed} maintenance task(s) missed their due date.</div>}
    <div className="px-6"><Card><CardHeader title="Maintenance Work Queue" subtitle="Lifecycle-driven service commitments" icon={Wrench} /><CardBody className="!p-0"><DataTable columns={columns} rows={maintenanceTasks} /></CardBody></Card></div>
  </div>
}

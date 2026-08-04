import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, Gauge, IndianRupee, PackageCheck, Plus, ReceiptText } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import StatCard from '../../../components/ui/StatCard'
import Tabs from '../../../components/ui/Tabs'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { useCurrentUser, useCan } from '../identity/hooks/useAuthorization'
import { useProjectEngine } from '../../../app/store/projectEngine'
import { formatCurrencyINR } from '../../../utils/format'

const inputClass = 'w-full rounded-lg border border-ink-200 px-3 py-2 text-sm'
const tabs = [{ value: 'projects', label: 'Running projects' }, { value: 'diary', label: 'Site diary' }, { value: 'measurements', label: 'Measurement book' }, { value: 'bills', label: 'Bills & payments' }, { value: 'risks', label: 'Risk center' }]

export default function DepartmentExecutionWorkspace() {
  const { dept, projects, workOrders, inspections, timelines, assets } = useDepartment()
  const user = useCurrentUser()
  const canWrite = useCan('projects.inspection') || useCan('projects.create')
  const executionLogs = useProjectEngine((s) => s.executionLogs)
  const measurementBooks = useProjectEngine((s) => s.measurementBooks)
  const bills = useProjectEngine((s) => s.bills)
  const recordDailyProgress = useProjectEngine((s) => s.recordDailyProgress)
  const recordMeasurement = useProjectEngine((s) => s.recordMeasurement)
  const recordBill = useProjectEngine((s) => s.recordBill)
  const completeProject = useProjectEngine((s) => s.completeProject)
  const [tab, setTab] = useState('projects')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ projectId: '', progress: '', labour: '', materials: '', workItem: '', estimatedQuantity: '', executedQuantity: '', amount: '', remarks: '' })
  const projectIds = new Set(projects.map((item) => item.id))
  const logs = executionLogs.filter((item) => projectIds.has(item.projectId))
  const entries = measurementBooks.filter((item) => projectIds.has(item.projectId))
  const projectBills = bills.filter((item) => projectIds.has(item.projectId))
  const nameFor = (id) => projects.find((item) => item.id === id)?.title || id
  const summary = useMemo(() => ({
    running: projects.filter((item) => item.status !== 'completed').length,
    completed: projects.filter((item) => item.status === 'completed').length,
    due: inspections.filter((item) => item.status === 'scheduled').length,
    utilized: projects.reduce((sum, item) => sum + (item.budgetUtilized || 0), 0),
  }), [projects, inspections])
  const reset = () => setForm({ projectId: '', progress: '', labour: '', materials: '', workItem: '', estimatedQuantity: '', executedQuantity: '', amount: '', remarks: '' })
  const submit = (event) => {
    event.preventDefault()
    const payload = { ...form, projectId: form.projectId || selected?.id, departmentId: dept.id, actor: user?.name }
    if (!payload.projectId) return
    if (modal === 'diary') recordDailyProgress(payload)
    if (modal === 'measurement') recordMeasurement(payload)
    if (modal === 'bill') recordBill({ ...payload, amount: Number(payload.amount || 0) })
    setModal(null); reset()
  }
  const projectColumns = [
    { key: 'id', label: 'Project ID' },
    { key: 'title', label: 'Project', render: (row) => <span className="font-semibold text-ink-950">{row.title}</span> },
    { key: 'progress', label: 'Progress', render: (row) => <span className="font-semibold text-leaf-700">{row.progress}%</span> },
    { key: 'budget', label: 'Budget', render: (row) => formatCurrencyINR(row.budgetSanctioned) },
    { key: 'status', label: 'Status', render: (row) => <Badge tone={row.status === 'completed' ? 'positive' : 'info'}>{row.status}</Badge> },
    { key: 'risk', label: 'Risk', render: (row) => <Badge tone={row.risk === 'high' ? 'negative' : row.risk === 'medium' ? 'warning' : 'positive'}>{row.risk}</Badge> },
  ]
  const content = {
    projects: <><CardHeader title="Sanctioned execution pipeline" subtitle="Projects originate only from DM-approved DPRs" icon={Gauge} /><CardBody className="!p-0"><DataTable rows={projects} columns={projectColumns} onRowClick={setSelected} /></CardBody></>,
    diary: <><CardHeader title="Daily site diary" subtitle="Engineer notes, labour, materials and GPS-ready progress" icon={FileText} action={canWrite && <Button size="sm" icon={Plus} onClick={() => setModal('diary')}>Add log</Button>} /><CardBody className="!p-0"><DataTable rows={logs} columns={[{ key: 'recordedAt', label: 'Recorded', render: (row) => new Date(row.recordedAt).toLocaleString() }, { key: 'projectId', label: 'Project', render: (row) => nameFor(row.projectId) }, { key: 'progress', label: 'Progress', render: (row) => `${row.progress}%` }, { key: 'labour', label: 'Labour' }, { key: 'materials', label: 'Material' }, { key: 'remarks', label: 'Remarks' }]} emptyLabel="No site diary entries" /></CardBody></>,
    measurements: <><CardHeader title="Government measurement book" subtitle="Quantity evidence awaiting verification" icon={PackageCheck} action={canWrite && <Button size="sm" icon={Plus} onClick={() => setModal('measurement')}>MB entry</Button>} /><CardBody className="!p-0"><DataTable rows={entries} columns={[{ key: 'date', label: 'Date' }, { key: 'projectId', label: 'Project', render: (row) => nameFor(row.projectId) }, { key: 'workItem', label: 'Work item' }, { key: 'estimatedQuantity', label: 'Estimated' }, { key: 'executedQuantity', label: 'Executed' }, { key: 'verified', label: 'Verified', render: (row) => <Badge tone={row.verified ? 'positive' : 'warning'}>{row.verified ? 'Verified' : 'Pending'}</Badge> }]} emptyLabel="No measurement entries" /></CardBody></>,
    bills: <><CardHeader title="Bills & payments" subtitle="Running bills remain pending until verification" icon={ReceiptText} action={canWrite && <Button size="sm" icon={Plus} onClick={() => setModal('bill')}>Submit bill</Button>} /><CardBody className="!p-0"><DataTable rows={projectBills} columns={[{ key: 'id', label: 'Bill ID' }, { key: 'projectId', label: 'Project', render: (row) => nameFor(row.projectId) }, { key: 'amount', label: 'Amount', render: (row) => formatCurrencyINR(row.amount) }, { key: 'status', label: 'Status', render: (row) => <Badge tone="warning">{row.status.replace(/_/g, ' ')}</Badge> }]} emptyLabel="No running bills" /></CardBody></>,
    risks: <><CardHeader title="Execution risk center" subtitle="Schedule, budget and quality risk signals" icon={AlertTriangle} /><CardBody className="!p-0"><DataTable rows={projects.filter((item) => item.risk !== 'low' || item.delays?.length).map((item) => ({ ...item, signal: item.delays?.[0] || 'Monitor budget burn and inspection quality' }))} columns={[{ key: 'title', label: 'Project' }, { key: 'risk', label: 'Severity', render: (row) => <Badge tone={row.risk === 'high' ? 'negative' : 'warning'}>{row.risk}</Badge> }, { key: 'signal', label: 'Risk signal' }, { key: 'advice', label: 'Recommendation', render: () => 'Inspect site / control release' }]} emptyLabel="No material execution risks" /></CardBody></>,
  }[tab]
  return <div className="space-y-6 pb-8">
    <PageHeader eyebrow={`${dept.code} · Projects & Execution`} title="Government Project Execution ERP" description="Monitor sanctioned projects, field execution, quality, finances and asset handover." action={canWrite && <Button icon={Plus} onClick={() => setModal('diary')}>Daily progress</Button>} />
    <div className="px-6 grid grid-cols-2 gap-3 md:grid-cols-4"><StatCard label="Running projects" value={summary.running} icon={Gauge} tone="sky" /><StatCard label="Completed" value={summary.completed} icon={CheckCircle2} tone="leaf" /><StatCard label="Inspection due" value={summary.due} icon={ClipboardCheck} tone="saffron" /><StatCard label="Budget utilized" value={formatCurrencyINR(summary.utilized)} icon={IndianRupee} tone="ink" /></div>
    <div className="px-6"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>
    <div className="px-6"><Card>{content}</Card></div>
    <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title} width="max-w-2xl" footer={selected?.status !== 'completed' && canWrite ? <Button variant="positive" onClick={() => { completeProject(selected.id, user); setSelected(null) }}>Certify completion & handover</Button> : null}>
      {selected && <div className="space-y-4 text-sm"><div className="grid grid-cols-2 gap-3 rounded-xl bg-ink-50 p-4"><span>Proposal: <b>{selected.proposalId}</b></span><span>Contractor: <b>{selected.contractor}</b></span><span>Budget: <b>{formatCurrencyINR(selected.budgetSanctioned)}</b></span><span>Utilized: <b>{formatCurrencyINR(selected.budgetUtilized)}</b></span></div><div><b>Milestones</b>{selected.milestones.map((item) => <div key={item.title} className="mt-2 flex justify-between border-b border-ink-100 pb-2"><span>{item.title}</span><span>{item.progressPct}% · {item.status}</span></div>)}</div><div><b>Project timeline</b>{timelines.filter((item) => item.entityId === selected.id).slice(-5).map((item) => <p key={item.id} className="mt-1 text-xs text-ink-600">{new Date(item.at).toLocaleDateString()} · {item.details}</p>)}</div><p className="text-xs text-ink-500">{assets.filter((item) => item.projectId === selected.id).length} linked assets · {workOrders.filter((item) => item.projectId === selected.id).length} work orders</p></div>}
    </Modal>
    <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'diary' ? 'Record daily site progress' : modal === 'measurement' ? 'Measurement book entry' : 'Submit running bill'} footer={<Button form="execution-form" type="submit">Save record</Button>}>
      <form id="execution-form" onSubmit={submit} className="space-y-3"><select className={inputClass} value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select>{modal === 'diary' && <><input className={inputClass} type="number" placeholder="Physical progress %" value={form.progress} onChange={(event) => setForm({ ...form, progress: event.target.value })} /><input className={inputClass} placeholder="Labour deployed" value={form.labour} onChange={(event) => setForm({ ...form, labour: event.target.value })} /><input className={inputClass} placeholder="Materials consumed" value={form.materials} onChange={(event) => setForm({ ...form, materials: event.target.value })} /></>}{modal === 'measurement' && <><input className={inputClass} placeholder="Work item" value={form.workItem} onChange={(event) => setForm({ ...form, workItem: event.target.value })} /><input className={inputClass} placeholder="Estimated quantity" value={form.estimatedQuantity} onChange={(event) => setForm({ ...form, estimatedQuantity: event.target.value })} /><input className={inputClass} placeholder="Executed quantity" value={form.executedQuantity} onChange={(event) => setForm({ ...form, executedQuantity: event.target.value })} /></>}{modal === 'bill' && <input className={inputClass} type="number" placeholder="Bill amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />}<textarea className={inputClass} rows="3" placeholder="Remarks / observations" value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} /></form>
    </Modal>
  </div>
}

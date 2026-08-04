import { useState, useMemo } from 'react'
import {
  FolderGit2, ShieldAlert, CheckCircle2, TrendingUp, Eye, AlertTriangle, DollarSign
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import StatCard from '../../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { formatCurrencyINR } from '../../../utils/format'

export default function DepartmentProjectsWorkspace() {
  const { dept, projects, timelines, documents } = useDepartment()
  const [selectedProject, setSelectedProject] = useState(null)

  // Overall financial summary
  const summary = useMemo(() => {
    const totalBudget = projects.reduce((sum, p) => sum + p.budgetSanctioned, 0)
    const totalUtilized = projects.reduce((sum, p) => sum + p.budgetUtilized, 0)
    const avgProgress = projects.length
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0
    return { totalBudget, totalUtilized, avgProgress }
  }, [projects])

  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[11.5px] font-bold text-ink-900">{r.id}</span> },
    { key: 'title', label: 'Project Name', render: (r) => <span className="font-semibold text-ink-950 block truncate max-w-[220px]">{r.title}</span> },
    { key: 'progress', label: 'Progress', render: (r) => (
      <div className="flex items-center gap-2 w-28">
        <div className="h-2 w-full bg-ink-100 rounded-full overflow-hidden">
          <div className="h-full bg-leaf-600 rounded-full" style={{ width: `${r.progress}%` }} />
        </div>
        <span className="font-mono text-[11.5px] font-semibold">{r.progress}%</span>
      </div>
    )},
    { key: 'budgetSanctioned', label: 'Budget', render: (r) => <span className="font-mono">{formatCurrencyINR(r.budgetSanctioned)}</span> },
    { key: 'risk', label: 'Risk', render: (r) => <Badge tone={r.risk === 'low' ? 'positive' : r.risk === 'medium' ? 'warning' : 'negative'}>{r.risk.toUpperCase()}</Badge> },
    { key: 'action', label: 'View', render: (r) => (
      <Button size="xs" variant="outline" icon={Eye} onClick={(e) => { e.stopPropagation(); setSelectedProject(r) }}>
        Details
      </Button>
    )}
  ]

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow={`Project Infrastructure Pipeline · ${dept.code}`}
        title={`${dept.label} Capital Projects`}
        description="Monitor physical milestones, financial utilization rates, contractor delivery speed, and site inspections."
      />

      <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <StatCard label="Sanctioned Capital Pool" value={formatCurrencyINR(summary.totalBudget)} icon={DollarSign} tone="ink" sub={`${projects.length} Active Projects`} />
        <StatCard label="Expenditure Utilized" value={formatCurrencyINR(summary.totalUtilized)} icon={TrendingUp} tone="leaf" sub={`${Math.round((summary.totalUtilized / (summary.totalBudget || 1)) * 100)}% Utilization Rate`} />
        <StatCard label="Avg Completion Progress" value={`${summary.avgProgress}%`} icon={CheckCircle2} tone="sky" sub="Overall Execution State" />
      </div>

      <div className="px-6">
        <Card>
          <CardHeader title="Capital Project Pipeline Progress Ledger" subtitle="Interactive tracking and risk indicators" icon={FolderGit2} />
          <CardBody className="!p-0">
            <DataTable columns={columns} rows={projects} onRowClick={(row) => setSelectedProject(row)} />
          </CardBody>
        </Card>
      </div>

      {/* DETAIL MODAL */}
      <Modal open={!!selectedProject} onClose={() => setSelectedProject(null)} width="max-w-2xl">
        {selectedProject && (
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="kbd-mono text-[11px] font-bold text-ink-400">{selectedProject.id} (Promoted from Proposal)</span>
                <h3 className="text-base font-bold text-ink-950 mt-1">{selectedProject.title}</h3>
              </div>
              <Badge tone="positive">UNDER CONSTRUCTION</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[12.5px] bg-ink-50/50 p-4 rounded-xl border border-ink-100">
              <div>
                <span className="text-ink-400 block text-[11px] font-semibold uppercase">CONTRACTOR</span>
                <span className="font-bold text-ink-900">{selectedProject.contractor}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] font-semibold uppercase">CURRENT STAGE</span>
                <span className="font-bold text-ink-900 capitalize">{selectedProject.currentStage || selectedProject.status}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] font-semibold uppercase">LINKED PROPOSAL</span>
                <span className="font-mono text-ink-900 font-bold">{selectedProject.proposalId}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] font-semibold uppercase">RISK ASSESSMENT</span>
                <span className="font-semibold text-ink-900 capitalize flex items-center gap-1">
                  <ShieldAlert size={14} className={selectedProject.risk === 'low' ? 'text-leaf-600' : selectedProject.risk === 'medium' ? 'text-saffron-600' : 'text-alert-600'} />
                  {selectedProject.risk} Risk
                </span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] font-semibold uppercase">BUDGET ALLOCATION</span>
                <span className="font-mono text-ink-900 font-bold">{formatCurrencyINR(selectedProject.budgetSanctioned)}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] font-semibold uppercase">UTILIZED FUNDS</span>
                <span className="font-mono text-leaf-700 font-bold">{formatCurrencyINR(selectedProject.budgetUtilized)}</span>
              </div>
            </div>

            {/* Delay Warning */}
            {selectedProject.delays?.length > 0 && (
              <div className="p-3 bg-alert-50 border border-alert-200 text-alert-900 rounded-xl flex items-start gap-2 text-[12px]">
                <AlertTriangle className="text-alert-600 shrink-0 mt-0.5" size={16} />
                <div>
                  <span className="font-semibold">Site Delay Alert:</span>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-alert-800">
                    {selectedProject.delays.map((delay, idx) => <li key={idx}>{delay}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* Milestones stepper */}
            <div className="space-y-3">
              <span className="font-semibold text-ink-800 text-[12.5px]">Physical Milestones Checklist</span>
              <div className="border border-ink-100 rounded-xl divide-y divide-ink-100 bg-white">
                {selectedProject.milestones.map((m, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-[12.5px]">
                    <div className="flex items-center gap-2">
                      {m.status === 'completed' ? (
                        <CheckCircle2 size={16} className="text-leaf-600 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-ink-300 shrink-0" />
                      )}
                      <span className={m.status === 'completed' ? 'text-ink-500 line-through' : 'font-semibold text-ink-900'}>
                        {m.title}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-ink-600">{m.progressPct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[12.5px]">
              <div className="p-3 rounded-xl border border-ink-100 bg-ink-50/20">
                <span className="font-semibold text-ink-700 block">Total Work Orders</span>
                <span className="text-xl font-bold text-ink-900 block mt-1">{selectedProject.workOrderIds?.length || 0} Scheduled</span>
              </div>
              <div className="p-3 rounded-xl border border-ink-100 bg-ink-50/20">
                <span className="font-semibold text-ink-700 block">Field Audits Conducted</span>
                <span className="text-xl font-bold text-ink-900 block mt-1">{selectedProject.siteVisits || 0} Inspections</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
              <div className="border border-ink-100 rounded-xl p-3"><span className="font-semibold text-ink-800 block mb-2">Execution timeline & audit</span>{timelines.filter((item) => item.entityId === selectedProject.id).slice(-4).map((item) => <p key={item.id} className="py-1 border-t border-ink-50"><span className="font-mono text-ink-400">{new Date(item.at).toLocaleDateString()}</span> {item.details}</p>) || <p className="text-ink-400">No events recorded.</p>}</div>
              <div className="border border-ink-100 rounded-xl p-3"><span className="font-semibold text-ink-800 block mb-2">Project documents</span>{documents.filter((doc) => doc.projectId === selectedProject.id).map((doc) => <p key={doc.id} className="py-1 border-t border-ink-50">{doc.name} <span className="text-ink-400">{doc.category} · v{doc.version}</span></p>)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

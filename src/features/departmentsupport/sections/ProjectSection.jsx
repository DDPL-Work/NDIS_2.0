// Generic projects / DPR / budget section (§11, §13) — reuses the existing
// planning pipeline (proposals → negotiation → sanction → project execution)
// from the shared project engine, filtered to the department.  Nothing is
// created here; this section only reports what the workflow has recorded.
import { useMemo } from 'react'
import { FolderKanban, CircleDollarSign, FilePlus2 } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import Provenance from '../../admin/decisionDashboard/Provenance'
import { formatDateTime } from '../../../utils/format'

const stateTone = (state) => {
  if (['approved', 'sanctioned', 'completed', 'execution'].includes(state)) return 'positive'
  if (['draft', 'proposal'].includes(state)) return 'neutral'
  if (['rejected', 'cancelled'].includes(state)) return 'negative'
  return 'warning'
}

const formatINR = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0)

export default function ProjectSection({ departmentId, proposals, projects, budgets, loadedAt, onOpenWorkflow }) {
  const deptProposals = useMemo(() => (proposals || []).filter((p) => String(p.departmentId) === String(departmentId)), [proposals, departmentId])
  const deptProjects = useMemo(() => (projects || []).filter((p) => String(p.departmentId) === String(departmentId)), [projects, departmentId])
  const deptBudgets = useMemo(() => (budgets || []).filter((b) => String(b.departmentId) === String(departmentId)), [budgets, departmentId])

  const sanctionTotal = deptBudgets.reduce((sum, b) => sum + (Number(b.sanctioned) || Number(b.amount) || 0), 0)
  const releasedTotal = deptBudgets.reduce((sum, b) => sum + (Number(b.released) || 0), 0)
  const expenditureTotal = deptBudgets.reduce((sum, b) => sum + (Number(b.expenditure) || 0), 0)
  const executionTotal = deptProjects.reduce((sum, p) => sum + (Number(p.budgetSanctioned) || 0), 0)

  const pipelineCounts = useMemo(() => {
    const counts = {}
    deptProposals.forEach((p) => { counts[p.state] = (counts[p.state] || 0) + 1 })
    deptProjects.forEach((p) => { counts[p.status || 'planning'] = (counts[p.status || 'planning'] || 0) + 1 })
    return counts
  }, [deptProposals, deptProjects])

  return (
    <Card>
      <CardHeader
        title="Active projects / DPR / budget"
        subtitle="The shared proposal → negotiation → sanction → execution pipeline for this department."
        action={onOpenWorkflow ? <Button size="sm" variant="outline" icon={FilePlus2} onClick={onOpenWorkflow}>Open workflow</Button> : undefined}
      />
      <CardBody>
        {deptProposals.length === 0 && deptProjects.length === 0 && deptBudgets.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No proposals or projects recorded" description="This department has no pipeline records yet. Officers create proposals through the workflow; this section reports only real records." />
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge tone="neutral">Proposals: {deptProposals.length}</Badge>
              <Badge tone="neutral">Projects: {deptProjects.length}</Badge>
              {Object.entries(pipelineCounts).filter(([, count]) => count > 0).map(([state, count]) => (
                <Badge key={state} tone={stateTone(state)}>{state.replace(/_/g, ' ')}: {count}</Badge>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3 mb-4">
              <div className="rounded-lg border border-ink-100 p-3">
                <p className="text-[11px] uppercase tracking-wide text-ink-400 font-semibold">Sanctioned</p>
                <p className="text-lg font-display font-semibold text-ink-950 mt-0.5">{sanctionTotal + executionTotal ? formatINR(sanctionTotal + executionTotal) : '₹0'}</p>
              </div>
              <div className="rounded-lg border border-ink-100 p-3">
                <p className="text-[11px] uppercase tracking-wide text-ink-400 font-semibold">Released</p>
                <p className="text-lg font-display font-semibold text-ink-950 mt-0.5">{formatINR(releasedTotal)}</p>
              </div>
              <div className="rounded-lg border border-ink-100 p-3">
                <p className="text-[11px] uppercase tracking-wide text-ink-400 font-semibold">Expenditure</p>
                <p className="text-lg font-display font-semibold text-ink-950 mt-0.5">{formatINR(expenditureTotal)}</p>
              </div>
            </div>

            <div className="rounded-lg border border-ink-100 divide-y divide-ink-100 max-h-72 overflow-y-auto">
              {deptProposals.slice(0, 20).map((proposal) => (
                <div key={proposal.id} className="px-3 py-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink-900 truncate">{proposal.title}</p>
                    <p className="text-[11.5px] text-ink-500 truncate">{proposal.id} · {proposal.gisLocation?.address || 'no location'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={stateTone(proposal.state)}>{proposal.state}</Badge>
                    {proposal.financialEstimate && <p className="text-[11.5px] text-ink-500 mt-1">{formatINR(proposal.financialEstimate)}</p>}
                  </div>
                </div>
              ))}
              {deptProjects.slice(0, 20).map((project) => (
                <div key={project.id} className="px-3 py-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink-900 truncate">{project.title}</p>
                    <p className="text-[11.5px] text-ink-500 truncate">{project.id} · {project.village || 'no location'}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-ink-100 overflow-hidden"><div className="h-full rounded-full bg-leaf-500" style={{ width: `${project.progress || 0}%` }} /></div>
                      <span className="text-[10.5px] kbd-mono text-ink-500">{project.progress || 0}%</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={stateTone(project.status || project.currentStage)}>{project.status || project.currentStage}</Badge>
                    {project.budgetSanctioned && <p className="text-[11.5px] text-ink-500 mt-1">{formatINR(project.budgetSanctioned)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-3 pt-3 border-t border-ink-100">
          <Provenance
            source="GET /api/proposals/ · GET /api/projects/ · budget records (project engine)"
            definition="Pipeline records filtered by department id. Sanction/execution figures come from real proposal and project records; zero totals mean no records exist yet, not zero spend."
            updatedAt={loadedAt ? formatDateTime(loadedAt) : undefined}
          />
        </div>
      </CardBody>
    </Card>
  )
}
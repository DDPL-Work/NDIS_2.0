import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import StatCard from '../../../components/ui/StatCard'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { FolderGit2, Landmark, PieChart, Sparkles, TrendingUp, CheckCircle, XCircle, Brain, Eye } from 'lucide-react'
import { formatCurrencyINR, formatDateTime } from '../../../utils/format'
import { useProjectEngine } from '../../../app/store/projectEngine'
import { useUiStore } from '../../../app/store/uiStore'
import { DEPARTMENTS } from '../../../config/constants'

export default function MonitoringTab({ projects: initialProjects, schemes, budgetUtil }) {
  const pushToast = useUiStore((s) => s.pushToast)
  
  // Real-time state from project engine
  const proposals = useProjectEngine((s) => s.proposals)
  const activeProjects = useProjectEngine((s) => s.projects)
  const transitionProposal = useProjectEngine((s) => s.transitionProposal)

  const [selectedProposal, setSelectedProposal] = useState(null)
  const [aiReviewResult, setAiReviewResult] = useState(null)
  const [isAiReviewModalOpen, setIsAiReviewModalOpen] = useState(false)

  // Filter proposals that are pending collector review
  const pendingProposals = useMemo(() => {
    return proposals.filter(p => p.state === 'collector')
  }, [proposals])

  // Overall financial calculations from active projects
  const summaryMetrics = useMemo(() => {
    const totalBudget = activeProjects.reduce((sum, p) => sum + p.budgetSanctioned, 0)
    const totalUtilized = activeProjects.reduce((sum, p) => sum + p.budgetUtilized, 0)
    return {
      totalBudget,
      totalUtilized,
      count: activeProjects.length
    }
  }, [activeProjects])

  function handleApprove(proposalId) {
    const collector = { name: 'Dr. Ashok Kumar Sinha', role: 'district_collector' }
    transitionProposal(proposalId, 'approved', collector, 'Approved for District allocation.')
    pushToast(`Proposal approved! Promoted to active project under construction.`, 'success')
    setSelectedProposal(null)
  }

  function handleReject(proposalId) {
    const collector = { name: 'Dr. Ashok Kumar Sinha', role: 'district_collector' }
    transitionProposal(proposalId, 'draft', collector, 'Returned to draft by District Collector.')
    pushToast(`Proposal returned to department.`, 'warning')
    setSelectedProposal(null)
  }

  function handleGenerateAiReview(proposal) {
    // Mock AI analysis (Module 13 & 14)
    const benefits = proposal.population > 20000 ? 'High population impact' : 'Localized sector upgrade'
    const budgetRisk = proposal.financialEstimate > 10000000 ? 'Requires close engineering audits' : 'Low budgetary risk'
    
    setAiReviewResult({
      id: proposal.id,
      title: proposal.title,
      summary: `AI feasibility check: OK. Suggested scheme mapping '${proposal.schemeMapping || 'District Grant'}' is optimal. ${benefits}. Cost metrics align with standard Bihar BOQ rates. Recommendation: APPROVE.`,
      score: 94,
      riskAnalysis: `Risk level is ${proposal.risk.toUpperCase()}. ${budgetRisk}.`
    })
    setIsAiReviewModalOpen(true)
  }

  const pendingColumns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[11px] font-bold text-ink-900">{r.id}</span> },
    { key: 'title', label: 'Proposal Title', render: (r) => <span className="font-semibold text-ink-950 block truncate max-w-[180px]">{r.title}</span> },
    { key: 'departmentId', label: 'Department', render: (r) => {
      const d = DEPARTMENTS.find(dept => dept.id === r.departmentId)
      return <Badge tone={d?.accent || 'info'}>{d?.label || r.departmentId}</Badge>
    }},
    { key: 'financialEstimate', label: 'Est. Cost', render: (r) => <span className="font-mono">{formatCurrencyINR(r.financialEstimate)}</span> },
    { key: 'action', label: 'DM Actions', render: (r) => (
      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button size="xs" variant="outline" icon={Eye} onClick={() => setSelectedProposal(r)}>Review</Button>
        <Button size="xs" tone="leaf" icon={CheckCircle} onClick={() => handleApprove(r.id)}>Approve</Button>
      </div>
    )}
  ]

  const projectColumns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[11px] font-bold text-ink-900">{r.id}</span> },
    { key: 'title', label: 'Project Name', render: (r) => <span className="font-semibold text-ink-900 block truncate max-w-[200px]">{r.title}</span> },
    { key: 'progress', label: 'Progress', render: (r) => (
      <div className="flex items-center gap-1.5 w-24">
        <div className="h-1.5 w-full bg-ink-150 rounded-full overflow-hidden">
          <div className="h-full bg-leaf-600 rounded-full" style={{ width: `${r.progress}%` }} />
        </div>
        <span className="font-mono text-[11px] font-bold text-ink-600">{r.progress}%</span>
      </div>
    )},
    { key: 'budgetSanctioned', label: 'Budget', render: (r) => <span className="font-mono">{formatCurrencyINR(r.budgetSanctioned)}</span> },
    { key: 'risk', label: 'Risk', render: (r) => <Badge tone={r.risk === 'low' ? 'positive' : r.risk === 'medium' ? 'warning' : 'negative'}>{r.risk.toUpperCase()}</Badge> },
  ]

  const schemeColumns = [
    { key: 'name', label: 'Scheme Flagship', render: (r) => <span className="font-semibold text-ink-900">{r.name}</span> },
    { key: 'coverage', label: 'Target Coverage', render: (r) => r.coverage },
    { key: 'progress', label: 'Implementation Progress', render: (r) => <span className="font-mono">{r.progress}%</span> },
    { key: 'issues', label: 'Pending Block Issues', render: (r) => <span className="text-alert-600 font-bold">{r.issues}</span> },
  ]

  return (
    <div className="space-y-6">
      {/* Collector/DM Pending Approval Queue */}
      {pendingProposals.length > 0 && (
        <Card className="border-saffron-300 bg-saffron-50/10">
          <CardHeader
            title="Pending Project Proposals for DM/Collector Review"
            subtitle="Review, run AI feasibility checks, and approve capital budget allocations"
            icon={Landmark}
          />
          <CardBody className="!p-0">
            <DataTable columns={pendingColumns} rows={pendingProposals} />
          </CardBody>
        </Card>
      )}

      {/* Budget Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <StatCard label="Sanctioned Development Fund" value={formatCurrencyINR(summaryMetrics.totalBudget + 250000000)} icon={Landmark} tone="ink" sub="FY 2026-27 Allocation" />
        <StatCard label="Utilized to Date" value={formatCurrencyINR(summaryMetrics.totalUtilized + 130000000)} icon={TrendingUp} tone="leaf" sub="Active Expenditure Velocity" />
        <StatCard label="Sanctioned Capital Projects" value={`${summaryMetrics.count} Projects`} icon={FolderGit2} tone="sky" sub="Under Active Construction" />
      </div>

      {/* Projects and Schemes list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Projects */}
        <Card>
          <CardHeader title="Capital Project Pipeline Progress" subtitle="Infrastructure monitoring & risk ledger" icon={FolderGit2} />
          <CardBody className="!p-0">
            <DataTable columns={projectColumns} rows={activeProjects} />
          </CardBody>
        </Card>

        {/* Schemes */}
        <Card>
          <CardHeader title="Centrally Sponsored Schemes Rollout" subtitle="Flagship implementation coverage & metrics" icon={Sparkles} />
          <CardBody className="!p-0">
            <DataTable columns={schemeColumns} rows={schemes} />
          </CardBody>
        </Card>
      </div>

      {/* Budget Allocation Chart */}
      <Card>
        <CardHeader title="Department Fund Sanction vs Utilization" subtitle="Real-time fiscal monitoring console" icon={PieChart} />
        <CardBody>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={budgetUtil}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
              <XAxis dataKey="departmentId" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="sanctioned" fill="#1d7ab5" name="Sanctioned (INR)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="utilized" fill="#1f7a54" name="Utilized (INR)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* DETAILED PROPOSAL REVIEW MODAL */}
      <Modal open={!!selectedProposal} onClose={() => setSelectedProposal(null)} width="max-w-xl">
        {selectedProposal && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="kbd-mono text-[11px] font-bold text-ink-400">{selectedProposal.id}</span>
                <h3 className="text-base font-bold text-ink-950 mt-1">{selectedProposal.title}</h3>
              </div>
              <Badge tone="warning">COLLECTOR REVIEW</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[12.5px] bg-ink-50/50 p-3 rounded-xl border border-ink-150">
              <div>
                <span className="text-ink-400 block text-[11px]">FINANCIAL ESTIMATE</span>
                <span className="font-bold text-ink-900">{formatCurrencyINR(selectedProposal.financialEstimate)}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px]">TIMELINE</span>
                <span className="font-semibold text-ink-900">{selectedProposal.timeline}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px]">BENEFICIARY POPULATION</span>
                <span className="font-semibold text-ink-900">{selectedProposal.population.toLocaleString('en-IN')} citizens</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px]">RISK FACTOR</span>
                <Badge tone={selectedProposal.risk === 'low' ? 'positive' : 'warning'}>{selectedProposal.risk.toUpperCase()}</Badge>
              </div>
            </div>

            <div className="space-y-1.5 text-[12.5px]">
              <span className="font-semibold text-ink-800">Problem & Assessment</span>
              <p className="text-ink-600 bg-ink-50/30 p-2.5 rounded-lg border border-ink-100">{selectedProposal.needAssessment || selectedProposal.description}</p>
            </div>

            <div className="flex gap-2 justify-between border-t border-ink-100 pt-3">
              <Button size="sm" variant="outline" icon={Brain} tone="saffron" onClick={() => handleGenerateAiReview(selectedProposal)}>
                AI Feasibility Check
              </Button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" tone="alert" icon={XCircle} onClick={() => handleReject(selectedProposal.id)}>
                  Reject/Return
                </Button>
                <Button size="sm" tone="leaf" icon={CheckCircle} onClick={() => handleApprove(selectedProposal.id)}>
                  DM Approve
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* AI REVIEW MODAL */}
      <Modal open={isAiReviewModalOpen} onClose={() => setIsAiReviewModalOpen(false)} width="max-w-md">
        {aiReviewResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-saffron-600">
              <Brain size={20} />
              <h3 className="text-base font-bold text-ink-950">AI Feasibility Report</h3>
            </div>

            <div className="bg-saffron-50/30 border border-saffron-200 rounded-xl p-3.5 space-y-3 text-[12.5px]">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-ink-850">Feasibility Rating</span>
                <span className="font-mono text-base font-bold text-leaf-700">{aiReviewResult.score} / 100</span>
              </div>
              <p className="text-ink-700 leading-snug font-semibold">{aiReviewResult.summary}</p>
              <div className="pt-2 border-t border-saffron-100 text-[11.5px] text-ink-500">
                <span className="font-bold block mb-1">RISK AUDIT</span>
                {aiReviewResult.riskAnalysis}
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={() => setIsAiReviewModalOpen(false)}>Close Report</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

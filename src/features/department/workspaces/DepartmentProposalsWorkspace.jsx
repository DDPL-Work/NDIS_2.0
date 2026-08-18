import { useState, useMemo } from 'react'
import {
  ClipboardList, TrendingUp, Sparkles, Eye, Plus, Copy,
  CheckCircle, ArrowRight, X, AlertTriangle, HelpCircle, FileText
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { useUiStore } from '../../../app/store/uiStore'
import { useAsync } from '../../../hooks/useAsync'
import { useDataVersion, DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { backendProposalApi } from '../../../api/proposalApi'
import { BackendCapabilityError } from '../../../api/apiClient'
import { formatCurrencyINR, formatDateTime } from '../../../utils/format'

const STATUS_TONE = {
  DRAFT_DPR: 'neutral',
  PENDING_REVIEW: 'warning',
  APPROVED: 'positive',
  SANCTIONED: 'positive',
  IN_EXECUTION: 'info',
  COMPLETED: 'positive',
  REJECTED: 'negative',
}

export default function DepartmentProposalsWorkspace() {
  const { dept, complaints } = useDepartment()
  const pushToast = useUiStore((s) => s.pushToast)

  const proposalsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.PROPOSALS] || 0)
  const { data: proposals, loading, error, refetch } = useAsync(
    () => backendProposalApi.list({ department: dept.id }),
    [dept.id, proposalsVersion],
  )

  const [selectedProposal, setSelectedProposal] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    needAssessment: '',
    problemStatement: '',
    objectives: '',
    expectedOutcomes: '',
    financialEstimate: '',
    timeline: '3 Months',
    risk: 'low',
    priority: 'medium',
    beneficiary: '',
    population: '',
    schemeMapping: '',
    address: '',
    latitude: '',
    longitude: '',
  })

  // AI Gap analysis trigger (derived from live complaints)
  const recurringComplaints = useMemo(() => {
    return complaints.filter(c => c.state === 'escalated' || c.priority === 'urgent')
  }, [complaints])

  const showAiDraftOption = recurringComplaints.length >= 1

  async function handleCreate(e) {
    e.preventDefault()
    if (!formData.title || !formData.financialEstimate) {
      pushToast('Please fill all mandatory fields.', 'error')
      return
    }
    try {
      await backendProposalApi.create({
        title: formData.title,
        department: dept.id,
        description: formData.description,
        need_assessment: formData.needAssessment,
        problem_statement: formData.problemStatement,
        objectives: formData.objectives,
        expected_outcomes: formData.expectedOutcomes,
        estimated_cost: Number(formData.financialEstimate),
        estimated_timeline: formData.timeline,
        risk_level: formData.risk,
        priority: formData.priority,
        population_impact: Number(formData.population || 0),
        village: formData.address,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
      })
      pushToast('Proposal draft saved on the backend.', 'success')
      setIsCreateModalOpen(false)
      resetForm()
    } catch (e) {
      pushToast(`Draft failed: ${e.message}`, 'error')
    }
  }

  function handleAiAutoDraft() {
    if (recurringComplaints.length === 0) return
    const primaryIssue = recurringComplaints[0]
    setFormData({
      title: `Preventive Asset Reconstruction: ${primaryIssue.categoryName} mitigation at ${primaryIssue.location.village}`,
      description: `Preventive replacement and capacity upgrade project initiated by AI Recommendation to address recurring failures (${primaryIssue.ticketNumber}).`,
      needAssessment: `Recurring citizen reports in ${primaryIssue.location.block} show a critical deficit in current infrastructural capacity.`,
      problemStatement: `Citizen complaint ${primaryIssue.id} reports: "${primaryIssue.description}".`,
      objectives: `Resolve and permanently upgrade the target utility infrastructure in ${primaryIssue.location.village}.`,
      expectedOutcomes: `Eliminate recurring failures, decrease block downtime, improve localized service delivery.`,
      financialEstimate: '2500000',
      timeline: '2 Months',
      risk: 'medium',
      priority: 'high',
      beneficiary: `Residents of ${primaryIssue.location.village} block sector`,
      population: '1200',
      schemeMapping: 'District Capital Infrastructure Grant',
      address: primaryIssue.location.address,
      latitude: String(primaryIssue.location.position[1]),
      longitude: String(primaryIssue.location.position[0]),
    })
    setIsCreateModalOpen(true)
    pushToast('Auto-drafted proposal form from AI Gap Analysis!', 'success')
  }

  function handleDuplicate() {
    pushToast('Duplicating proposals is not supported by the backend (BACKEND GAP).', 'error')
  }

  async function handleSubmitForReview(pId) {
    try {
      await backendProposalApi.submit(pId)
      pushToast(`Proposal ${pId} submitted for review.`, 'success')
      setSelectedProposal(null)
    } catch (e) { pushToast(`Submission failed: ${e.message}`, 'error') }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      needAssessment: '',
      problemStatement: '',
      objectives: '',
      expectedOutcomes: '',
      financialEstimate: '',
      timeline: '3 Months',
      risk: 'low',
      priority: 'medium',
      beneficiary: '',
      population: '',
      schemeMapping: '',
      address: '',
      latitude: '',
      longitude: '',
    })
  }

  const columns = [
    { key: 'proposalId', label: 'ID', render: (r) => <span className="kbd-mono text-[11.5px] font-bold text-ink-900">{r.proposalId}</span> },
    { key: 'title', label: 'Title', render: (r) => <span className="font-semibold text-ink-950 block truncate max-w-[200px]">{r.title}</span> },
    { key: 'estimatedCost', label: 'Est. Cost', render: (r) => <span className="font-mono">{formatCurrencyINR(r.estimatedCost)}</span> },
    { key: 'priority', label: 'Priority', render: (r) => <Badge tone={r.priority === 'urgent' ? 'negative' : r.priority === 'high' ? 'warning' : 'info'}>{String(r.priority || '—').toUpperCase()}</Badge> },
    { key: 'status', label: 'State', render: (r) => <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{r.statusDisplay || r.status || '—'}</Badge> },
    { key: 'action', label: 'Actions', render: (r) => (
      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button size="xs" variant="outline" icon={Eye} onClick={() => setSelectedProposal(r)}>View</Button>
        <Button size="xs" variant="outline" icon={Copy} onClick={handleDuplicate}>Dup</Button>
      </div>
    )}
  ]

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow={`Project Planning & Proposals · ${dept.code}`}
        title={`${dept.label} Proposals Engine`}
        description="Draft proposals on the backend, submit them for review, and track them along the district approval pipeline."
        action={
          <div className="flex gap-2">
            {showAiDraftOption && (
              <Button size="sm" variant="outline" tone="saffron" icon={Sparkles} onClick={handleAiAutoDraft}>
                AI Auto Draft
              </Button>
            )}
            <Button size="sm" icon={Plus} onClick={() => { resetForm(); setIsCreateModalOpen(true) }}>
              Create Proposal
            </Button>
          </div>
        }
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader title="Proposals Pipeline Ledger" subtitle="Live backend proposal register" icon={ClipboardList} />
            <CardBody className="!p-0">
              {error ? (
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="text-sm text-red-700">{error.status === 401 || error.status === 403 ? 'You are not authorized to access this proposal register.' : `Unable to load proposals: ${error.message}`}</p>
                  <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
                </div>
              ) : loading && !proposals ? (
                <p className="px-4 py-4 text-sm text-ink-500">Loading proposals…</p>
              ) : (
                <DataTable columns={columns} rows={proposals || []} emptyLabel="No proposals on the backend for this department" onRowClick={(row) => setSelectedProposal(row)} />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          {showAiDraftOption && (
            <Card className="border-saffron-200 bg-saffron-50/20">
              <CardHeader title="AI Preventive Recommendations" icon={Sparkles} />
              <CardBody className="text-[12px] space-y-3">
                <p className="text-ink-600 leading-snug">
                  AI has detected recurring issues in <span className="font-semibold">{dept.label}</span>. We recommend drafting a preventive reconstruction proposal.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-saffron-100 space-y-1">
                  <span className="font-semibold text-saffron-900 block truncate">{recurringComplaints[0].title}</span>
                  <p className="text-[11px] text-ink-500 truncate">{recurringComplaints[0].location.address}</p>
                </div>
                <Button size="xs" className="w-full" tone="saffron" onClick={handleAiAutoDraft}>
                  Auto-Draft Now
                </Button>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Proposal Workflow Stages" icon={FileText} />
            <CardBody className="text-[11.5px] space-y-2 text-ink-600 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-ink-800">
                <span>Draft DPR</span> <ArrowRight size={12} />
                <span>Pending Review</span> <ArrowRight size={12} />
                <span>Approved</span> <ArrowRight size={12} />
                <span>Sanctioned</span> <ArrowRight size={12} />
                <span>Execution</span>
              </div>
              <p>Submission moves the draft to the review queue; approval and sanction are decided on the backend by the competent authority.</p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Modal open={!!selectedProposal} onClose={() => setSelectedProposal(null)} width="max-w-2xl">
        {selectedProposal && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="kbd-mono text-[11px] font-bold text-ink-400">{selectedProposal.proposalId}</span>
                <h3 className="text-lg font-bold text-ink-950 mt-1">{selectedProposal.title}</h3>
              </div>
              <Badge tone={STATUS_TONE[selectedProposal.status] || 'neutral'}>{selectedProposal.statusDisplay || selectedProposal.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[12.5px] bg-ink-50/50 p-3 rounded-xl">
              <div>
                <span className="text-ink-400 block text-[11px]">FINANCIAL ESTIMATE</span>
                <span className="font-bold text-ink-900">{formatCurrencyINR(selectedProposal.estimatedCost)}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px]">TIMELINE</span>
                <span className="font-semibold text-ink-900">{selectedProposal.estimatedTimeline || '—'}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px]">TARGET POPULATION</span>
                <span className="font-semibold text-ink-900">{selectedProposal.populationImpact ? `${selectedProposal.populationImpact.toLocaleString('en-IN')} beneficiaries` : '—'}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px]">DEPARTMENT</span>
                <span className="font-semibold text-ink-900">{selectedProposal.departmentName || selectedProposal.departmentId || '—'}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[12.5px]">
              <span className="font-semibold text-ink-800">Problem Statement & Need</span>
              <p className="text-ink-600 bg-ink-50/30 p-2.5 rounded-lg border border-ink-100">{selectedProposal.problemStatement || selectedProposal.engineeringNotes || '—'}</p>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-ink-800 text-[12.5px]">Proposal Actions</span>
              <div className="flex gap-2">
                {selectedProposal.status === 'DRAFT_DPR' && (
                  <Button size="sm" icon={CheckCircle} onClick={() => handleSubmitForReview(selectedProposal.id)}>Submit for Review</Button>
                )}
                {selectedProposal.status !== 'DRAFT_DPR' && (
                  <p className="text-[11.5px] text-ink-500">Further stages (review, approval, sanction) are handled in the competent authority queue on the backend.</p>
                )}
              </div>
            </div>

            <div className="border-t border-ink-100 pt-3 space-y-1.5 text-[12px]">
              <span className="font-semibold text-ink-800 block">Review Trail</span>
              {selectedProposal.reviewNotes && (
                <p className="text-ink-600"><span className="text-ink-400">Review notes:</span> {selectedProposal.reviewNotes}</p>
              )}
              {selectedProposal.reviewedByName && (
                <p className="text-ink-600"><span className="text-ink-400">Reviewed by:</span> {selectedProposal.reviewedByName}{selectedProposal.reviewedAt ? ` · ${formatDateTime(selectedProposal.reviewedAt)}` : ''}</p>
              )}
              {selectedProposal.approvedByName && (
                <p className="text-ink-600"><span className="text-ink-400">Approved by:</span> {selectedProposal.approvedByName}{selectedProposal.approvedAt ? ` · ${formatDateTime(selectedProposal.approvedAt)}` : ''}</p>
              )}
              {!selectedProposal.reviewNotes && !selectedProposal.reviewedByName && !selectedProposal.approvedByName && (
                <p className="text-ink-500">No review activity recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE MODAL */}
      <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} width="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-ink-950">Draft New Infrastructure Proposal</h3>
            <button type="button" onClick={() => setIsCreateModalOpen(false)}><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label-text">PROPOSAL TITLE *</label>
              <input
                type="text"
                className="input-field"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Construction of Elevated Water Reservoir Silao"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label-text">PROJECT DESCRIPTION</label>
              <textarea
                rows={2}
                className="input-field"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of works, scope of procurement, and project details."
              />
            </div>

            <div>
              <label className="label-text">ESTIMATED FINANCIAL BUDGET (INR) *</label>
              <input
                type="number"
                className="input-field"
                required
                value={formData.financialEstimate}
                onChange={e => setFormData({ ...formData, financialEstimate: e.target.value })}
                placeholder="e.g. 3500000"
              />
            </div>

            <div>
              <label className="label-text">TIMELINE</label>
              <select
                className="input-field"
                value={formData.timeline}
                onChange={e => setFormData({ ...formData, timeline: e.target.value })}
              >
                <option value="1 Month">1 Month</option>
                <option value="2 Months">2 Months</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="12 Months">12 Months</option>
              </select>
            </div>

            <div>
              <label className="label-text">NEED ASSESSMENT</label>
              <input
                type="text"
                className="input-field"
                value={formData.needAssessment}
                onChange={e => setFormData({ ...formData, needAssessment: e.target.value })}
                placeholder="Why is this project required?"
              />
            </div>

            <div>
              <label className="label-text">SCHEME MAPPING</label>
              <input
                type="text"
                className="input-field"
                value={formData.schemeMapping}
                onChange={e => setFormData({ ...formData, schemeMapping: e.target.value })}
                placeholder="e.g. Jal Jeevan Mission"
              />
            </div>

            <div>
              <label className="label-text">RISK LEVEL</label>
              <select
                className="input-field"
                value={formData.risk}
                onChange={e => setFormData({ ...formData, risk: e.target.value })}
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            <div>
              <label className="label-text">PRIORITY</label>
              <select
                className="input-field"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="label-text">LATITUDE</label>
              <input
                type="text"
                className="input-field"
                value={formData.latitude}
                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g. 25.0294"
              />
            </div>

            <div>
              <label className="label-text">LONGITUDE</label>
              <input
                type="text"
                className="input-field"
                value={formData.longitude}
                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g. 85.4211"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Draft</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
// Approvals Page — Vol 3 §15.3 Workflow Approval Pipeline.
// Backend-driven: rows come from GET /api/proposals/ and decisions are the
// backend's own approve / reject / sanction actions (backend_guide2.1 §6.3).
// Phase 3: the "In execution" tab joins sanctioned DPRs with the execution
// projects the backend materialized for them (projectApi / projects list).
import { useEffect, useMemo, useState } from 'react'
import { Banknote, CheckCircle2, FolderGit2, Handshake, Info } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Tabs from '../../components/ui/Tabs'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import WorkflowStepper from '../../components/ui/WorkflowStepper'
import { useUiStore } from '../../app/store/uiStore'
import { useAsync } from '../../hooks/useAsync'
import { useDataVersion, DATA_SCOPES } from '../../app/store/dataVersionStore'
import { backendProposalApi } from '../../api/proposalApi'
import { backendProjectApi } from '../../api/projectApi'
import { backendDepartmentApi } from '../../api/departmentApi'
import { formatCurrencyINR, formatDate } from '../../utils/format'
import { getFinalSanctionAmount, isNegotiatedAgreement } from '../../utils/finance'

const TABS = [
  { value: 'under_review', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'execution', label: 'In execution' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All proposals' },
]

const TAB_STATUS = { under_review: 'PENDING_REVIEW', approved: 'APPROVED', execution: null, rejected: 'REJECTED', all: null }

const EXECUTION_STATUSES = ['SANCTIONED', 'IN_EXECUTION', 'COMPLETED']

// Legacy 8-stage stepper vocabulary — presentation only, the backend status
// is never rewritten. Statuses without a sensible stepper stage hide it.
const STEPPER_STATE = {
  DRAFT_DPR: 'draft',
  PENDING_REVIEW: 'under_review',
  APPROVED: 'under_review',
  SANCTIONED: 'budget_approved',
  IN_EXECUTION: 'tasked',
}

// Small presentational helpers for the detail workspace — render only the
// fields the backend actually returned; amounts parse safely, zero stays zero.
const orDash = (v) => (v === null || v === undefined || v === '' ? '—' : v)

const Section = ({ title, children }) => (
  <div>
    <div className="h-px bg-ink-100" />
    <h4 className="mt-2 mb-2 text-[12.5px] font-semibold text-ink-800">{title}</h4>
    {children}
  </div>
)

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10.5px] text-ink-400 uppercase tracking-wide">{label}</p>
    <p className="mt-0.5 text-[12.5px] font-medium text-ink-900">{orDash(value)}</p>
  </div>
)

const MoneyRow = ({ label, value, strong = false, tone }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2.5">
    <span className="text-[12px] text-ink-500">{label}</span>
    <span className={`${strong ? 'text-[14px] font-semibold text-ink-900' : 'text-[13px] font-medium'} ${tone === 'leaf' ? 'text-leaf-700' : 'text-ink-800'}`}>{orDash(value)}</span>
  </div>
)

// Role label only — never fabricates a person; "DM" from the backend renders
// as the role it stands for.
const proposerLabel = (name) => (!name ? '—' : /dm|magistrate|collector/i.test(String(name)) ? 'District Magistrate' : String(name))

export default function Approvals() {
  const pushToast = useUiStore((s) => s.pushToast)
  const [tab, setTab] = useState('under_review')
  const [deptFilter, setDeptFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [sanctionOpen, setSanctionOpen] = useState(false)
  const [sanctionAmount, setSanctionAmount] = useState('')
  const [busyAction, setBusyAction] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [negotiations, setNegotiations] = useState([])
  const [releases, setReleases] = useState([])
  const [negotiateOpen, setNegotiateOpen] = useState(false)
  const [negotiateMode, setNegotiateMode] = useState('COUNTER_OFFER')
  const [negotiateAmount, setNegotiateAmount] = useState('')
  const [negotiateTimeline, setNegotiateTimeline] = useState('')
  const [negotiateScope, setNegotiateScope] = useState('')
  const [negotiateRemarks, setNegotiateRemarks] = useState('')
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [releaseMode, setReleaseMode] = useState('INSTALLMENT')
  const [releaseTranche, setReleaseTranche] = useState('')
  const [releaseAmount, setReleaseAmount] = useState('')
  const [releaseRemarks, setReleaseRemarks] = useState('')
  const versions = useDataVersion((s) => (s.versions[DATA_SCOPES.PROPOSALS] || 0) + (s.versions[DATA_SCOPES.PLANNING] || 0))
  const projectsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.PROJECTS] || 0)

  const { data: departments } = useAsync(() => backendDepartmentApi.list(), [])
  const deptOptions = useMemo(() => [{ value: 'all', label: 'All departments' }, ...(departments || []).map((d) => ({ value: d.id, label: d.name }))], [departments])

  const status = TAB_STATUS[tab]
  const deptPk = deptFilter === 'all' ? undefined : Number(deptFilter)
  const fetcher = useMemo(() => () => backendProposalApi.list({ ...(status ? { status } : {}), ...(deptPk ? { departmentId: deptPk } : {}) }), [status, deptPk])
  const { data: proposals, loading, error, refetch } = useAsync(fetcher, [tab, deptPk, versions])
  const rows = useMemo(() => {
    const list = proposals || []
    return tab === 'execution' ? list.filter((p) => EXECUTION_STATUSES.includes(p.status)) : list
  }, [tab, proposals])

  // Execution tab joins sanctioned DPRs with their backend execution projects.
  const projectFetcher = useMemo(() => {
    if (tab !== 'execution') return async () => null
    return () => backendProjectApi.list(deptPk ? { departmentId: deptPk } : {})
  }, [tab, deptPk])
  const { data: executionProjects } = useAsync(projectFetcher, [tab, deptPk, projectsVersion])

  const projectByProposal = useMemo(() => {
    const map = new Map()
    ;(executionProjects || []).forEach((project) => {
      ;[project.proposalIdStr, String(project.proposalId || '')].filter(Boolean).forEach((key) => map.set(key, project))
    })
    return map
  }, [executionProjects])

  const linkedProject = (proposal) => projectByProposal.get(String(proposal.id)) || projectByProposal.get(proposal.proposalId) || null

// Proposal detail + negotiation & release history for the selected row — one
// detail request and one request per register, no polling, no loops. The
// detail response is authoritative (full DTO incl. agreed terms / clearances /
// attachments); the list row is used as a fallback while it loads.
  useEffect(() => {
    if (!selected) return
    let active = true
    setDetail(null)
    backendProposalApi.get(selected.id)
      .then((d) => active && setDetail(d))
      .catch(() => active && setDetail(null))
    backendProposalApi.negotiations(selected.id)
      .then((rows) => active && setNegotiations(rows || []))
      .catch(() => active && setNegotiations([]))
    backendProposalApi.releases(selected.id)
      .then((rows) => active && setReleases(rows || []))
      .catch(() => active && setReleases([]))
    return () => { active = false }
  }, [selected])

  const proposal = detail || selected

  // Round state — derived from backend negotiation records only. Open-round
  // detection is status-driven (backend status "OPEN"), with a response-marker
  // fallback for serializers that omit the status field. `proposed_by` values
  // come from the backend (verified "DM"/"dm"); the DM acts when the open round
  // was proposed by the department; a DM-proposed round waits on the department.
  const isOpenNegotiation = (n) => {
    const status = String(n?.status || '').trim().toUpperCase()
    return status ? status === 'OPEN' : !n?.respondedAt && !n?.responseRemarks
  }
  const openRound = useMemo(() => (negotiations || []).filter(isOpenNegotiation).sort((a, b) => (b.negotiationRound || 0) - (a.negotiationRound || 0))[0] || null, [negotiations])
  const waitingForDepartment = !!openRound && /dm|magistrate|collector/i.test(String(openRound.proposedByName ?? openRound.proposedBy ?? ''))
  const departmentResponse = useMemo(() => {
    const withResponse = (negotiations || []).filter((n) => n.responseRemarks || n.respondedByName).slice(-1)[0]
    if (withResponse) return withResponse
    if (openRound && !waitingForDepartment) return openRound
    return null
  }, [negotiations, openRound, waitingForDepartment])

  async function runAction(action, fn, okMessage) {
    setBusyAction(action)
    setActionError(null)
    try {
      await fn()
      pushToast(okMessage, 'success')
      const current = selected
      setSelected(null)
      setRemarks('')
      setSanctionOpen(false)
      setNegotiateOpen(false)
      setNegotiateAmount('')
      setNegotiateTimeline('')
      setNegotiateScope('')
      setNegotiateRemarks('')
      setReleaseTranche('')
      setReleaseAmount('')
      setReleaseRemarks('')
      if (current) {
        backendProposalApi.negotiations(current.id).then((rows) => setNegotiations(rows || [])).catch(() => {})
        backendProposalApi.releases(current.id).then((rows) => setReleases(rows || [])).catch(() => {})
      }
    } catch (e) {
      if (e.status === 409) {
        pushToast('This negotiation has changed since you opened it. Refreshing the latest proposal…', 'warning')
        if (selected) {
          backendProposalApi.get(selected.id).then((d) => setDetail(d)).catch(() => {})
          backendProposalApi.negotiations(selected.id).then((rows) => setNegotiations(rows || [])).catch(() => {})
        }
      } else {
        setActionError(e)
      }
    } finally { setBusyAction(null) }
  }

  const approve = () => runAction('approve', () => backendProposalApi.approve(selected.id), `Proposal ${selected.proposalId} approved.`)
  const reject = () => {
    if (!remarks.trim()) { pushToast('Remarks are required to reject.', 'error'); return }
    runAction('reject', () => backendProposalApi.reject(selected.id, { review_notes: remarks.trim() }), `Proposal ${selected.proposalId} rejected.`)
  }
  const sanction = () => {
    const authoritativeAmount = getFinalSanctionAmount(proposal)
    if (!authoritativeAmount) { pushToast('Final accepted amount unavailable.', 'error'); return }
    const amount = Number(sanctionAmount)
    if (amount !== authoritativeAmount) { pushToast('Sanction amount must equal the authoritative final accepted amount.', 'error'); return }
    runAction('sanction', () => backendProposalApi.sanction(selected.id, { sanctioned_amount: amount }), `Proposal ${selected.proposalId} sanctioned.`)
  }
  const openNegotiation = (mode) => {
    setNegotiateMode(mode)
    setNegotiateAmount(mode === 'ACCEPT' && openRound?.proposedAmount ? String(openRound.proposedAmount) : '')
    setNegotiateTimeline(mode === 'ACCEPT' && openRound?.proposedTimelineDays ? String(openRound.proposedTimelineDays) : '')
    setNegotiateScope(mode === 'ACCEPT' && openRound?.proposedScope ? openRound.proposedScope : '')
    setNegotiateRemarks('')
    setNegotiateOpen(true)
  }
  const negotiate = () => {
    if (!selected) return
    const payload = { action: negotiateMode, remarks: negotiateRemarks.trim() }
    if (negotiateMode === 'COUNTER_OFFER') {
      if (negotiateAmount.trim() !== '') payload.proposed_amount = Number(negotiateAmount)
      if (negotiateTimeline.trim() !== '') payload.proposed_timeline_days = Number(negotiateTimeline)
      if (negotiateScope.trim() !== '') payload.proposed_scope = negotiateScope.trim()
    }
    runAction('negotiate', () => backendProposalApi.negotiate(selected.id, payload), `Negotiation response registered for ${selected.proposalId}.`)
  }
  const release = () => {
    const amount = Number(releaseAmount)
    if (!Number.isFinite(amount) || amount <= 0) { pushToast('Enter a valid release amount.', 'error'); return }
    const payload = { mode: releaseMode, amount, remarks: releaseRemarks.trim() }
    if (releaseMode === 'INSTALLMENT' && releaseTranche.trim() !== '') payload.tranche_number = Number(releaseTranche)
    runAction('release', () => backendProposalApi.release(selected.id, payload), `Release ${releaseMode} recorded for ${selected.proposalId}.`)
  }

  const columns = [
    { key: 'proposalId', label: 'ID', render: (r) => <span className="kbd-mono text-[12px]">{r.proposalId}</span> },
    { key: 'title', label: 'Proposal', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'dept', label: 'Department', render: (r) => r.departmentName || '—' },
    { key: 'amount', label: 'Requested', render: (r) => formatCurrencyINR(r.estimatedCost) },
    { key: 'delegation', label: 'Authority', render: (r) => (r.delegatedPowerNote ? <Badge tone="info">{r.delegatedPowerNote}</Badge> : '—') },
    { key: 'submittedAt', label: 'Submitted', render: (r) => (r.createdAt ? formatDate(r.createdAt) : '—') },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  const executionColumns = [
    { key: 'proposalId', label: 'ID', render: (r) => <span className="kbd-mono text-[12px]">{r.proposalId}</span> },
    { key: 'title', label: 'DPR', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'dept', label: 'Department', render: (r) => r.departmentName || '—' },
    { key: 'status', label: 'DPR status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'project', label: 'Linked project', render: (r) => { const project = linkedProject(r); return project ? <span className="font-medium text-ink-900">{project.title}</span> : '—' } },
    { key: 'projectStatus', label: 'Project status', render: (r) => { const project = linkedProject(r); return project ? <StatusBadge status={project.status} /> : '—' } },
    { key: 'progress', label: 'Progress', render: (r) => { const project = linkedProject(r); return project ? <span className="font-semibold text-leaf-700">{project.progress}%</span> : '—' } },
    { key: 'sanction', label: 'Sanction', render: (r) => { const project = linkedProject(r); return project?.sanctionOrder ? <Badge tone="info">{project.sanctionOrder}</Badge> : '—' } },
  ]

  const tableColumns = tab === 'execution' ? executionColumns : columns

  const isPending = selected?.status === 'PENDING_REVIEW'
  const isApproved = selected?.status === 'APPROVED'

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · FR-AP-03"
        title="Proposal approvals & delegation engine"
        description="Review, approve, reject or sanction line-department DPR proposals prepared in the Development Planning ERP."
        action={
          <Select
            value={deptFilter}
            onChange={setDeptFilter}
            options={deptOptions}
          />
        }
      />
      <div className="px-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <div className="p-6">
        <div className="card">
          {error ? (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm text-red-700">{error.message}</p>
              <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
            </div>
          ) : loading && !rows.length ? (
            <p className="px-4 py-4 text-sm text-ink-500">Loading proposals…</p>
          ) : (
            <DataTable columns={tableColumns} rows={rows} onRowClick={setSelected} emptyLabel="No proposals in this view" />
          )}
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setRemarks(''); setActionError(null) }}
        title={selected?.title}
        width="max-w-4xl"
        footer={
          isPending ? (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button variant="outline" icon={Handshake} loading={busyAction === 'negotiate'} onClick={() => openNegotiation('COUNTER_OFFER')}>Counter-Offer</Button>
              <Button variant="danger" loading={busyAction === 'reject'} onClick={reject}>Reject</Button>
              <Button variant="positive" loading={busyAction === 'approve'} onClick={approve}>Approve Proposal</Button>
            </>
          ) : selected?.status === 'UNDER_NEGOTIATION' ? (
            waitingForDepartment ? (
              <>
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                <Button variant="positive" icon={CheckCircle2} loading={busyAction === 'negotiate'} onClick={() => openNegotiation('ACCEPT')}>Accept Dept. Offer</Button>
                <Button variant="outline" icon={Handshake} loading={busyAction === 'negotiate'} onClick={() => openNegotiation('COUNTER_OFFER')}>Counter-Offer</Button>
                <Button variant="danger" loading={busyAction === 'negotiate'} onClick={() => openNegotiation('REJECT')}>Reject Dept. Offer</Button>
              </>
            )
          ) : isApproved ? (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              <Button variant="positive" disabled={!getFinalSanctionAmount(proposal)} loading={busyAction === 'sanction'} onClick={() => { setSanctionAmount(String(getFinalSanctionAmount(proposal))); setSanctionOpen(true) }}>Sanction Budget</Button>
            </>
          ) : EXECUTION_STATUSES.includes(selected?.status) ? (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              <Button variant="positive" icon={Banknote} onClick={() => { setReleaseAmount(''); setReleaseTranche(String((releases.length || 0) + 1)); setReleaseOpen(true) }}>Release Budget</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            {STEPPER_STATE[proposal.status] && (
              <div className="p-3 bg-ink-50/50 rounded-xl border border-ink-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1">Workflow Lifecycle Progress</p>
                <WorkflowStepper currentState={STEPPER_STATE[proposal.status]} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={proposal.status} />
              <span className="text-[12px] text-ink-500 kbd-mono">{proposal.proposalId}</span>
              {proposal.departmentName && <span className="text-[12px] text-ink-500">· {proposal.departmentName}</span>}
              {proposal.districtName && <span className="text-[12px] text-ink-500">· {proposal.districtName}</span>}
            </div>

            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-700">{actionError.message}</div>
            )}

            {/* Financial delegation note — issued by the backend */}
            {proposal.delegatedPowerNote ? (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-leaf-50 border border-leaf-200 text-[12.5px] text-leaf-800">
                <CheckCircle2 size={16} className="text-leaf-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Delegated authority</span>
                  <p className="text-[11.5px] text-leaf-700 mt-0.5">{proposal.delegatedPowerNote}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-ink-50 border border-ink-100 text-[12.5px] text-ink-600">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>The delegation note is issued by the backend once the DPR is costed.</span>
              </div>
            )}

            <Section title="Proposal Overview">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Field label="Proposal ID" value={proposal.proposalId} />
                <Field label="Title" value={proposal.title} />
                <Field label="Category" value={proposal.category} />
                <Field label="Department" value={proposal.departmentName} />
                <Field label="District" value={proposal.districtName} />
                <Field label="Block" value={proposal.block} />
                <Field label="Village" value={proposal.village} />
                <Field label="Ward" value={proposal.ward} />
                <Field label="Priority" value={proposal.priority} />
                <Field label="Funding Source" value={proposal.fundingSource} />
                <Field label="Created By" value={proposal.createdByName} />
                <Field label="Created" value={proposal.createdAt ? formatDate(proposal.createdAt) : '—'} />
                <Field label="Current Status" value={proposal.statusDisplay || proposal.status} />
                <Field label="Current Stage" value={proposal.stageDisplay || proposal.stage} />
              </div>
            </Section>

            <Section title="Need & Problem Statement">
              <p className="rounded-lg bg-ink-50/60 border border-ink-100 p-3 text-[12.5px] text-ink-700">{proposal.problemStatement || 'Not provided'}</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Gap Score" value={proposal.gapScore ?? '—'} />
                <Field label="Source Priority" value={proposal.sourcePriority || proposal.sourcePriorityId} />
                <Field label="Facility" value={proposal.facilityName || proposal.facilityId} />
                <Field label="Population Impact" value={proposal.populationImpact ?? '—'} />
                <Field label="Linked Complaints" value={proposal.linkedComplaintIds.length ? proposal.linkedComplaintIds.join(', ') : 'None'} />
              </div>
              {proposal.gapEvidence && <p className="mt-3 rounded-lg border border-sky-100 bg-sky-50/40 p-3 text-[12.5px] text-ink-700"><strong>Gap evidence:</strong> {proposal.gapEvidence}</p>}
              {proposal.recommendedAction && <p className="mt-2 text-[12.5px] text-ink-700"><strong>Recommended action:</strong> {proposal.recommendedAction}</p>}
            </Section>

            <Section title="Survey & Site Inspection">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Inspection Date" value={proposal.inspectionDate ? formatDate(proposal.inspectionDate) : '—'} />
                <Field label="Survey Team" value={proposal.surveyTeam} />
                <Field label="GIS Reference" value={proposal.gisReference} />
                <Field label="Latitude" value={proposal.latitude} />
                <Field label="Longitude" value={proposal.longitude} />
              </div>
              <p className="mt-2 text-[12.5px] text-ink-700">{proposal.inspectionNotes || 'Not provided'}</p>
            </Section>

            <Section title="Technical DPR">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Field label="Estimated Timeline" value={proposal.estimatedTimeline || '—'} />
                <Field label="Civil Works" value={formatCurrencyINR(proposal.civilWorks)} />
                <Field label="Equipment Cost" value={formatCurrencyINR(proposal.equipmentCost)} />
                <Field label="Electrical Cost" value={formatCurrencyINR(proposal.electricalCost)} />
                <Field label="Contingency Cost" value={formatCurrencyINR(proposal.contingencyCost)} />
                <Field label="Maintenance Cost" value={formatCurrencyINR(proposal.maintenanceCost)} />
              </div>
              <p className="mt-2 text-[12.5px] text-ink-700">{proposal.technicalScope || 'Not provided'}</p>
              {proposal.engineeringNotes && <p className="mt-1.5 text-[12.5px] text-ink-700">Engineering: {proposal.engineeringNotes}</p>}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-50 border border-ink-100 px-3 py-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Original Estimate</span>
                <span className="text-[14px] font-semibold text-ink-900">{formatCurrencyINR(proposal.estimatedCost)}</span>
              </div>
            </Section>

            <Section title="Financial Summary">
              <div className="rounded-lg border border-ink-100 divide-y divide-ink-100">
                <MoneyRow label="Original DPR Estimate (immutable)" value={formatCurrencyINR(proposal.estimatedCost)} />
                {isNegotiatedAgreement(proposal) && (
                  <>
                    <MoneyRow label="Negotiated Amount" value={formatCurrencyINR(proposal.agreedAmount)} strong tone="leaf" />
                    <MoneyRow label="Difference / Savings" value={proposal.estimatedCost > 0 ? formatCurrencyINR(proposal.estimatedCost - proposal.agreedAmount) : '—'} />
                  </>
                )}
                <MoneyRow label="Final Accepted Amount" value={getFinalSanctionAmount(proposal) ? formatCurrencyINR(getFinalSanctionAmount(proposal)) : 'Final accepted amount unavailable.'} strong />
                <MoneyRow label="Sanction Amount" value={proposal.sanctionAmount > 0 ? formatCurrencyINR(proposal.sanctionAmount) : 'Not sanctioned'} />
              </div>
              {isNegotiatedAgreement(proposal) && (
                <span className="mt-2 inline-block rounded-md bg-leaf-50 border border-leaf-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-leaf-800">Final Agreed Amount</span>
              )}
            </Section>

            {isPending && (
              <div>
                <label className="block text-[12px] font-medium text-ink-700 mb-1">Administrative Remarks (Mandatory to reject)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
                  placeholder="Enter approval remarks or reason for rejection…"
                />
              </div>
            )}

            <Section title="Sanction & Budget">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Sanction Amount" value={proposal.sanctionAmount > 0 ? formatCurrencyINR(proposal.sanctionAmount) : 'Not sanctioned'} />
                <Field label="Sanction Order" value={proposal.sanctionOrder} />
                <Field label="Budget Status" value={proposal.budgetStatus} />
                <Field label="Authority" value={proposal.approvalAuthority} />
              </div>
            </Section>

            {(isNegotiatedAgreement(proposal) || proposal.approvalMode === 'DIRECT') && (
              <Section title="Final Agreement">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Approval Mode" value={proposal.approvalMode} />
                  <Field label="Final Accepted Amount" value={getFinalSanctionAmount(proposal) ? formatCurrencyINR(getFinalSanctionAmount(proposal)) : 'Final accepted amount unavailable.'} />
                  <Field label="Agreed Timeline" value={proposal.agreedTimelineDays > 0 ? `${proposal.agreedTimelineDays} days` : '—'} />
                  <Field label="Agreed Scope" value={proposal.agreedScope || (isNegotiatedAgreement(proposal) ? 'Not specified' : '—')} />
                </div>
                {!isNegotiatedAgreement(proposal) && proposal.approvalMode === 'DIRECT' && (
                  <p className="mt-2 text-[12px] text-ink-500">Direct approval — no negotiation; the final amount is the original DPR estimate.</p>
                )}
              </Section>
            )}

            {(proposal.reviewNotes || proposal.reviewedByName || proposal.approvedByName) && (
              <Section title="Review Trail">
                {proposal.reviewNotes && (
                  <div className="mt-2 rounded-lg bg-alert-50 border border-alert-200 p-3 text-[12.5px] text-alert-700">
                    <strong className="block text-[11px] uppercase tracking-wide text-alert-800">Reviewer Note</strong>
                    {proposal.reviewNotes}
                    {proposal.reviewedByName && <span className="block mt-1 text-[11.5px] text-alert-600">— {proposal.reviewedByName}{proposal.reviewedAt ? `, ${formatDate(proposal.reviewedAt)}` : ''}</span>}
                  </div>
                )}
                {proposal.approvedByName && (
                  <div className="mt-2 rounded-lg bg-leaf-50 border border-leaf-200 p-3 text-[12.5px] text-leaf-800">
                    <strong className="block text-[11px] uppercase tracking-wide text-leaf-700">Approved</strong>
                    {proposal.approvedByName}{proposal.approvedAt ? `, ${formatDate(proposal.approvedAt)}` : ''}
                  </div>
                )}
              </Section>
            )}

            {proposal.status === 'UNDER_NEGOTIATION' && (
              <Section title="Negotiation & Department Decision">
                {waitingForDepartment ? (
                  <p className="rounded-lg border border-saffron-200 bg-saffron-50 p-3 text-[12.5px] text-saffron-800">Your counter-offer (round {openRound?.negotiationRound || '—'}) is open on the backend — waiting for the department's decision. Their response will appear here.</p>
                ) : departmentResponse ? (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-[12.5px]">
                    <strong className="block text-[11px] uppercase tracking-wide text-sky-800">Department Decision</strong>
                    <p className="mt-1 font-semibold text-ink-900">{departmentResponse.action || '—'}{departmentResponse.respondedByName && <span className="font-medium text-ink-500"> · by {departmentResponse.respondedByName}</span>}</p>
                    {(departmentResponse.responseRemarks || departmentResponse.remarks) && <p className="mt-1 text-ink-700">Remarks: {departmentResponse.responseRemarks || departmentResponse.remarks}</p>}
                    {departmentResponse.proposedAmount > 0 && <p className="text-ink-700">Proposed amount: <strong>{formatCurrencyINR(departmentResponse.proposedAmount)}</strong></p>}
                    {departmentResponse.proposedTimelineDays > 0 && <p className="text-ink-700">Proposed timeline: <strong>{departmentResponse.proposedTimelineDays} days</strong></p>}
                    {departmentResponse.proposedScope && <p className="text-ink-700">Proposed scope: <strong>{departmentResponse.proposedScope}</strong></p>}
                  </div>
                ) : (
                  <p className="rounded-lg bg-ink-50 border border-ink-100 p-3 text-[12.5px] text-ink-600">No department response is recorded on the backend yet.</p>
                )}
              </Section>
            )}

            {negotiations.length > 0 && (
              <Section title="Negotiation History">
                <div className="space-y-2">
                  {negotiations.slice().sort((a, b) => (b.negotiationRound || 0) - (a.negotiationRound || 0)).map((n) => (
                    <div key={n.id ?? n.negotiationRound} className="rounded-lg border border-ink-100 p-3 text-[12.5px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink-900">Round {n.negotiationRound || '—'} · {n.action || '—'} · by {proposerLabel(n.proposedByName || n.proposedBy)}</span>
                        <span className="flex items-center gap-2">
                          <Badge tone={n.statusDisplay || n.status === 'OPEN' ? 'warning' : 'neutral'}>{n.statusDisplay || n.status || '—'}</Badge>
                          <span className="text-[11px] text-ink-400">{n.createdAt ? formatDate(n.createdAt) : ''}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <p className="text-ink-700">Amount: <strong>{n.proposedAmount > 0 ? formatCurrencyINR(n.proposedAmount) : '—'}</strong></p>
                        <p className="text-ink-700">Timeline: <strong>{n.proposedTimelineDays > 0 ? `${n.proposedTimelineDays} days` : '—'}</strong></p>
                        <p className="text-ink-700">Scope: <strong>{n.proposedScope || 'Not specified'}</strong></p>
                        <p className="text-ink-700">Status: <strong>{n.statusDisplay || n.status || '—'}</strong></p>
                      </div>
                      {(n.remarks || n.responseRemarks) && <p className="mt-1 text-ink-500">Remarks: {n.responseRemarks || n.remarks}</p>}
                      {n.respondedByName && <p className="mt-1 text-[11px] text-ink-400">Responded by {n.respondedByName}</p>}
                      {n.approvalMode && <p className="mt-1 text-[11px] text-sky-700">Approval mode: {n.approvalMode}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {releases.length > 0 && (
              <div>
                <div className="h-px bg-ink-100" />
                <h4 className="mt-2 text-[12.5px] font-semibold text-ink-800">Budget Release Trail</h4>
                <div className="mt-2 space-y-2">
                  {releases.map((r) => (
                    <div key={r.id} className="rounded-lg border border-ink-100 p-3 text-[12.5px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink-900">{r.releaseNumber || `Release #${r.id}`} · {r.mode}</span>
                        <span className="text-[11px] text-ink-400">{r.releasedAt ? formatDate(r.releasedAt) : ''}</span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <p className="text-ink-700">Amount: <strong>{formatCurrencyINR(r.amount)}</strong></p>
                        {r.trancheNumber > 0 && <p className="text-ink-700">Tranche: <strong>{r.trancheNumber}</strong></p>}
                        {r.status && <p className="text-ink-700">Status: <strong>{r.statusDisplay || r.status}</strong></p>}
                        {r.remainingAmount > 0 && <p className="text-ink-700">Remaining: <strong>{formatCurrencyINR(r.remainingAmount)}</strong></p>}
                      </div>
                      {r.remarks && <p className="mt-1 text-ink-500">{r.remarks}</p>}
                      {r.referenceNumber && <p className="mt-1 text-[11px] text-ink-400">Reference: {r.referenceNumber}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Section title="Clearances & NOCs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  ['Land', proposal.clearances?.land],
                  ['Forest', proposal.clearances?.forest],
                  ['Environmental', proposal.clearances?.environmental],
                  ['Utility Shifting', proposal.clearances?.utility_shifting],
                ].map(([label, ok]) => (
                  <div key={label} className={`rounded-lg border px-3 py-2 text-[12px] font-medium ${ok ? 'bg-leaf-50 border-leaf-200 text-leaf-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <span className="block text-[10.5px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
                    {ok ? '✓ Cleared' : '✕ Not Cleared'}
                  </div>
                ))}
              </div>
              {proposal.clearancesNotes && <p className="mt-2 text-[12.5px] text-ink-600">{proposal.clearancesNotes}</p>}
            </Section>

            <Section title="Attachments">
              {Array.isArray(proposal.attachments) && proposal.attachments.length > 0 ? (
                <div className="space-y-2">
                  {proposal.attachments.map((item, index) => {
                    const fileName = item.file_name || item.name || (item.file ? String(item.file).split('/').pop() : `Attachment ${index + 1}`)
                    return (
                      <div key={item.id ?? index} className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 px-3 py-2 text-[12.5px]">
                        <span className="truncate text-ink-700">{fileName}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          {item.uploaded_at && <span className="text-[11px] text-ink-400">{formatDate(item.uploaded_at)}</span>}
                          {item.file ? <a className="text-sky-700 hover:underline" href={item.file} target="_blank" rel="noreferrer">Open</a> : <span className="text-[11px] text-ink-400">No file URL</span>}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[12.5px] text-ink-500">No attachments uploaded</p>
              )}
            </Section>

            {EXECUTION_STATUSES.includes(proposal.status) && (() => {
              const project = linkedProject(proposal)
              return (
                <div>
                  <div className="h-px bg-ink-100" />
                  <h4 className="mt-2 text-[12.5px] font-semibold text-ink-800">Execution Project</h4>
                  {project ? (
                    <div className="mt-2 rounded-lg border border-ink-100 p-3 space-y-2 text-[12.5px]">
                      <div className="flex items-center gap-2"><FolderGit2 size={15} className="text-sky-600 shrink-0" /><span className="font-semibold text-ink-900">{project.title}</span></div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Project status</p><p className="mt-0.5"><StatusBadge status={project.status} /></p></div>
                        <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Progress</p><p className="mt-0.5 font-semibold text-leaf-700">{project.progress}%</p></div>
                        <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Sanction order</p><p className="mt-0.5 font-medium text-ink-900">{project.sanctionOrder || '—'}</p></div>
                        <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Sanctioned budget</p><p className="mt-0.5 font-medium text-ink-900">{formatCurrencyINR(project.budgetSanctioned)}</p></div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 rounded-lg bg-ink-50 border border-ink-100 p-3 text-[12.5px] text-ink-600">No execution project is linked to this DPR on the backend yet.</p>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </Modal>

      <Modal
        open={sanctionOpen}
        onClose={() => setSanctionOpen(false)}
        title={selected ? `Sanction budget — ${selected.proposalId}` : 'Sanction budget'}
        width="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSanctionOpen(false)}>Cancel</Button>
            <Button variant="positive" disabled={!getFinalSanctionAmount(proposal)} loading={busyAction === 'sanction'} onClick={sanction}>Sanction</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-ink-100 divide-y divide-ink-100">
            <MoneyRow label="Original DPR Estimate" value={formatCurrencyINR(proposal?.estimatedCost)} />
            <MoneyRow label="Negotiated Amount" value={isNegotiatedAgreement(proposal) ? formatCurrencyINR(proposal?.agreedAmount) : 'Not negotiated'} />
            <MoneyRow label="Final Accepted Amount" value={getFinalSanctionAmount(proposal) ? formatCurrencyINR(getFinalSanctionAmount(proposal)) : 'Final accepted amount unavailable.'} strong tone="leaf" />
            <MoneyRow label="Sanction Amount" value={getFinalSanctionAmount(proposal) ? formatCurrencyINR(getFinalSanctionAmount(proposal)) : 'Unavailable'} strong />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Sanctioned amount (₹)</label>
            <input
              type="number"
              value={sanctionAmount}
              readOnly
              className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-700"
            />
          </div>
          {isNegotiatedAgreement(proposal) && (
            <p className="text-[11.5px] text-leaf-700">Negotiated agreement detected — the default is the final agreed amount ({formatCurrencyINR(proposal.agreedAmount)}), not the original estimate.</p>
          )}
          <p className="text-[12px] text-ink-500">Issues the sanction order number and moves the proposal into execution on the backend.</p>
        </div>
      </Modal>

      <Modal
        open={negotiateOpen}
        onClose={() => setNegotiateOpen(false)}
        title={selected ? `Negotiation response — ${selected.proposalId}` : 'Negotiation response'}
        width="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setNegotiateOpen(false)}>Cancel</Button>
            <Button
              variant={negotiateMode === 'REJECT' ? 'danger' : negotiateMode === 'ACCEPT' ? 'positive' : 'outline'}
              icon={Handshake}
              loading={busyAction === 'negotiate'}
              disabled={negotiateMode !== 'COUNTER_OFFER' && !negotiateRemarks.trim()}
              onClick={negotiate}
            >
              {negotiateMode === 'ACCEPT' ? 'Confirm Acceptance' : negotiateMode === 'REJECT' ? 'Reject Offer' : 'Send Counter-Offer'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-[12px] text-ink-500">Negotiation never rewrites the DPR's estimated cost — the backend records the response, resolves the round state, and writes the agreed terms (approval mode NEGOTIATED) only when the backend confirms the agreement.</p>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Decision</label>
            <div className="flex flex-wrap gap-1.5">
              {['ACCEPT', 'COUNTER_OFFER', 'REJECT'].map((mode) => (
                <button key={mode} onClick={() => setNegotiateMode(mode)} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${negotiateMode === mode ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 border border-ink-200'}`}>{mode === 'COUNTER_OFFER' ? 'Counter-Offer' : mode === 'ACCEPT' ? 'Accept' : 'Reject'}</button>
              ))}
            </div>
          </div>
          {negotiateMode === 'COUNTER_OFFER' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Proposed amount (₹)</label>
                <input type="number" min="0" step="0.01" value={negotiateAmount} onChange={(e) => setNegotiateAmount(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500" placeholder="e.g. 10500000" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Proposed timeline (days)</label>
                <input type="number" min="1" value={negotiateTimeline} onChange={(e) => setNegotiateTimeline(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500" placeholder="e.g. 210" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Proposed scope</label>
                <textarea rows="2" value={negotiateScope} onChange={(e) => setNegotiateScope(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500" placeholder="Scope adjustments, if any" />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Remarks {negotiateMode !== 'COUNTER_OFFER' && '(required)'}</label>
            <textarea rows="2" value={negotiateRemarks} onChange={(e) => setNegotiateRemarks(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500" placeholder="Basis of this decision" />
          </div>
          {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-700">{actionError.message}</div>}
        </div>
      </Modal>

      <Modal
        open={releaseOpen}
        onClose={() => setReleaseOpen(false)}
        title={selected ? `Budget release — ${selected.proposalId}` : 'Budget release'}
        width="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setReleaseOpen(false)}>Cancel</Button>
            <Button variant="positive" icon={Banknote} loading={busyAction === 'release'} onClick={release}>Record Release</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Release mode</label>
            <select value={releaseMode} onChange={(e) => setReleaseMode(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500">
              <option value="FULL">FULL — single release</option>
              <option value="INSTALLMENT">INSTALLMENT — tranche release</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Amount (₹)</label>
            <input type="number" min="0" step="0.01" value={releaseAmount} onChange={(e) => setReleaseAmount(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500" placeholder="e.g. 5000000" />
          </div>
          {releaseMode === 'INSTALLMENT' && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Tranche number</label>
              <input type="number" min="1" value={releaseTranche} onChange={(e) => setReleaseTranche(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Remarks</label>
            <textarea rows="2" value={releaseRemarks} onChange={(e) => setReleaseRemarks(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500" placeholder="Release basis or condition" />
          </div>
          <p className="text-[12px] text-ink-500">Releases, tranches and remaining balances are computed and stored by the backend.</p>
          {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-700">{actionError.message}</div>}
        </div>
      </Modal>
    </div>
  )
}

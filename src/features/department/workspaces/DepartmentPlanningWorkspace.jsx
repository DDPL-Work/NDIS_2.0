import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Banknote, CheckCircle2, ClipboardList, FilePlus2, FileUp, FolderGit2, Handshake, Landmark, MapPin, Send, Sparkles, X } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import Modal from '../../../components/ui/Modal'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { useCurrentUser, useCan } from '../identity/hooks/useAuthorization'
import { formatCurrencyINR, formatDate } from '../../../utils/format'
import { useAsync } from '../../../hooks/useAsync'
import { useDataVersion, DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { useUiStore } from '../../../app/store/uiStore'
import { backendPlanningApi } from '../../../api/planningApi'
import { backendProposalApi } from '../../../api/proposalApi'
import { backendProjectApi } from '../../../api/projectApi'

// TEMPORARY BUILD MARKER — proves which workspace module the browser loaded.
// Remove together with the other diagnosis logs once proposal 13 passes.
console.log('[PLANNING WORKSPACE BUILD]', 'NEGOTIATION-UI-FIX-2026-08-18-01')

const STEPS = ['Need identification', 'Survey & inspection', 'Technical DPR', 'Financial estimation', 'Clearances', 'Attachments', 'Review & submit']
const inputClass = 'w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500'
const label = (text) => <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">{text}</label>
const toNumber = (value) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0 }
const departmentPk = (user) => {
  const raw = (user && typeof user.department === 'object' && user.department) ? (user.department.id ?? user.department.departmentId) : (user?.department ?? user?.departmentId)
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const formFromProposal = (p) => ({
  title: p.title || '',
  category: p.category || '',
  village: p.village || '',
  block: p.block || '',
  population: p.populationImpact ? String(p.populationImpact) : '',
  gapScore: p.gapScore ? String(p.gapScore) : '',
  linkedComplaints: (p.linkedComplaintIds || []).join(', '),
  surveyDate: p.inspectionDate ? String(p.inspectionDate).slice(0, 10) : '',
  surveyTeam: p.surveyTeam || '',
  surveyNotes: p.inspectionNotes || '',
  gisReference: p.gisReference || '',
  latitude: p.latitude != null ? String(p.latitude) : '',
  longitude: p.longitude != null ? String(p.longitude) : '',
  technicalScope: p.technicalScope || '',
  engineeringNotes: p.engineeringNotes || '',
  timeline: p.estimatedTimeline || '',
  civilWorks: String(p.civilWorks || 0),
  equipment: String(p.equipmentCost || 0),
  electrical: String(p.electricalCost || 0),
  contingency: String(p.contingencyCost || 0),
  maintenance: String(p.maintenanceCost || 0),
  clearances: p.clearancesNotes || '',
  environmental: Boolean(p.clearances?.environmental),
  land: Boolean(p.clearances?.land),
  forest: Boolean(p.clearances?.forest),
  utilityShifting: Boolean(p.clearances?.utility_shifting),
})

const emptyForm = (prefill = {}) => ({
  title: prefill.title || '',
  category: '',
  village: prefill.village || '',
  block: prefill.block || '',
  population: '',
  gapScore: prefill.gapScore || '',
  linkedComplaints: '',
  surveyDate: '',
  surveyTeam: '',
  surveyNotes: '',
  gisReference: '',
  latitude: '',
  longitude: '',
  technicalScope: '',
  engineeringNotes: '',
  timeline: '',
  civilWorks: '',
  equipment: '',
  electrical: '',
  contingency: '',
  maintenance: '',
  clearances: '',
  environmental: false,
  land: false,
  forest: false,
  utilityShifting: false,
})

// ── Negotiation & department decision workflow ───────────────────────────────
// Backend-driven (backend_next_guide §6.3): rounds come from
// GET /api/proposals/{id}/negotiations/, the department responds through
// POST /api/proposals/{id}/negotiation-response/. No negotiation state is
// created on this side; every status transition stays backend-authoritative.

// Open-round detection is status-driven: the backend explicitly reports
// status "OPEN" on an active round. The response-marker heuristic is only a
// fallback for serializers that omit the status field. Round records are
// normalized by negotiationMapper (both embedded and dedicated shapes).
const isOpenNegotiation = (round) => {
  const status = String(round?.status || '').trim().toUpperCase()
  if (status) return status === 'OPEN'
  return !round?.respondedAt && !round?.responseRemarks
}
const byRoundDescending = (a, b) => (b.negotiationRound || 0) - (a.negotiationRound || 0)
const openRoundsOf = (rounds) => (rounds || []).filter(isOpenNegotiation).sort(byRoundDescending)
const openRoundOf = (rounds) => openRoundsOf(rounds)[0] || null

// DM proposer detection — normalized against the verified backend values
// ("DM" on the dedicated endpoint, "dm" in proposed_by_name on the embedded
// serializer) and the application's role naming convention. No usernames.
const DM_PROPOSER_LABELS = new Set(['dm', 'district magistrate', 'magistrate', 'collector', 'district collector'])
const isDmProposed = (round) => {
  const proposer = String(round?.proposedByName ?? round?.proposedBy ?? '').trim().toLowerCase()
  return DM_PROPOSER_LABELS.has(proposer) || /dm|magistrate|collector/i.test(proposer)
}

function DprSummaryCard({ proposal }) {
  const fields = [
    ['Proposal ID', proposal?.proposalId || '—'],
    ['Category', proposal?.category || '—'],
    ['Village / Block', `${proposal?.village || '—'} / ${proposal?.block || '—'}`],
    ['Estimated cost', proposal?.costFormatted || formatCurrencyINR(proposal?.estimatedCost)],
    ['Estimated timeline', proposal?.estimatedTimeline || '—'],
    ['Population impact', proposal?.populationImpact || '—'],
    ['Linked complaints', (proposal?.linkedComplaintIds || []).length],
    ['Attachments', Array.isArray(proposal?.attachments) ? proposal.attachments.length : 0],
    ['Status', proposal?.statusDisplay || proposal?.status || '—'],
    ['Stage', proposal?.stageDisplay || proposal?.stage || '—'],
  ]
  return (
    <div className="rounded-xl border border-ink-150 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500"><CheckCircle2 size={13} />Submitted DPR — read-only</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px] sm:grid-cols-3">
        {fields.map(([labelText, value]) => (
          <div key={labelText}>
            <p className="text-[10.5px] uppercase tracking-wide text-ink-400">{labelText}</p>
            <p className="font-medium text-ink-900 break-words">{value}</p>
          </div>
        ))}
      </div>
      {proposal?.technicalScope && <p className="mt-3 text-[12.5px] text-ink-600"><span className="text-[10.5px] uppercase tracking-wide text-ink-400">Technical scope</span><br />{proposal.technicalScope}</p>}
      {proposal?.reviewNotes && <div className="mt-3 rounded-lg border border-saffron-200 bg-saffron-50 px-3 py-2 text-[12.5px] text-saffron-800"><strong>Reviewer note:</strong> {proposal.reviewNotes}</div>}
      {proposal?.delegatedPowerNote && <p className="mt-3 rounded-lg bg-leaf-50 px-3 py-2 text-[12px] text-leaf-800"><Landmark className="mr-1 inline" size={13} />{proposal.delegatedPowerNote}</p>}
      <p className="mt-3 text-[11.5px] text-ink-400">The submitted DPR is locked while the negotiation is open. The negotiation response is a separate decision record — the original values above are never overwritten.</p>
    </div>
  )
}

function NegotiationComparison({ proposal, round }) {
  const rows = [
    { label: 'Amount', original: proposal?.costFormatted || (proposal?.estimatedCost ? formatCurrencyINR(proposal.estimatedCost) : '—'), proposed: round?.proposedAmount ? formatCurrencyINR(round.proposedAmount) : null, diff: round?.proposedAmount && proposal?.estimatedCost ? (round.proposedAmount - proposal.estimatedCost) : null },
    { label: 'Timeline', original: proposal?.estimatedTimeline || '—', proposed: round?.proposedTimelineDays ? `${round.proposedTimelineDays} days` : null, diff: null },
    { label: 'Scope', original: proposal?.technicalScope || '—', proposed: round?.proposedScope || null, diff: null },
  ]
  return (
    <div className="rounded-xl border border-ink-150 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500"><Handshake size={13} />DM counter-offer vs original DPR</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-[12.5px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wide text-ink-400">
              <th className="py-1.5 pr-2 font-semibold">Field</th>
              <th className="py-1.5 pr-2 font-semibold">Original DPR</th>
              <th className="py-1.5 pr-2 font-semibold">DM proposal</th>
              <th className="py-1.5 font-semibold">Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={`border-t border-ink-100 ${row.proposed ? 'bg-sky-50/60' : ''}`}>
                <td className="py-2 pr-2 font-semibold text-ink-800">{row.label}</td>
                <td className="py-2 pr-2 text-ink-700">{row.original}</td>
                <td className={`py-2 pr-2 font-semibold ${row.proposed ? 'text-sky-800' : 'text-ink-400'}`}>{row.proposed || '—'}</td>
                <td className="py-2 text-ink-600">{row.diff === null ? (row.proposed ? 'changed' : '—') : <span className={row.diff < 0 ? 'text-leaf-700' : 'text-alert-600'}>{row.diff < 0 ? '−' : '+'}{formatCurrencyINR(Math.abs(row.diff))}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NegotiationHistoryCard({ rounds }) {
  if (!rounds?.length) return null
  return (
    <div className="rounded-xl border border-ink-150 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500"><Handshake size={13} />Negotiation history</p>
      <div className="space-y-2">
        {(rounds || []).map((n) => (
          <div key={n.id} className="rounded-lg border border-ink-100 p-3 text-[12.5px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-ink-900">
                Round {n.negotiationRound || '—'} · {n.action || '—'}
                {n.proposedByName && <span className="ml-1 font-medium text-ink-500">by {n.proposedByName}</span>}
              </span>
              <span className="flex items-center gap-2">
                <Badge tone={n.statusDisplay || n.status === 'OPEN' ? 'warning' : 'neutral'}>{n.statusDisplay || n.status || '—'}</Badge>
                <span className="text-[11px] text-ink-400">{n.createdAt ? formatDate(n.createdAt) : ''}</span>
              </span>
            </div>
            <div className="mt-1.5 grid gap-1 sm:grid-cols-3">
              {n.proposedAmount > 0 && <p className="text-ink-700">Amount: <b>{formatCurrencyINR(n.proposedAmount)}</b></p>}
              {n.proposedTimelineDays > 0 && <p className="text-ink-700">Timeline: <b>{n.proposedTimelineDays} days</b></p>}
              {n.proposedScope && <p className="text-ink-700">Scope: <b>{n.proposedScope}</b></p>}
            </div>
            {(n.remarks || n.responseRemarks) && <p className="mt-1 text-ink-500">{n.responseRemarks || n.remarks}</p>}
            {n.respondedByName && <p className="mt-1 text-[11px] text-ink-400">Responded by {n.respondedByName}{n.respondedAt ? ` · ${formatDate(n.respondedAt)}` : ''}</p>}
            {n.approvalMode && <p className="mt-1 text-[11px] text-sky-700">Approval mode: {n.approvalMode}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProposalNegotiationView({ deptCode, proposalId, initialProposal }) {
  const navigate = useNavigate()
  const pushToast = useUiStore((s) => s.pushToast)
  const [proposal, setProposal] = useState(initialProposal || null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [decisionMode, setDecisionMode] = useState(null) // null | 'ACCEPT' | 'COUNTER_OFFER' | 'REJECT'
  const [responseAmount, setResponseAmount] = useState('')
  const [responseTimeline, setResponseTimeline] = useState('')
  const [responseScope, setResponseScope] = useState('')
  const [responseRemarks, setResponseRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  const [negotiations, setNegotiations] = useState(null)
  const [roundsLoading, setRoundsLoading] = useState(true)
  const [roundsError, setRoundsError] = useState(null)
  // Race guard: every fetch bumps requestVersionRef; a response is applied only
  // if it is still the latest request (prevents a stale/empty response from
  // overwriting a newer one).
  const requestVersionRef = useRef(0)
  useEffect(() => {
    const requestId = ++requestVersionRef.current
    console.log('[NEGOTIATION REQUEST START]', requestId)
    setRoundsLoading(true)
    setRoundsError(null)
    backendProposalApi.negotiations(proposalId)
      .then((data) => {
        console.log('[NEGOTIATION REQUEST END]', requestId, data)
        if (requestId !== requestVersionRef.current) return
        console.trace('[NEGOTIATION SET STATE]', data)
        setNegotiations(data)
        setRoundsLoading(false)
      })
      .catch((error) => {
        if (requestId !== requestVersionRef.current) return
        setNegotiations(null)
        setRoundsLoading(false)
        setRoundsError(error)
      })
  }, [proposalId, refreshKey])
  const refetchNegotiations = () => setRefreshKey((key) => key + 1)

  // Single source of truth for the whole negotiation surface. Every piece of
  // UI below (decision panel, waiting state, comparison, history, action
  // availability) derives from THIS one object — never from independently
  // computed states. Open-round detection is status-driven: the backend
  // reports status "OPEN" on the active round; round records arrive from
  // negotiationMapper already normalized to one DTO shape.
  const negotiationState = useMemo(() => {
    const rounds = Array.isArray(negotiations) ? negotiations : []
    const normalizedRounds = rounds
      .filter(Boolean)
      .sort((a, b) => Number(b.negotiationRound || 0) - Number(a.negotiationRound || 0))
    const openRounds = normalizedRounds.filter((round) => String(round.status || '').toUpperCase() === 'OPEN')
    const openRound = openRounds[0] || null
    const proposer = String(openRound?.proposedByName ?? openRound?.proposedBy ?? '').trim().toLowerCase()
    const isDmProposal = DM_PROPOSER_LABELS.has(proposer) || /dm|magistrate|collector/i.test(proposer)
    const isDepartmentProposal = !isDmProposal && Boolean(proposer)
    return {
      rounds: normalizedRounds,
      openRound,
      isOpen: Boolean(openRound),
      isDmProposal,
      isDepartmentProposal,
      showDepartmentDecision: Boolean(openRound) && isDmProposal,
    }
  }, [negotiations])

  const agreementReached = !!(proposal?.approvalMode || proposal?.agreedAmount > 0 || proposal?.agreedTimelineDays > 0)

  // Development-only diagnostics — statically stripped in production builds.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    console.debug('[Negotiation State]', {
      proposalId,
      proposalStatus: proposal?.status,
      negotiationCount: negotiationState.rounds.length,
      openRound: negotiationState.openRound,
      isDmProposal: negotiationState.isDmProposal,
      showDepartmentDecision: negotiationState.showDepartmentDecision,
    })
  }, [proposalId, proposal, negotiationState])

  const refresh = async () => {
    try {
      const fresh = await backendProposalApi.get(proposalId)
      setProposal(fresh)
    } catch (e) { setActionError(e) }
    setRefreshKey((key) => key + 1)
  }

  const openDecision = (mode) => {
    setActionError(null)
    if (mode === 'COUNTER_OFFER') {
      // Pre-fill with the DM's current proposal — never the original DPR values.
      setResponseAmount(negotiationState.openRound?.proposedAmount ? String(negotiationState.openRound.proposedAmount) : '')
      setResponseTimeline(negotiationState.openRound?.proposedTimelineDays ? String(negotiationState.openRound.proposedTimelineDays) : '')
      setResponseScope(negotiationState.openRound?.proposedScope || '')
    }
    setDecisionMode(mode)
  }

  const decide = async () => {
    if (!decisionMode) return
    if (decisionMode === 'COUNTER_OFFER') {
      const amountValue = Number(responseAmount)
      const timelineValue = Number(responseTimeline)
      if (!(amountValue > 0)) { setActionError(new Error('Proposed amount must be greater than zero.')); return }
      if (!(timelineValue > 0)) { setActionError(new Error('Proposed timeline must be greater than zero days.')); return }
      if (!responseScope.trim()) { setActionError(new Error('Proposed scope is required.')); return }
      if (!responseRemarks.trim()) { setActionError(new Error('Decision remarks are required.')); return }
    }
    setActionError(null)
    setBusy(true)
    try {
      const payload = { action: decisionMode, remarks: responseRemarks.trim() }
      if (decisionMode === 'COUNTER_OFFER') {
        if (responseAmount.trim() !== '') payload.proposed_amount = Number(responseAmount)
        if (responseTimeline.trim() !== '') payload.proposed_timeline_days = Number(responseTimeline)
        if (responseScope.trim() !== '') payload.proposed_scope = responseScope.trim()
      }
      await backendProposalApi.respondNegotiation(proposalId, payload)
      pushToast(
        decisionMode === 'ACCEPT' ? 'Counter-offer accepted — the backend updates the proposal status.'
          : decisionMode === 'REJECT' ? 'Counter-offer rejected — your decision was sent to the District Magistrate.'
          : 'Counter-offer sent to the District Magistrate.',
        'success'
      )
      setDecisionMode(null)
      setResponseAmount('')
      setResponseTimeline('')
      setResponseScope('')
      setResponseRemarks('')
      await refresh()
    } catch (e) {
      if (e.status === 409) {
        pushToast('This negotiation has changed since you opened it. Refreshing the latest proposal…', 'warning')
        refresh()
      } else {
        setActionError(e)
      }
    } finally { setBusy(false) }
  }

  // Render-time invariant: the decision panel and the waiting state are
  // MUTUALLY EXCLUSIVE. Both derive from negotiationState only — the waiting
  // card can never render when showDepartmentDecision is true.
  const renderNegotiationBody = () => {
    if (roundsLoading && !negotiationState.rounds.length) {
      return <p className="text-sm text-ink-500">Loading negotiation rounds…</p>
    }
    if (roundsError) {
      return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{roundsError.message}</p>
          <Button size="sm" variant="outline" onClick={refetchNegotiations}>Retry</Button>
        </div>
      )
    }
    // 1. OPEN DM counter-offer -> Department Decision Panel
    if (negotiationState.showDepartmentDecision) {
      const openRound = negotiationState.openRound
      return (
        <>
          <NegotiationComparison proposal={proposal} round={openRound} />
          <div className="rounded-xl border border-ink-150 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">DM counter-offer · Round {openRound.negotiationRound || '—'}</p>
              <Badge tone="warning">{openRound.statusDisplay || openRound.status || 'OPEN'}</Badge>
            </div>
            <div className="mt-3 grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2">
              {openRound.proposedAmount > 0 && <p className="text-ink-800">Amount: <b>{formatCurrencyINR(openRound.proposedAmount)}</b> <span className="text-ink-400">(original {proposal?.costFormatted || '—'})</span></p>}
              {openRound.proposedTimelineDays > 0 && <p className="text-ink-800">Timeline: <b>{openRound.proposedTimelineDays} days</b> <span className="text-ink-400">(original {proposal?.estimatedTimeline || '—'})</span></p>}
              {openRound.proposedScope && <p className="text-ink-800">Scope: <b>{openRound.proposedScope}</b></p>}
              <p className="text-ink-800">Proposed by: <b>{openRound.proposedByName || openRound.proposedBy || 'District Magistrate'}</b></p>
            </div>
            {openRound.remarks && <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-[12.5px] text-ink-700"><strong>Remarks:</strong> {openRound.remarks}</p>}
            <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Your decision</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="positive" icon={CheckCircle2} onClick={() => openDecision('ACCEPT')}>Accept counter-offer</Button>
              <Button variant="outline" icon={Handshake} onClick={() => openDecision('COUNTER_OFFER')}>Counter-offer</Button>
              <Button variant="danger" onClick={() => openDecision('REJECT')}>Reject</Button>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-400">Your decision is recorded on the backend and becomes visible to the District Magistrate. The proposal status changes only when the backend confirms it.</p>
          </div>
        </>
      )
    }
    // 2. OPEN round that is not a DM counter-offer -> Waiting for DM
    if (negotiationState.isOpen && !negotiationState.isDmProposal) {
      return (
        <div className="rounded-xl border border-saffron-200 bg-saffron-50 p-4 text-sm text-saffron-800">
          <p className="font-semibold">Waiting for the District Magistrate</p>
          <p className="mt-1 text-[12.5px]">Round {negotiationState.openRound.negotiationRound || '—'} proposed by {negotiationState.openRound.proposedByName || 'your department'} is open on the backend. The DM's next decision will appear here as a new round.</p>
        </div>
      )
    }
    // 3. Rounds exist but none is actionable right now
    if (negotiationState.rounds.length > 0) {
      if (agreementReached) {
        return (
          <div className="rounded-xl border border-leaf-200 bg-leaf-50 p-4 text-sm text-leaf-800">
            <p className="font-semibold">Agreement reached{proposal?.approvalMode ? ` — approval mode ${proposal.approvalMode}` : ''}</p>
            {(proposal?.agreedAmount > 0 || proposal?.agreedTimelineDays > 0) && (
              <p className="mt-1 text-[12.5px]">
                {proposal.agreedAmount > 0 && <>Agreed amount: <b>{formatCurrencyINR(proposal.agreedAmount)}</b></>}
                {proposal.agreedTimelineDays > 0 && <>{proposal.agreedAmount > 0 ? ' · ' : ''}Agreed timeline: <b>{proposal.agreedTimelineDays} days</b></>}
              </p>
            )}
          </div>
        )
      }
      return (
        <div className="rounded-xl border border-ink-150 p-4 text-sm text-ink-600">
          <p className="font-semibold">No open negotiation round</p>
          <p className="mt-1 text-[12.5px]">The latest round (round {negotiationState.rounds[0].negotiationRound || '—'}, {negotiationState.rounds[0].statusDisplay || negotiationState.rounds[0].status || 'status unknown'}) is closed on the backend. New rounds appear here automatically.</p>
        </div>
      )
    }
    // 4. No rounds at all
    return (
      <div className="rounded-xl border border-ink-150 p-4 text-sm text-ink-600">
        <p className="font-semibold">No open negotiation round</p>
        <p className="mt-1 text-[12.5px]">No negotiation round is recorded on the backend yet. New rounds appear here automatically.</p>
      </div>
    )
  }

  if (import.meta.env.DEV) console.log('[NEGOTIATION UI STATE]', {
    negotiations,
    negotiationCount: negotiationState.rounds.length,
    first: negotiationState.rounds[0] || null,
    openRound: negotiationState.openRound,
    showDepartmentDecision: negotiationState.showDepartmentDecision,
    isDmProposal: negotiationState.isDmProposal,
    roundsLoading,
    roundsError: roundsError?.message || null,
  })

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow={`${deptCode} · Planning & Proposals`}
        title="Development Proposal — Negotiation"
        description={`${proposal?.proposalId || proposalId} · ${proposal?.title || 'DPR'} — responding to the District Magistrate's counter-offer.`}
        action={<Button variant="outline" onClick={() => navigate('/linedept/planning')}>Back to repository</Button>}
      />

      <div className="px-6 space-y-4">
        {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError.message}</div>}

        <DprSummaryCard proposal={proposal} />

        <div className="rounded-xl border border-sky-300 bg-sky-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-900"><Handshake size={16} />Negotiation required</p>
          <p className="mt-1 text-sm text-sky-800">The District Magistrate has proposed changes to this DPR. Accepting the counter-offer applies the agreed amount, timeline and scope (approval mode NEGOTIATED) on the backend — the original estimated cost is never overwritten.</p>
        </div>

        {renderNegotiationBody()}

        <NegotiationHistoryCard rounds={negotiationState.rounds} />

        {agreementReached && (proposal?.agreedScope || proposal?.approvalMode) && (
          <div className="rounded-xl border border-ink-150 p-4 text-[12.5px] text-ink-700">
            <p className="mb-1 text-[10.5px] uppercase tracking-wide text-ink-400">Agreed terms</p>
            <p className="break-words">{proposal.agreedScope || 'No scope note recorded on the backend.'}</p>
          </div>
        )}
      </div>

      <Modal
        open={!!decisionMode}
        onClose={() => { if (!busy) setDecisionMode(null) }}
        title={decisionMode === 'ACCEPT' ? `Accept DM counter-offer — ${proposal?.proposalId || ''}` : decisionMode === 'COUNTER_OFFER' ? `Counter-offer to DM — ${proposal?.proposalId || ''}` : `Reject counter-offer — ${proposal?.proposalId || ''}`}
        width="max-w-lg"
        footer={
          <>
            <Button variant="outline" disabled={busy} onClick={() => setDecisionMode(null)}>Cancel</Button>
            <Button
              variant={decisionMode === 'REJECT' ? 'danger' : decisionMode === 'ACCEPT' ? 'positive' : 'outline'}
              icon={decisionMode === 'COUNTER_OFFER' ? Handshake : decisionMode === 'ACCEPT' ? CheckCircle2 : undefined}
              loading={busy}
              disabled={busy || (decisionMode === 'REJECT' && !responseRemarks.trim()) || (decisionMode === 'COUNTER_OFFER' && (!(Number(responseAmount) > 0) || !(Number(responseTimeline) > 0) || !responseScope.trim() || !responseRemarks.trim()))}
              onClick={decide}
            >
              {busy ? 'Submitting…' : decisionMode === 'ACCEPT' ? 'Confirm Acceptance' : decisionMode === 'COUNTER_OFFER' ? 'Send Counter Offer' : 'Reject Counter Offer'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {decisionMode === 'ACCEPT' && negotiationState.openRound && (
            <div className="rounded-lg border border-leaf-200 bg-leaf-50 p-3 text-[12.5px] text-leaf-900">
              <p className="font-semibold">The following proposal will be accepted:</p>
              <div className="mt-1 grid gap-1 sm:grid-cols-2">
                <p>DM amount: <b>{negotiationState.openRound.proposedAmount ? formatCurrencyINR(negotiationState.openRound.proposedAmount) : '—'}</b></p>
                <p>Original DPR amount: <b>{proposal?.costFormatted || '—'}</b></p>
                <p>DM timeline: <b>{negotiationState.openRound.proposedTimelineDays ? `${negotiationState.openRound.proposedTimelineDays} days` : '—'}</b></p>
                <p>Original DPR timeline: <b>{proposal?.estimatedTimeline || '—'}</b></p>
                {negotiationState.openRound.proposedScope && <p className="sm:col-span-2">DM scope: <b>{negotiationState.openRound.proposedScope}</b></p>}
              </div>
              {negotiationState.openRound.remarks && <p className="mt-1 text-leaf-800">DM remarks: {negotiationState.openRound.remarks}</p>}
            </div>
          )}
          {decisionMode === 'COUNTER_OFFER' && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>{label('Proposed amount (₹)')}<input type="number" min="0" step="0.01" className={inputClass} value={responseAmount} onChange={(e) => setResponseAmount(e.target.value)} /></div>
              <div>{label('Proposed timeline (days)')}<input type="number" min="1" className={inputClass} value={responseTimeline} onChange={(e) => setResponseTimeline(e.target.value)} /></div>
              <div className="sm:col-span-2">{label('Proposed scope')}<textarea rows="2" className={inputClass} value={responseScope} onChange={(e) => setResponseScope(e.target.value)} /></div>
            </div>
          )}
          <div>{label(decisionMode === 'REJECT' ? 'Reason (required)' : 'Decision remarks')}<textarea rows="3" className={inputClass} value={responseRemarks} onChange={(e) => setResponseRemarks(e.target.value)} placeholder={decisionMode === 'REJECT' ? 'Why are you rejecting this counter-offer?' : 'Notes for the District Magistrate…'} /></div>
          {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-700">{actionError.message}</div>}
        </div>
      </Modal>
    </div>
  )
}

function ProposalDetailView({ deptCode, proposalId }) {
  const navigate = useNavigate()
  const { data: proposal, loading, error, refetch } = useAsync(() => backendProposalApi.get(proposalId), [proposalId])

  if (loading && !proposal) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader eyebrow={`${deptCode} · Planning & Proposals`} title="Development Proposal DPR Wizard" description="Loading proposal from the backend…" />
        <div className="px-6"><Card><CardBody><p className="text-sm text-ink-500">Loading proposal…</p></CardBody></Card></div>
      </div>
    )
  }
  if (error && !proposal) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader eyebrow={`${deptCode} · Planning & Proposals`} title="Development Proposal" description="The proposal could not be loaded." action={<Button variant="outline" onClick={() => navigate('/linedept/planning')}>Back to repository</Button>} />
        <div className="px-6">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error.message}</p>
            <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  // UNDER_NEGOTIATION proposals open the dedicated negotiation & decision
  // screen (read-only DPR + backend negotiation rounds). Everything else
  // resumes through the DPR wizard as before.
  if (proposal?.status === 'UNDER_NEGOTIATION') {
    return <ProposalNegotiationView deptCode={deptCode} proposalId={proposalId} initialProposal={proposal} />
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader eyebrow={`${deptCode} · Planning & Proposals`} title="Development Proposal DPR Wizard" description="Prepare a traceable, sanction-ready Department Project Report on the live backend." action={<Button variant="outline" onClick={() => navigate('/linedept/planning')}>Cancel</Button>} />
      <div className="px-6"><Card><CardBody><DprWizard proposalId={proposalId} onDone={() => navigate('/linedept/planning')} /></CardBody></Card></div>
    </div>
  )
}

function DprWizard({ proposalId: initialId, prefill = {}, onCreated, onDone }) {
  const navigate = useNavigate()
  const pushToast = useUiStore((s) => s.pushToast)
  const [proposalId, setProposalId] = useState(initialId || null)
  const [proposal, setProposal] = useState(null)
  const [step, setStep] = useState(initialId ? null : 0)
  const [initialized, setInitialized] = useState(false)
  const [form, setForm] = useState(() => emptyForm(prefill))
  const [pendingFiles, setPendingFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [releaseHistory, setReleaseHistory] = useState([])
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    if (!proposalId) return
    let active = true
    backendProposalApi.releases(proposalId)
      .then((rows) => active && setReleaseHistory(rows || []))
      .catch(() => {})
    return () => { active = false }
  }, [proposalId])

  useEffect(() => {
    if (!proposalId) return
    let active = true
    backendProposalApi.get(proposalId)
      .then((p) => { if (active) { setProposal(p); setForm(formFromProposal(p)) } })
      .catch((e) => { if (active) setActionError(e) })
    return () => { active = false }
  }, [proposalId])

  useEffect(() => {
    if (step !== STEPS.length - 1 || !proposalId) return
    let active = true
    backendProposalApi.get(proposalId)
      .then((p) => { if (active) { setProposal(p); setForm(formFromProposal(p)) } })
      .catch(() => {})
    return () => { active = false }
  }, [step, proposalId])

  const completedSteps = useMemo(() => {
    const p = proposal
    if (!p) return []
    return [
      Boolean(p.title),
      Boolean(p.inspectionNotes || p.surveyTeam || p.inspectionDate),
      Boolean(p.technicalScope),
      Number(p.estimatedCost || 0) > 0,
      Boolean(p.clearancesNotes || Object.keys(p.clearances || {}).length),
      Array.isArray(p.attachments) && p.attachments.length > 0,
      Boolean(p.status && p.status !== 'DRAFT_DPR'),
    ]
  }, [proposal])

  useEffect(() => {
    if (!initialId || !proposal || initialized) return
    const first = completedSteps.findIndex((done) => !done)
    setStep(first === -1 ? STEPS.length - 1 : first)
    setInitialized(true)
  }, [initialId, proposal, initialized, completedSteps])

  const payloadForStep = (index) => {
    if (index === 0) return {
      title: form.title.trim(),
      category: form.category,
      village: form.village.trim() || null,
      block: form.block.trim() || null,
      population_impact: toNumber(form.population),
      gap_score: toNumber(form.gapScore),
      linked_complaint_ids: form.linkedComplaints.split(',').map((item) => item.trim()).filter(Boolean).map(Number).filter(Number.isFinite),
    }
    if (index === 1) {
      const payload = { inspection_date: form.surveyDate || null, survey_team: form.surveyTeam, inspection_notes: form.surveyNotes, gis_reference: form.gisReference || null }
      if (form.latitude.trim() !== '') payload.latitude = toNumber(form.latitude)
      if (form.longitude.trim() !== '') payload.longitude = toNumber(form.longitude)
      return payload
    }
    if (index === 2) return { technical_scope: form.technicalScope, engineering_notes: form.engineeringNotes, estimated_timeline: form.timeline }
    if (index === 3) return { civil_works: toNumber(form.civilWorks), electrical_cost: toNumber(form.electrical), equipment_cost: toNumber(form.equipment), contingency_cost: toNumber(form.contingency), maintenance_cost: toNumber(form.maintenance) }
    if (index === 4) return { clearances: { environmental: form.environmental, land: form.land, forest: form.forest, utility_shifting: form.utilityShifting }, clearances_notes: form.clearances }
    return {}
  }

  const saveStep = async (advance) => {
    setActionError(null)
    setSaving(true)
    try {
      let id = proposalId
      if (!id) {
        const created = await backendProposalApi.create(payloadForStep(0))
        id = created.id
        setProposalId(id)
        setProposal(created)
        pushToast(`Proposal ${created.proposalId} created — draft saved.`, 'success')
        onCreated?.(id)
      } else if (step === 5) {
        if (pendingFiles.length) await backendProposalApi.uploadAttachments(id, buildFormData(pendingFiles))
        setPendingFiles([])
      } else {
        await backendProposalApi[STEP_ACTIONS[step]](id, payloadForStep(step))
      }
      const fresh = await backendProposalApi.get(id)
      setProposal(fresh)
      setForm(formFromProposal(fresh))
      if (step === 5) {
        // Upload success is reported from the backend register, never from
        // frontend state (Phase 2.1 §6.7).
        const registered = Array.isArray(fresh.attachments) ? fresh.attachments.length : 0
        pushToast(registered > 0 ? `${registered} attachment${registered === 1 ? '' : 's'} registered by the backend.` : 'No attachments were registered by the backend for this DPR.', registered > 0 ? 'success' : 'error')
      }
      if (advance && step < STEPS.length - 1) setStep(step + 1)
    } catch (e) { setActionError(e) } finally { setSaving(false) }
  }

  const submit = async () => {
    if (!proposalId) return
    setActionError(null)
    setSubmitting(true)
    try {
      await backendProposalApi.submit(proposalId)
      pushToast('DPR submitted for DM review.', 'success')
      onDone?.()
    } catch (e) { setActionError(e) } finally { setSubmitting(false) }
  }

  const total = ['civilWorks', 'equipment', 'electrical', 'contingency', 'maintenance'].reduce((sum, key) => sum + toNumber(form[key]), 0)
  const review = proposal || form

  if (step === null) return <p className="text-sm text-ink-500">Loading proposal…</p>

  const page = [
    <div className="grid gap-3 sm:grid-cols-2" key="need">
      {[['Proposal title', 'title'], ['Category', 'category'], ['Village', 'village'], ['Block', 'block'], ['Population impact', 'population'], ['Gap score', 'gapScore'], ['Linked complaint IDs', 'linkedComplaints']].map(([name, key]) => (
        <div key={key}>{label(name)}<input className={inputClass} value={form[key]} onChange={(e) => update(key, e.target.value)} /></div>
      ))}
    </div>,
    <div className="grid gap-3 sm:grid-cols-2" key="survey">
      <div>{label('Inspection date')}<input type="date" className={inputClass} value={form.surveyDate} onChange={(e) => update('surveyDate', e.target.value)} /></div>
      <div>{label('Survey team')}<input className={inputClass} placeholder="Officer, engineer, inspector" value={form.surveyTeam} onChange={(e) => update('surveyTeam', e.target.value)} /></div>
      <div className="sm:col-span-2">{label('Inspection notes / existing infrastructure')}<textarea className={inputClass} rows="4" value={form.surveyNotes} onChange={(e) => update('surveyNotes', e.target.value)} placeholder="Coverage, catchment radius, nearby assets and survey result" /></div>
      <div>{label('GIS reference')}<input className={inputClass} placeholder="e.g. OSM node / plot id" value={form.gisReference} onChange={(e) => update('gisReference', e.target.value)} /></div>
      <div>{label('Latitude')}<input type="number" step="any" className={inputClass} placeholder="e.g. 25.0294" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} /></div>
      <div>{label('Longitude')}<input type="number" step="any" className={inputClass} placeholder="e.g. 85.4211" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} /></div>
      <div className="sm:col-span-2 rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800"><MapPin className="mr-2 inline" size={16} />Site: {form.village || 'Selected site'}, {form.block}</div>
    </div>,
    <div className="grid gap-3" key="technical">
      <div>{label('Technical scope')}<textarea className={inputClass} rows="3" value={form.technicalScope} onChange={(e) => update('technicalScope', e.target.value)} placeholder="Scope, execution method, specifications and material requirements" /></div>
      <div>{label('Engineering notes and dependencies')}<textarea className={inputClass} rows="3" value={form.engineeringNotes} onChange={(e) => update('engineeringNotes', e.target.value)} /></div>
      <div>{label('Estimated timeline')}<input className={inputClass} value={form.timeline} onChange={(e) => update('timeline', e.target.value)} /></div>
    </div>,
    <div className="grid gap-3 sm:grid-cols-2" key="financial">
      {[['Civil works', 'civilWorks'], ['Equipment', 'equipment'], ['Electrical', 'electrical'], ['Contingency', 'contingency'], ['Maintenance', 'maintenance']].map(([name, key]) => (
        <div key={key}>{label(name)}<input type="number" min="0" className={inputClass} value={form[key]} onChange={(e) => update(key, e.target.value)} /></div>
      ))}
      <div className="rounded-lg bg-ink-900 p-4 text-white"><span className="text-xs uppercase text-ink-300">Grand total (entered)</span><div className="text-xl font-bold">{formatCurrencyINR(total)}</div><small className="text-ink-300">Backend computes the final total on save.</small></div>
    </div>,
    <div className="grid gap-3" key="clearance">
      <div>{label('Clearances and NOCs')}<textarea className={inputClass} rows="4" value={form.clearances} onChange={(e) => update('clearances', e.target.value)} placeholder="Environmental, land, forest, utility shifting, NOC notes" /></div>
      <div className="rounded-lg border border-ink-150 p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Checklist</p>{[['Environmental NOC', 'environmental'], ['Land availability / acquisition', 'land'], ['Forest clearance', 'forest'], ['Utility shifting', 'utilityShifting']].map(([name, key]) => <label key={key} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" checked={form[key]} onChange={(e) => update(key, e.target.checked)} />{name}</label>)}</div>
    </div>,
    <div key="attachments">
      <div className="flex items-center gap-3">
        <input type="file" multiple className="block w-full text-sm text-ink-500 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sky-700" onChange={(e) => setPendingFiles((current) => [...current, ...Array.from(e.target.files || [])])} />
        <Button variant="outline" icon={FileUp} disabled={!pendingFiles.length || saving} onClick={() => saveStep(false)}>{saving ? 'Uploading…' : 'Upload'}</Button>
      </div>
      {pendingFiles.length > 0 && <div className="mt-3 space-y-2">{pendingFiles.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg border border-ink-150 px-3 py-2 text-sm"><span className="truncate">{file.name}</span><button className="text-ink-400 hover:text-ink-700" onClick={() => setPendingFiles((current) => current.filter((_, i) => i !== index))}><X size={14} /></button></div>)}</div>}
      <p className="mt-2 text-xs text-ink-400">Files are uploaded to the backend DPR attachment register.</p>
      {Array.isArray(proposal?.attachments) && proposal.attachments.length > 0 && <div className="mt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Registered attachments</p><div className="space-y-2">{proposal.attachments.map((item, index) => { const fileName = item.file_name || item.name || (item.file ? item.file.split('/').pop() : `Attachment ${index + 1}`); return <div key={index} className="flex items-center justify-between rounded-lg border border-ink-150 px-3 py-2 text-sm"><span className="truncate">{fileName}</span>{item.file && <a className="text-sky-700 hover:underline" href={item.file} target="_blank" rel="noreferrer">Open</a>}</div> })}</div></div>}
    </div>,
    <div className="space-y-3" key="review">
      <div className="rounded-xl border border-ink-150 p-4 text-sm"><strong>{review.title || 'Untitled DPR'}</strong><p className="mt-2 text-ink-600">{proposal?.problemStatement || review.surveyNotes || 'No need assessment entered yet.'}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span>Priority: <b>{proposal?.priority || '—'}</b></span><span>Funding: <b>{proposal?.fundingSource || '—'}</b></span><span>Beneficiaries: <b>{proposal?.populationImpact || review.population || '—'}</b></span><span>Backend cost: <b>{proposal?.costFormatted || formatCurrencyINR(total)}</b></span><span>Status: <b>{proposal?.statusDisplay || '—'}</b></span><span>Stage: <b>{proposal?.stageDisplay || '—'}</b></span></div>{proposal?.delegatedPowerNote && <p className="mt-3 rounded-lg bg-leaf-50 px-3 py-2 text-xs text-leaf-800"><Landmark className="mr-1 inline" size={13} />{proposal.delegatedPowerNote}</p>}</div>
      {proposal?.reviewNotes && <div className="rounded-lg border border-saffron-200 bg-saffron-50 px-4 py-3 text-sm text-saffron-800"><strong>Reviewer note:</strong> {proposal.reviewNotes}</div>}
      {proposalId && releaseHistory.length > 0 && (
        <div className="rounded-xl border border-ink-150 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500"><Banknote size={13} />Budget Release Trail</p>
          <div className="space-y-2">
            {releaseHistory.map((r) => (
              <div key={r.id} className="rounded-lg border border-ink-100 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink-900">{r.releaseNumber || `Release #${r.id}`} · {r.mode}</span>
                  <span className="text-[11px] text-ink-400">{r.releasedAt ? formatDate(r.releasedAt) : ''}</span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <p className="text-ink-700">Amount: <b>{formatCurrencyINR(r.amount)}</b></p>
                  {r.trancheNumber > 0 && <p className="text-ink-700">Tranche: <b>{r.trancheNumber}</b></p>}
                  {r.status && <p className="text-ink-700">Status: <b>{r.statusDisplay || r.status}</b></p>}
                  {r.remainingAmount > 0 && <p className="text-ink-700">Remaining: <b>{formatCurrencyINR(r.remainingAmount)}</b></p>}
                </div>
                {r.remarks && <p className="mt-1 text-ink-500">{r.remarks}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-sm text-ink-500">Submitting moves this DPR to <b>Pending Review</b> for the District Magistrate.</p>
    </div>,
  ][step]

  const isLast = step === STEPS.length - 1
  const primaryLabel = step === 0 && !proposalId ? 'Create draft' : step < 5 ? 'Save & continue' : 'Continue'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1">{STEPS.map((name, index) => <span key={name} className={`rounded-full px-2 py-1 text-[10px] ${index === step ? 'bg-sky-600 text-white' : completedSteps[index] ? 'bg-leaf-100 text-leaf-800' : 'bg-ink-100 text-ink-400'}`}>{index + 1}. {name}</span>)}</div>
      {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError.message}</div>}
      {page}
      <div className="flex flex-wrap justify-between gap-2 border-t border-ink-100 pt-4">
        <Button variant="ghost" icon={ArrowLeft} disabled={!step || saving || submitting} onClick={() => setStep(step - 1)}>Back</Button>
        {isLast
          ? <Button variant="positive" icon={Send} disabled={saving || submitting} onClick={submit}>{submitting ? 'Submitting…' : 'Submit for review'}</Button>
          : <span className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={saving || submitting} onClick={() => saveStep(false)}>{saving ? 'Saving…' : (step === 0 && !proposalId ? 'Create draft' : 'Save step')}</Button>
              <Button icon={ArrowRight} disabled={saving || submitting} onClick={() => { if (step === 0 && !form.title.trim()) { pushToast('Proposal title is required.', 'error'); return } saveStep(true) }}>{saving ? 'Saving…' : primaryLabel}</Button>
            </span>}
      </div>
    </div>
  )
}

// Step 1 (need identification) is created with POST /proposals/ and edited
// with PATCH /proposals/{id}/ — both share the `update(id, payload)` shape.
const STEP_ACTIONS = ['update', 'saveSurveyInspection', 'saveTechnicalDpr', 'saveFinancialEstimation', 'saveClearances', null, null]

const buildFormData = (files) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return formData
}

const VIEW_STATUS = { drafts: 'DRAFT_DPR', submitted: 'PENDING_REVIEW', approved: 'APPROVED', rejected: 'REJECTED', sanctioned: null, negotiation: 'UNDER_NEGOTIATION' }

// Sanctioned DPRs continue into project execution on the backend. The lifecycle
// view joins proposals with the projects the backend materialized for them.
const SANCTIONED_STATUSES = ['SANCTIONED', 'IN_EXECUTION', 'COMPLETED']

const VIEW_TITLES = {
  dashboard: 'Development Planning ERP',
  drafts: 'Draft Proposals',
  submitted: 'Pending Review',
  approved: 'Approved Proposals',
  rejected: 'Rejected Proposals',
  returned: 'Returned Proposals',
  sanctioned: 'Sanctioned & In Execution',
  negotiation: 'Under Negotiation',
}

const PLANNING_VIEWS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'submitted', label: 'Pending review' },
  { value: 'negotiation', label: 'Under negotiation' },
  { value: 'approved', label: 'Approved' },
  { value: 'sanctioned', label: 'In execution' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'returned', label: 'Returned' },
]

export default function DepartmentPlanningWorkspace({ view = 'dashboard' }) {
  const { dept } = useDepartment()
  const user = useCurrentUser()
  const canCreate = useCan('projects.create')
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const planningVersion = useDataVersion((s) => s.versions[DATA_SCOPES.PLANNING] || 0)
  const proposalsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.PROPOSALS] || 0)
  const projectsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.PROJECTS] || 0)
  const deptPk = useMemo(() => departmentPk(user), [user])
  const districtPk = useMemo(() => {
    const raw = (user && typeof user.district === 'object' && user.district) ? (user.district.id ?? user.district.districtId) : (user?.districtId ?? user?.district)
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [user])

  // On the proposal detail route the list/dashboard fetchers are no-ops so
  // navigating into a proposal does not fire repository-wide requests.
  const dashboardFetcher = useMemo(() => (view === 'proposal' ? async () => null : () => backendPlanningApi.dashboard()), [view])
  const { data: dashboard, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useAsync(dashboardFetcher, [planningVersion, view])

  // The DPR repository is always the department/district-scoped proposal list
  // (GET /api/proposals/?department=&district=), including on the dashboard —
  // planning/dashboard supplies only the KPI counts and suggested needs.
  const status = VIEW_STATUS[view]
  const proposalFetcher = useMemo(() => {
    if (view === 'proposal') return async () => null
    return () => backendProposalApi.list({
      ...(status ? { status } : {}),
      ...(deptPk ? { departmentId: deptPk } : {}),
      ...(districtPk ? { districtId: districtPk } : {}),
    })
  }, [view, status, deptPk, districtPk])
  const { data: proposals, loading: proposalsLoading, error: proposalsError, refetch: refetchProposals } = useAsync(proposalFetcher, [view, status, deptPk, districtPk, proposalsVersion, planningVersion])

  // Phase 3 lifecycle bridge: projects the backend materialized for the
  // department's sanctioned DPRs (matched on proposal reference or numeric id).
  const projectFetcher = useMemo(() => {
    if (view !== 'sanctioned') return async () => null
    return () => backendProjectApi.list(deptPk ? { departmentId: deptPk } : {})
  }, [view, deptPk])
  const { data: lifecycleProjects } = useAsync(projectFetcher, [view, deptPk, projectsVersion])

  const projectByProposal = useMemo(() => {
    const map = new Map()
    ;(lifecycleProjects || []).forEach((project) => {
      ;[project.proposalIdStr, String(project.proposalId || '')].filter(Boolean).forEach((key) => map.set(key, project))
    })
    return map
  }, [lifecycleProjects])

  const linkedProject = (row) => projectByProposal.get(String(row.id)) || projectByProposal.get(row.proposalId) || null

  const needs = dashboard?.suggestedDevelopmentNeeds || []
  const kpi = dashboard?.kpiSummary || {}
  const rows = useMemo(() => {
    const list = proposals || []
    if (view === 'returned') return list.filter((p) => p.reviewNotes)
    if (view === 'sanctioned') return list.filter((p) => SANCTIONED_STATUSES.includes(p.status))
    return list
  }, [view, proposals])

  // Negotiation highlights for UNDER_NEGOTIATION rows — the open DM round is
  // fetched per row (bounded to negotiating proposals only) so the repository
  // can surface the counter-offer and the "action required" cue without
  // fabricating any negotiation state.
  const [negotiationHighlights, setNegotiationHighlights] = useState({})
  useEffect(() => {
    if (view === 'proposal') return
    const targets = (rows || []).filter((row) => row.status === 'UNDER_NEGOTIATION').map((row) => row.id)
    if (!targets.length) { setNegotiationHighlights({}); return }
    let active = true
    Promise.all(targets.map((id) => backendProposalApi.negotiations(id).then((list) => [id, list || []]).catch(() => [id, []])))
      .then((entries) => { if (active) setNegotiationHighlights(Object.fromEntries(entries)) })
    return () => { active = false }
  }, [rows, proposalsVersion])

  const convertToDpr = (need) => {
    const params = new URLSearchParams({ title: need.title, village: need.village || '', block: need.block || '', gapScore: String(need.gap_score ?? '') })
    navigate(`/linedept/planning/new?${params}`)
  }

  const errorBox = (message, retry) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm text-red-700">{message}</p>
      <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
    </div>
  )

  if (view === 'new') {
    const prefill = { title: searchParams.get('title') || '', village: searchParams.get('village') || '', block: searchParams.get('block') || '', gapScore: searchParams.get('gapScore') || '' }
    return (
      <div className="space-y-6 pb-8">
        <PageHeader eyebrow={`${dept.code} · Planning & Proposals`} title="Development Proposal DPR Wizard" description="Prepare a traceable, sanction-ready Department Project Report on the live backend." action={<Button variant="outline" onClick={() => navigate('/linedept/planning')}>Cancel</Button>} />
        <div className="px-6"><Card><CardBody><DprWizard prefill={prefill} onCreated={(proposalId) => navigate(`/linedept/planning/proposals/${proposalId}`, { replace: true })} onDone={() => navigate('/linedept/planning')} /></CardBody></Card></div>
      </div>
    )
  }

  // /linedept/planning/proposals/:id — negotiation-aware detail route.
  if (view === 'proposal') {
    return <ProposalDetailView deptCode={dept.code} proposalId={id} />
  }

  const tableColumns = [
    { key: 'proposalId', label: 'Proposal ID' },
    { key: 'title', label: 'DPR title' },
    { key: 'cost', label: 'Cost', render: (row) => row.estimatedCost ? formatCurrencyINR(row.estimatedCost) : (row.costFormatted || '—') },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const openRound = openRoundOf(negotiationHighlights[row.id])
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={row.status} />
            {row.status === 'UNDER_NEGOTIATION' && openRound && isDmProposed(openRound) && <Badge tone="warning">Action required</Badge>}
          </div>
        )
      },
    },
    {
      key: 'negotiation',
      label: 'Negotiation',
      render: (row) => {
        if (row.status !== 'UNDER_NEGOTIATION') return '—'
        const openRound = openRoundOf(negotiationHighlights[row.id])
        if (!openRound) return <span className="text-[12px] text-ink-400">Waiting for DM</span>
        return (
          <div className="text-[12px] leading-snug">
            {openRound.proposedAmount > 0 && <p className="font-medium text-ink-800">DM counter-offer: {formatCurrencyINR(openRound.proposedAmount)}</p>}
            {openRound.proposedTimelineDays > 0 && <p className="text-ink-600">{openRound.proposedTimelineDays} days</p>}
            {openRound.remarks && <p className="max-w-[220px] truncate text-ink-500" title={openRound.remarks}>{openRound.remarks}</p>}
          </div>
        )
      },
    },
    { key: 'stage', label: 'Stage', render: (row) => row.stageDisplay || row.stage || '—' },
    { key: 'block', label: 'Block', render: (row) => row.block || '—' },
    { key: 'submitted', label: 'Submitted', render: (row) => row.createdAt ? formatDate(row.createdAt) : '—' },
    {
      key: 'actions',
      label: '',
      render: (row) => row.status === 'UNDER_NEGOTIATION'
        ? <Button size="sm" variant="outline" icon={Handshake} onClick={() => navigate(`/linedept/planning/proposals/${row.id}`)}>Review Negotiation</Button>
        : <Button size="sm" variant="outline" onClick={() => navigate(`/linedept/planning/proposals/${row.id}`)}>View / Resume</Button>,
    },
  ]

  // Sanctioned DPRs continue as backend projects — the execution ERP row carries
  // its sanction order, live progress and status, and cross-links to it.
  const lifecycleColumns = [
    { key: 'proposalId', label: 'DPR ID', render: (row) => <span className="kbd-mono text-[12px]">{row.proposalId}</span> },
    { key: 'title', label: 'DPR title', render: (row) => <span className="font-medium text-ink-900">{row.title}</span> },
    { key: 'status', label: 'DPR status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'project', label: 'Linked project', render: (row) => { const project = linkedProject(row); return project ? <span className="font-medium text-ink-900">{project.title}</span> : '—' } },
    { key: 'projectStatus', label: 'Project status', render: (row) => { const project = linkedProject(row); return project ? <StatusBadge status={project.status} /> : '—' } },
    { key: 'progress', label: 'Progress', render: (row) => { const project = linkedProject(row); return project ? <span className="font-semibold text-leaf-700">{project.progress}%</span> : '—' } },
    { key: 'sanction', label: 'Sanction', render: (row) => { const project = linkedProject(row); return project?.sanctionOrder ? <Badge tone="info">{project.sanctionOrder}</Badge> : (row.costFormatted || formatCurrencyINR(row.estimatedCost)) } },
    { key: 'actions', label: '', render: (row) => { const project = linkedProject(row); return (
      <div className="flex gap-1.5" onClick={(event) => event.stopPropagation()}>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/linedept/planning/proposals/${row.id}`)}>View DPR</Button>
        {project && <Button size="sm" variant="outline" icon={FolderGit2} onClick={() => navigate(`/linedept/projects/${project.id}`)}>View project</Button>}
      </div>
    ) } },
  ]

  const columns = view === 'sanctioned' ? lifecycleColumns : tableColumns

  return (
    <div className="space-y-6 pb-8">
      <PageHeader eyebrow={`${dept.code} · Planning & Proposals`} title={VIEW_TITLES[view]} description="Development needs flow through DPR preparation, DM review and sanction on the live backend." action={canCreate && <Button icon={FilePlus2} onClick={() => navigate('/linedept/planning/new')}>New proposal</Button>} />
      <div className="px-6">
        <div className="flex flex-wrap gap-1 rounded-lg border border-ink-100 bg-white p-1 text-[12.5px] font-medium w-fit">
          {PLANNING_VIEWS.map((item) => {
            const active = item.value === view || (view === 'dashboard' && item.value === 'dashboard')
            return (
              <button key={item.value} onClick={() => navigate(item.value === 'dashboard' ? '/linedept/planning' : `/linedept/planning/${item.value}`)} className={`px-3 py-1.5 rounded-md transition-colors ${active ? 'bg-ink-900 text-white font-semibold' : 'text-ink-600 hover:bg-ink-50'}`}>{item.label}</button>
            )
          })}
        </div>
      </div>
      {view === 'dashboard' && (
        <>
          <div className="px-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Development Needs" value={dashboardLoading ? '…' : kpi.developmentNeeds} icon={Sparkles} tone="saffron" />
            <StatCard label="Draft DPR" value={dashboardLoading ? '…' : kpi.draftDpr} icon={ClipboardList} tone="ink" />
            <StatCard label="Pending Review" value={dashboardLoading ? '…' : kpi.pendingReview} icon={Landmark} tone="sky" />
            <StatCard label="Approved" value={dashboardLoading ? '…' : kpi.approved} icon={CheckCircle2} tone="leaf" />
          </div>
          <div className="px-6">
            <Card>
              <CardHeader title="Suggested development needs" subtitle="Grievance clusters and infrastructure gaps computed by the backend" icon={Sparkles} />
              <CardBody className="!p-0">
                {dashboardError ? errorBox(dashboardError.message, refetchDashboard)
                  : dashboardLoading && !dashboard ? <p className="px-4 py-4 text-sm text-ink-500">Loading suggested needs…</p>
                  : <DataTable rows={needs} columns={[
                    { key: 'title', label: 'Need' },
                    { key: 'department', label: 'Department' },
                    { key: 'block', label: 'Block', render: (row) => row.block || '—' },
                    { key: 'gapScore', label: 'Gap score', render: (row) => <Badge tone="warning">{row.gap_score}</Badge> },
                    { key: 'linkedComplaints', label: 'Linked complaints', render: (row) => row.linked_complaints_count ?? 0 },
                    { key: 'convert', label: '', render: (row) => canCreate && <Button size="sm" variant="outline" onClick={() => convertToDpr(row)}>Convert to DPR</Button> },
                  ]} emptyLabel="No priority development needs right now" />}
              </CardBody>
            </Card>
          </div>
        </>
      )}
      {view === 'sanctioned' && (
        <div className="px-6">
          <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800"><FolderGit2 size={16} className="mt-0.5 shrink-0" /><span>Sanctioned DPRs are materialized as execution projects by the backend. Open the linked project to record daily progress, site diaries, measurement books, bills and risks; completed projects hand over into the Asset workspace.</span></div>
        </div>
      )}
      <div className="px-6">
        <Card>
          <CardHeader title="DPR repository" subtitle={view === 'dashboard' ? `${rows.length} proposals from the backend` : `${rows.length} proposals in this view`} icon={ClipboardList} />
          <CardBody className="!p-0">
            {proposalsError ? errorBox(proposalsError.message, refetchProposals)
              : proposalsLoading && !rows.length ? <p className="px-4 py-4 text-sm text-ink-500">Loading proposals…</p>
              : <DataTable rows={rows} columns={columns} emptyLabel="No proposals in this view yet" />}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

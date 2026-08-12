import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, FilePlus2, FileUp, Landmark, MapPin, Send, Sparkles, X } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { useCurrentUser, useCan } from '../identity/hooks/useAuthorization'
import { formatCurrencyINR, formatDate } from '../../../utils/format'
import { useAsync } from '../../../hooks/useAsync'
import { useDataVersion, DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { useUiStore } from '../../../app/store/uiStore'
import { backendPlanningApi } from '../../../api/planningApi'
import { backendProposalApi } from '../../../api/proposalApi'

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
  category: p.category || 'Infrastructure',
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
  timeline: p.estimatedTimeline || '90 days',
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
  category: 'Infrastructure',
  village: prefill.village || '',
  block: prefill.block || 'Silao',
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
  timeline: '90 days',
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
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

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
      <div className="rounded-xl border border-ink-150 p-4 text-sm"><strong>{review.title || 'Untitled DPR'}</strong><p className="mt-2 text-ink-600">{proposal?.problemStatement || review.surveyNotes || 'No need assessment entered yet.'}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span>Priority: <b>{proposal?.priority || '—'}</b></span><span>Funding: <b>{proposal?.fundingSource || '—'}</b></span><span>Beneficiaries: <b>{proposal?.populationImpact || review.population || '—'}</b></span><span>Backend cost: <b>{proposal?.costFormatted || formatCurrencyINR(total)}</b></span><span>Status: <b>{proposal?.statusDisplay || 'Draft DPR'}</b></span><span>Stage: <b>{proposal?.stageDisplay || '—'}</b></span></div>{proposal?.delegatedPowerNote && <p className="mt-3 rounded-lg bg-leaf-50 px-3 py-2 text-xs text-leaf-800"><Landmark className="mr-1 inline" size={13} />{proposal.delegatedPowerNote}</p>}</div>
      {proposal?.reviewNotes && <div className="rounded-lg border border-saffron-200 bg-saffron-50 px-4 py-3 text-sm text-saffron-800"><strong>Reviewer note:</strong> {proposal.reviewNotes}</div>}
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
      <div className="flex justify-between border-t border-ink-100 pt-4">
        <Button variant="ghost" icon={ArrowLeft} disabled={!step || saving || submitting} onClick={() => setStep(step - 1)}>Back</Button>
        {isLast
          ? <Button variant="positive" icon={Send} disabled={saving || submitting} onClick={submit}>{submitting ? 'Submitting…' : 'Submit for review'}</Button>
          : <span className="flex gap-2">
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

const VIEW_STATUS = { drafts: 'DRAFT_DPR', submitted: 'PENDING_REVIEW', approved: 'APPROVED', rejected: 'REJECTED' }

const VIEW_TITLES = {
  dashboard: 'Development Planning ERP',
  drafts: 'Draft Proposals',
  submitted: 'Pending Review',
  approved: 'Approved Proposals',
  rejected: 'Rejected Proposals',
  returned: 'Returned Proposals',
}

export default function DepartmentPlanningWorkspace({ view = 'dashboard' }) {
  const { dept } = useDepartment()
  const user = useCurrentUser()
  const canCreate = useCan('projects.create')
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const planningVersion = useDataVersion((s) => s.versions[DATA_SCOPES.PLANNING] || 0)
  const proposalsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.PROPOSALS] || 0)
  const deptPk = useMemo(() => departmentPk(user), [user])

  const dashboardFetcher = useMemo(() => () => backendPlanningApi.dashboard(), [])
  const { data: dashboard, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useAsync(dashboardFetcher, [planningVersion])

  const status = VIEW_STATUS[view]
  const proposalFetcher = useMemo(() => {
    if (view === 'dashboard') return async () => null
    return () => backendProposalApi.list({ ...(status ? { status } : {}), ...(deptPk ? { departmentId: deptPk } : {}) })
  }, [view, status, deptPk])
  const { data: proposals, loading: proposalsLoading, error: proposalsError, refetch: refetchProposals } = useAsync(proposalFetcher, [view, status, deptPk, proposalsVersion, planningVersion])

  const needs = dashboard?.suggestedDevelopmentNeeds || []
  const kpi = dashboard?.kpiSummary || {}
  const rows = useMemo(() => {
    if (view === 'dashboard') return dashboard?.dprRepository || []
    const list = proposals || []
    return view === 'returned' ? list.filter((p) => p.reviewNotes) : list
  }, [view, dashboard, proposals])

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

  if (view === 'new' || view === 'proposal') {
    const prefill = view === 'new'
      ? { title: searchParams.get('title') || '', village: searchParams.get('village') || '', block: searchParams.get('block') || '', gapScore: searchParams.get('gapScore') || '' }
      : {}
    return (
      <div className="space-y-6 pb-8">
        <PageHeader eyebrow={`${dept.code} · Planning & Proposals`} title="Development Proposal DPR Wizard" description="Prepare a traceable, sanction-ready Department Project Report on the live backend." action={<Button variant="outline" onClick={() => navigate('/linedept/planning')}>Cancel</Button>} />
        <div className="px-6"><Card><CardBody><DprWizard proposalId={view === 'proposal' ? id : null} prefill={prefill} onCreated={(proposalId) => navigate(`/linedept/planning/proposals/${proposalId}`, { replace: true })} onDone={() => navigate('/linedept/planning')} /></CardBody></Card></div>
      </div>
    )
  }

  const tableColumns = [
    { key: 'proposalId', label: 'Proposal ID' },
    { key: 'title', label: 'DPR title' },
    { key: 'cost', label: 'Cost', render: (row) => row.estimatedCost ? formatCurrencyINR(row.estimatedCost) : (row.costFormatted || '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'stage', label: 'Stage', render: (row) => row.stageDisplay || row.stage || '—' },
    { key: 'block', label: 'Block', render: (row) => row.block || '—' },
    { key: 'submitted', label: 'Submitted', render: (row) => row.createdAt ? formatDate(row.createdAt) : '—' },
    { key: 'actions', label: '', render: (row) => <Button size="sm" variant="outline" onClick={() => navigate(`/linedept/planning/proposals/${row.id}`)}>View / Resume</Button> },
  ]

  return (
    <div className="space-y-6 pb-8">
      <PageHeader eyebrow={`${dept.code} · Planning & Proposals`} title={VIEW_TITLES[view]} description="Development needs flow through DPR preparation, DM review and sanction on the live backend." action={canCreate && <Button icon={FilePlus2} onClick={() => navigate('/linedept/planning/new')}>New proposal</Button>} />
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
      <div className="px-6">
        <Card>
          <CardHeader title="DPR repository" subtitle={view === 'dashboard' ? `${(dashboard?.dprRepository || []).length} active proposals from the backend` : `${rows.length} proposals in this view`} icon={ClipboardList} />
          <CardBody className="!p-0">
            {proposalsError ? errorBox(proposalsError.message, refetchProposals)
              : proposalsLoading && !rows.length ? <p className="px-4 py-4 text-sm text-ink-500">Loading proposals…</p>
              : <DataTable rows={rows} columns={tableColumns} emptyLabel="No proposals in this view yet" />}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, CloudSun, FileText, Gauge, Landmark, Send } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import StatusBadge from '../../../components/ui/StatusBadge'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { useAsync } from '../../../hooks/useAsync'
import { useDataVersion, DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { useUiStore } from '../../../app/store/uiStore'
import { backendProjectApi } from '../../../api/projectApi'
import { backendSiteDiaryApi } from '../../../api/siteDiaryApi'
import { backendExecutionRiskApi } from '../../../api/executionRiskApi'
import { formatCurrencyINR, formatDate } from '../../../utils/format'

const inputClass = 'w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500'
const SEVERITY_TONE = { low: 'positive', medium: 'warning', high: 'negative', critical: 'negative' }

// Payload for POST /api/projects/{id}/daily-progress/ — fields verified live
// during Phase 2.1. `physical_progress` is the writable serializer field
// (progress_pct is silently ignored by the backend); labour_deployed,
// materials_consumed, weather_condition and work_description are accepted and
// recorded into the auto-created site diary entry. risk_signal is accepted
// but currently ignored by the backend (kept for forward compatibility).
const buildDailyProgressPayload = (form) => ({
  physical_progress: Number(form.progress || 0),
  labour_deployed: Number(form.labour || 0),
  materials_consumed: form.materials,
  weather_condition: form.weather,
  risk_signal: form.riskSignal || null,
  work_description: form.remarks,
})

const initialForm = { progress: '', labour: '', materials: '', weather: 'Clear', riskSignal: '', remarks: '' }

export default function DepartmentProjectDetail() {
  const { dept } = useDepartment()
  const { id } = useParams()
  const navigate = useNavigate()
  const pushToast = useUiStore((s) => s.pushToast)
  const projectsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.PROJECTS] || 0)
  const diariesVersion = useDataVersion((s) => s.versions[DATA_SCOPES.SITE_DIARIES] || 0)
  const risksVersion = useDataVersion((s) => s.versions[DATA_SCOPES.RISKS] || 0)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)

  const projectFetcher = useMemo(() => () => backendProjectApi.get(id), [id])
  const { data: project, loading, error, refetch } = useAsync(projectFetcher, [id, projectsVersion])

  const diaryFetcher = useMemo(() => () => backendSiteDiaryApi.list({ project: id }), [id])
  const { data: diaries } = useAsync(diaryFetcher, [id, diariesVersion])

  const riskFetcher = useMemo(() => () => backendExecutionRiskApi.list({ project: id }), [id])
  const { data: risks } = useAsync(riskFetcher, [id, risksVersion])

  const submitProgress = async (event) => {
    event.preventDefault()
    const progress = Number(form.progress)
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) { pushToast('Enter physical progress between 0 and 100 percent.', 'error'); return }
    setSaving(true)
    setActionError(null)
    try {
      await backendProjectApi.dailyProgress(id, buildDailyProgressPayload(form))
      pushToast('Daily progress recorded — the backend updates project status.', 'success')
      setForm(initialForm)
    } catch (e) { setActionError(e) } finally { setSaving(false) }
  }

  if (loading && !project) return <div className="space-y-6 pb-8"><PageHeader eyebrow={`${dept.code} · Projects & Execution`} title="Project detail" description="Loading project…" /></div>
  if (error && !project) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader eyebrow={`${dept.code} · Projects & Execution`} title="Project detail" description="Execution record" action={<Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/linedept/projects')}>Back</Button>} />
        <div className="px-6"><div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-700">{error.status === 404 ? 'This project does not exist on the backend.' : `Unable to load the project: ${error.message}`}</p><Button size="sm" variant="outline" onClick={refetch}>Retry</Button></div></div>
      </div>
    )
  }

  const fields = [
    ['Project ID', project.projectId && <span className="kbd-mono">{project.projectId}</span>],
    ['Source proposal', (project.proposalIdStr || project.proposalId) ? <span className="kbd-mono">{project.proposalIdStr || project.proposalId}</span> : '—'],
    ['Status', <StatusBadge status={project.status} />],
    ['Stage', project.stage || '—'],
    ['Progress', `${project.progress}%`],
    ['Sanctioned budget', formatCurrencyINR(project.budgetSanctioned)],
    ['Budget utilized', formatCurrencyINR(project.budgetUtilized)],
    ['Sanction order', project.sanctionOrder || '—'],
    ['Department', project.departmentName || '—'],
    ['District', project.districtName || '—'],
    ['Village', project.village || '—'],
    ['Block', project.block || '—'],
    ['Contractor', project.contractor || '—'],
    ['Risk', project.risk ? <Badge tone={SEVERITY_TONE[project.risk] || 'neutral'}>{project.risk}</Badge> : '—'],
    ['Start date', project.startDate ? formatDate(project.startDate) : '—'],
    ['Completion date', project.completionDate ? formatDate(project.completionDate) : '—'],
    ['Created', project.createdAt ? formatDate(project.createdAt) : '—'],
  ].filter(([, value]) => value !== undefined && value !== null)

  return (
    <div className="space-y-6 pb-8">
      <PageHeader eyebrow={`${dept.code} · Projects & Execution`} title={project.title} description="Backend execution record for the sanctioned DPR" action={<Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/linedept/projects')}>Back</Button>} />
      <div className="px-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-400">Progress</p><p className="mt-1 text-xl font-bold text-leaf-700">{project.progress}%</p></CardBody></Card>
        <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-400">Sanctioned budget</p><p className="mt-1 text-xl font-bold">{formatCurrencyINR(project.budgetSanctioned)}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-400">Budget utilized</p><p className="mt-1 text-xl font-bold">{formatCurrencyINR(project.budgetUtilized)}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs uppercase tracking-wide text-ink-400">Status</p><p className="mt-1"><StatusBadge status={project.status} /></p></CardBody></Card>
      </div>
      <div className="px-6"><Card><CardHeader title="Project information" icon={Landmark} /><CardBody><div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{fields.map(([label, value]) => <div key={label}><p className="text-[10.5px] uppercase tracking-wide text-ink-400">{label}</p><p className="mt-0.5 font-medium text-ink-900">{value}</p></div>)}</div></CardBody></Card></div>
      <div className="px-6 grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="Daily progress" subtitle="Physical progress, labour, materials, weather and optional risk signal" icon={Gauge} /><CardBody>
          <form onSubmit={submitProgress} className="space-y-3">
            {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{actionError.message}</div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Physical progress %</label><input className={inputClass} type="number" min="0" max="100" value={form.progress} onChange={(event) => setForm({ ...form, progress: event.target.value })} /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Labour deployed</label><input className={inputClass} type="number" min="0" value={form.labour} onChange={(event) => setForm({ ...form, labour: event.target.value })} /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Materials consumed</label><input className={inputClass} value={form.materials} onChange={(event) => setForm({ ...form, materials: event.target.value })} /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Weather</label><select className={inputClass} value={form.weather} onChange={(event) => setForm({ ...form, weather: event.target.value })}>{['Clear', 'Overcast', 'Rain', 'Hot', 'Cold', 'Windy'].map((option) => <option key={option}>{option}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Risk signal (optional)</label><select className={inputClass} value={form.riskSignal} onChange={(event) => setForm({ ...form, riskSignal: event.target.value })}><option value="">None</option><option>low</option><option>medium</option><option>high</option><option>critical</option></select></div>
            </div>
            <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Work description / notes</label><textarea className={inputClass} rows="3" value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} /></div>
            <Button type="submit" icon={Send} disabled={saving}>{saving ? 'Recording…' : 'Record daily progress'}</Button>
          </form>
          <p className="mt-3 text-xs text-ink-400">Reaching 100% marks the project COMPLETED on the backend; the status shown here is always the backend value.</p>
        </CardBody></Card>
        <Card><CardHeader title="Execution context" subtitle="Backend records for this project" icon={CloudSun} /><CardBody className="space-y-4">
          {project.completionDate && <div className="flex items-start gap-2 rounded-lg bg-leaf-50 px-3 py-2.5 text-sm text-leaf-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" /><span>Planned completion: {formatDate(project.completionDate)}</span></div>}
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Site diary entries ({diaries?.length || 0})</p><div className="space-y-2">{diaries?.length ? diaries.slice(0, 6).map((entry) => <div key={entry.id} className="rounded-lg border border-ink-150 px-3 py-2 text-sm"><div className="flex items-center justify-between"><span className="font-medium text-ink-900">{entry.workPerformed || 'Site diary entry'}</span><span className="text-xs text-ink-500">{entry.date ? formatDate(entry.date) : '—'}</span></div><p className="mt-1 text-xs text-ink-600">{entry.observations}{entry.labour ? ` · ${entry.labour} labour` : ''}{entry.materials ? ` · ${entry.materials}` : ''}</p></div>) : <p className="text-sm text-ink-500">No site diary entries yet.</p>}</div></div>
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Execution risks ({risks?.length || 0})</p><div className="space-y-2">{risks?.length ? risks.slice(0, 6).map((risk) => <div key={risk.id} className="flex items-center justify-between rounded-lg border border-ink-150 px-3 py-2 text-sm"><span className="truncate">{risk.signal || 'Registered risk'}</span><Badge tone={SEVERITY_TONE[risk.severity] || 'neutral'}>{risk.severity || '—'}</Badge></div>) : <p className="text-sm text-ink-500">No execution risks registered.</p>}</div></div>
        </CardBody></Card>
      </div>
    </div>
  )
}
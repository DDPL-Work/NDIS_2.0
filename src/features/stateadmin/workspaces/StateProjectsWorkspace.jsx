// State Projects workspace:
//   registry    → central project registry (register + view)
//   monitoring  → financial progress, completion, at-risk projects
//   templates   → project template library
//   categories  → project category taxonomy
// Project financial fields are book-keeping mirrors of finance records; the
// finance engine remains the source of truth for released/utilized numbers.
import { useMemo, useState } from 'react'
import { FolderKanban, Activity, LayoutTemplate, Tags, Plus, Eye, AlertTriangle } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { useStateProjectStore } from '../store/stateProjectStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { useStatePermission, useStateActor } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { Field, SelectField, formatAmount, FilterStrip, SummaryPill } from '../components/StateUI'
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from '../../../config/stateConstants'

const META = {
  registry: { title: 'Project Registry', eyebrow: 'STATE ADMIN · PROJECTS · REGISTRY', icon: FolderKanban, description: 'Central registry of state projects — every project is traceable to department, district, scheme and its sanction chain.' },
  monitoring: { title: 'Project Monitoring', eyebrow: 'STATE ADMIN · PROJECTS · MONITORING', icon: Activity, description: 'State-wide financial and physical progress — completion, at-risk and low-utilization projects derived from project records.' },
  templates: { title: 'Project Templates', eyebrow: 'STATE ADMIN · PROJECTS · TEMPLATES', icon: LayoutTemplate, description: 'Reusable DPR / document templates per project type.' },
  categories: { title: 'Project Categories', eyebrow: 'STATE ADMIN · PROJECTS · CATEGORIES', icon: Tags, description: 'Category taxonomy that scopes eligibility and workflows.' },
}

export default function StateProjectsWorkspace({ mode = 'registry' }) {
  const meta = META[mode]
  const Icon = meta.icon
  return (
    <div className="px-6 pb-10">
      <PageHeader eyebrow={meta.eyebrow} title={meta.title} description={meta.description} />
      <ViewForMode mode={mode} />
      {Icon && null}
    </div>
  )
}

function ViewForMode({ mode }) {
  if (mode === 'monitoring') return <ProjectMonitoringView />
  if (mode === 'templates') return <ProjectTemplatesView />
  if (mode === 'categories') return <ProjectCategoriesView />
  return <ProjectRegistryView />
}

// ── Registry ────────────────────────────────────────────────────────────────
function ProjectRegistryView() {
  const store = useStateProjectStore()
  const master = useStateMasterStore()
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const canCreate = useStatePermission('project.manage')
  const [status, setStatus] = useState('all')
  const [departmentId, setDepartmentId] = useState('')
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewFor, setViewFor] = useState(null)
  const [form, setForm] = useState({})

  const deptName = (id) => master.departments.find((d) => d.id === id)?.name || id || '—'
  const districtName = (id) => master.districts.find((d) => d.id === id)?.name || id || '—'
  const schemeName = (id) => master.schemes.find((s) => s.id === id)?.name || id || '—'

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return store.projects.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (departmentId && p.departmentId !== departmentId) return false
      if (q && !`${p.id} ${p.name}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [store.projects, status, departmentId, query])

  const totals = useMemo(() => ({
    count: store.projects.length,
    sanctioned: store.projects.reduce((a, p) => a + (p.sanctionedAmount || 0), 0),
    released: store.projects.reduce((a, p) => a + (p.releasedAmount || 0), 0),
    utilized: store.projects.reduce((a, p) => a + (p.utilizedAmount || 0), 0),
  }), [store.projects])

  const run = (fn, ok) => {
    try { fn(); pushToast(ok, 'success'); setCreateOpen(false) } catch (e) { pushToast(e.message, 'error') }
  }

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All Statuses' }, ...PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))]} />
        <SelectField label="Department" value={departmentId} onChange={setDepartmentId} options={[{ value: '', label: 'All Departments' }, ...master.departments.map((d) => ({ value: d.id, label: d.name }))]} />
        <div className="relative">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search project / ID" className="input-field px-3 py-2 text-[13px]" />
        </div>
        {canCreate && <Button icon={Plus} onClick={() => setCreateOpen(true)}>Register Project</Button>}
      </FilterStrip>

      <div className="mb-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card><CardBody><SummaryPill label="Projects" value={totals.count} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Sanctioned" value={formatAmount(totals.sanctioned)} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Released" value={formatAmount(totals.released)} tone="saffron" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Utilized" value={formatAmount(totals.utilized)} tone="leaf" /></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="Project Registry" subtitle={`${rows.length} projects`} icon={FolderKanban} />
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects found" description="Adjust filters or register a project." />
          ) : (
            <DataTable
              columns={[
                { key: 'id', label: 'Project ID', render: (r) => <span className="font-mono text-[12px]">{r.id}</span> },
                { key: 'name', label: 'Project Name', render: (r) => <span className="font-medium text-ink-900">{r.name}</span> },
                { key: 'departmentId', label: 'Department', render: (r) => deptName(r.departmentId) },
                { key: 'districtId', label: 'District', render: (r) => districtName(r.districtId) },
                { key: 'estimatedCost', label: 'Estimated Cost', render: (r) => formatAmount(r.estimatedCost) },
                { key: 'sanctionedAmount', label: 'Sanctioned', render: (r) => formatAmount(r.sanctionedAmount) },
                { key: 'releasedAmount', label: 'Released', render: (r) => <span className="text-saffron-700">{formatAmount(r.releasedAmount)}</span> },
                { key: 'utilizedAmount', label: 'Utilized', render: (r) => <span className="text-leaf-700">{formatAmount(r.utilizedAmount)}</span> },
                { key: 'completionPct', label: 'Completion', render: (r) => <Badge tone={r.completionPct >= 80 ? 'positive' : r.completionPct >= 40 ? 'warning' : 'negative'}>{r.completionPct}%</Badge> },
                { key: 'status', label: 'Status', render: (r) => <Badge tone={PROJECT_STATUS_TONE[r.status] || 'neutral'}>{PROJECT_STATUS_LABELS[r.status] || r.status}</Badge> },
                { key: '_', label: '', render: (r) => <Button variant="ghost" size="sm" icon={Eye} onClick={() => setViewFor(r)}>View</Button> },
              ]}
              rows={rows}
              keyField="id"
            />
          )}
        </CardBody>
      </Card>

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} width="max-w-2xl" title="Register Project" footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => run(() => {
          if (!form.name || !form.departmentId) throw new Error('Project name and department are required.')
          store.addProject({
            name: form.name, departmentId: form.departmentId, districtId: form.districtId || null,
            schemeId: form.schemeId || null, category: form.category || 'General', type: form.type || 'civil_works',
            estimatedCost: crFromLakh(form.estimatedCostCr), startDate: form.startDate || null,
            expectedCompletion: form.expectedCompletion || null, implementingAgency: form.implementingAgency || '',
            documents: form.documents ? form.documents.split(',').map((d) => d.trim()).filter(Boolean) : [],
          }, actor)
        }, 'Project registered in the state registry.')}>Register</Button></>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Project Name" value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Field label="Estimated Cost (₹ Crore)" type="number" step="0.01" min="0" value={form.estimatedCostCr || ''} onChange={(e) => setForm((f) => ({ ...f, estimatedCostCr: e.target.value }))} />
            <SelectField label="Department" value={form.departmentId || ''} onChange={(v) => setForm((f) => ({ ...f, departmentId: v }))} options={master.departments.map((d) => ({ value: d.id, label: d.name }))} />
            <SelectField label="District (optional)" value={form.districtId || ''} onChange={(v) => setForm((f) => ({ ...f, districtId: v }))} options={[{ value: '', label: 'None' }, ...master.districts.map((d) => ({ value: d.id, label: d.name }))]} />
            <SelectField label="Scheme (optional)" value={form.schemeId || ''} onChange={(v) => setForm((f) => ({ ...f, schemeId: v }))} options={[{ value: '', label: 'None' }, ...master.schemes.map((s) => ({ value: s.id, label: s.name }))]} />
            <Field label="Category" value={form.category || ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Rural Infrastructure" />
            <Field label="Start Date" type="date" value={form.startDate || ''} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            <Field label="Expected Completion" type="date" value={form.expectedCompletion || ''} onChange={(e) => setForm((f) => ({ ...f, expectedCompletion: e.target.value }))} />
            <Field label="Implementing Agency" value={form.implementingAgency || ''} onChange={(e) => setForm((f) => ({ ...f, implementingAgency: e.target.value }))} className="sm:col-span-2" />
            <Field label="Document IDs (comma separated)" value={form.documents || ''} onChange={(e) => setForm((f) => ({ ...f, documents: e.target.value }))} className="sm:col-span-2" placeholder="DPR-XXX.pdf, Estimate.pdf" />
          </div>
        </Modal>
      )}

      {viewFor && (
        <Modal open onClose={() => setViewFor(null)} width="max-w-2xl" title={`${viewFor.id} — ${viewFor.name}`} footer={<Button variant="ghost" onClick={() => setViewFor(null)}>Close</Button>}>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Department</span>{deptName(viewFor.departmentId)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">District</span>{districtName(viewFor.districtId)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Scheme</span>{schemeName(viewFor.schemeId)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Status</span><Badge tone={PROJECT_STATUS_TONE[viewFor.status] || 'neutral'}>{PROJECT_STATUS_LABELS[viewFor.status] || viewFor.status}</Badge></p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Estimated Cost</span>{formatAmount(viewFor.estimatedCost)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Sanctioned</span>{formatAmount(viewFor.sanctionedAmount)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Released</span>{formatAmount(viewFor.releasedAmount)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Committed</span>{formatAmount(viewFor.committedAmount)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Utilized</span>{formatAmount(viewFor.utilizedAmount)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Completion</span>{viewFor.completionPct}%</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Expected Completion</span>{viewFor.expectedCompletion || '—'}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Implementing Agency</span>{viewFor.implementingAgency || '—'}</p>
            {viewFor.gisLocation && <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">GIS Location</span>{viewFor.gisLocation.lat}, {viewFor.gisLocation.lng}</p>}
          </div>
          {viewFor.documents?.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-wide text-ink-400 mb-1">Documents</p>
              <div className="flex flex-wrap gap-2">{viewFor.documents.map((d) => <Badge key={d} tone="neutral">{d}</Badge>)}</div>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}

// ── Monitoring ──────────────────────────────────────────────────────────────
function ProjectMonitoringView() {
  const store = useStateProjectStore()
  const master = useStateMasterStore()
  const [fy] = useState('All FY')
  const today = Date.now()

  const active = store.projects.filter((p) => ['approved', 'sanctioned', 'released', 'in_progress'].includes(p.status))
  const delayed = active.filter((p) => p.expectedCompletion && new Date(p.expectedCompletion).getTime() < today)
  const lowUtil = active.filter((p) => p.releasedAmount > 0 && ((p.utilizedAmount || 0) / p.releasedAmount) < 0.4)

  const deptName = (id) => master.departments.find((d) => d.id === id)?.name || id

  const byDept = useMemo(() => {
    const map = {}
    store.projects.forEach((p) => {
      if (!map[p.departmentId]) map[p.departmentId] = { departmentId: p.departmentId, count: 0, sanctioned: 0, released: 0, utilized: 0, completion: 0 }
      const row = map[p.departmentId]
      row.count += 1
      row.sanctioned += p.sanctionedAmount || 0
      row.released += p.releasedAmount || 0
      row.utilized += p.utilizedAmount || 0
      row.completion += p.completionPct || 0
    })
    return Object.values(map).map((r) => ({ ...r, completion: Math.round(r.completion / r.count) }))
  }, [store.projects])

  const avgCompletion = active.length ? Math.round(active.reduce((a, p) => a + (p.completionPct || 0), 0) / active.length) : 0

  return (
    <>
      <FilterStrip className="mb-5">
        <span className="text-[12px] text-ink-500">Monitoring scope: {active.length} active projects · {byDept.length} departments across FY {fy}</span>
      </FilterStrip>

      <div className="mb-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card><CardBody><SummaryPill label="Active Projects" value={active.length} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Average Completion" value={`${avgCompletion}%`} tone="leaf" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="At Risk (delayed)" value={delayed.length} tone="alert" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Low Utilization" value={lowUtil.length} tone="saffron" /></CardBody></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader title="Department Project Roll-up" subtitle="Sanctioned / Released / Utilized (₹)" icon={Activity} />
          <CardBody className="p-0">
            {byDept.length === 0 ? <EmptyState icon={Activity} title="No project records" /> : (
              <DataTable
                columns={[
                  { key: 'departmentId', label: 'Department', render: (r) => deptName(r.departmentId) },
                  { key: 'count', label: 'Projects' },
                  { key: 'sanctioned', label: 'Sanctioned', render: (r) => formatAmount(r.sanctioned) },
                  { key: 'released', label: 'Released', render: (r) => <span className="text-saffron-700">{formatAmount(r.released)}</span> },
                  { key: 'utilized', label: 'Utilized', render: (r) => <span className="text-leaf-700">{formatAmount(r.utilized)}</span> },
                  { key: 'completion', label: 'Completion', render: (r) => <Badge tone={r.completion >= 70 ? 'positive' : r.completion >= 40 ? 'warning' : 'negative'}>{r.completion}%</Badge> },
                ]}
                rows={byDept}
                keyField="departmentId"
              />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Projects at Risk" subtitle="Past expected completion or low utilization" icon={AlertTriangle} />
          <CardBody className="p-0">
            {delayed.length === 0 && lowUtil.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="No projects at risk" description="All active projects are on schedule with acceptable utilization." />
            ) : (
              <DataTable
                columns={[
                  { key: 'id', label: 'Project', render: (r) => <span className="font-mono text-[12px]">{r.id}</span> },
                  { key: 'name', label: 'Name', render: (r) => <span className="text-[12.5px]">{r.name}</span> },
                  { key: '_risk', label: 'Risk', render: (r) => {
                    const isDelayed = r.expectedCompletion && new Date(r.expectedCompletion).getTime() < today
                    const isLow = r.releasedAmount > 0 && ((r.utilizedAmount || 0) / r.releasedAmount) < 0.4
                    if (isDelayed && isLow) return <Badge tone="negative">Delayed · Low utilization</Badge>
                    if (isDelayed) return <Badge tone="warning">Past expected completion</Badge>
                    return <Badge tone="saffron">Low utilization</Badge>
                  } },
                  { key: 'completionPct', label: 'Completion', render: (r) => `${r.completionPct}%` },
                ]}
                rows={[...delayed, ...lowUtil.filter((p) => !delayed.includes(p))].slice(0, 40)}
                keyField="id"
              />
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Project Financial Progress" subtitle="Sanctioned → Released → Utilized" icon={FolderKanban} />
        <CardBody>
          <div className="space-y-3">
            {active.slice(0, 30).map((p) => {
              const releasedPct = p.sanctionedAmount ? Math.min(100, Math.round(((p.releasedAmount || 0) / p.sanctionedAmount) * 100)) : 0
              const usedPct = p.releasedAmount ? Math.min(100, Math.round(((p.utilizedAmount || 0) / p.releasedAmount) * 100)) : 0
              return (
                <div key={p.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] font-medium text-ink-800 truncate">{p.id} — {p.name}</span>
                    <span className="text-[11px] text-ink-400 shrink-0">{formatAmount(p.sanctionedAmount)} sanctioned · {releasedPct}% released · {usedPct}% utilized</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                    <div className="h-full rounded-full bg-saffron-500" style={{ width: `${releasedPct}%` }} />
                  </div>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                    <div className="h-full rounded-full bg-leaf-600" style={{ width: `${usedPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </>
  )
}

// ── Templates ───────────────────────────────────────────────────────────────
function ProjectTemplatesView() {
  const store = useStateProjectStore()
  return (
    <Card>
      <CardHeader title="Project Templates" subtitle={`${store.projectTemplates.length} templates`} icon={LayoutTemplate} />
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {store.projectTemplates.map((t) => (
            <div key={t.id} className="rounded-xl border border-ink-100 p-4">
              <p className="text-[13.5px] font-semibold text-ink-900">{t.label}</p>
              <p className="text-[11px] font-mono text-ink-400 mt-0.5">{t.id}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.fields.map((f) => <Badge key={f} tone="neutral">{f}</Badge>)}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

// ── Categories ──────────────────────────────────────────────────────────────
function ProjectCategoriesView() {
  const store = useStateProjectStore()
  const master = useStateMasterStore()
  return (
    <Card>
      <CardHeader title="Project Categories" subtitle={`${store.projectCategories.length} categories`} icon={Tags} />
      <CardBody className="p-0">
        <DataTable
          columns={[
            { key: 'id', label: 'Category ID', render: (r) => <span className="font-mono text-[12px]">{r.id}</span> },
            { key: 'label', label: 'Category' },
            { key: 'departmentIds', label: 'Scoped Departments', render: (r) => (
              <span className="flex flex-wrap gap-1">{r.departmentIds.map((d) => <Badge key={d} tone="info">{master.departments.find((x) => x.id === d)?.name || d}</Badge>)}</span>
            ) },
          ]}
          rows={store.projectCategories}
          keyField="id"
        />
      </CardBody>
    </Card>
  )
}

export function crFromLakh(input) {
  const value = Number(input)
  if (!input || Number.isNaN(value)) return 0
  return Math.round(value * 10000000)
}
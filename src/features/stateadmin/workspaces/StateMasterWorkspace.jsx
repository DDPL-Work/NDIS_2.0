// Master data workspace — Departments, Districts, Schemes, Financial Years,
// Budget Heads, users & officers. Everything is configurable data; nothing
// is hard-coded. Mode is driven by the sidebar route.
import { useState } from 'react'
import {
  Building2, MapPin, Sparkles, Tags, FileText, CalendarRange, ListOrdered, Users, UserCog, Network, Plus,
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { SCHEME_TYPES, FUND_SOURCES, FINANCIAL_YEARS } from '../../../config/stateConstants'
import { useStateMasterStore } from '../store/stateMasterStore'
import { useStatePermission, useStateActor } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import {
  DepartmentsView, HierarchyView, DepartmentUsersView, DepartmentHeadsView,
  DistrictsView, DistrictOfficersView, SchemesView, SchemeCategoriesView,
  SchemeGuidelinesView, FinancialYearsView, BudgetHeadsView,
} from './masterViews'

export const MASTER_META = {
  departments: { title: 'Department Master', description: 'Central department registry — configured by State Admin.', icon: Building2, eyebrow: 'STATE ADMIN · DEPARTMENTS · DIRECTORY & MASTER' },
  hierarchy: { title: 'Department Hierarchy', description: 'Department → Directorate → District Office → Block / Subdivision → Facility.', icon: Network, eyebrow: 'STATE ADMIN · DEPARTMENTS · HIERARCHY' },
  'department-users': { title: 'Department Users', description: 'Users attached to each department.', icon: Users, eyebrow: 'STATE ADMIN · DEPARTMENTS · USERS' },
  'department-heads': { title: 'Department Heads', description: 'Heads of Department registry.', icon: UserCog, eyebrow: 'STATE ADMIN · DEPARTMENTS · HEADS' },
  districts: { title: 'District Master', description: 'District directory with officers and GIS boundary references.', icon: MapPin, eyebrow: 'STATE ADMIN · DISTRICTS · DIRECTORY & MASTER' },
  'district-officers': { title: 'District Officers', description: 'Officers appointed at district level (DM / ADM / DFO / DPO).', icon: UserCog, eyebrow: 'STATE ADMIN · DISTRICTS · OFFICERS' },
  schemes: { title: 'Scheme Master', description: 'Schemes & programmes with funding, guidelines and eligibility.', icon: Sparkles, eyebrow: 'STATE ADMIN · SCHEMES & PROGRAMS · MASTER' },
  'scheme-categories': { title: 'Scheme Categories', description: 'Taxonomy grouping schemes by sector.', icon: Tags, eyebrow: 'STATE ADMIN · SCHEMES · CATEGORIES' },
  'scheme-guidelines': { title: 'Scheme Guidelines', description: 'Guidelines and eligibility registers per scheme.', icon: FileText, eyebrow: 'STATE ADMIN · SCHEMES · GUIDELINES' },
  'financial-years': { title: 'Financial Years', description: 'Annual financial year registry.', icon: CalendarRange, eyebrow: 'STATE ADMIN · MASTER · FINANCIAL YEARS' },
  'budget-heads': { title: 'Budget Heads', description: 'Standardised budget head vocabulary.', icon: ListOrdered, eyebrow: 'STATE ADMIN · MASTER · BUDGET HEADS' },
}

export const ADDABLE_MODES = ['departments', 'districts', 'schemes', 'budget-heads', 'financial-years']

export function masterCount(mode, master) {
  return {
    departments: master.departments.length,
    hierarchy: master.departments.length,
    'department-users': master.users.length,
    'department-heads': master.departments.length,
    districts: master.districts.length,
    'district-officers': master.districts.length,
    schemes: master.schemes.length,
    'scheme-categories': master.schemeCategories.length,
    'scheme-guidelines': master.schemes.length,
    'financial-years': master.financialYears.length,
    'budget-heads': master.budgetHeads.length,
  }[mode] || 0
}

export default function StateMasterWorkspace({ mode = 'departments' }) {
  const master = useStateMasterStore()
  const canManage = useStatePermission('master.manage')
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const [modalType, setModalType] = useState(null)
  const meta = MASTER_META[mode] || MASTER_META.departments
  const Icon = meta.icon

  const run = (fn, okMessage) => {
    try { fn(); pushToast(okMessage, 'success'); setModalType(null) }
    catch (error) { pushToast(error.message, 'error') }
  }

  return (
    <div className="px-6 pb-10">
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        action={canManage && ADDABLE_MODES.includes(mode) ? (
          <Button icon={Plus} onClick={() => setModalType(mode)}>Add Record</Button>
        ) : undefined}
      />
      <Card>
        <CardHeader title={meta.title} subtitle={`${masterCount(mode, master)} records`} icon={Icon} />
        <CardBody className="p-0">
          <ModuleView mode={mode} master={master} actor={actor} canManage={canManage} pushToast={pushToast} run={run} />
        </CardBody>
      </Card>
      {modalType && <MasterModal type={modalType} master={master} actor={actor} onClose={() => setModalType(null)} pushToast={pushToast} />}
    </div>
  )
}

function ModuleView({ mode, master, actor, canManage, pushToast, run }) {
  const common = { master, actor, canManage, pushToast, run }
  switch (mode) {
    case 'hierarchy': return <HierarchyView master={master} />
    case 'department-users': return <DepartmentUsersView master={master} />
    case 'department-heads': return <DepartmentHeadsView master={master} />
    case 'districts': return <DistrictsView {...common} />
    case 'district-officers': return <DistrictOfficersView master={master} />
    case 'schemes': return <SchemesView master={master} />
    case 'scheme-categories': return <SchemeCategoriesView master={master} />
    case 'scheme-guidelines': return <SchemeGuidelinesView master={master} />
    case 'financial-years': return <FinancialYearsView master={master} />
    case 'budget-heads': return <BudgetHeadsView master={master} />
    default: return <DepartmentsView {...common} />
  }
}

function MasterModal({ type, master, actor, onClose, pushToast }) {
  const [form, setForm] = useState({})
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const submit = () => {
    try {
      if (type === 'departments') {
        if (!form.id || !form.name || !form.code) throw new Error('Department ID, name and code are required.')
        master.addDepartment({ ...form, id: form.id.trim().toLowerCase().replace(/\s+/g, '-'), status: 'active', hierarchy: ['Directorate', 'District Office', 'Block', 'Facility'], type: form.type || 'department', contact: '', phone: '', address: '' })
        pushToast(`Department "${form.name}" added to the master.`, 'success')
      } else if (type === 'districts') {
        if (!form.id || !form.name || !form.code) throw new Error('District ID, name and code are required.')
        master.addDistrict({ ...form, id: form.id.trim().toLowerCase(), status: 'active' })
        pushToast(`District "${form.name}" added to the master.`, 'success')
      } else if (type === 'schemes') {
        if (!form.id || !form.name || !form.code) throw new Error('Scheme ID, name and code are required.')
        master.addScheme({
          ...form,
          id: form.id.trim().toUpperCase(),
          departmentId: form.departmentId || null,
          type: form.type || 'centrally_sponsored',
          fundingSource: form.fundingSource || 'centrally_sponsored',
          budgetHeadId: form.budgetHeadId || 'bh-continuing',
          fy: form.fy || FINANCIAL_YEARS[2].code,
          status: form.status || 'active',
          guidelines: form.guidelines || '',
          eligibility: form.eligibility || '',
          targetDistrictIds: form.targetDistrictIds && form.targetDistrictIds.length ? form.targetDistrictIds : null,
        })
        pushToast(`Scheme "${form.name}" added to the master.`, 'success')
      } else if (type === 'budget-heads') {
        if (!form.id || !form.label || !form.code) throw new Error('Budget head code and label are required.')
        master.addBudgetHead({ id: form.id.trim().toLowerCase().replace(/\s+/g, '-'), code: form.code, label: form.label, category: form.category || 'Revenue' })
        pushToast('Budget head added.', 'success')
      } else if (type === 'financial-years') {
        const code = form.code || ''
        if (!/^\d{4}-\d{2}$/.test(code)) throw new Error('Financial year must be in the format 2027-28.')
        master.addFinancialYear({ id: `fy-${code}`, code, label: `Financial Year ${code}`, startDate: `${code.slice(0, 4)}-04-01`, endDate: `${Number(code.slice(0, 4)) + 1}-03-31`, status: 'active' })
        pushToast(`Financial year ${code} added.`, 'success')
      }
      onClose()
    } catch (error) { pushToast(error.message, 'error') }
  }
  return (
    <Modal open onClose={onClose} width="max-w-2xl" title={`Add — ${titleFor(type)}`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Create Record</Button></>}>
      <div className="space-y-3">
        {type === 'departments' && <><MasterField label="Department ID (slug)" value={form.id || ''} onChange={set('id')} placeholder="e.g. agriculture" /><MasterField label="Department Name" value={form.name || ''} onChange={set('name')} /><MasterField label="Code" value={form.code || ''} onChange={set('code')} placeholder="e.g. AGR" /><MasterField label="Head of Department" value={form.head || ''} onChange={set('head')} /></>}
        {type === 'districts' && <><MasterField label="District ID (slug)" value={form.id || ''} onChange={set('id')} placeholder="e.g. aurangabad" /><MasterField label="District Name" value={form.name || ''} onChange={set('name')} /><MasterField label="Code" value={form.code || ''} onChange={set('code')} /><MasterField label="Division" value={form.division || ''} onChange={set('division')} /></>}
        {type === 'schemes' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MasterField label="Scheme ID" value={form.id || ''} onChange={set('id')} placeholder="e.g. SCH-NEW" />
              <MasterField label="Scheme Name" value={form.name || ''} onChange={set('name')} placeholder="Full scheme name" />
              <MasterField label="Code" value={form.code || ''} onChange={set('code')} placeholder="e.g. NEW-2026" />
              <MasterSelect label="Department" value={form.departmentId || ''} onChange={set('departmentId')} options={[{ value: '', label: 'Select department' }, ...master.departments.map((d) => ({ value: d.id, label: d.name }))]} />
              <MasterSelect label="Scheme Type" value={form.type || ''} onChange={set('type')} options={[{ value: '', label: 'Select type' }, ...SCHEME_TYPES]} />
              <MasterSelect label="Funding Source" value={form.fundingSource || ''} onChange={set('fundingSource')} options={[{ value: '', label: 'Select funding source' }, ...FUND_SOURCES]} />
              <MasterSelect label="Budget Head" value={form.budgetHeadId || ''} onChange={set('budgetHeadId')} options={[{ value: '', label: 'Select budget head' }, ...master.budgetHeads.map((h) => ({ value: h.id, label: `${h.label} (${h.code})` }))]} />
              <MasterSelect label="Financial Year" value={form.fy || ''} onChange={set('fy')} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
              <MasterSelect label="Status" value={form.status || 'active'} onChange={set('status')} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            </div>
            <MasterField label="Guidelines" value={form.guidelines || ''} onChange={set('guidelines')} placeholder="Reference guidelines / approvals" />
            <MasterField label="Eligibility" value={form.eligibility || ''} onChange={set('eligibility')} placeholder="Who is eligible under the scheme" />
            <div>
              <span className="mb-1 block text-[12px] font-medium text-ink-700">Target Districts (leave empty for all districts)</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 rounded-lg border border-ink-100 bg-ink-50/50 p-2.5">
                {master.districts.map((d) => (
                  <label key={d.id} className="flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-700">
                    <input
                      type="checkbox"
                      className="accent-ink-900"
                      checked={(form.targetDistrictIds || []).includes(d.id)}
                      onChange={(e) => setForm((f) => {
                        const current = f.targetDistrictIds || []
                        return { ...f, targetDistrictIds: e.target.checked ? [...current, d.id] : current.filter((x) => x !== d.id) }
                      })}
                    />
                    {d.name}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
        {type === 'budget-heads' && <><MasterField label="Budget Head ID" value={form.id || ''} onChange={set('id')} placeholder="e.g. bh-roads" /><MasterField label="Code (Major/Minor)" value={form.code || ''} onChange={set('code')} placeholder="e.g. 4216-01-800" /><MasterField label="Label" value={form.label || ''} onChange={set('label')} /><MasterField label="Category" value={form.category || ''} onChange={set('category')} placeholder="Revenue / Capital / Scheme" /></>}
        {type === 'financial-years' && <><MasterField label="Financial Year" value={form.code || ''} onChange={set('code')} placeholder="2027-28" /></>}
      </div>
    </Modal>
  )
}

function MasterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink-700">{label}</span>
      <select value={value} onChange={onChange} className="input-field w-full px-3 py-2 text-[13px]">
        {options.map((o) => <option key={o.value + o.label} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function titleFor(type) {
  return { departments: 'Department', districts: 'District', schemes: 'Scheme', 'budget-heads': 'Budget Head', 'financial-years': 'Financial Year' }[type] || 'Record'
}

function MasterField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink-700">{label}</span>
      <input className="input-field px-3 py-2 text-[13px]" {...props} />
    </label>
  )
}
// Sub-views for the master data workspace (per mode).
import { useState } from 'react'
import { Building2, Pencil, MapPin } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useUiStore } from '../../../app/store/uiStore'
import { useStateActor, useStatePermission } from '../hooks/useStatePermissions'

export function DepartmentsView({ master, canManage, pushToast, run }) {
  const actor = useStateActor()
  const [edit, setEdit] = useState(null)
  const [field, setField] = useState({})
  const canEdit = useStatePermission('master.manage')
  const openEdit = (r) => { setEdit(r); setField({ head: r.head, contact: r.contact, address: r.address }) }
  return (
    <>
      <DataTable
        columns={[
          { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
          { key: 'name', label: 'Department' },
          { key: 'type', label: 'Type', render: (r) => <Badge tone="info">{titleText(r.type)}</Badge> },
          { key: 'head', label: 'Head of Department' },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'positive' : 'neutral'}>{r.status}</Badge> },
          { key: '_', label: 'Actions', render: (r) => canEdit && <button onClick={(e) => { e.stopPropagation(); openEdit(r) }} className="text-ink-400 hover:text-ink-900"><Pencil size={14} /></button> },
        ]}
        rows={master.departments}
        onRowClick={canManage ? (r) => openEdit(r) : undefined}
      />
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={`Edit — ${edit.name}`} footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>Close</Button>
            <Button variant="danger" onClick={() => { try { master.toggleDepartmentStatus(edit.id); pushToast(`${edit.name} ${edit.status === 'active' ? 'de-activated' : 'activated'}.`, 'success'); setEdit(null) } catch (e) { pushToast(e.message, 'error') } }}>Toggle Status</Button>
          </>
        }>
          <div className="space-y-3">
            <EditField label="Head of Department" value={field.head || ''} onChange={(v) => setField((f) => ({ ...f, head: v }))} />
            <EditField label="Contact" value={field.contact || ''} onChange={(v) => setField((f) => ({ ...f, contact: v }))} />
            <EditField label="Office Address" value={field.address || ''} onChange={(v) => setField((f) => ({ ...f, address: v }))} />
          </div>
          <div className="mt-4">
            <Button variant="primary" onClick={() => run(() => { master.updateDepartment(edit.id, field); pushToast('Department updated.', 'success') })}>Save Changes</Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export function HierarchyView({ master }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
      {master.departments.map((dept) => (
        <div key={dept.id} className="rounded-xl border border-ink-100 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Building2 size={15} className="text-ink-700" />
            <span className="text-[14px] font-semibold text-ink-950">{dept.name}</span>
            <Badge tone="info">{dept.code}</Badge>
          </div>
          <div className="space-y-1.5">
            {dept.hierarchy.map((level, i) => (
              <div key={level} className="flex items-center gap-2">
                <span className="w-4 text-right font-mono text-[10.5px] text-ink-400">{i + 1}</span>
                <span className="h-px w-3 bg-ink-200" />
                <span className="rounded-md border border-ink-100 bg-ink-50 px-2 py-1 text-[12px] text-ink-700">{level}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DepartmentUsersView({ master }) {
  const byDept = master.users.reduce((acc, u) => {
    const key = u.departmentId || 'state-wide'
    if (!acc[key]) acc[key] = []
    acc[key].push(u)
    return acc
  }, {})
  return (
    <DataTable
      columns={[
        { key: 'name', label: 'User' },
        { key: 'designation', label: 'Designation' },
        { key: 'departmentId', label: 'Department', render: (r) => r.departmentId
          ? (master.departments.find((d) => d.id === r.departmentId)?.name || r.departmentId)
          : <Badge tone="info">State-wide</Badge> },
        { key: 'username', label: 'Username', render: (r) => <span className="font-mono text-[12px]">{r.username}</span> },
        { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'positive' : 'neutral'}>{r.status}</Badge> },
      ]}
      rows={master.users}
    />
  )
}

export function DepartmentHeadsView({ master }) {
  return (
    <DataTable
      columns={[
        { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
        { key: 'name', label: 'Department' },
        { key: 'head', label: 'Head of Department' },
        { key: 'contact', label: 'Contact', render: (r) => <span className="font-mono text-[12px]">{r.contact || '—'}</span> },
        { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'positive' : 'neutral'}>{r.status}</Badge> },
      ]}
      rows={master.departments}
    />
  )
}

export function DistrictsView({ master, run }) {
  const pushToast = useUiStore((s) => s.pushToast)
  const [edit, setEdit] = useState(null)
  const openEdit = (r) => setEdit(r)
  return (
    <>
      <DataTable
        columns={[
          { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
          { key: 'name', label: 'District' },
          { key: 'division', label: 'Division' },
          { key: 'dm', label: 'District Magistrate' },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'positive' : 'neutral'}>{r.status}</Badge> },
        ]}
        rows={master.districts}
        onRowClick={openEdit}
      />
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={edit.name} footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>Close</Button>
            <Button variant="primary" onClick={() => run(() => { master.updateDistrict(edit.id, { dm: edit.dm, adm: edit.adm, dfo: edit.dfo, dpo: edit.dpo }); pushToast('District officers updated.', 'success') })}>Save Officers</Button>
          </>
        }>
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2">
            <MapPin size={14} className="text-ink-500" />
            <span className="text-[12.5px] text-ink-700">{edit.name} · {edit.division}</span>
            <Badge tone="neutral">{edit.gisBoundary}</Badge>
          </div>
          <div className="space-y-3">
            <EditField label="DM" value={edit.dm || ''} onChange={(v) => setEdit({ ...edit, dm: v })} />
            <EditField label="ADM" value={edit.adm || ''} onChange={(v) => setEdit({ ...edit, adm: v })} />
            <EditField label="District Finance Officer" value={edit.dfo || ''} onChange={(v) => setEdit({ ...edit, dfo: v })} />
            <EditField label="District Planning Officer" value={edit.dpo || ''} onChange={(v) => setEdit({ ...edit, dpo: v })} />
          </div>
        </Modal>
      )}
    </>
  )
}

export function DistrictOfficersView({ master }) {
  return (
    <DataTable
      columns={[
        { key: 'name', label: 'District' },
        { key: 'dm', label: 'DM', render: (r) => <>{r.dm}</> },
        { key: 'adm', label: 'ADM' },
        { key: 'dfo', label: 'District Finance Officer' },
        { key: 'dpo', label: 'District Planning Officer' },
      ]}
      rows={master.districts}
    />
  )
}

export function SchemesView({ master }) {
  const [selected, setSelected] = useState(null)
  return (
    <>
      <DataTable
        columns={[
          { key: 'code', label: 'Scheme Code', render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
          { key: 'name', label: 'Scheme' },
          { key: 'departmentId', label: 'Department', render: (r) => master.departments.find((d) => d.id === r.departmentId)?.name || r.departmentId },
          { key: 'type', label: 'Type', render: (r) => <Badge tone="info">{titleText(r.type)}</Badge> },
          { key: 'fundingSource', label: 'Funding Source', render: (r) => <Badge tone="neutral">{titleText(r.fundingSource)}</Badge> },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'positive' : 'neutral'}>{r.status}</Badge> },
        ]}
        rows={master.schemes}
        onRowClick={setSelected}
      />
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.name} footer={<Button variant="primary" onClick={() => setSelected(null)}>Close</Button>}>
          <div className="space-y-2 text-[13px] text-ink-700">
            <p><span className="font-medium text-ink-900">Budget Head:</span> {selected.budgetHeadId}</p>
            <p><span className="font-medium text-ink-900">Financial Year:</span> {selected.fy}</p>
            <p><span className="font-medium text-ink-900">Guidelines:</span> {selected.guidelines}</p>
            <p><span className="font-medium text-ink-900">Eligibility:</span> {selected.eligibility}</p>
            <p><span className="font-medium text-ink-900">Target Districts:</span> {selected.targetDistrictIds ? selected.targetDistrictIds.join(', ') : 'All districts'}</p>
          </div>
        </Modal>
      )}
    </>
  )
}

export function SchemeCategoriesView({ master }) {
  return (
    <DataTable
      columns={[
        { key: 'label', label: 'Category' },
        { key: 'departments', label: 'Departments', render: (r) => r.departments.map((d) => master.departments.find((x) => x.id === d)?.name || d).join(' · ') },
        { key: 'schemes', label: 'Schemes', render: (r) => <Badge tone="info">{r.schemes.length} schemes</Badge> },
      ]}
      rows={master.schemeCategories}
    />
  )
}

export function SchemeGuidelinesView({ master }) {
  return (
    <div className="divide-y divide-ink-50">
      {master.schemes.map((scheme) => (
        <div key={scheme.id} className="flex items-start justify-between gap-6 px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-ink-900">{scheme.name}</p>
            <p className="mt-0.5 text-[12.5px] text-ink-500"><span className="font-medium text-ink-600">Guidelines:</span> {scheme.guidelines}</p>
            <p className="mt-0.5 text-[12.5px] text-ink-500"><span className="font-medium text-ink-600">Eligibility:</span> {scheme.eligibility}</p>
          </div>
          <Badge tone={scheme.status === 'active' ? 'positive' : 'neutral'}>{scheme.status}</Badge>
        </div>
      ))}
    </div>
  )
}

export function FinancialYearsView({ master }) {
  return (
    <DataTable
      columns={[
        { key: 'code', label: 'Financial Year', render: (r) => <span className="font-mono text-[12.5px]">{r.code}</span> },
        { key: 'startDate', label: 'Starts', render: (r) => r.startDate },
        { key: 'endDate', label: 'Ends', render: (r) => r.endDate },
        { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'positive' : 'neutral'}>{r.status}</Badge> },
      ]}
      rows={master.financialYears}
    />
  )
}

export function BudgetHeadsView({ master }) {
  return (
    <DataTable
      columns={[
        { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
        { key: 'label', label: 'Budget Head' },
        { key: 'category', label: 'Category', render: (r) => <Badge tone="info">{r.category}</Badge> },
      ]}
      rows={master.budgetHeads}
    />
  )
}

function titleText(value) {
  return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function EditField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink-700">{label}</span>
      <input className="input-field px-3 py-2 text-[13px]" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

import { useMemo, useState } from 'react'
import { Activity, Check, Clock3, FileClock, Plus, ShieldCheck, UserCog, Users } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { useAuthorization } from '../identity/hooks/useAuthorization'
import { useIdentityStore } from '../identity/identityStore'
import { PERMISSION_CATALOG } from '../identity/permissions/permissionCatalog'
import { useAsync } from '../../../hooks/useAsync'
import { useDataVersion, DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { useUiStore } from '../../../app/store/uiStore'
import { backendEmployeeApi } from '../../../api/employeeApi'
import { AuthRepository } from '../../../services/auth/AuthRepository'

const label = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const statusTone = (status) => ({ active: 'positive', present: 'positive', approved: 'positive', ACTIVE: 'positive', ACCEPTED: 'positive', 'USER CREATED': 'info', pending: 'warning', INVITED: 'warning', PENDING: 'warning', suspended: 'negative', rejected: 'negative', offline: 'neutral', field: 'info' }[status] || 'neutral')
const roleRows = (response) => {
  if (Array.isArray(response)) return response
  return response?.roles || response?.results || response?.data || []
}

const GAP_MESSAGE = {
  attendance: 'The backend does not expose an attendance API yet — no attendance records can be shown or recorded. This screen remains as a BACKEND GAP placeholder.',
  leave: 'The backend does not expose a leave-management API yet — no leave applications can be shown or decided. This screen remains as a BACKEND GAP placeholder.',
  performance: 'The backend does not expose a performance-score API yet — no performance data can be shown. This screen remains as a BACKEND GAP placeholder.',
  audit: 'The backend does not expose a workforce audit-log API yet — no identity events can be shown. This screen remains as a BACKEND GAP placeholder.',
}

export default function DepartmentWorkforceWorkspace({ mode = 'employees' }) {
  const { dept } = useDepartment()
  const { user, can } = useAuthorization()
  const roles = useIdentityStore((state) => state.roles)
  const updateRolePermissions = useIdentityStore((state) => state.updateRolePermissions)
  const pushToast = useUiStore((s) => s.pushToast)
  const employeesVersion = useDataVersion((s) => s.versions[DATA_SCOPES.EMPLOYEES] || 0)
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id)
  const [savingInvite, setSavingInvite] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', designation: '', role: 'dept_officer', office: 'District Office', block: 'Silao' })

  const employeeFetcher = useMemo(() => () => backendEmployeeApi.list(), [])
  const { data: backendEmployees, loading: employeesLoading, error: employeesError, refetch: refetchEmployees } = useAsync(employeeFetcher, [employeesVersion])

  const rolesFetcher = useMemo(() => () => AuthRepository.listRoles(), [])
  const { data: rolesCatalog, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useAsync(rolesFetcher, [])

  const employees = useMemo(() => (backendEmployees || []).filter((item) => !item.departmentName || !dept.id || item.departmentName.toLowerCase().includes(String(dept.label || '').toLowerCase().replace(' department', '')) || item.departmentId === dept.id), [backendEmployees, dept])
  const staff = employees
  const filteredStaff = useMemo(() => staff.filter((item) => `${item.name} ${item.email} ${item.designation}`.toLowerCase().includes(query.toLowerCase())), [staff, query])
  const title = { employees: 'Employee Directory', organization: 'Organization Hierarchy', roles: 'Department Role Builder', permissions: 'Permission Matrix', attendance: 'Attendance Management', leave: 'Leave Management', performance: 'Performance Management', audit: 'Security Audit Trail' }[mode]
  const description = { employees: 'Onboard, search and manage employees on the live backend registry.', organization: 'Review reporting relationships and departmental span of control.', roles: 'Roles served by the platform (backend role catalog).', permissions: 'Configure the actions granted to each departmental role.', attendance: 'Live clock events, field status and daily workforce presence.', leave: 'Review employee leave applications and approval decisions.', performance: 'Operational performance signals derived from attendance and assigned work.', audit: 'Immutable event history for workforce and authorization activity.' }[mode]
  const actor = user || { name: 'Department Administrator', id: 'system' }

  const submitInvite = async (event) => {
    event.preventDefault()
    setInviteError(null)
    setSavingInvite(true)
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), designation: form.designation.trim(), role: form.role, office: form.office.trim(), block: form.block.trim() }
      await backendEmployeeApi.invite(payload)
      pushToast(`Invitation sent to ${payload.email}.`, 'success')
      setInviteOpen(false)
      setForm({ name: '', email: '', designation: '', role: 'dept_officer', office: 'District Office', block: 'Silao' })
    } catch (e) { setInviteError(e) } finally { setSavingInvite(false) }
  }

  const toggleStatus = async (employee) => {
    const next = employee.status === 'ACTIVE' || employee.status === 'active' ? 'INVITED' : 'ACTIVE'
    try {
      await backendEmployeeApi.update(employee.id, { status: next })
      pushToast(`${employee.name} marked ${next}.`, 'success')
      refetchEmployees()
    } catch (e) { pushToast(e.message, 'error') }
  }

  const errorBox = (message, retry) => (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm text-red-700">{message}</p>
      {retry && <Button size="sm" variant="outline" onClick={retry}>Retry</Button>}
    </div>
  )

  const employeeColumns = [
    { key: 'name', label: 'Employee', render: (row) => <div><div className="font-semibold text-ink-950">{row.name}</div><div className="text-[11px] text-ink-400">{row.employeeNumber || '—'} · {row.email}</div></div> },
    { key: 'designation', label: 'Designation', render: (row) => <span>{row.designation || label(row.role)}</span> },
    { key: 'office', label: 'Office / Block', render: (row) => <span>{row.office || '—'}<br /><small className="text-ink-400">{row.block || '—'}</small></span> },
    { key: 'status', label: 'Status', render: (row) => <Badge tone={statusTone(row.status)}>{row.statusDisplay || label(row.status)}</Badge> },
    { key: 'action', label: 'Action', render: (row) => can('workforce.manage') && <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); toggleStatus(row) }}>{row.status === 'ACTIVE' || row.status === 'active' ? 'Suspend' : 'Activate'}</Button> },
  ]

  const renderEmployees = () => (
    <Card>
      <CardHeader title="Department employees" subtitle={`${staff.length} registered workforce members on the backend registry`} icon={Users} action={can('workforce.invite') && <Button icon={Plus} size="sm" onClick={() => setInviteOpen(true)}>Invite employee</Button>} />
      <CardBody className="!p-0">
        {employeesError ? errorBox(employeesError.message, refetchEmployees)
          : employeesLoading && !staff.length ? <p className="px-4 py-4 text-sm text-ink-500">Loading employees…</p>
          : <>
              <div className="p-3 border-b border-ink-100"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or designation" className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500" /></div>
              <DataTable rows={filteredStaff} columns={employeeColumns} emptyLabel="No employees found on the backend registry" />
            </>}
      </CardBody>
    </Card>
  )

  const renderOrganization = () => (
    <Card>
      <CardHeader title="Reporting hierarchy" subtitle="Employees without a manager report to the department head." icon={UserCog} />
      <CardBody>
        {employeesError ? errorBox(employeesError.message, refetchEmployees)
          : employeesLoading && !staff.length ? <p className="text-sm text-ink-500">Loading employees…</p>
          : <div className="space-y-3">{staff.length ? staff.filter((person) => !person.managerId).map((manager) => <div key={manager.id} className="rounded-lg border border-ink-150 p-3"><div className="font-semibold text-ink-950">{manager.name} <span className="font-normal text-ink-400">— {manager.designation || label(manager.role)}</span></div><div className="mt-2 ml-4 space-y-1 border-l-2 border-sky-100 pl-3">{staff.filter((person) => person.managerId === manager.id).map((person) => <div key={person.id} className="text-sm text-ink-700">{person.name} <span className="text-ink-400">· {person.designation || label(person.role)}</span></div>)}{!staff.some((person) => person.managerId === manager.id) && <div className="text-xs text-ink-400">No direct reports</div>}</div></div>) : <p className="text-sm text-ink-400">Invite employees to establish the reporting hierarchy.</p>}</div>}
      </CardBody>
    </Card>
  )

  const renderRoles = () => (
    <Card>
      <CardHeader title="Platform role catalog" subtitle="Roles served by the backend — the authorization engine stays authoritative." icon={ShieldCheck} />
      <CardBody className="!p-0">
        {rolesError ? errorBox(rolesError.message, refetchRoles)
          : rolesLoading && !roleRows(rolesCatalog).length ? <p className="px-4 py-4 text-sm text-ink-500">Loading roles…</p>
          : <DataTable rows={roleRows(rolesCatalog)} columns={[
              { key: 'name', label: 'Role', render: (row) => <span className="font-semibold text-ink-900">{row.name || row.code || row.key}</span> },
              { key: 'code', label: 'Code', render: (row) => <span className="kbd-mono text-xs">{row.code || row.key || row.role || '—'}</span> },
              { key: 'description', label: 'Description', render: (row) => row.description || row.label || '—' },
            ]} emptyLabel="No roles returned by the backend" />}
      </CardBody>
    </Card>
  )

  const renderPermissions = () => { const role = roles.find((item) => item.id === selectedRole) || roles[0]; const selected = new Set(role?.permissions || []); return <Card><CardHeader title="Role permission matrix" subtitle="Frontend access configuration for departmental UI actions (audited locally)." icon={ShieldCheck} action={<select value={role?.id || ''} onChange={(event) => setSelectedRole(event.target.value)} className="rounded-lg border border-ink-200 px-2 py-1.5 text-sm">{roles.map((item) => <option key={item.id} value={item.id}>{label(item.name)}</option>)}</select>} /><CardBody><div className="space-y-4">{Object.entries(PERMISSION_CATALOG).map(([module, actions]) => <div key={module} className="rounded-lg border border-ink-100 p-3"><div className="mb-2 text-sm font-semibold text-ink-900">{label(module)}</div><div className="flex flex-wrap gap-2">{actions.map((action) => { const permission = `${module}.${action}`; return <button type="button" key={permission} disabled={!can('workforce.roles')} onClick={() => updateRolePermissions(actor, role.id, selected.has(permission) ? role.permissions.filter((item) => item !== permission) : [...role.permissions, permission])} className={`rounded-md border px-2 py-1 text-xs ${selected.has(permission) ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-ink-200 text-ink-500'}`}>{selected.has(permission) && <Check size={11} className="mr-1 inline" />}{label(action)}</button> })}</div></div>)}</div></CardBody></Card> }

  const renderGap = () => (
    <Card>
      <CardHeader title={`${title} — backend gap`} subtitle="No documented API for this module" icon={Clock3} />
      <CardBody>
        <div className="rounded-lg border border-saffron-200 bg-saffron-50 px-4 py-3 text-sm text-saffron-800">
          <strong>BACKEND GAP — </strong>{GAP_MESSAGE[mode]}
        </div>
      </CardBody>
    </Card>
  )

  const content = { employees: renderEmployees, organization: renderOrganization, roles: renderRoles, permissions: renderPermissions, attendance: renderGap, leave: renderGap, performance: renderGap, audit: renderGap }[mode]

  return (
    <div className="space-y-6 pb-8">
      <PageHeader eyebrow={`${dept.code} · Workforce & Identity`} title={title} description={description} />
      {content?.()}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite department employee" footer={<><Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button><Button form="employee-invite" type="submit" icon={Plus} loading={savingInvite}>Send invitation</Button></>}>
        <form id="employee-invite" onSubmit={submitInvite} className="grid gap-3 sm:grid-cols-2">
          {[['name', 'Full name'], ['email', 'Official email'], ['designation', 'Designation'], ['office', 'Office'], ['block', 'Block']].map(([key, placeholder]) => <input key={key} required={['name', 'email'].includes(key)} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} placeholder={placeholder} className="rounded-lg border border-ink-200 px-3 py-2 text-sm" />)}
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="rounded-lg border border-ink-200 px-3 py-2 text-sm">{roles.map((role) => <option key={role.id} value={role.id}>{label(role.name)}</option>)}</select>
          {inviteError && <p className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{inviteError.message}</p>}
        </form>
      </Modal>
    </div>
  )
}
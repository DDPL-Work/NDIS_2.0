// Users & Roles workspace (P8).
// State administration user registry — role assignments, status, designation,
// department scope and the permission matrix for each role. User records are
// hydrated from GET /api/users/ and every change writes through the backend.
import { useMemo, useState } from 'react'
import { ShieldCheck, UserPlus, Power, Search, KeyRound } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Pagination, { usePagedRows } from '../../../components/ui/Pagination'
import { useStateMasterStore } from '../store/stateMasterStore'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { backendUserApi } from '../../../api/userApi'
import { useStatePermission, useStateActor } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { Field, SelectField, FilterStrip, SummaryPill } from '../components/StateUI'
import { STATE_PORTAL_ROLES, STATE_PERMISSIONS, STATE_ROLE_PERMISSIONS } from '../../../config/stateConstants'
import { ROLE_LABELS } from '../../../config/constants'

const statusTone = { active: 'positive', inactive: 'neutral' }

export default function StateUsersWorkspace() {
  const master = useStateMasterStore()
  const finance = useStateFinanceStore()
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const canManage = useStatePermission('user.manage')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({})

  const roleOptions = STATE_PORTAL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] || r }))

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return master.users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (q && !`${u.name} ${u.username} ${u.designation}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [master.users, roleFilter, query])

  const { page, setPage, pageSize, setPageSize, pageRows, total } = usePagedRows(rows)

  const changeRole = async (user, role) => {
    try {
      await backendUserApi.update(user.id, { role })
      master.setUsers(master.users.map((u) => (u.id === user.id ? { ...u, role } : u)))
      finance.writeAudit({ actor, action: 'USER_ROLE_CHANGED', entity: 'user', entityId: user.id, oldValue: user.role, newValue: role, reason: `Role updated to ${ROLE_LABELS[role] || role} (${user.username}).` })
      pushToast(`${user.name} → ${ROLE_LABELS[role] || role}.`, 'success')
    } catch (e) { pushToast(e.message, 'error') }
  }

  const toggleStatus = async (user) => {
    const status = user.status === 'active' ? 'inactive' : 'active'
    try {
      await backendUserApi.update(user.id, { is_active: status === 'active' })
      master.setUsers(master.users.map((u) => (u.id === user.id ? { ...u, status } : u)))
      finance.writeAudit({ actor, action: 'USER_STATUS_CHANGED', entity: 'user', entityId: user.id, oldValue: user.status, newValue: status })
      pushToast(`${user.name} ${status === 'active' ? 'activated' : 'deactivated'}.`, 'success')
    } catch (e) { pushToast(e.message, 'error') }
  }

  const save = async () => {
    if (!form.username || !form.name) throw new Error('Username and display name are required.')
    if (master.users.some((u) => u.username === form.username.trim())) throw new Error(`Username ${form.username.trim()} already exists.`)
    const created = await backendUserApi.create({
      username: form.username.trim(),
      first_name: form.name.trim(),
      role: form.role || STATE_PORTAL_ROLES[0],
      designation: form.designation || 'Officer',
      department: form.departmentId || null,
    })
    finance.writeAudit({ actor, action: 'USER_CREATED', entity: 'user', entityId: created.username, newValue: { name: form.name.trim(), role: form.role || STATE_PORTAL_ROLES[0] } })
    await master.hydrateFromBackend()
    setCreateOpen(false)
    setForm({})
  }

  const selectedRolePills = selected ? STATE_ROLE_PERMISSIONS[selected.role] || [] : []

  return (
    <div className="px-6 pb-10">
      <PageHeader
        eyebrow="STATE ADMIN · ADMINISTRATION · USERS & ROLES"
        title="Users & Roles"
        description="Registry of state administration accounts with role-based permissions. Permissions mirror the module.action vocabulary enforced across the portal."
      />

      <FilterStrip className="mb-4">
        <SelectField label="Role filter" value={roleFilter} onChange={setRoleFilter} placeholder="All roles" options={[{ value: 'all', label: 'All Roles' }, ...roleOptions]} />
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users" className="input-field pl-8 pr-3 py-2 text-[13px]" />
        </div>
        {canManage && <Button icon={UserPlus} onClick={() => setCreateOpen(true)}>Add User</Button>}
      </FilterStrip>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <Card><CardBody><SummaryPill label="Total Users" value={master.users.length} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Active" value={master.users.filter((u) => u.status === 'active').length} tone="leaf" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Roles Configured" value={STATE_PORTAL_ROLES.length} tone="saffron" /></CardBody></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
        <Card>
          <CardHeader title="User Registry" subtitle={`${rows.length} accounts · ${roleFilter === 'all' ? 'all roles' : ROLE_LABELS[roleFilter]}`} icon={ShieldCheck} />
          <CardBody className="p-0">
            {rows.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="No users match" />
            ) : (
              <ul className="divide-y divide-ink-50">
                {pageRows.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink-900">{u.name}</p>
                      <p className="truncate text-[11.5px] text-ink-500">{u.username} · {u.designation}{u.departmentId ? ` · ${master.departments.find((d) => d.id === u.departmentId)?.name || u.departmentId}` : ''}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone="neutral">{ROLE_LABELS[u.role] || u.role}</Badge>
                      <Badge tone={statusTone[u.status]}>{u.status}</Badge>
                      {canManage && (
                        <>
                          <select
                            value={u.role}
                            onChange={(e) => changeRole(u, e.target.value)}
                            className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-[12px] font-medium text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
                          >
                            {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <Button variant="ghost" size="sm" icon={Power} onClick={() => toggleStatus(u)} aria-label={`Toggle status for ${u.name}`} disabled={u.role === 'state_super_admin'} />
                          <Button variant="ghost" size="sm" icon={KeyRound} onClick={() => setSelected(u)} aria-label={`Permissions for ${u.name}`} />
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {total > pageSize && <Pagination total={total} page={page} onPage={setPage} pageSize={pageSize} onPageSize={setPageSize} />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Role & Permission Matrix" subtitle={selected ? `${selected.name} — ${ROLE_LABELS[selected.role] || selected.role}` : 'Select a user to inspect permissions'} icon={KeyRound} />
          <CardBody>
            {!selected ? (
              <EmptyState icon={KeyRound} title="No role selected" description="Pick a user in the registry to see their module-level permissions." />
            ) : (
              <div className="space-y-2">
                {selectedRolePills.length === 0 ? (
                  <p className="text-[12.5px] text-ink-500">This role has no explicit permission entries.</p>
                ) : (
                  selectedRolePills.map((p) => (
                    <div key={p} className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 bg-ink-50/50 px-3 py-2">
                      <span className="font-mono text-[11.5px] text-ink-800">{p}</span>
                      <span className="max-w-[45%] truncate text-right text-[11px] text-ink-500">{STATE_PERMISSIONS[p] || '—'}</span>
                    </div>
                  ))
                )}
                {selected.role !== 'state_super_admin' && (
                  <p className="pt-1 text-[11px] text-ink-400">Role changes take effect immediately; the audit trail records the actor, old and new role.</p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} width="max-w-lg" title="Add User" footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => { try { save(); pushToast(`User ${form.name} created.`, 'success') } catch (e) { pushToast(e.message, 'error') } }}>Create User</Button>
          </div>
        }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Username" value={form.username || ''} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="name.dept" />
            <Field label="Display Name" value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full Name" />
            <SelectField label="Role" value={form.role || ''} onChange={(v) => setForm((f) => ({ ...f, role: v }))} options={roleOptions} />
            <Field label="Designation" value={form.designation || ''} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} placeholder="Officer / Admin" />
            <div className="sm:col-span-2">
              <SelectField label="Department Scope (optional)" value={form.departmentId || ''} onChange={(v) => setForm((f) => ({ ...f, departmentId: v }))} options={[{ value: '', label: 'State-wide' }, ...master.departments.map((d) => ({ value: d.id, label: d.name }))]} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
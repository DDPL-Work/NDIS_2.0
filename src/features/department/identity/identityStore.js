import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_ROLE_PERMISSIONS } from './permissions/permissionCatalog'

const id = (prefix, count) => `${prefix}-2026-${String(count + 101).padStart(5, '0')}`
const audit = (actor, action, module, entityId, previousValue, newValue) => ({ id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, actor: actor?.name || 'System', userId: actor?.id || actor?.sub || 'system', action, module, entityId, previousValue, newValue, ip: '127.0.0.1', timestamp: new Date().toISOString() })

// Employee records are backend-authoritative (GET /api/employees/); this
// store starts EMPTY and only holds records the local identity actions create.
const INITIAL_EMPLOYEES = []

export const useIdentityStore = create(persist((set, get) => ({
  employees: INITIAL_EMPLOYEES, roles: Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([key, permissions]) => ({ id: key, name: key.replace(/_/g, ' '), permissions, system: true })),
  attendance: [], leaves: [], tasks: [], auditLogs: [], temporaryPermissions: [], sessions: [], invitations: [],
  log: (actor, action, module, entityId, previousValue = null, newValue = null) => set((s) => ({ auditLogs: [audit(actor, action, module, entityId, previousValue, newValue), ...s.auditLogs] })),
  onboardEmployee: (actor, payload) => {
    const employee = { id: id('EMP', get().employees.length), employeeNumber: `GOV-${Date.now().toString().slice(-6)}`, status: 'active', employmentType: 'regular', attendanceStatus: 'offline', tasks: [], permissions: [], joinedAt: new Date().toISOString(), ...payload }
    set((s) => ({ employees: [...s.employees, employee], invitations: [...s.invitations, { id: id('INV', s.invitations.length), employeeId: employee.id, status: 'sent', email: employee.email, createdAt: new Date().toISOString() }], auditLogs: [audit(actor, 'EMPLOYEE_INVITED', 'workforce', employee.id, null, employee), ...s.auditLogs] }))
    return employee
  },
  updateEmployee: (actor, employeeId, updates) => set((s) => { const previous = s.employees.find((item) => item.id === employeeId); return { employees: s.employees.map((item) => item.id === employeeId ? { ...item, ...updates } : item), auditLogs: [audit(actor, 'EMPLOYEE_UPDATED', 'workforce', employeeId, previous, updates), ...s.auditLogs] } }),
  createRole: (actor, payload) => set((s) => { const role = { id: `role_${Date.now()}`, permissions: [], system: false, ...payload }; return { roles: [...s.roles, role], auditLogs: [audit(actor, 'ROLE_CREATED', 'authorization', role.id, null, role), ...s.auditLogs] } }),
  updateRolePermissions: (actor, roleId, permissions) => set((s) => ({ roles: s.roles.map((role) => role.id === roleId ? { ...role, permissions } : role), auditLogs: [audit(actor, 'ROLE_PERMISSIONS_CHANGED', 'authorization', roleId, null, permissions), ...s.auditLogs] })),
  clock: (actor, employeeId, type, gps = null) => set((s) => ({ attendance: [{ id: id('ATT', s.attendance.length), employeeId, type, gps, timestamp: new Date().toISOString(), status: type === 'clock_in' ? 'present' : 'completed' }, ...s.attendance], employees: s.employees.map((employee) => employee.id === employeeId ? { ...employee, attendanceStatus: type === 'clock_in' ? 'field' : 'offline', lastGps: gps } : employee), auditLogs: [audit(actor, type.toUpperCase(), 'attendance', employeeId, null, gps), ...s.auditLogs] })),
  applyLeave: (actor, payload) => set((s) => ({ leaves: [{ id: id('LEV', s.leaves.length), status: 'pending', appliedAt: new Date().toISOString(), ...payload }, ...s.leaves], auditLogs: [audit(actor, 'LEAVE_APPLIED', 'leave', payload.employeeId, null, payload), ...s.auditLogs] })),
  decideLeave: (actor, leaveId, status) => set((s) => ({ leaves: s.leaves.map((leave) => leave.id === leaveId ? { ...leave, status, decidedAt: new Date().toISOString() } : leave), auditLogs: [audit(actor, `LEAVE_${status.toUpperCase()}`, 'leave', leaveId), ...s.auditLogs] })),
  assignTask: (actor, payload) => set((s) => ({ tasks: [{ id: id('TSK', s.tasks.length), status: 'assigned', createdAt: new Date().toISOString(), ...payload }, ...s.tasks], auditLogs: [audit(actor, 'TASK_ASSIGNED', 'workforce', payload.assigneeId, null, payload), ...s.auditLogs] })),
  grantTemporaryPermission: (actor, payload) => set((s) => ({ temporaryPermissions: [...s.temporaryPermissions, { id: id('TMP', s.temporaryPermissions.length), grantedAt: new Date().toISOString(), ...payload }], auditLogs: [audit(actor, 'TEMPORARY_PERMISSION_GRANTED', 'authorization', payload.employeeId, null, payload), ...s.auditLogs] })),
}), { name: 'ndisp-department-identity-v2' }))

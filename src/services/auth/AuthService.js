import { AuthRepository } from './AuthRepository'
import { tokenManager } from './tokenManager'
import { ROLES, ROLE_LABELS } from '../../config/constants'
import { getDefaultRoute } from '../../app/authRoutes'

// Single canonical mapping: backend role code -> frontend canonical role code
// Backend codes are UPPER_SNAKE_CASE (e.g., DEPARTMENT_HEAD)
// Frontend canonical codes are lower_snake_case (e.g., dept_head)
export const BACKEND_TO_FRONTEND_ROLE = {
  CITIZEN: ROLES.CITIZEN,
  DISTRICT_COLLECTOR: ROLES.DISTRICT_COLLECTOR,
  DISTRICT_MAGISTRATE: ROLES.DM,
  ADM: ROLES.ADM,
  DEPARTMENT_HEAD: ROLES.DEPT_HEAD,
  DEPARTMENT_OFFICER: ROLES.DEPT_OFFICER,
  EXECUTIVE_ENGINEER: ROLES.ENGINEER,
  FIELD_INSPECTOR: ROLES.FIELD_INSPECTOR,
  FIELD_SUPERVISOR: ROLES.SUPERVISOR,
  STATE_SUPER_ADMIN: ROLES.STATE_SUPER_ADMIN,
  STATE_ADMIN: ROLES.STATE_ADMIN,
  STATE_FINANCE_ADMIN: ROLES.STATE_FINANCE_ADMIN,
  STATE_DEPARTMENT_ADMIN: ROLES.STATE_DEPT_ADMIN,
  STATE_MONITORING_OFFICER: ROLES.STATE_MONITORING_OFFICER,
  STATE_GIS_ADMIN: ROLES.STATE_GIS_ADMIN,
  SYSTEM_ADMINISTRATOR: ROLES.SYSTEM_ADMIN,
}

export const FRONTEND_TO_BACKEND_ROLE = Object.fromEntries(
  Object.entries(BACKEND_TO_FRONTEND_ROLE).map(([k, v]) => [v, k])
)

export function normalizeRoleCode(backendCode) {
  if (!backendCode) return null
  const code = String(backendCode).toUpperCase()
  return BACKEND_TO_FRONTEND_ROLE[code] || code.toLowerCase().replace(/[\s-]/g, '_')
}

export function getBackendRoleCode(frontendCode) {
  return FRONTEND_TO_BACKEND_ROLE[frontendCode] || String(frontendCode).toUpperCase().replace(/_/g, '_')
}

export function getRoleScope(frontendCode) {
  const scopes = {
    [ROLES.CITIZEN]: 'SELF',
    [ROLES.DISTRICT_COLLECTOR]: 'DISTRICT',
    [ROLES.DM]: 'DISTRICT',
    [ROLES.ADM]: 'DISTRICT',
    [ROLES.DEPT_HEAD]: 'DEPARTMENT',
    [ROLES.DEPT_OFFICER]: 'DEPARTMENT',
    [ROLES.ENGINEER]: 'DEPARTMENT',
    [ROLES.FIELD_INSPECTOR]: 'DEPARTMENT',
    [ROLES.SUPERVISOR]: 'DEPARTMENT',
    [ROLES.STATE_SUPER_ADMIN]: 'STATE',
    [ROLES.STATE_ADMIN]: 'STATE',
    [ROLES.STATE_FINANCE_ADMIN]: 'STATE',
    [ROLES.STATE_DEPT_ADMIN]: 'STATE',
    [ROLES.STATE_MONITORING_OFFICER]: 'STATE',
    [ROLES.STATE_GIS_ADMIN]: 'STATE',
    [ROLES.SYSTEM_ADMIN]: 'STATE',
  }
  return scopes[frontendCode] || 'UNKNOWN'
}

export function getRolePortal(frontendCode) {
  const portals = {
    [ROLES.CITIZEN]: 'citizen',
    [ROLES.DISTRICT_COLLECTOR]: 'admin',
    [ROLES.DM]: 'admin',
    [ROLES.ADM]: 'admin',
    [ROLES.DEPT_HEAD]: 'linedept',
    [ROLES.DEPT_OFFICER]: 'linedept',
    [ROLES.ENGINEER]: 'engineer',
    [ROLES.FIELD_INSPECTOR]: 'engineer',
    [ROLES.SUPERVISOR]: 'linedept',
    [ROLES.STATE_SUPER_ADMIN]: 'state-admin',
    [ROLES.STATE_ADMIN]: 'state-admin',
    [ROLES.STATE_FINANCE_ADMIN]: 'state-admin',
    [ROLES.STATE_DEPT_ADMIN]: 'state-admin',
    [ROLES.STATE_MONITORING_OFFICER]: 'state-admin',
    [ROLES.STATE_GIS_ADMIN]: 'state-admin',
    [ROLES.SYSTEM_ADMIN]: 'admin',
  }
  return portals[frontendCode] || 'unknown'
}

// Resolve the backend department/district/state value — which may be a scalar
// pk (department: 1), a slug (department: "health") or an object
// (department: { id: 1, name: ... }) — to a plain scalar id.
const scalarId = (value) => value && typeof value === 'object' ? (value.id ?? null) : value ?? null
// Keep numeric backend pks numeric for request payloads (?department=1) while
// preserving string slugs for the app-level store conventions.
const normalizeId = (value) => value != null ? Number(value) || value : null

export function normalizeUser(profile = {}) {
  const department = profile.department ?? profile.department_id ?? null
  const district = profile.district ?? profile.district_id ?? null
  const state = profile.state ?? profile.state_id ?? null
  const departmentId = normalizeId(scalarId(department))
  const districtId = normalizeId(scalarId(district))
  const stateId = normalizeId(scalarId(state))
  const departmentName = String(profile.department_name || (department && typeof department === 'object' ? department.name || department.label : '') || '').trim()
  const districtName = String(profile.district_name || (district && typeof district === 'object' ? district.name || district.label : '') || '').trim()
  const stateName = String(profile.state_name || (state && typeof state === 'object' ? state.name || state.label : '') || '').trim()

  // Backend role code comes from role_info.code (e.g., "DEPARTMENT_HEAD")
  // Map to frontend canonical role code (e.g., "dept_head")
  const backendRoleCode = String(profile.role_info?.code || profile.role?.code || profile.role_code || '').trim()
  const role = normalizeRoleCode(backendRoleCode)
  if (!role) throw new Error('Your account does not have a recognised NDISP role. Please contact an administrator.')

  const roleName = String(profile.role_info?.name || profile.role?.name || profile.designation || ROLE_LABELS[role] || role).trim()

  // Scope from backend role_info.scope_level or derive from role
  const scopeLevel = String(profile.role_info?.scope_level || getRoleScope(role) || '').trim()

  // Canonical identity: a scalar backend id (department: 1) is carried through
  // as { id, label, name } on user.department / user.district / user.state so
  // every consumer that reads the object form (user.department.id) sees the
  // same id exposed by the numeric departmentId / districtId fields.
  const departmentObject = departmentId != null || departmentName ? { id: departmentId, label: departmentName, name: departmentName } : null
  const districtObject = districtId != null || districtName ? { id: districtId, label: districtName, name: districtName } : null
  const stateObject = stateId != null || stateName ? { id: stateId, label: stateName, name: stateName } : null

  // Permissions: prefer backend-supplied permissions, fallback to empty (frontend derives from role)
  const permissions = Array.isArray(profile.permissions) ? profile.permissions : (Array.isArray(profile.role_info?.permissions) ? profile.role_info?.permissions : [])

  return {
    id: profile.id || profile.user_id,
    username: profile.username,
    email: profile.email,
    name: profile.full_name || profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username,
    role,
    roleCode: role, // frontend canonical code
    backendRoleCode, // original backend code
    roleName,
    scope: scopeLevel,
    departmentId,
    departmentName,
    department: departmentObject,
    districtId,
    districtName,
    district: districtObject,
    stateId,
    stateName,
    state: stateObject,
    designation: profile.designation || '',
    permissions,
  }
}

export const AuthService = {
  async login(credentials) { await AuthRepository.login(credentials); const user = normalizeUser(await AuthRepository.getCurrentUser()); tokenManager.setUser(user); return { user, redirectTo: getDefaultRoute(user.role) } },
  async signup(payload) { return AuthRepository.signup(payload) },
  async restoreSession() { if (!tokenManager.get().access && !tokenManager.get().refresh) return null; const user = normalizeUser(await AuthRepository.getCurrentUser()); tokenManager.setUser(user); return user },
  logout() { AuthRepository.logout() },
  async changePassword(payload) { return AuthRepository.changePassword(payload) },
  async forgotPassword(payload) { return AuthRepository.forgotPassword(payload) },
  async resetPassword(payload) { return AuthRepository.resetPassword(payload) },
}

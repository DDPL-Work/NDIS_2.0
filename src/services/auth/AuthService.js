import { AuthRepository } from './AuthRepository'
import { tokenManager } from './tokenManager'
import { ROLES, ROLE_LABELS } from '../../config/constants'
import { getDefaultRoute } from '../../app/authRoutes'

const ROLE_CODES = { citizen: ROLES.CITIZEN, citizen_registered: ROLES.CITIZEN, citizen_anonymous: ROLES.CITIZEN, department_officer: ROLES.DEPT_OFFICER, dept_officer: ROLES.DEPT_OFFICER, department_head: ROLES.DEPT_HEAD, dept_head: ROLES.DEPT_HEAD, executive_engineer: ROLES.ENGINEER, engineer: ROLES.ENGINEER, field_inspector: ROLES.FIELD_INSPECTOR, field_supervisor: ROLES.SUPERVISOR, adm: ROLES.ADM, district_magnetrate: ROLES.DM, district_magistrate: ROLES.DM, dm: ROLES.DM, collector: ROLES.DISTRICT_COLLECTOR, district_collector: ROLES.DISTRICT_COLLECTOR, state_admin: ROLES.STATE_ADMIN, system_admin: ROLES.SYSTEM_ADMIN }
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
  const code = String(profile.role_info?.code || profile.role?.code || profile.role_code || profile.role || '').toLowerCase().replace(/[\s-]/g, '_')
  const role = ROLE_CODES[code]
  if (!role) throw new Error('Your account does not have a recognised NDISP role. Please contact an administrator.')
  const roleName = String(profile.role_info?.name || profile.role?.name || profile.designation || ROLE_LABELS[role] || role).trim()
  // Canonical identity: a scalar backend id (department: 1) is carried through
  // as { id, label, name } on user.department / user.district / user.state so
  // every consumer that reads the object form (user.department.id) sees the
  // same id exposed by the numeric departmentId / districtId fields.
  const departmentObject = departmentId != null || departmentName ? { id: departmentId, label: departmentName, name: departmentName } : null
  const districtObject = districtId != null || districtName ? { id: districtId, label: districtName, name: districtName } : null
  const stateObject = stateId != null || stateName ? { id: stateId, label: stateName, name: stateName } : null
  return { id: profile.id || profile.user_id, username: profile.username, email: profile.email, name: profile.full_name || profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username, role, roleCode: code, roleName, departmentId, departmentName, department: departmentObject, districtId, districtName, district: districtObject, stateId, stateName, state: stateObject, designation: profile.designation || '', permissions: profile.permissions || profile.role_info?.permissions || [] }
}
export const AuthService = {
  async login(credentials) { await AuthRepository.login(credentials); const user = normalizeUser(await AuthRepository.getCurrentUser()); tokenManager.setUser(user); return { user, redirectTo: getDefaultRoute(user.role) } },
  async signup(payload) { return AuthRepository.signup(payload) },
  async restoreSession() { if (!tokenManager.get().access && !tokenManager.get().refresh) return null; const user = normalizeUser(await AuthRepository.getCurrentUser()); tokenManager.setUser(user); return user },
  logout() { AuthRepository.logout() },
}

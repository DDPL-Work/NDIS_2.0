import { apiRequest } from './apiClient'
import { mapComplaint } from './mappers/complaintMapper'
import { DEPARTMENTS } from '../config/constants'

// Department → colour lookup for the GIS map markers, legend and chips.
// Pilot sectors keep their fixed LLD palette colour; other backend line
// departments get complementary colours, and unknowns fall back to a set of
// well-spaced hues — so departments never end up with near-identical colours
// on the map (a plain id-hash can place neighbouring ids a few hues apart).
const PILOT_COLORS = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d.color]))
const COLOR_RULES = [
  { key: 'water', words: ['water', 'jjm', 'sanitation'] },
  { key: 'health', words: ['health'] },
  { key: 'education', words: ['education', 'school'] },
  { key: 'pwd', words: ['public works', 'pwd', 'road', 'transport'] },
  { key: 'electricity', words: ['electricity', 'electric', 'power'] },
  { key: 'urban', words: ['urban', 'municipal', 'ulb'] },
  { key: 'solar', words: ['solar', 'renewable'] },
  { key: 'tourism', words: ['tourism', 'heritage'] },
  { key: 'extra', words: ['forest', 'environment'], color: '#0d9488' },
  { key: 'extra', words: ['revenue'], color: '#b45309' },
  { key: 'extra', words: ['district'], color: '#334155' },
  { key: 'extra', words: ['general administration', 'general admin'], color: '#64748b' },
]
const FALLBACK_HUES = [214, 14, 152, 32, 267, 96, 322, 58, 182, 288, 128, 245]
const colorFor = (id, name = '') => {
  const lower = String(name || '').toLowerCase()
  const rule = COLOR_RULES.find(({ words }) => words.some((word) => lower.includes(word)))
  if (rule) return rule.key === 'extra' ? rule.color : PILOT_COLORS[rule.key] || rule.color
  let hash = 0; for (const char of String(id)) hash = ((hash << 5) - hash) + char.charCodeAt(0)
  return `hsl(${FALLBACK_HUES[Math.abs(hash) % FALLBACK_HUES.length]} 58% 42%)`
}
const rows = (response) => Array.isArray(response) ? response : response.users || response.results || response.data || []
export const mapDepartment = (dto = {}) => ({ id: String(dto.id), name: dto.name, description: dto.description || '', color: colorFor(dto.id, dto.name), raw: dto })
export const mapDepartmentUser = (dto = {}) => {
  const user = typeof dto.user === 'object' ? dto.user : {}
  const roleInfo = typeof dto.role_info === 'object' ? dto.role_info : {}
  const role = typeof dto.role === 'object' ? dto.role : {}
  const id = dto.id ?? dto.user_id ?? user.id
  const roleCode = String(roleInfo.code || role.code || dto.role_code || roleInfo.name || role.name || dto.role_name || '').trim()
  return {
    id: id != null ? String(id) : '',
    name: String(dto.name || dto.full_name || [dto.first_name, dto.last_name].filter(Boolean).join(' ') || user.name || user.full_name || '').trim(),
    designation: String(dto.designation || dto.designation_name || user.designation || ''),
    roleCode,
    roleName: String(dto.role_name || roleInfo.name || role.name || roleCode),
    role: roleCode,
    email: String(dto.email || user.email || ''),
    raw: dto,
  }
}
const toQuery = (params) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value != null && value !== '')).toString()
  return query ? `?${query}` : ''
}
// GET /api/department/{id}/complain/ (backend_guide2.0.md §5.5) — department
// complaint rollup: totals, per-status summary, SLA breach count and the rows.
export const mapDepartmentComplaintRollup = (dto = {}) => ({
  departmentId: String(dto.department_id ?? dto.id ?? ''),
  departmentName: dto.department_name || '',
  total: Number(dto.total_complaints ?? 0),
  slaBreached: Number(dto.sla_breached_count ?? 0),
  statusSummary: dto.status_summary || {},
  complaints: Array.isArray(dto.complaints) ? dto.complaints.map(mapComplaint) : [],
  raw: dto,
})
export const backendDepartmentApi = {
  list: async (params = {}) => rows(await apiRequest(`/departments/${toQuery(params)}`)).map(mapDepartment),
  // Department roster used by the assign / start-inspection pickers.
  // The backend exposes the department-scoped user list at
  // /api/department/{id}/users/ (id = department primary key).
  users: async (departmentId, params = {}) => rows(await apiRequest(`/department/${departmentId}/users/${toQuery(params)}`)).map(mapDepartmentUser),
  complaints: async (departmentId) => mapDepartmentComplaintRollup(await apiRequest(`/department/${departmentId}/complain/`)),
}

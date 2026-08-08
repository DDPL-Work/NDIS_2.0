import { apiRequest } from './apiClient'

const colorFor = (id) => {
  let hash = 0; for (const char of String(id)) hash = ((hash << 5) - hash) + char.charCodeAt(0)
  return `hsl(${Math.abs(hash) % 360} 58% 42%)`
}
const rows = (response) => Array.isArray(response) ? response : response.users || response.results || response.data || []
export const mapDepartment = (dto = {}) => ({ id: String(dto.id), name: dto.name, description: dto.description || '', color: colorFor(dto.id), raw: dto })
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
export const backendDepartmentApi = {
  list: async (params = {}) => rows(await apiRequest(`/departments/${toQuery(params)}`)).map(mapDepartment),
  // Department roster used by the assign / start-inspection pickers.
  // The backend exposes the department-scoped user list at
  // /api/department/{id}/users/ (id = department primary key).
  users: async (departmentId, params = {}) => rows(await apiRequest(`/department/${departmentId}/users/${toQuery(params)}`)).map(mapDepartmentUser),
}

import { apiRequest } from './apiClient'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

const rows = (value) => (Array.isArray(value) ? value : value?.results || value?.data || [])

const query = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params)
    .filter(([, item]) => item !== undefined && item !== null && item !== '')
    .map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}

const mapUser = (dto = {}) => ({
  id: dto.id,
  username: dto.username || '',
  email: dto.email || '',
  firstName: dto.first_name || '',
  lastName: dto.last_name || '',
  fullName: [dto.first_name, dto.last_name].filter(Boolean).join(' '),
  phone: dto.phone || '',
  designation: dto.designation || '',
  role: dto.role || '',
  roleInfo: dto.role_info || {},
  departmentId: dto.department ?? dto.department_id,
  departmentName: dto.department_name || '',
  districtId: dto.district ?? dto.district_id,
  districtName: dto.district_name || '',
  stateId: dto.state ?? dto.state_id,
  stateName: dto.state_name || '',
  isActive: Boolean(dto.is_active),
  isStaff: Boolean(dto.is_staff),
  isSuperuser: Boolean(dto.is_superuser),
  createdAt: dto.created_at || null,
  raw: dto,
})

const touched = () => invalidateData(DATA_SCOPES.EMPLOYEES)

// User administration (GET/POST/PATCH/DELETE /api/users/) — used by the state
// administration user registry.  Role fields stay backend-authoritative.
export const backendUserApi = {
  async list(params = {}) { return rows(await apiRequest(`/users/${query(params)}`)).map(mapUser) },
  async get(id) { return mapUser(await apiRequest(`/users/${id}/`)) },
  async create(payload) { const user = mapUser(await apiRequest('/users/', { method: 'POST', body: payload })); touched(); return user },
  async update(id, payload) { const user = mapUser(await apiRequest(`/users/${id}/`, { method: 'PATCH', body: payload })); touched(); return user },
  async remove(id) { await apiRequest(`/users/${id}/`, { method: 'DELETE' }); touched() },
}
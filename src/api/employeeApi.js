import { apiRequest } from './apiClient'
import { mapEmployee, mapEmployeeList } from './mappers/employeeMapper'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

const query = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params)
    .filter(([, item]) => item !== undefined && item !== null && item !== '')
    .map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}

const touched = () => invalidateData(DATA_SCOPES.EMPLOYEES)

// Employee registry (backend_next_guide §20).  Filters: search, role, status,
// block.  Lifecycle transitions (INVITED → PENDING → ACCEPTED → USER CREATED
// → ROLE ASSIGNED → ACTIVE) are decided by the backend; the frontend only
// renders the authoritative status.
export const backendEmployeeApi = {
  async list(params = {}) { return mapEmployeeList(await apiRequest(`/employees/${query(params)}`)) },
  async get(id) { return mapEmployee(await apiRequest(`/employees/${id}/`)) },
  async create(payload) { const employee = mapEmployee(await apiRequest('/employees/', { method: 'POST', body: payload })); touched(); return employee },
  async update(id, payload) { const employee = mapEmployee(await apiRequest(`/employees/${id}/`, { method: 'PATCH', body: payload })); touched(); return employee },
  async remove(id) { await apiRequest(`/employees/${id}/`, { method: 'DELETE' }); touched() },
  async invite(payload) { const employee = mapEmployee(await apiRequest('/employees/invite/', { method: 'POST', body: payload })); touched(); return employee },
  async acceptInvite(payload) { const employee = mapEmployee(await apiRequest('/employees/accept-invite/', { method: 'POST', body: payload })); touched(); return employee },
}
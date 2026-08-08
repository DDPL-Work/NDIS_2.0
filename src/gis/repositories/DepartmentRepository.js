import { backendDepartmentApi } from '../../api/departmentApi'

// Single data adapter boundary for department master data (backend_guide §4.1).
export const DepartmentRepository = {
  list: (params = {}) => backendDepartmentApi.list(params),
  // Department-scoped user roster for workflow assignment pickers.
  users: (departmentId, params = {}) => backendDepartmentApi.users(departmentId, params),
}

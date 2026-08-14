import { backendDepartmentApi } from '../../api/departmentApi'
import { backendProjectApi } from '../../api/projectApi'
import { backendProposalApi } from '../../api/proposalApi'

// Single data adapter boundary for department master data (backend_guide §4.1).
export const DepartmentRepository = {
  list: (params = {}) => backendDepartmentApi.list(params),
  // Department-scoped user roster for workflow assignment pickers.
  users: (departmentId, params = {}) => backendDepartmentApi.users(departmentId, params),
  // Department complaint rollup (GET /api/department/{id}/complain/) — used by
  // the admin executive overview for per-department grievance counts + trend.
  complaints: (departmentId) => backendDepartmentApi.complaints(departmentId),
  // Department-scoped project registry (GET /api/projects/?department={id}).
  projects: (departmentId) => backendProjectApi.list({ department: departmentId }),
  // Department-scoped proposal registry (GET /api/proposals/?department={id}).
  proposals: (departmentId) => backendProposalApi.list({ department: departmentId }),
}

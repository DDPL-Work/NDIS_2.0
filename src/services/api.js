// Compatibility façade for legacy views.  It only delegates to repository/API
// modules; deliberately no local collections, seeded records, or fake latency.
import { backendGisApi } from '../api/gisApi'
import { backendNotificationApi } from '../api/notificationApi'
import { backendDashboardApi } from '../api/dashboardApi'
import { backendProposalApi } from '../api/proposalApi'
import { backendEmployeeApi } from '../api/employeeApi'
import { backendBudgetApi } from '../api/budgetApi'
import { backendUserApi } from '../api/userApi'
import { ComplaintRepository } from '../gis/repositories/ComplaintRepository'
import { unsupported } from '../api/apiClient'

export const masterDataApi = {
  listDistricts: () => unsupported('district master data'),
  listDepartments: () => unsupported('department master data'),
}

export const gisApi = {
  searchFacilities: (params) => backendGisApi.facilities(params),
  getAllFacilities: (districtId) => backendGisApi.facilities({ districtId }),
  getFacility: (id) => backendGisApi.facility(id),
  getDistrictBoundary: () => unsupported('district boundary data'),
  catalog: () => backendGisApi.catalog(),
  layer: (name) => backendGisApi.layer(name),
  facilitiesGeojson: (params) => backendGisApi.facilitiesGeojson(params),
}

export const workflowApi = {
  listGrievances: (params) => ComplaintRepository.list(params),
  trackGrievance: async (code) => (await ComplaintRepository.list({ tracking_code: code }))[0] || null,
  submitGrievance: (payload) => ComplaintRepository.create(payload),
  getComplaint: (id) => ComplaintRepository.detail(id),
  getComplaintTimeline: (id) => ComplaintRepository.timeline(id),
  assignComplaint: (id, payload) => ComplaintRepository.assign(id, payload),
  acceptComplaint: (id, payload) => ComplaintRepository.accept(id, payload),
  startComplaintInspection: (id, payload) => ComplaintRepository.startInspection(id, payload),
  resolveComplaint: (id, payload) => ComplaintRepository.resolve(id, payload),
  escalateComplaint: (id, payload) => ComplaintRepository.escalate(id, payload),
  listProposals: (params) => backendProposalApi.list(params),
  getProposal: (id) => backendProposalApi.get(id),
  getDirectives: () => unsupported('directives'),
  // Legacy callers passed a full proposal payload; the backend contract for
  // creating a proposal is POST /api/proposals/ (Step 1 — need identification).
  // Submission is the separate /submit/ workflow action used by the wizard.
  submitProposal: (payload) => backendProposalApi.create(payload),
  // There is no single backend equivalent for a free-form state transition —
  // the backend exposes submit/approve/reject/sanction actions instead.
  transitionProposal: () => unsupported('proposal workflow transitions'),
}

// The documented dashboard APIs are aggregate sources.  Views that require
// more specialised analytics must wait for a documented backend endpoint.
export const analyticsApi = {
  getCitizenDashboard: () => backendDashboardApi.citizen(),
  getMyDashboard: () => backendDashboardApi.myDashboard(),
  getDepartmentDashboard: (params) => backendDashboardApi.department(params),
  getOfficerDashboard: () => backendDashboardApi.officer(),
  getFieldInspectorDashboard: () => backendDashboardApi.fieldInspector(),
  getDistrictDashboard: (params) => backendDashboardApi.district(params),
  getDistrictCollectorDashboard: (params) => backendDashboardApi.districtCollector(params),
  getDmDashboard: (params) => backendDashboardApi.dm(params),
  getAdmDashboard: (params) => backendDashboardApi.adm(params),
  getStateDashboard: (params) => backendDashboardApi.state(params),
  getDepartmentKpis: (districtId) => backendDashboardApi.district({ district: districtId }).then((data) => data.department_kpis || data.departments || []),
  getDistrictSummary: (districtId) => backendDashboardApi.district({ district: districtId }),
  getHotspots: () => ComplaintRepository.getHeatmap(),
  getRecommendations: () => unsupported('AI recommendations'),
  getBudgetUtilization: () => unsupported('budget analytics'),
  getBudgetTimeline: () => unsupported('budget analytics'),
}

export const schemeApi = { listSchemes: (params) => backendBudgetApi.schemes.list(params) }

export const notificationApi = {
  listNotifications: (params) => backendNotificationApi.list(params),
}

export const ingestionApi = { uploadCsv: () => unsupported('CSV ingestion') }
export const directoryApi = {
  listUsers: (params) => backendUserApi.list(params),
  getUser: (id) => backendUserApi.get(id),
  listEmployees: (params) => backendEmployeeApi.list(params),
  getEmployee: (id) => backendEmployeeApi.get(id),
  inviteEmployee: (payload) => backendEmployeeApi.invite(payload),
  listFieldEngineers: (params) => backendEmployeeApi.list({ ...params, role: 'FIELD_INSPECTOR' }),
}

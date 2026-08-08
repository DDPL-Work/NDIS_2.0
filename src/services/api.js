// Compatibility façade for legacy views.  It only delegates to repository/API
// modules; deliberately no local collections, seeded records, or fake latency.
import { backendGisApi } from '../api/gisApi'
import { backendNotificationApi } from '../api/notificationApi'
import { backendDashboardApi } from '../api/dashboardApi'
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
  listProposals: () => unsupported('proposals'),
  getProposal: () => unsupported('proposals'),
  getDirectives: () => unsupported('directives'),
  submitProposal: () => unsupported('proposals'),
  transitionProposal: () => unsupported('proposal workflow'),
}

// The documented dashboard APIs are aggregate sources.  Views that require
// more specialised analytics must wait for a documented backend endpoint.
export const analyticsApi = {
  getCitizenDashboard: () => backendDashboardApi.citizen(),
  getDepartmentDashboard: (params) => backendDashboardApi.department(params),
  getOfficerDashboard: () => backendDashboardApi.officer(),
  getDistrictDashboard: (params) => backendDashboardApi.district(params),
  getStateDashboard: (params) => backendDashboardApi.state(params),
  getDepartmentKpis: (districtId) => backendDashboardApi.district({ district: districtId }).then((data) => data.department_kpis || data.departments || []),
  getDistrictSummary: (districtId) => backendDashboardApi.district({ district: districtId }),
  getHotspots: () => ComplaintRepository.getHeatmap(),
  getRecommendations: () => unsupported('AI recommendations'),
  getBudgetUtilization: () => unsupported('budget analytics'),
  getBudgetTimeline: () => unsupported('budget analytics'),
}

export const schemeApi = { listSchemes: () => unsupported('schemes') }

export const notificationApi = {
  listNotifications: (params) => backendNotificationApi.list(params),
}

export const ingestionApi = { uploadCsv: () => unsupported('CSV ingestion') }
export const directoryApi = {
  listUsers: () => unsupported('user directory'),
  listFieldEngineers: () => unsupported('employee directory'),
}

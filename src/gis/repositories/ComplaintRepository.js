import { backendComplaintApi } from '../../api/complaintApi'
import { mapTimelineEntry } from '../../api/mappers/complaintMapper'

// Unified complaint data repository. Every read AND every workflow mutation in
// the app goes through this single boundary (backend_guide.md §10.5):
//   - list() reads GET /api/complaints/ which is already role-filtered by the
//     backend for the authenticated user — views must NOT filter client-side.
//   - detail()/timeline() are deep reads used by every complaint modal.
//   - assign / accept / startInspection / resolve / feedback / close / reopen /
//     transfer / escalate / reject / uploadEvidence map 1:1 to the action
//     endpoints.
//
// The HTTP layer (complaintApi) already normalises DTOs via mapComplaint, so
// these delegations return application-shaped records as-is; re-mapping here
// would re-derive fields from raw keys that no longer exist.
//
// Spatial queries (nearby / nearest facility / heatmap / geojson) share this
// module too, so no view has to talk to the HTTP layer directly.
export const ComplaintRepository = {
  // Reads
  list: (filters = {}) => backendComplaintApi.list(filters),
  detail: (id) => backendComplaintApi.byId(id),
  timeline: async (id) => (await backendComplaintApi.timeline(id)).map(mapTimelineEntry),

  // Creation
  create: (payload) => backendComplaintApi.create(payload),

  // Workflow mutations
  assign: (id, payload = {}) => backendComplaintApi.assign(id, payload),
  accept: (id, payload = {}) => backendComplaintApi.accept(id, payload),
  startInspection: (id, payload = {}) => backendComplaintApi.startInspection(id, payload),
  resolve: (id, payload = {}) => backendComplaintApi.resolve(id, payload),
  feedback: (id, payload = {}) => backendComplaintApi.citizenFeedback(id, payload),
  close: (id) => backendComplaintApi.close(id),
  reopen: (id, payload = {}) => backendComplaintApi.reopen(id, payload),
  transfer: (id, payload = {}) => backendComplaintApi.transfer(id, payload),
  escalate: (id, payload = {}) => backendComplaintApi.escalate(id, payload),
  reject: (id, payload = {}) => backendComplaintApi.reject(id, payload),
  uploadEvidence: (id, files) => backendComplaintApi.uploadEvidence(id, files),

  // Spatial read endpoints
  findNearby: async ({ lat, lng, radius }) => {
    const response = await backendComplaintApi.nearby({ lat, lng, radius })
    return response?.results || response
  },
  findNearestFacility: ({ lat, lng }) => backendComplaintApi.nearestFacility({ lat, lng }),
  getHeatmap: (params = {}) => backendComplaintApi.heatmap(params),
  getGeojson: (params = {}) => backendComplaintApi.geojson(params),

  // Backwards-compatible aliases used by the complaint engine and spatial code.
  find: (filters = {}) => backendComplaintApi.list(filters),
  findById: (id) => backendComplaintApi.byId(id),
  findTimeline: async (id) => (await backendComplaintApi.timeline(id)).map(mapTimelineEntry),
}
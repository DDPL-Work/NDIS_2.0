import { apiRequest, withQuery } from './apiClient'

// Backend-driven structured citizen feedback API.
// Paths aligned to backend_guide_next2.2.md §26:
//   GET/POST /api/feedback/questions/        — question sets
//   GET/POST /api/feedback/responses/        — citizen submissions
//   GET       /api/feedback/aggregation/     — aggregated ratings
//   GET       /api/feedback/analytics/       — real-time analytics (query params)
//
// The frontend ONLY renders what the backend returns.

export const backendFeedbackApi = {
  // Question Sets — GET/POST /api/feedback/questions/
  async listQuestionSets(params = {}) {
    return apiRequest(withQuery('/feedback/questions/', params))
  },

  async getQuestionSet(id) {
    return apiRequest(`/feedback/questions/${id}/`)
  },

  async createQuestionSet(payload) {
    return apiRequest('/feedback/questions/', { method: 'POST', body: payload })
  },

  async updateQuestionSet(id, payload) {
    return apiRequest(`/feedback/questions/${id}/`, { method: 'PATCH', body: payload })
  },

  // Feedback Responses — GET/POST /api/feedback/responses/
  async listSubmissions(params = {}) {
    return apiRequest(withQuery('/feedback/responses/', params))
  },

  async getSubmission(id) {
    return apiRequest(`/feedback/responses/${id}/`)
  },

  async createSubmission(payload) {
    return apiRequest('/feedback/responses/', { method: 'POST', body: payload })
  },

  // Aggregated Feedback Ratings — GET /api/feedback/aggregation/
  async getAggregation(params = {}) {
    return apiRequest(withQuery('/feedback/aggregation/', params))
  },

  // Analytics — GET /api/feedback/analytics/ (single endpoint, query-param driven)
  // The backend exposes one analytics endpoint with filters:
  //   ?start_date=...&end_date=...&department=...&district=...
  //   ?view=overview|questions|locations|trends|distribution
  // The frontend maps its granular calls to this single endpoint.
  async getOverviewAnalytics(params = {}) {
    return apiRequest(withQuery('/feedback/analytics/', { ...params, view: 'overview' }))
  },

  async getQuestionAnalytics(params = {}) {
    return apiRequest(withQuery('/feedback/analytics/', { ...params, view: 'questions' }))
  },

  async getLocationAnalytics(params = {}) {
    return apiRequest(withQuery('/feedback/analytics/', { ...params, view: 'locations' }))
  },

  async getTrends(params = {}) {
    return apiRequest(withQuery('/feedback/analytics/', { ...params, view: 'trends' }))
  },

  async getResponseDistribution(params = {}) {
    return apiRequest(withQuery('/feedback/analytics/', { ...params, view: 'distribution' }))
  },

  // Map Data — query-param driven on the same analytics endpoint
  async getMapData(params = {}) {
    return apiRequest(withQuery('/feedback/analytics/', { ...params, view: 'map' }))
  },

  // Department/Service metadata
  async getMetadata() {
    return apiRequest('/feedback/analytics/', { method: 'GET' })
  },
}

export default backendFeedbackApi
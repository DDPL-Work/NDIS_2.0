import { apiRequest } from './apiClient'

// Backend-driven structured citizen feedback API.
// All question sets, response types, and aggregation logic are authoritative on the backend.
// The frontend ONLY renders what the backend returns.

const query = (params = {}) => {
  const value = new URLSearchParams(
    Object.entries(params)
      .filter(([, item]) => item !== undefined && item !== null && item !== '')
      .map(([key, item]) => [key, String(item)])
  )
  return value.toString() ? `?${value}` : ''
}

export const backendFeedbackApi = {
  // Question Sets
  // GET /api/feedback/question-sets/
  async listQuestionSets(params = {}) {
    return apiRequest(`/feedback/question-sets/${query(params)}`)
  },

  // GET /api/feedback/question-sets/{id}/
  async getQuestionSet(id) {
    return apiRequest(`/feedback/question-sets/${id}/`)
  },

  // POST /api/feedback/question-sets/
  async createQuestionSet(payload) {
    return apiRequest('/feedback/question-sets/', { method: 'POST', body: payload })
  },

  // PATCH /api/feedback/question-sets/{id}/
  async updateQuestionSet(id, payload) {
    return apiRequest(`/feedback/question-sets/${id}/`, { method: 'PATCH', body: payload })
  },

  // Feedback Submissions
  // GET /api/feedback/submissions/
  async listSubmissions(params = {}) {
    return apiRequest(`/feedback/submissions/${query(params)}`)
  },

  // GET /api/feedback/submissions/{id}/
  async getSubmission(id) {
    return apiRequest(`/feedback/submissions/${id}/`)
  },

  // POST /api/feedback/submissions/
  async createSubmission(payload) {
    return apiRequest('/feedback/submissions/', { method: 'POST', body: payload })
  },

  // Aggregations & Analytics
  // GET /api/feedback/analytics/overview/?district=...&department=...&date_from=...&date_to=...
  async getOverviewAnalytics(params = {}) {
    return apiRequest(`/feedback/analytics/overview/${query(params)}`)
  },

  // GET /api/feedback/analytics/by-question/?district=...&question_set=...&date_from=...&date_to=...
  async getQuestionAnalytics(params = {}) {
    return apiRequest(`/feedback/analytics/by-question/${query(params)}`)
  },

  // GET /api/feedback/analytics/by-location/?district=...&level=block|village|facility&date_from=...&date_to=...
  async getLocationAnalytics(params = {}) {
    return apiRequest(`/feedback/analytics/by-location/${query(params)}`)
  },

  // GET /api/feedback/analytics/trends/?district=...&granularity=day|week|month&date_from=...&date_to=...
  async getTrends(params = {}) {
    return apiRequest(`/feedback/analytics/trends/${query(params)}`)
  },

  // GET /api/feedback/analytics/distribution/?district=...&question_set=...&question=...&date_from=...&date_to=...
  async getResponseDistribution(params = {}) {
    return apiRequest(`/feedback/analytics/distribution/${query(params)}`)
  },

  // Map Data for Feedback Visualization
  // GET /api/feedback/map/?district=...&level=block|village|facility&department=...&date_from=...&date_to=...
  async getMapData(params = {}) {
    return apiRequest(`/feedback/map/${query(params)}`)
  },

  // Department/Service metadata
  // GET /api/feedback/metadata/
  async getMetadata() {
    return apiRequest('/feedback/metadata/')
  },
}

export default backendFeedbackApi
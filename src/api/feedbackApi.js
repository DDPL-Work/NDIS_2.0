import { apiRequest, withQuery } from './apiClient'
import { normalizeResponseType } from '../features/feedback/feedbackConstants'

// ---------------------------------------------------------------------------
// Question normalizer — transforms backend question-set envelopes into a flat
// array of normalized frontend question objects.
//
// Handles backend response shapes:
//   A) Bare array:              [{ id, questions: [...] }]
//   B) { results: [...] }:      { results: [{ id, questions: [...] }] }
//   C) { data: [...] }:         { data: [{ id, questions: [...] }] }
//   D) { records: [...] }:      { records: [{ id, questions: [...] }] }
//   E) { data: { results: [...] } }
//   F) Direct questions array:  [{ id, question_text: "..." }]
//   G) Single question object:  { id, question_text: "..." }
// ---------------------------------------------------------------------------

/**
 * Extract the array of question-set wrappers from any backend envelope.
 */
function extractQuestionSets(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'object') {
    if (Array.isArray(payload.results)) return payload.results
    if (Array.isArray(payload.data)) {
      // data may be an array of question-sets OR { results: [...] }
      if (payload.data.results && Array.isArray(payload.data.results)) return payload.data.results
      return payload.data
    }
    if (Array.isArray(payload.records)) return payload.records
  }
  return []
}

/**
 * Normalize a single raw backend question into the frontend model.
 *
 * Backend shape:
 *   { id, question_text, response_type, options: ["1 Star", ...], question_set }
 *
 * Frontend shape:
 *   { id, text, responseType, options: [{ value, label }], questionSetId, required }
 */
function normalizeQuestion(raw) {
  if (!raw || !raw.question_text) return null

  const responseType = normalizeResponseType(raw.response_type)

  // Build options array: backend returns string[] or { value, label }[]
  let options = []
  if (Array.isArray(raw.options)) {
    options = raw.options.map((opt) => {
      if (typeof opt === 'string') return { value: opt, label: opt }
      if (opt && typeof opt === 'object') return { value: opt.value ?? opt.id ?? String(opt), label: opt.label ?? opt.text ?? String(opt.value ?? opt.id ?? opt) }
      return { value: String(opt), label: String(opt) }
    })
  }

  return {
    id: raw.id,
    text: raw.question_text,
    responseType,
    options,
    questionSetId: raw.question_set ?? null,
    // Backend does not currently expose a required flag; default to false
    required: Boolean(raw.required),
  }
}

/**
 * Flatten all questions from question-set wrappers into a normalized array.
 * This is the primary normalizer used by UI components.
 *
 * @param {object|array} payload - Raw API response from /feedback/questions/
 * @returns {Array} Normalized question objects
 */
export function extractQuestions(payload) {
  const sets = extractQuestionSets(payload)
  if (import.meta.env?.DEV) {
    console.log('[NDISP Feedback] Question sets count:', sets.length)
  }

  const flat = sets.flatMap((set) => {
    if (Array.isArray(set?.questions)) return set.questions
    // If the set itself is a question (no wrapper)
    if (set?.question_text) return [set]
    return []
  })
  if (import.meta.env?.DEV) {
    console.log('[NDISP Feedback] Flattened questions count:', flat.length)
  }

  const normalized = flat.map(normalizeQuestion).filter(Boolean)
  if (import.meta.env?.DEV) {
    console.log('[NDISP Feedback] Normalized questions:', normalized)
  }

  return normalized
}

/**
 * Extract the first matching question set with metadata.
 * Returns { id, title, service_type, questions: [...] } or null.
 */
export function extractFirstQuestionSet(payload) {
  const sets = extractQuestionSets(payload)
  if (!sets.length) return null
  const first = sets[0]
  return {
    id: first.id,
    title: first.title || 'Feedback',
    serviceType: first.service_type || null,
    isActive: first.is_active !== false,
    questions: extractQuestions(first.questions ? first : []),
  }
}

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
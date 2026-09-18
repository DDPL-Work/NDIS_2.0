// Revenue & Property Intelligence — Revenue Analytics API
// Mirrors backend endpoints: /revenue/analytics/

import { apiRequest, withQuery, normalizeRows } from '../../../api/apiClient'

const PATH = '/revenue/analytics/'
const IS_DEV = import.meta.env.DEV

async function safeApiCall(path, options = {}) {
  try {
    return await apiRequest(path, options)
  } catch (error) {
    if (IS_DEV) {
      console.warn('[Revenue Analytics] API call failed, using dev fallback:', error?.message)
      return null
    }
    throw error
  }
}

export const revenueAnalyticsApi = {
  async getKpis(filters = {}) {
    return safeApiCall(withQuery(`${PATH}kpis/`, filters))
  },

  async getCollectionHeatmap(filters = {}) {
    return safeApiCall(withQuery(`${PATH}collection-heatmap/`, filters), { timeout: 60000 })
  },

  async getArrearsHeatmap(filters = {}) {
    return safeApiCall(withQuery(`${PATH}arrears-heatmap/`, filters), { timeout: 60000 })
  },

  async getDemandHeatmap(filters = {}) {
    return safeApiCall(withQuery(`${PATH}demand-heatmap/`, filters), { timeout: 60000 })
  },

  async getRevenueGap(filters = {}) {
    return safeApiCall(withQuery(`${PATH}revenue-gap/`, filters))
  },

  async getPropertyDensity(filters = {}) {
    return safeApiCall(withQuery(`${PATH}property-density/`, filters), { timeout: 60000 })
  },

  async getHighValueProperties(filters = {}) {
    const response = await safeApiCall(withQuery(`${PATH}high-value-properties/`, filters))
    return response ? normalizeRows(response) : []
  },

  async getAssessmentChangeCandidates(filters = {}) {
    const response = await safeApiCall(withQuery(`${PATH}assessment-change/`, filters))
    return response ? normalizeRows(response) : []
  },

  async getBlockWardAnalytics(filters = {}) {
    return safeApiCall(withQuery(`${PATH}block-ward/`, filters))
  },

  async getRevenueTrends(filters = {}) {
    return safeApiCall(withQuery(`${PATH}trends/`, filters))
  },

  async getReviewCandidates(filters = {}) {
    const response = await safeApiCall(withQuery(`${PATH}review-candidates/`, filters))
    return response ? normalizeRows(response) : []
  },

  async getCollectionVsDemand(filters = {}) {
    return safeApiCall(withQuery(`${PATH}collection-vs-demand/`, filters))
  },

  async getTopDefaulters(filters = {}) {
    const response = await safeApiCall(withQuery(`${PATH}top-defaulters/`, filters))
    return response ? normalizeRows(response) : []
  },
}

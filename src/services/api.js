// Single integration seam between the UI and data. Every function here returns
// a Promise and is grouped the same way the LLD's microservice catalog is
// (svc-gis, svc-asset, svc-workflow, svc-analytics, svc-notification — Vol 1
// §8.7). Swapping mock data for real HTTP calls to the API Gateway later means
// editing only this file — no component should import from `./mock/*` directly.
import { DISTRICTS, DEPARTMENTS } from '../config/constants'
import { getAllFacilities, getFacilitiesBy, getFacilityById } from './mock/facilities'
import { getAllProposals, getProposalsBy, getProposalById, getDirectivesFor } from './mock/workflows'
import { getAllGrievances, getGrievancesBy, findGrievanceByTrackingCode } from './mock/grievances'
import { getSchemes } from './mock/schemes'
import { getDepartmentKpis, getDistrictSummary, getHotspots, getRecommendations, getBudgetUtilization, getBudgetTimeline } from './mock/analytics'
import { getNotifications } from './mock/notifications'
import { simulateCsvIngestion } from './mock/ingestion'
import { getUserDirectory, getFieldEngineers } from './mock/users'
import { getDistrictBoundary } from './mock/boundaries'

// Simulated network latency so loading states are real, not instantaneous —
// production API p95 targets are <300ms non-spatial / <800ms spatial (Vol 1 §5).
function delay(min = 220, max = 520) {
  const ms = min + Math.random() * (max - min)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ok(data, opts) {
  await delay(opts?.min, opts?.max)
  return data
}

export const masterDataApi = {
  async listDistricts() {
    return ok(DISTRICTS)
  },
  async listDepartments() {
    return ok(DEPARTMENTS)
  },
}

// svc-gis / svc-asset / svc-search
export const gisApi = {
  async searchFacilities(params) {
    return ok(getFacilitiesBy(params), { min: 300, max: 700 })
  },
  async getAllFacilities(districtId) {
    return ok(getFacilitiesBy({ districtId }))
  },
  async getFacility(id) {
    return ok(getFacilityById(id))
  },
  async getDistrictBoundary(districtId) {
    return ok(getDistrictBoundary(districtId))
  },
}

// svc-workflow
export const workflowApi = {
  async listProposals(params) {
    return ok(getProposalsBy(params))
  },
  async getProposal(id) {
    return ok(getProposalById(id))
  },
  async getDirectives(departmentId) {
    return ok(getDirectivesFor(departmentId))
  },
  async listGrievances(params) {
    return ok(getGrievancesBy(params))
  },
  async trackGrievance(code) {
    return ok(findGrievanceByTrackingCode(code), { min: 400, max: 800 })
  },
  // Mutations mutate an in-memory list only — demonstrates the intended
  // request shape (LLD Vol 4 API contracts) without a persistence layer.
  async submitProposal(payload) {
    const all = getAllProposals()
    const created = {
      id: `PROP-${payload.departmentId.toUpperCase()}-${1000 + all.length}`,
      state: 'submitted',
      submittedAt: new Date().toISOString(),
      history: [{ state: 'draft', at: new Date().toISOString() }, { state: 'submitted', at: new Date().toISOString() }],
      ...payload,
    }
    all.unshift(created)
    return ok(created, { min: 400, max: 900 })
  },
  async transitionProposal(id, nextState, remarks) {
    const proposal = getProposalById(id)
    if (proposal) {
      proposal.state = nextState
      proposal.remarks = remarks || proposal.remarks
      proposal.history = [...proposal.history, { state: nextState, at: new Date().toISOString() }]
    }
    return ok(proposal, { min: 350, max: 750 })
  },
  async submitGrievance(payload) {
    const all = getAllGrievances()
    const created = {
      id: `GRV-${payload.departmentId.toUpperCase()}-${2000 + all.length}`,
      trackingCode: `NDISP-${payload.departmentId.slice(0, 2).toUpperCase()}${100000 + all.length}`,
      state: 'submitted',
      submittedAt: new Date().toISOString(),
      slaDueAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      reporterMasked: true,
      ...payload,
    }
    all.unshift(created)
    return ok(created, { min: 400, max: 900 })
  },
}

// svc-analytics (Enterprise Spatial Analytics Engine)
export const analyticsApi = {
  async getDepartmentKpis(districtId) {
    return ok(getDepartmentKpis(districtId), { min: 300, max: 650 })
  },
  async getDistrictSummary(districtId) {
    return ok(getDistrictSummary(districtId))
  },
  async getHotspots(districtId) {
    return ok(getHotspots(districtId), { min: 350, max: 700 })
  },
  async getRecommendations(districtId) {
    return ok(getRecommendations(districtId), { min: 400, max: 800 })
  },
  async getBudgetUtilization(districtId) {
    return ok(getBudgetUtilization(districtId))
  },
  async getBudgetTimeline(districtId) {
    return ok(getBudgetTimeline(districtId), { min: 300, max: 600 })
  },
}

// Citizen-facing scheme discovery (mst_scheme)
export const schemeApi = {
  async listSchemes(params) {
    return ok(getSchemes(params))
  },
}

// svc-notification
export const notificationApi = {
  async listNotifications() {
    return ok(getNotifications())
  },
}

// CSV ingestion pipeline (Ch 11) — Line Dept Data Upload screen
export const ingestionApi = {
  async uploadCsv(fileName, departmentId) {
    await delay(900, 1800)
    return simulateCsvIngestion(fileName, departmentId)
  },
}

// svc-auth (mocked — no real credential check, this is a persona switcher)
export const authApi = {
  async listUsers() {
    return ok(getUserDirectory())
  },
  async listFieldEngineers(departmentId) {
    return ok(getFieldEngineers(departmentId))
  },
}

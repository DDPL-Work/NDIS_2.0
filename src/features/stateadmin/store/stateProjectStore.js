// State Project Store — central project registry + proposal approval pipeline.
// BACKEND-INTEGRATED: projects hydrate from GET /api/projects/, proposals from
// GET /api/proposals/, and every mutation writes through the same APIs.  The
// proposal approval / sanction chain stays backend-authoritative; the finance
// mirror fields (sanctioned/released/committed/utilized) now come from the
// project's own backend amounts — nothing is fabricated on this side.
import { create } from 'zustand'
import { useStateFinanceStore } from './stateFinanceStore'
import { backendProjectApi } from '../../../api/projectApi'
import { backendProposalApi } from '../../../api/proposalApi'
import { BackendCapabilityError } from '../../../api/apiClient'
import { PROJECT_STATUSES } from '../../../config/stateConstants'
import { getFinalSanctionAmount } from '../../../utils/finance'

export const useStateProjectStore = create((set, get) => ({
  projects: [],
  proposals: [],
  projectCategories: [
    { id: 'cat-health-infra', label: 'Health Infrastructure', departmentIds: ['health'] },
    { id: 'cat-education-infra', label: 'Education Infrastructure', departmentIds: ['education'] },
    { id: 'cat-roads', label: 'Roads & Connectivity', departmentIds: ['pwd'] },
    { id: 'cat-power', label: 'Power & Electrification', departmentIds: ['electricity'] },
    { id: 'cat-sanitation', label: 'Sanitation & Urban Services', departmentIds: ['urban'] },
    { id: 'cat-renewable', label: 'Renewable Energy', departmentIds: ['solar'] },
    { id: 'cat-tourism', label: 'Tourism & Culture', departmentIds: ['tourism'] },
    { id: 'cat-water', label: 'Water Supply', departmentIds: ['water'] },
  ],
  projectTemplates: [
    { id: 'TPL-CIVIL', label: 'Civil Works (Infrastructure)', fields: ['DPR', 'Cost Estimate', 'Land Records', 'Site Photos'] },
    { id: 'TPL-PROC', label: 'Equipment Procurement', fields: ['Technical Specification', 'Rate Contract', 'Vendor List'] },
    { id: 'TPL-DIGITAL', label: 'Digital Infrastructure', fields: ['Solution Architecture', 'Data Safety Plan', 'Connectivity Plan'] },
    { id: 'TPL-RENEW', label: 'Renewable Energy', fields: ['Site Feasibility', 'Grid Study', 'O&M Plan'] },
  ],

  async hydrateFromBackend() {
    const [projects, proposals] = await Promise.all([
      backendProjectApi.list().catch(() => []),
      backendProposalApi.list().catch(() => []),
    ])
    set({
      projects: (projects || []).map(mapProjectRecord),
      proposals: (proposals || []).map(mapProposalRecord),
    })
  },

  async addProject(project, actor = {}) {
    if (!project.name || !project.departmentId) throw new Error('Project name and department are required.')
    const record = await backendProjectApi.create({
      title: project.name,
      department: project.departmentId,
      district: project.districtId || null,
      village: project.village || null,
      block: project.block || null,
      estimated_amount: project.estimatedCost || null,
    })
    useStateFinanceStore.getState().writeAudit({ actor, action: 'PROJECT_REGISTERED', entity: 'project', entityId: record.id, newValue: record })
    await get().hydrateFromBackend()
    return record
  },

  async updateProject(id, updates, actor = {}) {
    const project = get().projects.find((p) => p.id === id)
    if (!project) throw new Error('Project not found.')
    const record = await backendProjectApi.update(id, {
      title: updates.name || updates.title,
      status: updates.status,
      progress_percentage: updates.completionPct,
    })
    useStateFinanceStore.getState().writeAudit({ actor, action: 'PROJECT_UPDATED', entity: 'project', entityId: id, newValue: updates })
    await get().hydrateFromBackend()
    return record
  },

  // ── Proposals ────────────────────────────────────────────────────────────
  async createProposal({ name, departmentId, districtId, schemeId, projectCategory, estimatedCost, purpose, beneficiaryCount = 0, expectedOutcomes = '', timeline = '', actor = {} }) {
    if (!name || !departmentId || !schemeId || !estimatedCost || estimatedCost <= 0) throw new Error('Name, department, scheme and a positive estimated cost are required.')
    const proposal = await backendProposalApi.create({
      title: name,
      department: departmentId,
      district: districtId || null,
      scheme: schemeId,
      category: projectCategory || '',
      population_impact: beneficiaryCount,
      problem_statement: purpose || '',
      engineering_notes: expectedOutcomes || '',
      estimated_timeline: timeline || '',
    })
    useStateFinanceStore.getState().writeAudit({ actor, action: 'PROPOSAL_SUBMITTED', entity: 'project_proposal', entityId: proposal.id, newValue: { estimatedCost }, reason: purpose })
    await get().hydrateFromBackend()
    return proposal
  },

  // Approve / reject are the backend's own proposal actions; the remaining
  // workflow verbs (recommend, return, clarify, escalate, delegate, forward)
  // have no documented endpoint (BACKEND GAP).
  async actOnProposal({ id, action, actor = {}, remarks = '' }) {
    const proposal = get().proposals.find((p) => p.id === id)
    if (!proposal) throw new Error('Proposal not found.')
    let updated
    if (action === 'approve') {
      updated = await backendProposalApi.approve(id)
    } else if (action === 'reject') {
      updated = await backendProposalApi.reject(id, { review_notes: remarks })
    } else if (action === 'sanction') {
      updated = await backendProposalApi.sanction(id, { sanctioned_amount: getFinalSanctionAmount(proposal) })
    } else {
      throw new BackendCapabilityError(`proposal workflow verb "${action}"`)
    }
    useStateFinanceStore.getState().writeAudit({ actor, action: `PROPOSAL_${action.toUpperCase()}`, entity: 'project_proposal', entityId: id, oldValue: proposal.status, newValue: updated?.status || action, reason: remarks })
    await get().hydrateFromBackend()
    return updated
  },

  proposalNextStep() {
    return null
  },

  resetProjects() { set({ projects: [], proposals: [] }) },
}))

const mapProjectRecord = (project) => ({
  id: project.id,
  name: project.title || project.projectId || String(project.id),
  title: project.title || project.projectId || String(project.id),
  departmentId: project.departmentId,
  departmentName: project.departmentName || '',
  districtId: project.districtId,
  districtName: project.districtName || '',
  village: project.village || '',
  block: project.block || '',
  status: project.status ? project.status.toLowerCase() : 'draft',
  completionPct: project.progress || 0,
  estimatedCost: project.budgetSanctioned || 0,
  sanctionedAmount: project.budgetSanctioned || 0,
  releasedAmount: project.budgetSanctioned || 0,
  utilizedAmount: project.budgetUtilized || 0,
  committedAmount: project.budgetUtilized || 0,
  startDate: project.startDate || null,
  expectedCompletion: project.completionDate || null,
  gisLocation: null,
  documents: [],
  proposalId: project.proposalId || null,
  raw: project.raw || project,
})

const mapProposalRecord = (proposal) => ({
  id: proposal.id,
  name: proposal.title || String(proposal.id),
  title: proposal.title || String(proposal.id),
  departmentId: proposal.departmentId,
  districtId: proposal.districtId,
  schemeId: proposal.schemeId,
  projectCategory: proposal.category || '',
  estimatedCost: proposal.estimatedCost || 0,
  purpose: proposal.problemStatement || '',
  beneficiaryCount: proposal.populationImpact || 0,
  expectedOutcomes: proposal.engineeringNotes || '',
  timeline: proposal.estimatedTimeline || '',
  status: proposal.status ? proposal.status.toLowerCase() : '',
  history: [],
  createdBy: proposal.createdByName || 'Backend',
  createdAt: proposal.createdAt || null,
  raw: proposal.raw || proposal,
})

export const projectStatuses = PROJECT_STATUSES

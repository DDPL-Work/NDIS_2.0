// State Project Store — central project registry + proposal approval pipeline.
// Projects and proposals carry their financial fields (sanctioned / released /
// committed / utilized) as book-keeping mirrors of the finance engine records;
// the finance engine remains the source of truth for numbers.
import { create } from 'zustand'
import { useStateFinanceStore } from './stateFinanceStore'
import { SEED_PROJECTS, SEED_PROPOSALS, cr } from './seed/stateSeedData'
import { PROJECT_STATUSES } from '../../../config/stateConstants'
import { canActAt, nextStepFor } from '../services/approvalService'
import { assertAuthority } from '../services/authorityService'

export const useStateProjectStore = create((set, get) => ({
  projects: SEED_PROJECTS,
  proposals: SEED_PROPOSALS,
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

  addProject(project, actor = {}) {
    if (!project.name || !project.departmentId) throw new Error('Project name and department are required.')
    const record = { id: `PRJ-${Date.now().toString(36).toUpperCase()}`, status: 'draft', sanctionedAmount: null, releasedAmount: null, committedAmount: null, utilizedAmount: null, completionPct: 0, gisLocation: project.gisLocation || null, ...project }
    set((s) => ({ projects: [record, ...s.projects] }))
    useStateFinanceStore.getState().writeAudit({ actor, action: 'PROJECT_REGISTERED', entity: 'project', entityId: record.id, newValue: record })
    return record
  },

  updateProject(id, updates, actor = {}) {
    const project = get().projects.find((p) => p.id === id)
    if (!project) throw new Error('Project not found.')
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)) }))
    useStateFinanceStore.getState().writeAudit({ actor, action: 'PROJECT_UPDATED', entity: 'project', entityId: id, oldValue: project, newValue: updates })
  },

  // ── Proposals ────────────────────────────────────────────────────────────
  createProposal({ name, departmentId, districtId, schemeId, projectCategory, estimatedCost, purpose, beneficiaryCount = 0, expectedOutcomes = '', timeline = '', documents = [], gisLocation = null, actor = {} }) {
    if (!name || !departmentId || !schemeId || !estimatedCost || estimatedCost <= 0) throw new Error('Name, department, scheme and a positive estimated cost are required.')
    const proposal = {
      id: `PROP-${Date.now().toString(36).toUpperCase()}`,
      name, departmentId, districtId, schemeId, projectCategory, estimatedCost,
      purpose, beneficiaryCount, expectedOutcomes, timeline, documents, gisLocation,
      status: 'submitted',
      workflowId: 'WF-PROPOSAL',
      history: [{ action: 'submit', actor: actor.name || actor.role || 'Unknown', role: actor.role, timestamp: new Date().toISOString(), remarks: 'Proposal submitted by department.' }],
      createdBy: actor.name || actor.role || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ proposals: [proposal, ...s.proposals] }))
    useStateFinanceStore.getState().writeAudit({ actor, action: 'PROPOSAL_SUBMITTED', entity: 'project_proposal', entityId: proposal.id, newValue: { estimatedCost }, reason: purpose })
    useStateFinanceStore.getState().addNotification({ type: 'proposal_submitted', message: `Proposal ${proposal.id} submitted by ${proposal.createdBy} (₹${(estimatedCost / 10000000).toFixed(2)} Cr).`, departmentId })
    return proposal
  },

  actOnProposal({ id, action, actor = {}, remarks = '' }) {
    const proposal = get().proposals.find((p) => p.id === id)
    if (!proposal) throw new Error('Proposal not found.')
    const workflow = useStateFinanceStore.getState().workflows.find((w) => w.workflowId === proposal.workflowId)
    const can = canActAt(workflow, proposal.history, actor.role || '')
    if (!can.allowed && actor.role !== 'system_admin' && actor.role !== 'state_admin') {
      throw new Error(`Your role cannot act at this stage. Expected role: "${can.step?.role || 'completed'}".`)
    }
    if (action === 'approve') {
      assertAuthority(useStateFinanceStore.getState().authorityMatrix, actor, 'project', proposal.estimatedCost, { departmentId: proposal.departmentId, districtId: proposal.districtId, schemeId: proposal.schemeId })
    }
    const forbidden = ['approve', 'reject'].includes(action) && proposal.status === 'sanctioned'
    if (forbidden) throw new Error('Proposal already sanctioned — no further approval allowed.')
    const nextStatus = { approve: 'sanctioned', reject: 'rejected', return: 'returned', clarify: 'clarification_required', escalate: 'escalated', delegate: 'delegated', forward: 'forwarded', recommend: 'recommended' }[action] || proposal.status
    const updated = {
      ...proposal,
      status: nextStatus,
      history: [...proposal.history, { action, actor: actor.name || actor.role || 'Unknown', role: actor.role, timestamp: new Date().toISOString(), remarks }],
      decidedAt: ['approve', 'reject'].includes(action) ? new Date().toISOString() : proposal.decidedAt,
      decidedBy: ['approve', 'reject'].includes(action) ? actor.name || actor.role || 'Unknown' : proposal.decidedBy,
    }
    if (action === 'approve') {
      // Sanctioning a proposal creates the project with its sanction book-keeping.
      const project = {
        id: `PRJ-${proposal.id.replace('PROP-', '')}`,
        name: proposal.name,
        departmentId: proposal.departmentId,
        districtId: proposal.districtId,
        schemeId: proposal.schemeId,
        category: proposal.projectCategory || 'General',
        type: 'sanctioned_proposal',
        estimatedCost: proposal.estimatedCost,
        sanctionedAmount: proposal.estimatedCost,
        releasedAmount: null,
        committedAmount: null,
        utilizedAmount: null,
        completionPct: 0,
        startDate: new Date().toISOString().slice(0, 10),
        expectedCompletion: null,
        status: 'sanctioned',
        gisLocation: proposal.gisLocation,
        implementingAgency: proposal.createdBy,
        beneficiaryCount: proposal.beneficiaryCount,
        documents: proposal.documents,
        proposalId: proposal.id,
      }
      set((s) => ({ projects: [project, ...s.projects] }))
    }
    set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? updated : p)) }))
    useStateFinanceStore.getState().writeAudit({ actor, action: `PROPOSAL_${action.toUpperCase()}`, entity: 'project_proposal', entityId: proposal.id, oldValue: proposal.status, newValue: nextStatus, reason: remarks })
    if (action === 'escalate') useStateFinanceStore.getState().addNotification({ type: 'approval_escalated', message: `Proposal ${proposal.id} escalated to ${workflow?.escaStep?.escalateTo || 'competent authority'}.`, departmentId: proposal.departmentId })
    if (action === 'return') useStateFinanceStore.getState().addNotification({ type: 'proposal_returned', message: `Proposal ${proposal.id} returned with remarks.`, departmentId: proposal.departmentId })
    return updated
  },

  proposalNextStep(proposal) {
    const workflow = useStateFinanceStore.getState().workflows.find((w) => w.workflowId === proposal.workflowId)
    return nextStepFor(workflow, proposal.history, null)
  },

  resetProjects() { set({ projects: SEED_PROJECTS, proposals: SEED_PROPOSALS }) },
}))

export const projectStatuses = PROJECT_STATUSES
export const projectCr = cr
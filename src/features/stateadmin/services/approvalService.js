// Configurable approval workflow engine.
// Workflow definitions are DATA (editable at Workflow & Authority screen).
// A definition describes ordered steps with role + optional conditions;
// evaluation resolves the next step for a given entity context.

import { APPROVAL_ACTION_LABELS } from '../../../config/stateConstants'

export const DEFAULT_WORKFLOWS = [
  {
    workflowId: 'WF-SANCTION',
    name: 'Financial Sanction Approval',
    entityType: 'sanction',
    description: 'Sanction created by an authorised officer is reviewed and approved by the competent authority under delegated powers. Amounts beyond the acting authority escalate to the next tier.',
    steps: [
      { step: 1, role: 'state_dept_admin', action: 'approve', label: 'Department Review' },
      { step: 2, role: 'state_finance_admin', action: 'approve', label: 'Finance Approval' },
      { step: 3, role: 'state_admin', action: 'approve', label: 'State Admin Approval' },
    ],
    escaStep: {
      condition: 'amount_exceeds_authority',
      escalateTo: 'Finance Authority',
      label: 'Escalation',
    },
    status: 'active',
  },
  {
    workflowId: 'WF-RELEASE',
    name: 'Fund Release Approval',
    entityType: 'fund_release',
    description: 'Fund release proposals are validated against the parent sanction and released by the drawing authority within delegated limits.',
    steps: [
      { step: 1, role: 'state_dept_admin', action: 'approve', label: 'Release Proposal Review' },
      { step: 2, role: 'state_finance_admin', action: 'approve', label: 'Finance Release Approval' },
    ],
    status: 'active',
  },
  {
    workflowId: 'WF-PROPOSAL',
    name: 'Project Proposal Approval',
    entityType: 'project_proposal',
    description: 'Department proposal → District review → competent authority sanction. Configurable per scheme, amount and authority.',
    steps: [
      { step: 1, role: 'dm', action: 'recommend', label: 'District Recommendation' },
      { step: 2, role: 'state_dept_admin', action: 'review', label: 'Department Review' },
      { step: 3, role: 'state_finance_admin', action: 'approve', label: 'Financial Sanction' },
    ],
    status: 'active',
  },
  {
    workflowId: 'WF-REAPPROPRIATION',
    name: 'Re-appropriation Approval',
    entityType: 'reappropriation',
    description: 'Movement of budget between heads within a financial year, supported by an order and approved within re-appropriation limits.',
    steps: [
      { step: 1, role: 'state_finance_admin', action: 'approve', label: 'Finance Approval' },
      { step: 2, role: 'state_admin', action: 'approve', label: 'State Admin Approval' },
    ],
    status: 'active',
  },
]

// Evaluate whether the actor's role is entitled to act at the current step.
export function nextStepFor(workflow, history = []) {
  const pendingSteps = (workflow?.steps || [])
    .filter((s) => !history.some((h) => h.workflowId === workflow.workflowId && h.step === s.step && h.action !== 'reject' && h.action !== 'return'))
  return pendingSteps[0] || null
}

export function canActAt(workflow, history, actorRole) {
  const step = nextStepFor(workflow, history, actorRole)
  if (!step) return { allowed: true, reason: 'workflow_complete' }
  return { allowed: step.role === actorRole || actorRole === 'system_admin', step, reason: step.role === actorRole ? 'entitled' : 'not_entitled' }
}

export const actionLabel = (action) => APPROVAL_ACTION_LABELS[action] || action

export function applyWorkflowDefaults(workflows) {
  return workflows && workflows.length ? workflows : DEFAULT_WORKFLOWS
}
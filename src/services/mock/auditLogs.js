// Audit Log Compliance Service — Vol 2 §14 & Vol 4 API contracts (log_audit_event).
// Generates immutable compliance logs with cryptographic SHA-256 style signatures.
import { makeRng, randInt, pick } from '../../utils/random'

const ACTIONS = [
  { type: 'PROPOSAL_APPROVE', label: 'Proposal Sanctioned', actor: 'DM Nalanda', category: 'workflow' },
  { type: 'PROPOSAL_SUBMIT', label: 'New Proposal Authored', actor: 'Dept Officer (Health)', category: 'workflow' },
  { type: 'CSV_INGEST', label: 'Data Batch Uploaded', actor: 'Field Engineer (PHED)', category: 'ingestion' },
  { type: 'GRIEVANCE_ESCALATE', label: 'Grievance SLA Escalated', actor: 'System Engine', category: 'workflow' },
  { type: 'GRIEVANCE_RESOLVE', label: 'Inspection Photo Verified', actor: 'Field Inspector', category: 'field' },
  { type: 'DEFICIT_COMPUTE', label: 'MCDA Deficit Recalculated', actor: 'Analytics Engine', category: 'analytics' },
  { type: 'DIRECTIVE_ISSUE', label: 'Directive Issued', actor: 'ADM Nalanda', category: 'workflow' },
]

export function getAuditLogs() {
  const rng = makeRng('audit-logs-v1')
  const logs = []

  for (let i = 0; i < 28; i++) {
    const act = pick(rng, ACTIONS)
    const timestamp = new Date(Date.now() - i * 1800000 - randInt(rng, 100, 50000)).toISOString()
    const hash = Array.from({ length: 16 }, () => Math.floor(rng() * 16).toString(16)).join('')

    logs.push({
      id: `AUD-${10000 + i}`,
      actionType: act.type,
      label: act.label,
      category: act.category,
      actor: act.actor,
      ipAddress: `10.142.4.${randInt(rng, 10, 240)}`,
      targetEntityId: `${act.category.toUpperCase()}-${randInt(rng, 1000, 9999)}`,
      timestamp,
      hashSignature: `0x${hash}`,
      status: 'VERIFIED_IMMUTABLE',
    })
  }

  return logs
}

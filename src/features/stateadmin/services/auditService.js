// Immutable audit trail writer for the State Administration Panel.
// Mirrors the existing district audit conventions (actor, entity, hash kept).
import { sha } from './hashUtil'

export function buildAuditEntry({ actor, role, action, entity, entityId, oldValue = null, newValue = null, reason = '', referenceType = null, referenceNo = null }) {
  const timestamp = new Date().toISOString()
  const payload = JSON.stringify({ actor, action, entity, entityId, oldValue, newValue, timestamp })
  return {
    id: `STAUD-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`.toUpperCase(),
    actor,
    role,
    action,
    entity,
    entityId,
    oldValue,
    newValue,
    reason,
    referenceType,
    referenceNo,
    timestamp,
    ipAddress: 'client-side',
    hashSignature: sha(payload).slice(0, 16),
    status: 'LOCAL_PENDING_SYNC',
  }
}
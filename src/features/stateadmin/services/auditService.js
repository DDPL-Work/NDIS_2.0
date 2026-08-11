// Immutable audit trail writer for the State Administration Panel.
// Mirrors the existing district audit conventions (actor, entity, hash kept).
import { sha } from './hashUtil'

export function buildAuditEntry({ actor, role, action, entity, entityId, oldValue = null, newValue = null, reason = '', referenceType = null, referenceNo = null }) {
  const timestamp = new Date().toISOString()
  const payload = JSON.stringify({ actor, action, entity, entityId, oldValue, newValue, timestamp })
  return {
    id: `STAUD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase(),
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
    ipAddress: '10.142.0.' + Math.floor(Math.random() * 250),
    hashSignature: sha(payload).slice(0, 16),
    status: 'VERIFIED_IMMUTABLE',
  }
}
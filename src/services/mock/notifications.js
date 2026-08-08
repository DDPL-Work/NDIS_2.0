import { makeRng, randInt } from '../../utils/random'
import { DEPARTMENTS } from '../../config/constants'

// LLD Vol 3 Ch 18 — Notification Engine; channel-agnostic, portal/SMS/email at pilot.
const TEMPLATES = [
  { event: 'workflow.transitioned', text: (p) => `Proposal ${p} moved to Under DM Review.` },
  { event: 'workflow.transitioned', text: (p) => `Proposal ${p} was approved.` },
  { event: 'grievance.sla_breached', text: (p) => `Grievance ${p} escalated — SLA window elapsed.` },
  { event: 'asset.ingested', text: (p) => `CSV batch ${p} ingestion completed with validation warnings.` },
  { event: 'directive.issued', text: () => `New directive received from DM office — action required.` },
]

let _cache = null

export function getNotifications() {
  if (_cache) return _cache
  const rng = makeRng('notifications')
  const list = []
  for (let i = 0; i < 14; i++) {
    const t = TEMPLATES[randInt(rng, 0, TEMPLATES.length - 1)]
    const dept = DEPARTMENTS[randInt(rng, 0, DEPARTMENTS.length - 1)]
    list.push({
      id: `NTF-${1000 + i}`,
      event: t.event,
      message: t.text(`#${randInt(rng, 1000, 9999)}`),
      departmentId: dept.id,
      channel: ['portal', 'sms', 'email'][randInt(rng, 0, 2)],
      read: rng() > 0.5,
      createdAt: new Date(Date.now() - randInt(rng, 1, 5000) * 60000).toISOString(),
    })
  }
  _cache = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return _cache
}

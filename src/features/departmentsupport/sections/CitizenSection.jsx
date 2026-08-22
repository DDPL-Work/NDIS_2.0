// Generic citizen signals (§14) — REAL complaints routed to the department.
// Administrative data (records, status, SLA) is shown separately from citizen
// perception (rating + feedback comment) — the two are never conflated.
import { useMemo } from 'react'
import { MessageSquare } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Provenance from '../../admin/decisionDashboard/Provenance'
import { complaintsForDepartment } from '../../../api/departmentSupportApi'
import { formatDateTime } from '../../../utils/format'

const stateTone = (state) => {
  if (['closed', 'resolved', 'verification_pending'].includes(state)) return 'positive'
  if (['rejected', 'cancelled'].includes(state)) return 'negative'
  if (['assigned', 'accepted', 'inspection_started', 'evidence_uploaded', 'escalated'].includes(state)) return 'warning'
  return 'neutral'
}

export default function CitizenSection({ departmentId, complaints, loadedAt }) {
  const rows = useMemo(() => complaintsForDepartment(complaints || [], departmentId), [complaints, departmentId])
  const statusCounts = useMemo(() => {
    const counts = {}
    rows.forEach((row) => { const key = row.state || row.status || 'unknown'; counts[key] = (counts[key] || 0) + 1 })
    return counts
  }, [rows])
  const withFeedback = rows.filter((row) => row.rating != null || row.feedbackComment)

  return (
    <Card>
      <CardHeader
        title="Citizen signals"
        subtitle="Real complaints routed to this department — administrative records and citizen perception kept apart."
      />
      <CardBody>
        {rows.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No citizen complaints for this department" description="Complaints are routed by the backend department mapping. If you expected signals here, check the routing rules." />
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge tone="neutral">Total {rows.length}</Badge>
              {Object.entries(statusCounts).map(([state, count]) => (
                <Badge key={state} tone={stateTone(state)}>{state.replace(/_/g, ' ')}: {count}</Badge>
              ))}
              {withFeedback.length > 0 && <Badge tone="info">Citizen feedback: {withFeedback.length}</Badge>}
            </div>

            {/* Administrative data */}
            <div className="rounded-lg border border-ink-100 divide-y divide-ink-100 max-h-72 overflow-y-auto">
              {rows.slice(0, 40).map((complaint) => (
                <div key={complaint.id} className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink-900 truncate">{complaint.title}</p>
                      <p className="text-[11.5px] text-ink-500 truncate">{complaint.categoryName} · {complaint.location?.village || complaint.location?.block || 'no location'} · {complaint.ticketNumber}</p>
                    </div>
                    <Badge tone={stateTone(complaint.state)}>{complaint.state?.replace(/_/g, ' ')}</Badge>
                  </div>
                  {complaint.isSlaBreached && <p className="text-[11px] text-alert-600 mt-1">SLA breached — requires attention.</p>}
                  {complaint.rating != null && (
                    <p className="text-[11.5px] text-ink-600 mt-1">
                      <span className="font-medium text-ink-700">Citizen perception:</span> rating {complaint.rating}/5{complaint.feedbackComment ? ` — “${complaint.feedbackComment}”` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-3 pt-3 border-t border-ink-100">
          <Provenance
            source="GET /api/complaints/ (routed by department)"
            definition="Administrative = complaint record, status and SLA. Citizen perception = rating and feedback comment captured at citizen verification. Both are real backend fields."
            updatedAt={loadedAt ? formatDateTime(loadedAt) : undefined}
          />
        </div>
      </CardBody>
    </Card>
  )
}
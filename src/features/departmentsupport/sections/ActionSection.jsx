// Generic action queue (§11) — actions requiring officer attention, derived
// from REAL signals: config priority actions, assigned complaints breaching
// SLA, and execution engine work orders/maintenance.  Empty queues are honest.
import { useMemo } from 'react'
import { ListChecks, AlertTriangle, Wrench, Inbox } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import Provenance from '../../admin/decisionDashboard/Provenance'
import { complaintsForDepartment } from '../../../api/departmentSupportApi'
import { formatDateTime } from '../../../utils/format'

export default function ActionSection({ plan, departmentId, complaints, workOrders, maintenanceTasks, loadedAt, onSelectEntity, onAction }) {
  const items = useMemo(() => {
    const queue = []
    const config = plan?.config || {}

    // Priority-driven actions (P1/P2).
    const priorities = (plan?.ranked || []).filter((r) => r.priority.band === 'P1' || r.priority.band === 'P2')
    priorities.slice(0, 5).forEach(({ entity, priority }) => {
      (config.actions || []).filter((a) => a.appliesTo === 'priority').forEach((action) => {
        queue.push({
          id: `P-${entity.id}-${action.key}`,
          type: action.label,
          source: 'Priority',
          title: `${entity.name} (${priority.band} · score ${priority.score})`,
          detail: `${entity.categoryLabel} — ${action.label.toLowerCase()}`,
          tone: 'warning',
          entity,
          action,
        })
      })
    })

    // SLA-breached / action-needed complaints routed to the department.
    complaintsForDepartment(complaints || [], departmentId)
      .filter((c) => c.isSlaBreached || ['assigned', 'submitted', 'verification_pending'].includes(c.state))
      .slice(0, 8)
      .forEach((complaint) => {
        queue.push({
          id: `C-${complaint.id}`,
          type: complaint.isSlaBreached ? 'SLA breach' : 'Complaint action',
          source: 'Citizen',
          title: complaint.title,
          detail: `${complaint.categoryName} · ${complaint.location?.village || complaint.location?.block || 'no location'} · ${complaint.ticketNumber}`,
          tone: complaint.isSlaBreached ? 'negative' : 'info',
        })
      })

    // Execution engine records needing attention.
    ;(maintenanceTasks || []).filter((task) => task.departmentId === departmentId && task.status === 'missed').slice(0, 5).forEach((task) => {
      queue.push({ id: `M-${task.id}`, type: 'Maintenance overdue', source: 'Execution', title: task.title, detail: `Due ${task.dueDate}`, tone: 'negative' })
    })
    ;(workOrders || []).filter((wo) => wo.departmentId === departmentId && wo.state === 'assigned' && wo.completionDate === null).slice(0, 5).forEach((wo) => {
      queue.push({ id: `W-${wo.id}`, type: 'Work order in progress', source: 'Execution', title: wo.title, detail: `Deadline ${wo.deadline}`, tone: 'info' })
    })

    return queue
  }, [plan, departmentId, complaints, workOrders, maintenanceTasks])

  return (
    <Card>
      <CardHeader
        title="Action queue"
        subtitle="Items requiring officer attention for this department — each linked to its source signal."
      />
      <CardBody>
        {items.length === 0 ? (
          <EmptyState icon={ListChecks} title="No pending actions" description="No critical priorities, SLA breaches, overdue maintenance or open work orders for this department right now." />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-ink-100 p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Badge tone={item.tone}>{item.type}</Badge>
                    <Badge tone="neutral">{item.source}</Badge>
                  </div>
                  <p className="text-[13.5px] font-medium text-ink-900 mt-1.5 truncate">{item.title}</p>
                  <p className="text-[12px] text-ink-500 truncate">{item.detail}</p>
                </div>
                {item.entity && item.action && (
                  <Button size="sm" variant="ghost" className="shrink-0" onClick={() => {
                    if (onAction) onAction(item.action, item.entity)
                    else onSelectEntity?.(item.entity)
                  }}>Handle</Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-ink-100">
          <Provenance
            source="Priority model (config) · GET /api/complaints/ · execution engine records"
            definition="Queue items are derived from real P1/P2 priorities, real SLA-breached complaints and real execution records. Empty means nothing currently requires attention."
            updatedAt={loadedAt ? formatDateTime(loadedAt) : undefined}
          />
        </div>
      </CardBody>
    </Card>
  )
}
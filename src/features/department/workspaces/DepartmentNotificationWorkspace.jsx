import { useState } from 'react'
import { Bell, AlertTriangle, Clock, CheckCircle2, Inbox } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { useDepartment } from '../framework/DepartmentContext'
import { useComplaintEngine } from '../../../app/store/complaintEngine'
import { formatDateTime } from '../../../utils/format'

export default function DepartmentNotificationWorkspace() {
  const { dept } = useDepartment()
  const notifications = useComplaintEngine((s) => s.notifications)

  const deptNotifs = notifications.filter((n) => !n.departmentId || n.departmentId === dept.id)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Notification Center · ${dept.code}`}
        title={`${dept.label} Department Alerts & Telemetry`}
        description="Workflow assignments, SLA warning dispatches, and emergency notifications."
      />

      <div className="px-6 space-y-3">
        <div className="card divide-y divide-ink-100">
          {deptNotifs.length === 0 ? (
            <div className="p-8 text-center text-ink-400 text-[12.5px]">No notifications for this department.</div>
          ) : (
            deptNotifs.map((n) => (
              <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-ink-50/50 transition-colors">
                <Bell size={18} className="text-saffron-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink-900">{n.targetRole?.toUpperCase()} Alert</span>
                    <span className="font-mono text-[11px] text-ink-400">{formatDateTime(n.createdAt)}</span>
                  </div>
                  <p className="text-ink-700 mt-1">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

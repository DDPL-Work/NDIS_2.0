import { FileText, Search, AlertTriangle, MapPin, Building2, Clock, ArrowRight, Users } from 'lucide-react'
import Button from '../../../../components/ui/Button'
import TaskStatusBadge from '../TaskStatusBadge'
import TaskPriorityBadge from '../TaskPriorityBadge'
import { TASK_TYPES, TASK_STATUSES } from '../constants'

const TYPE_ICONS = {
  [TASK_TYPES.INTERVENTION]: FileText,
  [TASK_TYPES.PROPOSAL]: FileText,
  [TASK_TYPES.INSPECTION]: Search,
  [TASK_TYPES.ESCALATION]: AlertTriangle,
}

const TYPE_COLORS = {
  [TASK_TYPES.INTERVENTION]: 'text-sky-600 bg-sky-50 border-sky-100',
  [TASK_TYPES.PROPOSAL]: 'text-sky-600 bg-sky-50 border-sky-100',
  [TASK_TYPES.INSPECTION]: 'text-violet-600 bg-violet-50 border-violet-100',
  [TASK_TYPES.ESCALATION]: 'text-alert-600 bg-alert-50 border-alert-100',
}

const TYPE_LABELS = {
  [TASK_TYPES.INTERVENTION]: 'Intervention / DPR',
  [TASK_TYPES.PROPOSAL]: 'Proposal (DPR)',
  [TASK_TYPES.INSPECTION]: 'Field Inspection',
  [TASK_TYPES.ESCALATION]: 'Escalation',
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return null
  const parts = String(dateStr).split('-')
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDisplayTime(timeStr) {
  if (!timeStr) return ''
  const parts = String(timeStr).split(':')
  if (parts.length >= 2) {
    const h = Number(parts[0])
    const m = parts[1]
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${m} ${ampm}`
  }
  return timeStr
}

export default function TaskCard({ task, onClick, onEdit, onOpenFacility }) {
  const Icon = TYPE_ICONS[task.type] || FileText
  const isOverdue = task.isOverdue || task.status === TASK_STATUSES.OVERDUE

  // Build location subtitle: "Block, District" or just facility
  const locationParts = [task.blockName, task.districtName].filter(Boolean)
  const locationSubtitle = locationParts.join(', ')

  // For inspections, show scheduled date/time
  const inspectionDate = task.scheduledDate || task.preferredDate
  const inspectionTime = task.scheduledTime

  // For interventions, show cost/timeline
  const hasCost = task.estimatedCost != null && task.estimatedCost > 0

  return (
    <div
      className={`group rounded-lg border p-3.5 transition-colors cursor-pointer ${
        isOverdue
          ? 'border-alert-200 bg-alert-50/40 hover:border-alert-300'
          : 'border-ink-200 bg-white hover:border-ink-300 hover:shadow-sm'
      }`}
      onClick={() => onClick?.(task)}
    >
      {/* Top row: type badge + priority + status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[task.type] || 'text-ink-500 bg-ink-50 border-ink-100'}`}>
          <Icon size={11} />
          {TYPE_LABELS[task.type] || task.type}
        </span>
        <div className="flex items-center gap-1.5">
          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
          {task.departmentCode && (
            <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-600">
              {task.departmentCode}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-[13.5px] font-semibold text-ink-900 leading-snug group-hover:text-saffron-600 transition-colors">
        {task.title}
      </h4>

      {/* Facility & Location */}
      {(task.facilityName || task.locationName) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-600">
          <MapPin size={11} className="shrink-0 text-ink-400" />
          <span className="font-medium">{task.facilityName || task.locationName}</span>
          {locationSubtitle && locationSubtitle !== task.facilityName && (
            <span className="text-ink-400">· {locationSubtitle}</span>
          )}
        </div>
      )}

      {/* Date/Time or Cost/Timeline */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-500">
        {task.department && (
          <span className="flex items-center gap-1">
            <Building2 size={11} className="text-ink-400" />
            {task.department}
          </span>
        )}
        {/* Inspection: show date/time */}
        {task.type === TASK_TYPES.INSPECTION && (inspectionDate || inspectionTime) && (
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-ink-400" />
            {formatDisplayDate(inspectionDate)}
            {inspectionTime && ` · ${formatDisplayTime(inspectionTime)}`}
          </span>
        )}
        {/* Intervention: show cost */}
        {task.type === TASK_TYPES.INTERVENTION && hasCost && (
          <span className="font-medium text-ink-700">
            ₹{task.estimatedCost.toLocaleString('en-IN')}
          </span>
        )}
        {task.type === TASK_TYPES.INTERVENTION && task.expectedTimeline && (
          <span>Timeline: {task.expectedTimeline} days</span>
        )}
        {/* Escalation: show date */}
        {task.type === TASK_TYPES.ESCALATION && task.dueDate && (
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-ink-400" />
            {formatDisplayDate(task.dueDate)}
          </span>
        )}
        {/* Inspection: show team */}
        {task.type === TASK_TYPES.INSPECTION && task.inspectionTeam && (
          <span className="flex items-center gap-1">
            <Users size={11} className="text-ink-400" />
            {task.inspectionTeam}
          </span>
        )}
      </div>

      {/* Actions row */}
      <div className="mt-2.5 flex items-center gap-1.5 pt-2.5 border-t border-ink-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onClick?.(task) }}
          className="gap-1 text-[12px] h-7"
        >
          View
          <ArrowRight size={11} />
        </Button>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(task) }}
            className="text-[12px] h-7"
          >
            Edit
          </Button>
        )}
        {onOpenFacility && task.facilityName && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onOpenFacility(task) }}
            className="text-[12px] h-7"
          >
            Facility
          </Button>
        )}
      </div>
    </div>
  )
}

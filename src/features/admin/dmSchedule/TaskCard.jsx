import { FileText, Search, AlertTriangle, HardHat, MapPin, Building2, Clock, ChevronRight, ArrowRight } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import TaskStatusBadge from './TaskStatusBadge'
import TaskPriorityBadge from './TaskPriorityBadge'
import { TASK_TYPES, TASK_STATUSES } from './constants'

const TYPE_ICONS = {
  [TASK_TYPES.INTERVENTION]: FileText,
  [TASK_TYPES.PROPOSAL]: FileText,
  [TASK_TYPES.INSPECTION]: Search,
  [TASK_TYPES.ESCALATION]: AlertTriangle,
  [TASK_TYPES.WORK_ORDER]: HardHat,
}

const TYPE_COLORS = {
  [TASK_TYPES.INTERVENTION]: 'text-sky-600 bg-sky-50 border-sky-100',
  [TASK_TYPES.PROPOSAL]: 'text-sky-600 bg-sky-50 border-sky-100',
  [TASK_TYPES.INSPECTION]: 'text-violet-600 bg-violet-50 border-violet-100',
  [TASK_TYPES.ESCALATION]: 'text-alert-600 bg-alert-50 border-alert-100',
  [TASK_TYPES.WORK_ORDER]: 'text-leaf-600 bg-leaf-50 border-leaf-100',
}

export default function TaskCard({ task, onClick, onEdit, onOpenFacility }) {
  const Icon = TYPE_ICONS[task.type] || FileText
  const isOverdue = task.status === TASK_STATUSES.OVERDUE

  return (
    <div
      className={`group rounded-lg border p-4 transition-colors ${
        isOverdue
          ? 'border-alert-200 bg-alert-50/40 dark:border-alert-700 dark:bg-alert-900/10'
          : 'border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900'
      }`}
    >
      {/* Top row: Priority + Status badges */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
        </div>
        {/* Type label */}
        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold shrink-0 ${TYPE_COLORS[task.type] || 'text-ink-500 bg-ink-50 border-ink-100'}`}>
          <Icon size={11} />
          {task.typeLabel}
        </span>
      </div>

      {/* Title */}
      <button
        onClick={() => onClick?.(task)}
        className="text-left w-full"
      >
        <h4 className="text-[14px] font-semibold text-ink-900 dark:text-ink-100 leading-snug hover:text-saffron-600 transition-colors">
          {task.title}
        </h4>
      </button>

      {/* Facility & Location */}
      {task.facilityName && (
        <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-600">
          <MapPin size={12} className="shrink-0 text-ink-400" />
          <span className="font-medium">{task.facilityName}</span>
          {task.village && (
            <span className="text-ink-400">· {task.village}{task.block ? `, ${task.block}` : ''}</span>
          )}
        </div>
      )}

      {/* Department & Gap Score */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-500">
        {task.departmentName && (
          <span className="flex items-center gap-1">
            <Building2 size={11} className="text-ink-400" />
            {task.departmentName}
          </span>
        )}
        {task.gapScore != null && (
          <span className="font-medium text-ink-700">Coverage gap: {task.gapScore}%</span>
        )}
      </div>

      {/* Reason / Description (compact) */}
      {task.reason && (
        <p className="mt-2 text-[12px] text-ink-500 line-clamp-2 leading-relaxed">
          {task.reason}
        </p>
      )}

      {/* Due date — prominent */}
      {task.dueDateLabel && (
        <div className={`mt-3 flex items-center gap-1.5 text-[12.5px] font-medium ${
          task.dueDateUrgency === 'overdue' ? 'text-alert-600' :
          task.dueDateUrgency === 'today' ? 'text-saffron-600' :
          task.dueDateUrgency === 'tomorrow' ? 'text-sky-600' :
          'text-ink-600'
        }`}>
          <Clock size={12} className="shrink-0" />
          <span>Due: {task.dueDateLabel}</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 pt-3 border-t border-ink-100 dark:border-ink-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onClick?.(task)}
          className="gap-1 text-[12px]"
        >
          View details
          <ArrowRight size={12} />
        </Button>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            className="text-[12px]"
          >
            Edit / Reschedule
          </Button>
        )}
        {onOpenFacility && task.facilityId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenFacility(task)}
            className="text-[12px] ml-auto"
          >
            Open facility
          </Button>
        )}
      </div>
    </div>
  )
}

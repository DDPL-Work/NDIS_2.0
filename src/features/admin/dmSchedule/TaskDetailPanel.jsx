import { useState, useCallback } from 'react'
import {
  X, MapPin, Clock, User, DollarSign, Tag, ExternalLink, Calendar,
  FileText, AlertTriangle, Search, HardHat, CheckCircle, XCircle,
  Play, Pause, StickyNote
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useUiStore } from '../../../app/store/uiStore'
import { backendInterventionApi } from '../../../api/interventionApi'
import { backendInspectionApi } from '../../../api/inspectionApi'
import { backendProposalApi } from '../../../api/proposalApi'
import { invalidateData, DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { TASK_TYPES, TASK_TYPE_LABELS, TASK_STATUSES } from './constants'
import { getStatusDisplay } from './utils/taskNormalizer'

const TYPE_ICONS = {
  [TASK_TYPES.INTERVENTION]: FileText,
  [TASK_TYPES.PROPOSAL]: FileText,
  [TASK_TYPES.INSPECTION]: Search,
  [TASK_TYPES.ESCALATION]: AlertTriangle,
  [TASK_TYPES.WORK_ORDER]: HardHat,
}

const PRIORITY_BADGE_COLORS = {
  urgent: { bg: '#FDE8E8', text: '#B42318' },
  high: { bg: '#FEF0C7', text: '#B54708' },
  medium: { bg: '#D9F0FF', text: '#075985' },
  low: { bg: '#D1FAE5', text: '#065F46' },
}

const PRIORITY_LABELS = {
  urgent: 'P1 Critical',
  high: 'P2 High',
  medium: 'P3 Normal',
  low: 'P4 Low',
}

const STATUS_BADGE_COLORS = {
  pending: { bg: '#FEF0C7', text: '#B54708' },
  in_progress: { bg: '#D9F0FF', text: '#075985' },
  completed: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#F3F4F6', text: '#374151' },
}

const STATUS_LABELS = {
  pending: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function formatCurrency(value) {
  if (!value) return null
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
}

function formatDateFull(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function humanizeTag(raw) {
  if (!raw) return ''
  return String(raw)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function DrawerBadge({ bg, text, children }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      {children}
    </span>
  )
}

function SectionHeading({ children }) {
  return (
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/50">
      {children}
    </h3>
  )
}

function InfoRow({ label, value, icon: Icon }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start gap-2 py-1">
      {Icon && <Icon size={14} className="mt-0.5 shrink-0 text-white/40" />}
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
        <p className="mt-0.5 text-[13px] text-white leading-snug">{value}</p>
      </div>
    </div>
  )
}

export default function TaskDetailPanel({ task, onClose, onEdit, onOpenFacility, onRefresh }) {
  const [acting, setActing] = useState(false)
  const pushToast = useUiStore((s) => s.pushToast)

  const handleStatusAction = useCallback(async (action) => {
    if (!task?.sourceId) return
    setActing(true)
    try {
      if (task.type === TASK_TYPES.INTERVENTION) {
        await backendInterventionApi[action](task.sourceId)
      } else if (task.type === TASK_TYPES.INSPECTION) {
        await backendInspectionApi[action](task.sourceId)
      } else if (task.type === TASK_TYPES.PROPOSAL || task.type === TASK_TYPES.ESCALATION) {
        await backendProposalApi[action](task.sourceId)
      }
      invalidateData(DATA_SCOPES.INTERVENTIONS)
      invalidateData(DATA_SCOPES.INSPECTIONS)
      invalidateData(DATA_SCOPES.PROPOSALS)
      invalidateData(DATA_SCOPES.DASHBOARD)
      pushToast(`Task ${action}d successfully.`, 'success')
      onRefresh?.()
      onClose?.()
    } catch (error) {
      pushToast(error?.message || `Failed to ${action} task.`, 'error')
    } finally {
      setActing(false)
    }
  }, [task, pushToast, onRefresh, onClose])

  const getStatusActions = () => {
    if (!task) return []
    const actions = []
    const s = task.status

    if (task.type === TASK_TYPES.INTERVENTION) {
      if (s === 'pending_review' || s === 'under_review') {
        actions.push({ label: 'Approve', action: 'approve', variant: 'positive', icon: CheckCircle })
        actions.push({ label: 'Reject', action: 'reject', variant: 'danger', icon: XCircle })
      } else if (s === 'approved' || s === 'draft') {
        actions.push({ label: 'Start', action: 'start', variant: 'drawerPrimary', icon: Play })
      } else if (s === 'in_progress') {
        actions.push({ label: 'Complete', action: 'complete', variant: 'positive', icon: CheckCircle })
      }
      if (!['completed', 'cancelled', 'rejected'].includes(s)) {
        actions.push({ label: 'Cancel', action: 'cancel', variant: 'danger', icon: XCircle })
      }
    } else if (task.type === TASK_TYPES.INSPECTION) {
      if (s === 'scheduled' || s === 'pending') {
        actions.push({ label: 'Start', action: 'complete', variant: 'drawerPrimary', icon: Play })
        actions.push({ label: 'Postpone', action: 'postpone', variant: 'drawerGhost', icon: Pause })
      } else if (s === 'in_progress') {
        actions.push({ label: 'Complete', action: 'complete', variant: 'positive', icon: CheckCircle })
      }
      if (!['completed', 'cancelled'].includes(s)) {
        actions.push({ label: 'Cancel', action: 'cancel', variant: 'danger', icon: XCircle })
      }
    } else if (task.type === TASK_TYPES.PROPOSAL || task.type === TASK_TYPES.ESCALATION) {
      if (s === 'PENDING_REVIEW' || s === 'pending' || s === 'pending_review') {
        actions.push({ label: 'Approve', action: 'approve', variant: 'positive', icon: CheckCircle })
        actions.push({ label: 'Reject', action: 'reject', variant: 'danger', icon: XCircle })
      } else if (s === 'APPROVED' || s === 'approved') {
        actions.push({ label: 'Sanction', action: 'sanction', variant: 'positive', icon: CheckCircle })
      } else if (s === 'SANCTIONED' || s === 'sanctioned') {
        actions.push({ label: 'Start Execution', action: 'start', variant: 'drawerPrimary', icon: Play })
      }
    }

    return actions
  }

  const statusActions = getStatusActions()

  if (!task) return null

  const Icon = TYPE_ICONS[task.type] || FileText
  const pColors = PRIORITY_BADGE_COLORS[task.priority] || PRIORITY_BADGE_COLORS.medium
  const sColors = STATUS_BADGE_COLORS[task.status] || STATUS_BADGE_COLORS.pending
  const pLabel = PRIORITY_LABELS[task.priority] || task.priorityLabel || 'P3 Normal'
  const sLabel = STATUS_LABELS[task.status] || getStatusDisplay(task.rawStatus || task.status) || task.status

  const locationParts = [task.village || task.location, task.blockName || task.block, task.districtName || task.district].filter(Boolean)
  const locationStr = locationParts.join(', ')

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col md:w-[440px]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 -z-10 bg-black/30 backdrop-blur-sm md:bg-black/20"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close task details"
      />

      {/* Panel */}
      <div className="ml-auto flex h-full w-full max-w-[460px] flex-col border-l border-white/10 bg-[#0B3A5B] shadow-2xl md:w-[440px]">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10">
              <Icon size={18} className="text-white/70" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
                {task.typeLabel || TASK_TYPE_LABELS[task.type] || 'Task'}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <DrawerBadge bg={pColors.bg} text={pColors.text}>{pLabel}</DrawerBadge>
                <DrawerBadge bg={sColors.bg} text={sColors.text}>{sLabel}</DrawerBadge>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Close task details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Title */}
          <h2 className="text-[17px] font-semibold leading-snug text-white">{task.title}</h2>

          {/* Facility + Location */}
          {task.facilityName && (
            <p className="mt-1.5 text-[13.5px] text-white/80">{task.facilityName}</p>
          )}
          {locationStr && (
            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-white/60">
              <MapPin size={12} className="shrink-0" />
              {locationStr}
            </p>
          )}

          {/* Divider */}
          <hr className="my-4 border-white/10" />

          {/* WHY THIS TASK */}
          {(task.reason || task.description) && (
            <>
              <SectionHeading>Why This Task</SectionHeading>
              <p className="text-[13px] leading-relaxed text-white/80">
                {task.reason || task.description}
              </p>
              <hr className="my-4 border-white/10" />
            </>
          )}

          {/* SCHEDULE */}
          {(task.dueDate || task.scheduledDate || task.scheduledTime || task.assignee || task.inspectionTeam) && (
            <>
              <SectionHeading>Schedule</SectionHeading>
              <div className="space-y-1">
                {(task.scheduledDate || task.dueDate) && (
                  <InfoRow icon={Calendar} label="Date" value={formatDateFull(task.scheduledDate || task.dueDate)} />
                )}
                {(task.scheduledTime || (task.dueDate && formatTime(task.dueDate))) && (
                  <InfoRow icon={Clock} label="Time" value={formatTime(task.scheduledTime || task.dueDate)} />
                )}
                {task.inspectionTeam && (
                  <InfoRow icon={User} label="Team" value={task.inspectionTeam} />
                )}
                {(task.assignee || task.inspectorName) && (
                  <InfoRow icon={User} label="Inspector" value={task.assignee || task.inspectorName} />
                )}
              </div>
              <hr className="my-4 border-white/10" />
            </>
          )}

          {/* TASK / ACTION DETAILS */}
          {task.type === TASK_TYPES.INSPECTION && (
            <>
              <SectionHeading>Task Details</SectionHeading>
              <div className="space-y-1">
                {(task.purpose || task.description) && (
                  <InfoRow icon={StickyNote} label="Purpose" value={task.purpose || task.description} />
                )}
                {task.inspectionTeam && (
                  <InfoRow icon={User} label="Inspection Team" value={task.inspectionTeam} />
                )}
                {(task.inspectorName || task.inspectorDesignation) && (
                  <InfoRow icon={User} label="Inspector" value={[task.inspectorName, task.inspectorDesignation].filter(Boolean).join(' — ')} />
                )}
                {task.coverageGapScore != null && (
                  <InfoRow icon={AlertTriangle} label="Coverage Gap" value={`${task.coverageGapScore}%`} />
                )}
              </div>
              <hr className="my-4 border-white/10" />
            </>
          )}

          {task.type === TASK_TYPES.INTERVENTION && (
            <>
              <SectionHeading>Intervention Details</SectionHeading>
              <div className="space-y-1">
                {task.interventionType && (
                  <InfoRow icon={FileText} label="Intervention Type" value={task.interventionType} />
                )}
                {task.estimatedCost && (
                  <InfoRow icon={DollarSign} label="Estimated Cost" value={formatCurrency(task.estimatedCost)} />
                )}
                {task.expectedTimeline && (
                  <InfoRow icon={Clock} label="Expected Timeline" value={task.expectedTimeline} />
                )}
                {task.coverageGapScore != null && (
                  <InfoRow icon={AlertTriangle} label="Coverage Gap" value={`${task.coverageGapScore}%`} />
                )}
              </div>
              <hr className="my-4 border-white/10" />
            </>
          )}

          {task.type === TASK_TYPES.ESCALATION && (
            <>
              <SectionHeading>Escalation Details</SectionHeading>
              <div className="space-y-1">
                {task.title && (
                  <InfoRow icon={AlertTriangle} label="Issue" value={task.title} />
                )}
                {(task.reason || task.description) && (
                  <InfoRow icon={StickyNote} label="Reason" value={task.reason || task.description} />
                )}
                {task.createdAt && (
                  <InfoRow icon={Calendar} label="Escalated On" value={formatDateFull(task.createdAt)} />
                )}
              </div>
              <hr className="my-4 border-white/10" />
            </>
          )}

          {/* SOURCE */}
          <SectionHeading>Source</SectionHeading>
          <div className="space-y-1">
            <InfoRow
              icon={task.type === TASK_TYPES.INSPECTION ? Search : task.type === TASK_TYPES.ESCALATION ? AlertTriangle : FileText}
              label="Action"
              value={task.typeLabel || TASK_TYPE_LABELS[task.type] || 'Task'}
            />
            {task.departmentName && (
              <InfoRow icon={FileText} label="Department" value={task.departmentName} />
            )}
            {task.sourceId && (
              <InfoRow icon={Tag} label="Source ID" value={`${(task.typeLabel || 'Task').split(' ')[0]}-${task.sourceId}`} />
            )}
          </div>

          {/* TAGS */}
          {task.tags && task.tags.length > 0 && (
            <>
              <hr className="my-4 border-white/10" />
              <SectionHeading>Tags</SectionHeading>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.filter(Boolean).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11.5px] font-medium text-white/80"
                  >
                    {humanizeTag(tag)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-[#0A3250] px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {statusActions.map((sa) => (
              <Button
                key={sa.action}
                variant={sa.variant}
                size="sm"
                icon={sa.icon}
                loading={acting}
                disabled={acting}
                onClick={() => handleStatusAction(sa.action)}
              >
                {sa.label}
              </Button>
            ))}
            {task.facilityId && onOpenFacility && (
              <Button variant="drawerOutline" size="sm" icon={ExternalLink} onClick={() => onOpenFacility(task)}>
                Open Facility
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="drawerGhost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button variant="drawerOutline" size="sm" onClick={() => onEdit?.(task)}>
              Edit / Reschedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

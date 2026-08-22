import { AlertCircle, AlertTriangle, MinusCircle, CheckCircle2, Lightbulb, ArrowRight, Clock, Target, Database } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import GapScoreRing from '../../../components/ui/GapScoreRing'

const PRIORITY_META = {
  P1: { label: 'P1 Critical', tone: 'alert', icon: AlertCircle, bg: 'bg-alert-50', border: 'border-alert-200', text: 'text-alert-700', desc: 'Immediate action required — critical service deficit affecting vulnerable populations' },
  P2: { label: 'P2 High', tone: 'saffron', icon: AlertTriangle, bg: 'bg-saffron-50', border: 'border-saffron-200', text: 'text-saffron-700', desc: 'Urgent intervention needed — significant gap with escalation risk' },
  P3: { label: 'P3 Medium', tone: 'sky', icon: MinusCircle, bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', desc: 'Planned action recommended — measurable gap with defined remediation path' },
  P4: { label: 'P4 Low', tone: 'leaf', icon: CheckCircle2, bg: 'bg-leaf-50', border: 'border-leaf-200', text: 'text-leaf-700', desc: 'Monitor — gap within acceptable range, routine oversight sufficient' },
}

const PRIORITY_ORDER = { P1: 0, P2: 1, P3: 2, P4: 3 }

export function PriorityBadge({ priority, size = 'md' }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.P4
  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10.5px] px-2 py-1',
    lg: 'text-[11.5px] px-2.5 py-1.5',
  }
  return <Badge tone={meta.tone} className={sizeClasses[size]}>{meta.label}</Badge>
}

export function PriorityScoreRing({ priority, score, size = 48 }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.P4
  const color = meta.tone === 'alert' ? '#c0392b' : meta.tone === 'saffron' ? '#e07a2c' : meta.tone === 'sky' ? '#0b3558' : '#1f7a54'
  const clamped = Math.max(0, Math.min(1, score ?? 0))
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e4e7ec" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-mono text-[11px] font-semibold" style={{ color }}>{clamped.toFixed(2)}</span>
      </div>
    </div>
  )
}

// Main PriorityDisplay component — shows priority, score, reason, recommended action
export default function PriorityDisplay({ priorityData, compact = false, onAction }) {
  if (!priorityData) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-6 text-center">
        <MinusCircle className="mx-auto text-ink-300 mb-2" size={32} />
        <p className="text-[13px] text-ink-500">No priority assessment available.</p>
        <p className="text-[11px] text-ink-400 mt-1">The backend did not return a priority classification.</p>
      </div>
    )
  }

  const priority = priorityData.priority || (priorityData.score != null ? scoreToPriority(priorityData.score) : 'P4')
  const score = priorityData.score ?? priorityData.normalizedScore ?? null
  const reason = priorityData.reason || priorityData.reasonSummary || 'No reason provided.'
  const recommendedAction = priorityData.recommendedAction || priorityData.action || 'No action specified.'
  const evidence = priorityData.evidence || priorityData.supportingEvidence || []
  const existingIntervention = priorityData.existingIntervention || priorityData.linkedProject || null
  const timeline = priorityData.timeline || priorityData.targetDate || null
  const responsibleDept = priorityData.responsibleDepartment || priorityData.departmentName || null

  const meta = PRIORITY_META[priority] || PRIORITY_META.P4
  const Icon = meta.icon

  if (compact) {
    return (
      <div className={`rounded-xl border ${meta.border} ${meta.bg} p-3`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PriorityScoreRing priority={priority} score={score} size={40} />
            <div>
              <div className="flex items-center gap-1.5">
                <PriorityBadge priority={priority} size="md" />
                {responsibleDept && <span className="text-[10.5px] text-ink-500">{responsibleDept}</span>}
              </div>
              <p className="text-[12px] font-medium text-ink-950 mt-0.5 truncate">{priorityData.title || priorityData.name || 'Priority Area'}</p>
            </div>
          </div>
          {onAction && (
            <button onClick={onAction} className="flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:text-sky-900 shrink-0">
              <Lightbulb size={12} /> Action
            </button>
          )}
        </div>
        {!compact && recommendedAction && (
          <p className="mt-2 text-[11.5px] text-ink-700 leading-snug">{recommendedAction}</p>
        )}
      </div>
    )
  }

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <PriorityScoreRing priority={priority} score={score} size={56} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={priority} size="lg" />
              {responsibleDept && (
                <Badge tone="ink" className="text-[10px]">{responsibleDept}</Badge>
              )}
            </div>
            <h3 className="text-[14px] font-semibold text-ink-950 mt-1">
              {priorityData.title || priorityData.name || 'Priority Area'}
            </h3>
            <p className="text-[11px] text-ink-500 mt-0.5">{meta.desc}</p>
          </div>
        </div>
      </div>

      {/* Score + Model info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-ink-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Gap Score</p>
          <p className="text-[20px] font-bold text-ink-950 mt-0.5 font-mono">
            {score != null ? Number(score).toFixed(3) : 'Data unavailable'}
          </p>
        </div>
        <div className="rounded-lg border border-ink-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Priority</p>
          <p className="text-[20px] font-bold text-ink-950 mt-0.5">{priority}</p>
        </div>
        <div className="rounded-lg border border-ink-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{timeline ? 'Target Date' : 'Model Version'}</p>
          <p className="text-[13px] font-medium text-ink-800 mt-0.5 truncate">
            {timeline ? new Date(timeline).toLocaleDateString('en-IN') : (priorityData.modelVersion || 'Not provided')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-ink-100 bg-white p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Affected geography</p>
          <p className="mt-1 text-[12.5px] font-medium text-ink-800">{[priorityData.village, priorityData.block, priorityData.ward].filter(Boolean).join(', ') || 'Not provided'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Facility</p>
          <p className="mt-1 text-[12.5px] font-medium text-ink-800">{priorityData.facilityName || priorityData.facility || priorityData.name || 'Not provided'}</p>
        </div>
      </div>

      {/* Reason */}
      <div className="rounded-lg border border-ink-100 bg-white p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500 mb-2">
          <Target size={12} /> Reason for priority
        </p>
        <p className="text-[12.5px] text-ink-800 leading-snug">{reason}</p>
      </div>

      {/* Recommended Action */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700 mb-2">
          <Lightbulb size={12} /> Recommended action
        </p>
        <p className="text-[12.5px] text-ink-800 leading-snug">{recommendedAction}</p>
        {timeline && (
          <p className="flex items-center gap-1.5 text-[10.5px] text-sky-600 mt-2">
            <Clock size={12} /> Target completion: {new Date(timeline).toLocaleDateString('en-IN')}
          </p>
        )}
        {onAction && (
          <button onClick={onAction} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900">
            <ArrowRight size={14} /> Create Intervention
          </button>
        )}
      </div>

      {/* Evidence */}
      {evidence.length > 0 && (
        <details className="rounded-lg border border-ink-100 bg-white p-4">
          <summary className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 cursor-pointer">
            <Database size={13} className="text-sky-600" /> Supporting evidence ({evidence.length})
          </summary>
          <ul className="mt-2 space-y-1.5 text-[11.5px] text-ink-600">
            {evidence.map((e, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-ink-300 mt-0.5">•</span>
                <span>{typeof e === 'string' ? e : e.description || e.title || JSON.stringify(e)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Existing Intervention */}
      {existingIntervention && (
        <details className="rounded-lg border border-ink-100 bg-white p-4">
          <summary className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 cursor-pointer">
            <FolderGit2 size={13} className="text-saffron-600" /> Existing intervention
          </summary>
          <div className="mt-2 space-y-2">
            <div className="rounded-lg border border-ink-100 p-3">
              <p className="text-[12px] font-medium text-ink-800">{existingIntervention.title || existingIntervention.name || 'Intervention'}</p>
              <p className="text-[11px] text-ink-500 mt-0.5">{existingIntervention.status || existingIntervention.stage || 'Status unknown'}</p>
              {existingIntervention.estimatedCost && (
                <p className="text-[11px] text-ink-600 mt-1">Est. cost: {formatCurrencyINR(existingIntervention.estimatedCost)}</p>
              )}
            </div>
          </div>
        </details>
      )}
    </div>
  )
}

function scoreToPriority(score) {
  const s = Number(score)
  if (s >= 0.75) return 'P1'
  if (s >= 0.5) return 'P2'
  if (s >= 0.25) return 'P3'
  return 'P4'
}

function formatCurrencyINR(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`
  return `₹${num.toLocaleString('en-IN')}`
}

// FolderGit2 icon inline since it's not imported
function FolderGit2({ size = 13, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 21a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-5l-3-3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      <path d="M8 16h8" />
      <path d="M12 12v4" />
    </svg>
  )
}

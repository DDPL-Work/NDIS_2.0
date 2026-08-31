import { AlertCircle, AlertTriangle, MinusCircle, CheckCircle2, Lightbulb, ArrowRight, Target, Database } from 'lucide-react'
import Badge from '../../../components/ui/Badge'

const PRIORITY_META = {
  P1: { label: 'P1 Critical', tone: 'alert', icon: AlertCircle, bg: 'bg-alert-50', border: 'border-alert-200', desc: 'Immediate action required — critical service deficit' },
  P2: { label: 'P2 High', tone: 'saffron', icon: AlertTriangle, bg: 'bg-saffron-50', border: 'border-saffron-200', desc: 'Urgent intervention needed — significant gap' },
  P3: { label: 'P3 Medium', tone: 'sky', icon: MinusCircle, bg: 'bg-sky-50', border: 'border-sky-200', desc: 'Planned action recommended — measurable gap' },
  P4: { label: 'P4 Low', tone: 'leaf', icon: CheckCircle2, bg: 'bg-leaf-50', border: 'border-leaf-200', desc: 'Monitor — gap within acceptable range' },
}

export function PriorityBadge({ priority, size = 'md' }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.P4
  const sizeClasses = { sm: 'text-[9px] px-1.5 py-0.5', md: 'text-[10.5px] px-2 py-1', lg: 'text-[11.5px] px-2.5 py-1.5' }
  return <Badge tone={meta.tone} className={sizeClasses[size]}>{meta.label}</Badge>
}

export function PriorityScoreRing({ score, size = 48 }) {
  const s = Number(score)
  const clamped = Math.max(0, Math.min(100, Number.isFinite(s) ? s : 0))
  const normalized = clamped / 100
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - normalized)
  const color = clamped >= 75 ? '#c0392b' : clamped >= 50 ? '#e07a2c' : clamped >= 25 ? '#0b3558' : '#1f7a54'

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
        <span className="font-mono text-[11px] font-semibold" style={{ color }}>{clamped.toFixed(0)}</span>
      </div>
    </div>
  )
}

// PriorityDisplay — renders priority, score, reason, recommended action
// ALL data comes from backend — nothing fabricated
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

  // All fields from backend
  const priority = priorityData.priority || 'P4'
  const score = priorityData.gapScore ?? priorityData.gap_score ?? null
  const reason = priorityData.reason || (priorityData.reasonCodes || []).join(', ') || null
  const recommendedAction = priorityData.recommended_action || priorityData.recommendedAction || null
  const departmentCode = priorityData.departmentCode || priorityData.department_code || null
  const name = priorityData.name || priorityData.facility_name || 'Priority Area'
  const modelVersion = priorityData.modelVersion || priorityData.model_version || null

  const meta = PRIORITY_META[priority] || PRIORITY_META.P4
  const Icon = meta.icon

  if (compact) {
    return (
      <div className={`rounded-xl border ${meta.border} ${meta.bg} p-3`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PriorityScoreRing score={score} size={40} />
            <div>
              <div className="flex items-center gap-1.5">
                <PriorityBadge priority={priority} size="md" />
                {departmentCode && <span className="text-[10.5px] text-ink-500">{departmentCode}</span>}
              </div>
              <p className="text-[12px] font-medium text-ink-950 mt-0.5 truncate">{name}</p>
            </div>
          </div>
          {onAction && (
            <button onClick={onAction} className="flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:text-sky-900 shrink-0">
              <Lightbulb size={12} /> Action
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <PriorityScoreRing score={score} size={56} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={priority} size="lg" />
              {departmentCode && <Badge tone="ink" className="text-[10px]">{departmentCode}</Badge>}
            </div>
            <h3 className="text-[14px] font-semibold text-ink-950 mt-1">{name}</h3>
            <p className="text-[11px] text-ink-500 mt-0.5">{meta.desc}</p>
          </div>
        </div>
      </div>

      {/* Score + Model info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-ink-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Gap Score</p>
          <p className="text-[20px] font-bold text-ink-950 mt-0.5 font-mono">
            {score != null ? Number(score).toFixed(1) : 'Data unavailable'}
          </p>
        </div>
        <div className="rounded-lg border border-ink-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Priority</p>
          <p className="text-[20px] font-bold text-ink-950 mt-0.5">{priority}</p>
        </div>
        <div className="rounded-lg border border-ink-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Model Version</p>
          <p className="text-[13px] font-medium text-ink-800 mt-0.5 truncate">
            {modelVersion || 'Not provided'}
          </p>
        </div>
      </div>

      {/* Reason */}
      {reason && (
        <div className="rounded-lg border border-ink-100 bg-white p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500 mb-2">
            <Target size={12} /> Reason for priority
          </p>
          <p className="text-[12.5px] text-ink-800 leading-snug">{reason}</p>
        </div>
      )}

      {/* Recommended Action */}
      {recommendedAction && (
        <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700 mb-2">
            <Lightbulb size={12} /> Recommended action
          </p>
          <p className="text-[12.5px] text-ink-800 leading-snug">{recommendedAction}</p>
          {onAction && (
            <button onClick={onAction} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900">
              <ArrowRight size={14} /> Create Intervention
            </button>
          )}
        </div>
      )}
    </div>
  )
}

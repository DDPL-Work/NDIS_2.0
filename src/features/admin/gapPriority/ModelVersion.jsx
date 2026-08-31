import { Database, Clock, Weight, Info, AlertTriangle } from 'lucide-react'
import Badge from '../../../components/ui/Badge'

// ModelVersion — displays model version, calculation date, weight version from backend
export function ModelVersion({ metadata }) {
  if (!metadata || (!metadata.modelVersion && !metadata.calculatedAt && !metadata.weightVersion)) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 text-center">
        <AlertTriangle className="mx-auto text-ink-300 mb-2" size={24} />
        <p className="text-[12px] text-ink-500">Model metadata unavailable</p>
        <p className="text-[10.5px] text-ink-400 mt-1">The backend did not return model version information.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Database className="text-sky-600" size={18} />
        <h3 className="text-[13px] font-semibold text-ink-950">Gap Model</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
        {metadata.modelVersion && (
          <div className="rounded-lg border border-ink-100 p-3">
            <p className="font-medium text-ink-500 uppercase tracking-wide mb-1">Model Version</p>
            <p className="font-mono text-ink-900 text-[14px]">{metadata.modelVersion}</p>
          </div>
        )}
        {metadata.calculatedAt && (
          <div className="rounded-lg border border-ink-100 p-3">
            <p className="font-medium text-ink-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Clock size={11} /> Calculated
            </p>
            <p className="font-mono text-ink-900">
              {new Date(metadata.calculatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}
        {metadata.weightVersion && (
          <div className="rounded-lg border border-ink-100 p-3">
            <p className="font-medium text-ink-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Weight size={11} /> Weights
            </p>
            <p className="font-mono text-ink-900">{metadata.weightVersion}</p>
          </div>
        )}
      </div>

      {metadata.description && (
        <details className="mt-4">
          <summary className="flex items-center gap-1.5 text-[10.5px] text-ink-500 cursor-pointer">
            <Info size={12} /> Methodology & assumptions
          </summary>
          <div className="mt-2 p-3 rounded-lg bg-ink-50/50 text-[10.5px] text-ink-600 whitespace-pre-line">
            {metadata.description}
          </div>
        </details>
      )}
    </div>
  )
}

// WeightsDisplay — renders dimension weights from backend (never invented by frontend)
export function WeightsDisplay({ weights }) {
  if (!weights || Object.keys(weights).length === 0) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-6 text-center">
        <Weight className="mx-auto text-ink-300 mb-2" size={28} />
        <p className="text-[12px] text-ink-500">Dimension weights not provided</p>
        <p className="text-[10.5px] text-ink-400 mt-1">The backend did not return weight configuration.</p>
      </div>
    )
  }

  const DIMENSION_META = {
    demand_gap: { label: 'Demand Gap', icon: '👥' },
    capacity_gap: { label: 'Capacity Gap', icon: '🏗️' },
    accessibility_gap: { label: 'Accessibility Gap', icon: '🛣️' },
    infrastructure_gap: { label: 'Infrastructure Gap', icon: '🏢' },
    hr_gap: { label: 'HR Gap', icon: '👨‍⚕️' },
    medicine_gap: { label: 'Medicine Gap', icon: '💊' },
    coverage_gap: { label: 'Coverage Gap', icon: '📍' },
    citizen_feedback_gap: { label: 'Citizen Feedback Gap', icon: '📝' },
  }

  const entries = Object.entries(weights).map(([key, weight]) => ({
    key,
    weight: Number(weight),
    meta: DIMENSION_META[key] || { label: key.replace(/_/g, ' '), icon: '' },
  }))

  entries.sort((a, b) => b.weight - a.weight)

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Weight className="text-sky-600" size={18} />
          <h3 className="text-[13px] font-semibold text-ink-950">Dimension Weights</h3>
        </div>
        <Badge tone="sky" className="text-[9px]">From backend</Badge>
      </div>

      <div className="space-y-2">
        {entries.map(({ key, weight, meta }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-6 text-center text-[14px]">{meta.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="font-medium text-ink-800 truncate">{meta.label}</span>
                <span className="font-mono text-sky-700 shrink-0">{(weight * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${weight * 100}%` }} />
              </div>
            </div>
          </div>
        ))}

        <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between text-[10.5px]">
          <span className="text-ink-500">Sum of weights</span>
          <span className={`font-mono font-semibold ${Math.abs(entries.reduce((s, e) => s + e.weight, 0) - 1) < 0.001 ? 'text-sky-700' : 'text-alert-600'}`}>
            {(entries.reduce((s, e) => s + e.weight, 0) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export { ModelVersion as GapModelVersion }

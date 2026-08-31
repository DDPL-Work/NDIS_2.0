import { ChevronDown, Info, AlertCircle } from 'lucide-react'
import { useMemo } from 'react'
import Badge from '../../../components/ui/Badge'

// Backend component dimension metadata for display labels
const DIMENSION_META = {
  demand_gap: { label: 'Demand Gap', icon: '👥', description: 'Population need vs service capacity' },
  capacity_gap: { label: 'Capacity Gap', icon: '🏗️', description: 'Infrastructure capacity shortfall' },
  accessibility_gap: { label: 'Accessibility Gap', icon: '🛣️', description: 'Travel time / distance barriers' },
  infrastructure_gap: { label: 'Infrastructure Gap', icon: '🏢', description: 'Physical facility condition deficit' },
  hr_gap: { label: 'HR Gap', icon: '👨‍⚕️', description: 'Healthcare workforce shortage' },
  medicine_gap: { label: 'Medicine Gap', icon: '💊', description: 'Essential medicine stock deficit' },
  coverage_gap: { label: 'Coverage Gap', icon: '📍', description: 'Spatial service coverage deficit' },
  citizen_feedback_gap: { label: 'Citizen Feedback Gap', icon: '📝', description: 'Perceived service quality gap' },
}

function DimensionCard({ dimensionKey, value, weight }) {
  const meta = DIMENSION_META[dimensionKey] || { label: dimensionKey, icon: '', description: '' }
  const score = typeof value === 'number' ? value : null
  const hasData = score != null && Number.isFinite(score)

  return (
    <div className="group rounded-xl border border-ink-100 bg-white p-4 transition hover:border-ink-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[18px]">{meta.icon}</span>
          <div>
            <h4 className="text-[13px] font-semibold text-ink-950">{meta.label}</h4>
            <p className="text-[10.5px] text-ink-400">{meta.description}</p>
          </div>
        </div>
        <div className="text-right">
          {hasData ? (
            <div className="w-12 h-12 rounded-full border-2 border-sky-200 flex items-center justify-center">
              <span className="text-[13px] font-bold font-mono text-sky-700">{score.toFixed(0)}</span>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-ink-50 flex items-center justify-center">
              <span className="text-[11px] text-ink-400">—</span>
            </div>
          )}
        </div>
      </div>
      {weight != null && (
        <div className="mt-2 flex items-center gap-2 text-[10.5px] text-ink-500">
          <span>Weight:</span>
          <span className="font-mono text-sky-700">{(Number(weight) * 100).toFixed(1)}%</span>
        </div>
      )}
    </div>
  )
}

export default function GapDetail({ gapData, onExplain }) {
  if (!gapData) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-6 text-center">
        <AlertCircle className="mx-auto text-ink-300 mb-2" size={32} />
        <p className="text-[13px] text-ink-500">No gap data available</p>
        <p className="text-[11px] text-ink-400 mt-1">The backend did not return a gap assessment.</p>
      </div>
    )
  }

  // Backend fields: gap_assessment (overview) or direct fields (facility)
  const overallScore = gapData.averageGapScore ?? gapData.average_gap_score ?? gapData.gapScore ?? gapData.gap_score ?? null
  const hasOverall = overallScore != null && Number.isFinite(overallScore)

  // Components from backend (snake_case keys with numeric values)
  const components = gapData.components || {}
  const weights = gapData.weights || gapData.weightsUsed || gapData.weights_used || {}

  const componentEntries = useMemo(() => {
    return Object.entries(components).filter(([, v]) => v != null)
  }, [components])

  // Priority from score
  const getPriority = (score) => {
    const s = Number(score)
    if (s >= 75) return 'P1'
    if (s >= 50) return 'P2'
    if (s >= 25) return 'P3'
    return 'P4'
  }

  const priority = hasOverall ? getPriority(overallScore) : null

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="rounded-xl border border-ink-100 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-ink-950">Overall Gap Score</h3>
            <p className="text-[12px] text-ink-500 mt-0.5">
              Composite need-based deficit index. Higher = greater unmet need.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {hasOverall ? (
              <>
                <div className="w-16 h-16 rounded-full border-4 border-sky-200 flex items-center justify-center">
                  <span className="text-[18px] font-bold font-mono text-sky-700">{overallScore.toFixed(1)}</span>
                </div>
                {priority && (
                  <Badge tone={priority === 'P1' ? 'alert' : priority === 'P2' ? 'saffron' : priority === 'P3' ? 'sky' : 'leaf'} className="text-[11px] font-semibold">
                    {priority}
                  </Badge>
                )}
              </>
            ) : (
              <div className="w-16 h-16 rounded-full bg-ink-50 flex items-center justify-center">
                <span className="text-ink-400">—</span>
              </div>
            )}
          </div>
        </div>

        {/* Model version */}
        {(gapData.modelVersion || gapData.calculatedAt) && (
          <div className="mt-4 pt-4 border-t border-ink-100 flex flex-wrap items-center gap-4 text-[11px] text-ink-500">
            {gapData.modelVersion && (
              <span className="flex items-center gap-1">
                <Info size={12} /> Model: <span className="font-mono text-ink-700">{gapData.modelVersion}</span>
              </span>
            )}
          </div>
        )}

        {/* Weights from backend */}
        {Object.keys(weights).length > 0 && (
          <details className="mt-4">
            <summary className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 cursor-pointer">
              <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
              View dimension weights (from backend)
            </summary>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              {Object.entries(weights).map(([key, weight]) => (
                <div key={key} className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-ink-50">
                  <span className="text-ink-600 truncate">{DIMENSION_META[key]?.label || key}</span>
                  <span className="font-mono text-ink-800">{(Number(weight) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Component Breakdown — all from backend, never fabricated */}
      {componentEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {componentEntries.map(([key, value]) => (
            <DimensionCard
              key={key}
              dimensionKey={key}
              value={value}
              weight={weights[key]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-6 text-center">
          <AlertCircle className="mx-auto text-ink-300 mb-2" size={32} />
          <p className="text-[13px] text-ink-500">No component breakdown available</p>
          <p className="text-[11px] text-ink-400 mt-1">The backend did not return dimension-level gap data.</p>
        </div>
      )}

      {/* Reason codes from backend */}
      {gapData.reasonCodes && gapData.reasonCodes.length > 0 && (
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500 mb-2">
            <Info size={13} /> Reason codes (from backend)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {gapData.reasonCodes.map((code, i) => (
              <Badge key={i} tone="sky" className="text-[10px] font-mono">{code}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { ChevronDown, ChevronUp, Info, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useState, useMemo } from 'react'
import GapScoreRing from '../../../components/ui/GapScoreRing'
import Badge from '../../../components/ui/Badge'

// Component dimension metadata for display
const DIMENSION_META = {
  demand: { label: 'Demand Gap', icon: '👥', description: 'Population need vs service capacity' },
  capacity: { label: 'Capacity Gap', icon: '🏗️', description: 'Infrastructure capacity shortfall' },
  accessibility: { label: 'Accessibility Gap', icon: '🛣️', description: 'Travel time / distance barriers' },
  infrastructure: { label: 'Infrastructure Gap', icon: '🏢', description: 'Physical facility condition deficit' },
  hr: { label: 'HR Gap', icon: '👨‍⚕️', description: 'Healthcare workforce shortage' },
  medicine: { label: 'Medicine Gap', icon: '💊', description: 'Essential medicine stock deficit' },
  coverage: { label: 'Coverage Gap', icon: '📍', description: 'Spatial service coverage deficit' },
  citizen_feedback: { label: 'Citizen Feedback Gap', icon: '📝', description: 'Perceived service quality gap' },
}

function DimensionCard({ dimension, data, onExplain }) {
  const meta = DIMENSION_META[dimension] || { label: dimension, icon: '', description: '' }
  const score = data?.normalizedValue ?? data?.value ?? null
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
        <div className="flex items-center gap-1.5">
          {hasData && (
            <GapScoreRing score={Number(score)} size={36} strokeWidth={4} />
          )}
          {!hasData && (
            <div className="w-9 h-9 rounded-full bg-ink-50 flex items-center justify-center">
              <span className="text-[11px] text-ink-400">—</span>
            </div>
          )}
          <button
            onClick={() => onExplain?.(dimension, data)}
            className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition"
            aria-label={`Explain ${meta.label}`}
          >
            <Info size={14} />
          </button>
        </div>
      </div>

      {hasData && data.components && data.components.length > 0 && (
        <details className="group-open:mt-2">
          <summary className="flex items-center justify-between gap-2 text-[11px] text-ink-500 cursor-pointer select-none">
            <span>Sub-components</span>
            <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 space-y-1.5 border-t border-ink-100 pt-2">
            {data.components.map((comp) => (
              <div key={comp.label} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-ink-600 truncate">{comp.label}</span>
                <span className="text-ink-800 font-medium">{comp.value != null ? Number(comp.value).toFixed(2) : '—'}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

export default function GapDetail({ gapData, onExplain }) {
  if (!gapData) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-6 text-center">
        <AlertCircle className="mx-auto text-ink-300 mb-2" size={32} />
        <p className="text-[13px] text-ink-500">No gap data available for this entity.</p>
        <p className="text-[11px] text-ink-400 mt-1">The backend did not return a gap assessment.</p>
      </div>
    )
  }

  const overallScore = gapData.overallScore ?? gapData.score ?? null
  const hasOverall = overallScore != null && Number.isFinite(overallScore)

  // Only dimensions with actual backend data
  const dimensions = useMemo(() => {
    const dims = []
    Object.keys(DIMENSION_META).forEach((key) => {
      if (gapData.components?.[key] != null || gapData[key] != null) {
        dims.push({ key, data: gapData.components?.[key] ?? gapData[key] })
      }
    })
    return dims
  }, [gapData])

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
                <GapScoreRing score={Number(overallScore)} size={72} strokeWidth={8} label="Overall" />
                <PriorityBadge score={overallScore} />
              </>
            ) : (
              <div className="w-16 h-16 rounded-full bg-ink-50 flex items-center justify-center">
                <span className="text-ink-400">—</span>
              </div>
            )}
          </div>
        </div>

        {/* Model version + calculation date */}
        {(gapData.modelVersion || gapData.calculatedAt) && (
          <div className="mt-4 pt-4 border-t border-ink-100 flex flex-wrap items-center gap-4 text-[11px] text-ink-500">
            {gapData.modelVersion && (
              <span className="flex items-center gap-1">
                <span className="font-mono text-ink-700">{gapData.modelVersion}</span>
              </span>
            )}
            {gapData.calculatedAt && (
              <span>Calculated: {new Date(gapData.calculatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
            {gapData.weightVersion && (
              <span>Weights: {gapData.weightVersion}</span>
            )}
          </div>
        )}

        {/* Weights summary if available */}
        {gapData.weights && Object.keys(gapData.weights).length > 0 && (
          <details className="mt-4">
            <summary className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 cursor-pointer">
              <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
              View dimension weights (from backend)
            </summary>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              {Object.entries(gapData.weights).map(([key, weight]) => (
                <div key={key} className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-ink-50">
                  <span className="text-ink-600">{DIMENSION_META[key]?.label || key}</span>
                  <span className="font-mono text-ink-800">{(Number(weight) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Component Breakdown — only dimensions with real backend data */}
      {dimensions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {dimensions.map(({ key, data }) => (
            <DimensionCard key={key} dimension={key} data={data} onExplain={onExplain} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-6 text-center">
          <AlertTriangle className="mx-auto text-ink-300 mb-2" size={32} />
          <p className="text-[13px] text-ink-500">No component breakdown available.</p>
          <p className="text-[11px] text-ink-400 mt-1">The backend did not return dimension-level gap data.</p>
        </div>
      )}

      {/* Evidence sources if provided */}
      {gapData.sources && gapData.sources.length > 0 && (
        <details className="rounded-xl border border-ink-100 bg-white p-4">
          <summary className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 cursor-pointer">
            <Info size={13} /> Data sources & evidence
          </summary>
          <ul className="mt-2 space-y-1 text-[11px] text-ink-600">
            {gapData.sources.map((src, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-ink-300 mt-0.5">•</span>
                <span>{src}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function PriorityBadge({ score }) {
  const s = Number(score)
  if (s >= 0.75) return <Badge tone="alert" className="text-[11px] font-semibold">P1 Critical</Badge>
  if (s >= 0.5) return <Badge tone="saffron" className="text-[11px] font-semibold">P2 High</Badge>
  if (s >= 0.25) return <Badge tone="sky" className="text-[11px] font-semibold">P3 Medium</Badge>
  return <Badge tone="leaf" className="text-[11px] font-semibold">P4 Low</Badge>
}
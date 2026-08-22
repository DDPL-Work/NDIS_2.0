import { ChevronDown, ChevronUp, ExternalLink, Database, Clock, Weight } from 'lucide-react'
import { useState } from 'react'
import Badge from '../../../components/ui/Badge'

// ScoreExplanation — renders the detailed "Why is this high priority?" breakdown
// For each component: raw value, normalized value, weight, contribution, source, as-of date
export default function ScoreExplanation({ explanationData, onClose }) {
  if (!explanationData) {
    return (
      <div className="p-4 text-center text-ink-500">
        No explanation data available.
      </div>
    )
  }

  const [expanded, setExpanded] = useState({})

  const components = explanationData.components || []
  const overall = explanationData.overall || {}

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold text-ink-950">Why is this a priority?</h3>
          <p className="text-[12px] text-ink-500 mt-0.5">
            Complete breakdown of the gap score: raw inputs → normalized → weighted contribution.
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 shrink-0 p-1">
            <ExternalLink size={16} />
          </button>
        )}
      </div>

      {/* Overall summary */}
      <div className="rounded-xl border border-ink-100 bg-sky-50/50 p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Weight className="text-sky-700" size={18} />
            <div>
              <p className="text-[11px] font-medium text-sky-700 uppercase tracking-wide">Overall Score</p>
              <p className="text-[22px] font-bold text-ink-950">
                {overall.normalizedValue != null ? Number(overall.normalizedValue).toFixed(3) : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ink-500 shrink-0">
            {overall.modelVersion && (
              <span className="flex items-center gap-1"><Database size={12} /> {overall.modelVersion}</span>
            )}
            {overall.calculatedAt && (
              <span className="flex items-center gap-1"><Clock size={12} /> {new Date(overall.calculatedAt).toLocaleDateString('en-IN')}</span>
            )}
            {overall.weightVersion && <span>Weights: {overall.weightVersion}</span>}
          </div>
        </div>
      </div>

      {/* Component breakdown table */}
      <div className="rounded-xl border border-ink-100 bg-white overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_80px_80px_80px_100px_100px] gap-0 text-[10.5px] font-medium text-ink-500 uppercase tracking-wide bg-ink-50 border-b border-ink-100 px-3 py-2">
          <div className="truncate">Component</div>
          <div className="truncate">Raw Value</div>
          <div className="text-right">Normalized</div>
          <div className="text-right">Weight</div>
          <div className="text-right">Contribution</div>
          <div className="truncate">Source</div>
          <div className="truncate">As of</div>
        </div>

        <div className="divide-y divide-ink-100">
          {components.length === 0 ? (
            <div className="p-6 text-center text-ink-400 text-[12px]">
              No component breakdown returned by the backend.
            </div>
          ) : (
            components.map((comp, idx) => {
              const isOpen = expanded[idx]
              const hasSub = comp.subComponents && comp.subComponents.length > 0

              return (
                <div key={idx} className="bg-white">
                  <button
                    onClick={() => hasSub && setExpanded({ ...expanded, [idx]: !isOpen })}
                    className="w-full grid grid-cols-[auto_1fr_80px_80px_80px_100px_100px] gap-0 px-3 py-2.5 text-left hover:bg-ink-50 transition"
                    disabled={!hasSub}
                    style={{ cursor: hasSub ? 'pointer' : 'default' }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {hasSub && (
                        <span className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                          <ChevronDown size={12} />
                        </span>
                      )}
                      {!hasSub && <span className="shrink-0 w-4" />}
                      <span className="font-medium text-ink-800 truncate">{comp.label || comp.dimension || 'Unknown'}</span>
                    </div>
                    <div className="text-ink-600 truncate font-mono">
                      {comp.rawValue != null ? (typeof comp.rawValue === 'number' ? Number(comp.rawValue).toLocaleString('en-IN') : comp.rawValue) : '—'}
                    </div>
                    <div className="text-right font-mono text-ink-800">
                      {comp.normalizedValue != null ? Number(comp.normalizedValue).toFixed(3) : '—'}
                    </div>
                    <div className="text-right font-mono text-sky-700">
                      {comp.weight != null ? `{(Number(comp.weight) * 100).toFixed(1)}%` : '—'}
                    </div>
                    <div className="text-right font-mono text-sky-700 font-semibold">
                      {comp.contribution != null ? Number(comp.contribution).toFixed(3) : '—'}
                    </div>
                    <div className="text-ink-500 truncate max-w-[100px]">
                      {comp.source || 'Backend'}
                    </div>
                    <div className="text-ink-400 font-mono whitespace-nowrap">
                      {comp.asOfDate ? new Date(comp.asOfDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                    </div>
                  </button>

                  {hasSub && isOpen && (
                    <div className="bg-ink-50/50 border-t border-ink-100 grid grid-cols-[auto_1fr_80px_80px_80px_100px_100px] gap-0 px-3">
                      <div className="col-span-1 px-3" />
                      {comp.subComponents.map((sub, sIdx) => (
                        <div key={sIdx} className="py-1.5 text-[10px]">
                          <div className="flex items-center gap-1.5 text-ink-500 truncate">
                            <span className="w-3 h-3 rounded-full bg-sky-400 shrink-0" />
                            <span className="truncate">{sub.label}</span>
                          </div>
                          <div className="text-right font-mono text-ink-600">
                            {sub.rawValue != null ? (typeof sub.rawValue === 'number' ? Number(sub.rawValue).toLocaleString('en-IN') : sub.rawValue) : '—'}
                          </div>
                          <div className="text-right font-mono text-ink-800">
                            {sub.normalizedValue != null ? Number(sub.normalizedValue).toFixed(3) : '—'}
                          </div>
                          <div className="text-right font-mono text-sky-600">
                            {sub.weight != null ? `{(Number(sub.weight) * 100).toFixed(1)}%` : '—'}
                          </div>
                          <div className="text-right font-mono text-sky-700 font-medium">
                            {sub.contribution != null ? Number(sub.contribution).toFixed(3) : '—'}
                          </div>
                          <div className="text-ink-400 truncate max-w-[100px]">{sub.source || '—'}</div>
                          <div className="text-ink-400 font-mono">
                            {sub.asOfDate ? new Date(sub.asOfDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Methodology note */}
      {explanationData.methodology && (
        <details className="rounded-xl border border-ink-100 bg-white p-4">
          <summary className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 cursor-pointer">
            <Info size={13} /> Scoring methodology
          </summary>
          <div className="mt-2 text-[11px] text-ink-600 whitespace-pre-line">
            {explanationData.methodology}
          </div>
        </details>
      )}
    </div>
  )
}
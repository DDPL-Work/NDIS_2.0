import { ChevronDown, ExternalLink, Database, Clock, Weight } from 'lucide-react'
import { useState } from 'react'

// ScoreExplanation — renders the backend component breakdown
// Each component: label, raw value, normalized value, weight, contribution, source
export default function ScoreExplanation({ explanationData, onClose }) {
  if (!explanationData) {
    return (
      <div className="p-4 text-center text-ink-500 text-[13px]">
        No explanation data available. The backend did not return component breakdown.
      </div>
    )
  }

  const [expanded, setExpanded] = useState({})
  const components = explanationData.components || []
  const overall = explanationData.overall || {}

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold text-ink-950">Why is this a priority?</h3>
          <p className="text-[12px] text-ink-500 mt-0.5">
            Complete breakdown of the gap score: component values → weighted contribution.
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
          </div>
        </div>
      </div>

      {/* Component breakdown table */}
      <div className="rounded-xl border border-ink-100 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-0 text-[10.5px] font-medium text-ink-500 uppercase tracking-wide bg-ink-50 border-b border-ink-100 px-3 py-2">
          <div>Component</div>
          <div className="text-right">Raw Value</div>
          <div className="text-right">Weight</div>
          <div className="text-right">Contribution</div>
          <div>Source</div>
        </div>

        <div className="divide-y divide-ink-100">
          {components.length === 0 ? (
            <div className="p-6 text-center text-ink-400 text-[12px]">
              No component breakdown returned by the backend.
            </div>
          ) : (
            components.map((comp, idx) => (
              <div key={idx} className="px-3 py-2.5 hover:bg-ink-50/50">
                <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-0 items-center">
                  <div className="font-medium text-ink-800 truncate text-[11.5px]">{comp.label || 'Unknown'}</div>
                  <div className="text-right font-mono text-ink-600 text-[11px]">
                    {comp.rawValue != null ? (typeof comp.rawValue === 'number' ? comp.rawValue.toFixed(1) : comp.rawValue) : '—'}
                  </div>
                  <div className="text-right font-mono text-sky-700 text-[11px]">
                    {comp.weight != null ? `${(Number(comp.weight) * 100).toFixed(1)}%` : '—'}
                  </div>
                  <div className="text-right font-mono text-sky-700 font-semibold text-[11px]">
                    {comp.contribution != null ? Number(comp.contribution).toFixed(4) : '—'}
                  </div>
                  <div className="text-ink-500 truncate text-[11px]">
                    {comp.source || 'Backend'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Methodology note */}
      {explanationData.methodology && (
        <details className="rounded-xl border border-ink-100 bg-white p-4">
          <summary className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 cursor-pointer">
            <Database size={13} /> Scoring methodology
          </summary>
          <div className="mt-2 text-[11px] text-ink-600 whitespace-pre-line">
            {explanationData.methodology}
          </div>
        </details>
      )}
    </div>
  )
}

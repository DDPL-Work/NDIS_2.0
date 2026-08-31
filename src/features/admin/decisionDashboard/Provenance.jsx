import { Clock } from 'lucide-react'

// Provenance footer — every KPI and section declares its data source, its exact
// calculation definition and (where available) the last time the data loaded.
// This satisfies the auditability requirement: a number is only trustworthy
// when the reader can see where it came from.
export default function Provenance({ source, definition, updatedAt }) {
  return (
    <div className="space-y-1.5 text-[11px] leading-snug text-ink-400 border-t border-ink-100 pt-3">
      {source && (
        <p>
          <span className="font-medium text-ink-500">Source:</span> <span className="kbd-mono">{source}</span>
        </p>
      )}
      {definition && (
        <p>
          <span className="font-medium text-ink-500">Definition:</span> {definition}
        </p>
      )}
      {updatedAt && (
        <p className="flex items-center gap-1">
          <Clock size={11} /> Last updated {updatedAt}
        </p>
      )}
    </div>
  )
}
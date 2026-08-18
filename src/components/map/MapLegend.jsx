// Department legend — presentation layer for the same department data passed
// by the caller (ids / names / colors / selection state are never duplicated
// or hardcoded here). `DepartmentLegend` is the desktop full legend; the
// `DepartmentLegendControl` wraps it for < lg screens into a compact pill +
// bottom sheet so the map stays the primary visual area on mobile/tablet.
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export function DepartmentLegend({ departments = [], activeIds, onToggle }) {
  return (
    <div className="card px-3 py-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
      {departments.map((d) => {
        const active = activeIds.includes(d.id)
        return (
          <button
            key={d.id}
            onClick={() => onToggle(d.id)}
            className="flex items-center gap-1.5 text-[12px] font-medium"
            style={{ opacity: active ? 1 : 0.35 }}
          >
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            {d.name}
          </button>
        )
      })}
    </div>
  )
}

// Responsive department selector: full legend on desktop (lg+), compact pill
// + bottom sheet below lg. The sheet follows the existing citizen sheet
// pattern (ndisp-sheet-up, bottom-16 above the bottom navigation, z-150).
export function DepartmentLegendControl({ departments = [], activeIds = [], onToggle, allActive = false }) {
  const [open, setOpen] = useState(false)
  const doneRef = useRef(null)
  const count = departments.length
  const selectedCount = activeIds.length
  const single = selectedCount === 1 ? departments.find((d) => activeIds.includes(String(d.id))) : null
  const summary = allActive || selectedCount === 0 ? 'Departments' : single ? single.name : `Departments · ${selectedCount}`

  // Escape closes the sheet; initial focus lands on Done (44px touch target).
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const frame = requestAnimationFrame(() => doneRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(frame)
    }
  }, [open])

  return (
    <>
      {/* Desktop / wide: existing full legend */}
      <div className="hidden lg:block">
        <DepartmentLegend departments={departments} activeIds={activeIds} onToggle={onToggle} />
      </div>

      {/* Mobile / tablet: compact control + bottom sheet */}
      <div className="lg:hidden">
        <button
          type="button"
          aria-label="Open department filters"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[12.5px] font-medium text-ink-800 shadow-lg transition-colors hover:bg-ink-50"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-leaf-500" />
          <span className="max-w-[46vw] truncate">{summary}</span>
          {count > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-ink-900 px-1 text-[10.5px] font-semibold text-white">{count}</span>
          )}
          <ChevronDown size={14} className="shrink-0 text-ink-400" />
        </button>

        {open && (
          <>
            <div onClick={() => setOpen(false)} aria-hidden="true" className="fixed inset-0 z-[145] bg-slate-900/25" />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Departments"
              className="ndisp-sheet-up fixed inset-x-0 bottom-16 z-[150] flex max-h-[70dvh] flex-col overflow-hidden rounded-t-2xl border-t border-ink-100 bg-white shadow-2xl"
            >
              <div className="flex shrink-0 justify-center pt-2.5 pb-1">
                <span className="h-1 w-10 rounded-full bg-ink-200" />
              </div>
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-100 px-4 py-2">
                <h3 className="text-[13px] font-semibold text-ink-900">Departments</h3>
                <button
                  ref={doneRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-11 min-w-11 place-items-center rounded-lg px-3 text-[12.5px] font-semibold text-sky-700 transition-colors hover:bg-sky-50"
                >
                  Done
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain divide-y divide-ink-50 pb-[env(safe-area-inset-bottom)]">
                {departments.map((d) => {
                  const active = activeIds.includes(String(d.id))
                  return (
                    <button
                      key={String(d.id)}
                      type="button"
                      onClick={() => onToggle(String(d.id))}
                      aria-pressed={active}
                      className="flex min-h-11 w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-ink-50/60"
                      style={{ opacity: active ? 1 : 0.45 }}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                      <span className={`flex-1 text-[13px] font-medium ${active ? 'text-ink-900' : 'text-ink-600'}`}>{d.name}</span>
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${active ? 'border-leaf-500 bg-leaf-500 text-white' : 'border-ink-200'}`}>
                        {active && <Check size={12} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export function GapScoreLegend() {
  return (
    <div className="card px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1.5">Gap score</div>
      <div className="h-2 w-40 rounded-full" style={{ background: 'linear-gradient(90deg,#1f7a54,#e07a2c,#c0392b)' }} />
      <div className="flex justify-between text-[10.5px] text-ink-400 mt-1">
        <span>Well served</span>
        <span>Underserved</span>
      </div>
    </div>
  )
}
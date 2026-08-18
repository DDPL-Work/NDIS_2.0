// GIS Layers panel for the citizen map (catalog-driven, React state only).
// Mirrors REF.html sidebar behaviour — search filter, default layers, clear —
// without any DOM manipulation.
import { useState } from 'react'
import { ChevronDown, Eye, EyeOff, Layers, Loader2, Search } from 'lucide-react'
import clsx from 'clsx'

const layerBelongsToDepartment = (layer, department) => {
  if (!department) return true
  const departmentTerms = String(department.name || '').toLowerCase().split(/\s+/).filter((term) => term.length > 2 && term !== 'department')
  const value = `${layer.category || ''} ${layer.displayName || ''} ${layer.name || ''}`.toLowerCase()
  return departmentTerms.some((term) => value.includes(term))
}

// Layers merge across every active department: a layer is shown if it belongs
// to ANY of the selected departments (checkbox behaviour, ISSUE 9).
const layerBelongsToDepartments = (layer, departments = []) => {
  if (!departments.length) return true
  return departments.some((department) => layerBelongsToDepartment(layer, department))
}

export default function CitizenLayerPanel({ catalog, visible = {}, loading = {}, toggle, showDefaults, clearAll, activeCount = 0, selectedDepartments = [], closedDivider = true, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()

  const categories = Object.entries(catalog?.categories || {})
    .map(([category, layers]) => [
      category,
      (layers || []).filter((layer) =>
        layerBelongsToDepartments(layer, selectedDepartments) &&
        (!term || layer.displayName.toLowerCase().includes(term) || layer.name.toLowerCase().includes(term))
      ),
    ])
    .filter(([, layers]) => layers.length > 0)

  return (
    <div className={clsx(open || closedDivider ? 'border-b border-ink-100' : '')}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-semibold text-ink-800 hover:bg-ink-50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Layers size={13} className="text-saffron-600" />
          GIS Layers
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10.5px] font-medium text-ink-600">
            {activeCount} active
          </span>
          <ChevronDown size={13} className={clsx('text-ink-400 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2 animate-fade-in">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search layers (e.g. Hospital, Block)…"
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-7 pr-3 py-2 text-[12px] focus:bg-white focus:border-ink-300 focus:outline-none"
            />
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={showDefaults}
              className="flex min-h-11 items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-[11px] font-medium text-ink-700 hover:bg-ink-50"
            >
              <Eye size={11} /> Default Layers
            </button>
            <button
              onClick={clearAll}
              className="flex min-h-11 items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-[11px] font-medium text-ink-700 hover:bg-ink-50"
            >
              <EyeOff size={11} /> Clear Map
            </button>
          </div>

          {selectedDepartments.length > 0 && (
            <p className="px-1 text-[11px] text-ink-500">
              Layers for {selectedDepartments.map((d) => d.name).filter(Boolean).join(', ')}
            </p>
          )}

          <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
            {categories.length === 0 && (
              <p className="text-[11.5px] text-ink-400 px-1 py-2">No layers match “{query}”.</p>
            )}
            {categories.map(([category, layers]) => (
              <div key={category} className="rounded-lg border border-ink-100">
                <p className="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400 border-b border-ink-100 flex items-center justify-between">
                  {category}
                  <span className="text-ink-300">{layers.length}</span>
                </p>
                <div className="py-1">
                  {layers.map((layer) => (
                    <label
                      key={layer.name}
                      className="flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[12px] text-ink-700 hover:bg-ink-50"
                      title={layer.displayName}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        {loading[layer.name] && <Loader2 size={11} className="animate-spin text-saffron-600" />}
                        {layer.displayName}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-ink-400 bg-ink-100 rounded px-1 py-0.5">{layer.featureCount}</span>
                        <span className="grid h-11 w-11 -mr-2 place-items-center">
                          <input
                            type="checkbox"
                            className="accent-saffron-500"
                            checked={Boolean(visible[layer.name])}
                            onChange={() => toggle(layer)}
                          />
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

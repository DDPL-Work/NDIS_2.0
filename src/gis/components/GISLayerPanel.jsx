import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Eraser, Layers, ListChecks, Search } from 'lucide-react'

const titleCase = (value) => String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const CATEGORY_COLORS = ['#c0392b', '#1d7ab5', '#1f7a54', '#8a4fc0', '#e07a2c', '#546882', '#0e7490', '#b45309', '#be185d', '#4d7c0f']

export default function GISLayerPanel({ catalog, visible = {}, loading = {}, onToggle, embedded = false }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(() => new Set(Object.keys(catalog?.categories || {})))

  const groups = useMemo(() => {
    const entries = Object.entries(catalog?.categories || {})
    const term = query.trim().toLowerCase()
    return entries
      .map(([name, layers]) => {
        const filtered = term ? layers.filter((layer) => `${layer.displayName} ${layer.name}`.toLowerCase().includes(term)) : layers
        return { name, label: titleCase(name), layers: filtered, enabled: filtered.filter((layer) => visible[layer.name]).length }
      })
      .filter((group) => group.layers.length)
  }, [catalog, query, visible])

  const visibleLayers = useMemo(() => Object.values(catalog?.categories || {}).flat(), [catalog])

  const toggleGroup = (name) => setExpanded((current) => {
    const next = new Set(current)
    if (next.has(name)) next.delete(name); else next.add(name)
    return next
  })
  const allExpanded = expanded.size >= groups.length && groups.length > 0
  const everyVisible = visibleLayers.length > 0 && visibleLayers.every((layer) => visible[layer.name])

  const headerButton = 'text-[11px] font-medium text-ink-600 hover:text-ink-900'
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-ink-100 px-3 py-2.5">
        {!embedded && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-900"><Layers size={15} className="text-saffron-600" /> Layers</span>
            <span className="text-[11px] text-ink-400">{visibleLayers.filter((layer) => visible[layer.name]).length}/{visibleLayers.length} on</span>
          </div>
        )}
        <div className="relative mt-2"><Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="input-field !py-1.5 !pl-8 text-xs" placeholder="Search layers…" /></div>
        <div className="mt-2 flex items-center gap-3">
          <button className={headerButton} onClick={() => setExpanded(new Set(groups.map((group) => group.name)))} disabled={allExpanded}>Expand all</button>
          <button className={headerButton} onClick={() => setExpanded(new Set())} disabled={expanded.size === 0}>Collapse all</button>
          <div className="ml-auto flex items-center gap-2">
            <button title="Select all" className="text-ink-400 hover:text-saffron-600 disabled:opacity-40" onClick={() => visibleLayers.forEach((layer) => onToggle(layer, true))} disabled={everyVisible}><ListChecks size={15} /></button>
            <button title="Clear all" className="text-ink-400 hover:text-alert-600 disabled:opacity-40" onClick={() => visibleLayers.forEach((layer) => onToggle(layer, false))} disabled={visibleLayers.length === 0 || !visibleLayers.some((layer) => visible[layer.name])}><Eraser size={15} /></button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {groups.length === 0 && <p className="px-2 py-6 text-center text-[12px] text-ink-400">No layers match “{query}”</p>}
        <div className="space-y-1">
          {groups.map((group, index) => {
            const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            const isOpen = expanded.has(group.name)
            return (
              <div key={group.name} className="rounded-lg">
                <button onClick={() => toggleGroup(group.name)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-ink-50">
                  {isOpen ? <ChevronDown size={13} className="shrink-0 text-ink-400" /> : <ChevronRight size={13} className="shrink-0 text-ink-400" />}
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded text-[8.5px] font-bold uppercase text-white" style={{ background: color }}>{group.label.charAt(0)}</span>
                  <span className="truncate text-[12px] font-semibold text-ink-800">{group.label}</span>
                  <span className="rounded-full bg-ink-100 px-1.5 text-[10px] font-medium text-ink-500">{group.layers.length}</span>
                  <span className={`ml-auto shrink-0 rounded-full px-1.5 text-[10px] font-medium ${group.enabled > 0 ? 'bg-saffron-100 text-saffron-700' : 'text-ink-400'}`}>{group.enabled > 0 ? `${group.enabled} on` : 'off'}</span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="min-h-0 overflow-hidden">
                    <div className="ml-4 space-y-0.5 border-l border-ink-100 py-0.5 pl-2.5">
                      {group.layers.map((layer) => {
                        const active = Boolean(visible[layer.name])
                        return (
                          <label key={layer.id} className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors ${active ? 'bg-saffron-50/70 text-ink-900' : 'text-ink-600 hover:bg-ink-50'}`}>
                            <span className="flex min-w-0 items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full border border-ink-200" style={{ background: layer.color || '#94a3b8' }} /><span className="truncate">{layer.displayName}</span></span>
                            {loading[layer.name] ? <span className="shrink-0 text-[10px] text-ink-400">Loading…</span> : <input type="checkbox" className="accent-saffron-500" checked={active} onChange={() => onToggle(layer)} />}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
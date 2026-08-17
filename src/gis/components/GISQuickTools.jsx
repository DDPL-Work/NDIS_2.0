import { Crosshair, Maximize, Minus, Plus, Search, SlidersHorizontal, Wrench } from 'lucide-react'

// Department-contextual GIS tools. Every action here drives existing
// capabilities only — quick-find presets dispatch the same spatial-query event
// as the AI assistant, map filters reuse the workspace's point mode filter,
// and map actions call the existing MapView imperative API. No mock data, no
// new backend endpoints.
const DEFAULT_QUICK_FIND = ['Find assets', 'Show complaints', 'Show projects', 'Road defects']

const DEPT_QUICK_FIND = {
  health: ['Nearest PHC', 'Nearest hospital', 'Nearest oxygen PHC', 'Nearest ambulance', 'Show complaints'],
  education: ['Nearest school', 'Anganwadi', 'Show complaints', 'Show projects'],
  water: ['Find water tank', 'Borewell', 'Pipeline', 'Show complaints'],
  solar: ['Find solar plant', 'Find assets', 'Show complaints'],
  electricity: ['Transformer', 'Street light', 'Feeder', 'Show complaints'],
  pwd: ['Road defects', 'Find bridges', 'Show complaints', 'Show projects'],
  urban: ['Find assets', 'Garbage complaints', 'Show projects'],
  tourism: ['Tourist place', 'Heritage', 'Find assets', 'Show complaints'],
}

const FILTERS = [
  { id: 'all', label: 'All', permission: null },
  { id: 'asset', label: 'Assets', permission: 'assets.view' },
  { id: 'complaint', label: 'Complaints', permission: 'complaints.view' },
  { id: 'project', label: 'Projects', permission: 'projects.view' },
]

export default function GISQuickTools({ deptId = '', deptLabel = 'department', mode = 'all', can = () => true, onAsk, onSetMode, onLocate, onFitData, onZoomIn, onZoomOut }) {
  const quickFind = DEPT_QUICK_FIND[deptId] || DEFAULT_QUICK_FIND
  const filters = FILTERS.filter((item) => !item.permission || can(item.permission))
  const actions = [
    { id: 'locate', label: 'My Location', icon: Crosshair, run: onLocate },
    { id: 'fit', label: 'Fit to Data', icon: Maximize, run: onFitData },
    { id: 'zoom-in', label: 'Zoom In', icon: Plus, run: onZoomIn },
    { id: 'zoom-out', label: 'Zoom Out', icon: Minus, run: onZoomOut },
  ]

  return (
    <div className="space-y-4 text-[12px]">
      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400"><Search size={12} className="text-saffron-600" />Quick find</p>
        <p className="mt-0.5 text-[11px] text-ink-400">Search presets for {deptLabel} spatial data</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quickFind.map((term) => (
            <button key={term} onClick={() => onAsk?.(term)} title={`Search “${term}”`} aria-label={`Search ${term}`} className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 transition-colors hover:border-saffron-400 hover:bg-saffron-50 hover:text-saffron-800">{term}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400"><SlidersHorizontal size={12} className="text-saffron-600" />Map filters</p>
        <p className="mt-0.5 text-[11px] text-ink-400">Show only one node type on the map</p>
        <div className="mt-2 flex overflow-hidden rounded-lg border border-ink-200">
          {filters.map((item) => (
            <button key={item.id} onClick={() => onSetMode?.(item.id)} className={`flex-1 px-2 py-1.5 text-[11px] font-medium transition-colors ${mode === item.id ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 hover:bg-ink-50'}`}>{item.label}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400"><Wrench size={12} className="text-saffron-600" />Map actions</p>
        <p className="mt-0.5 text-[11px] text-ink-400">Control the map viewport</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {actions.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} onClick={item.run} title={item.label} aria-label={item.label} className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink-700 transition-colors hover:bg-ink-50"><Icon size={13} className="shrink-0 text-ink-400" /><span className="truncate">{item.label}</span></button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
import { BarChart3, ChevronDown, Crosshair, MapPin, ShieldAlert, Timer } from 'lucide-react'

const METRICS = [
  { key: 'nodes', icon: Crosshair, label: 'Mapped nodes', accent: '#1d7ab5' },
  { key: 'located', icon: MapPin, label: 'Geo-located', accent: '#1f7a54' },
  { key: 'priority', icon: ShieldAlert, label: 'Priority complaints', accent: '#c0392b' },
  { key: 'active', icon: BarChart3, label: 'Active projects', accent: '#e07a2c' },
  { key: 'delayed', icon: Timer, label: 'Delayed projects', accent: '#b45309' },
  { key: 'resolution', icon: Timer, label: 'Resolution', accent: '#1f7a54' },
]

export default function GISAnalyticsPanel({ points = [], complaints = [], projects = [], open, onToggle }) {
  const mapped = points.filter((point) => Array.isArray(point.position) && point.position.length >= 2).length
  const urgent = complaints.filter((row) => ['urgent', 'high', 'critical'].includes(row.priority)).length
  const active = projects.filter((row) => row.status !== 'delayed' && row.status !== 'completed').length
  const delayed = projects.filter((row) => row.status === 'delayed').length
  const resolved = complaints.filter((row) => ['resolved', 'closed'].includes(row.state)).length
  const resolutionPct = complaints.length ? Math.round((resolved / complaints.length) * 100) : null
  const values = { nodes: points.length, located: mapped, priority: urgent, active, delayed, resolution: resolutionPct == null ? '—' : `${resolutionPct}%` }

  return (
    <section className="shrink-0 border-t border-ink-100 bg-ink-50/60">
      <button onClick={onToggle} className="flex w-full items-center gap-2 px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 hover:text-ink-900">
        <BarChart3 size={13} className="text-saffron-600" /> Spatial analytics
        <span className="ml-1 text-[10px] font-normal text-ink-400">{points.length} nodes · {complaints.length} complaints · {projects.length} projects</span>
        <ChevronDown size={13} className={`ml-auto text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="grid grid-cols-3 gap-2 px-3 pb-2.5 md:grid-cols-6">
          {METRICS.map((metric) => (
            <div key={metric.key} className="rounded-lg border border-ink-100 border-l-4 bg-white px-2.5 py-2" style={{ borderLeftColor: metric.accent }}>
              <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-ink-400"><metric.icon size={11} style={{ color: metric.accent }} />{metric.label}</div>
              <div className="mt-0.5 text-[17px] font-semibold leading-tight text-ink-900">{values[metric.key]}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
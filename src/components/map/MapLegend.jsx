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

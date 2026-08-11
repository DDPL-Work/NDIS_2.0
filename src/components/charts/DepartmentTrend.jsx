import { LineChart, Line, ResponsiveContainer } from 'recharts'

// Compact inline trend used in list rows: no axes, no grid, no legend — just
// the line in the department accent colour. Renders a muted empty label when
// the source exposes no time-series data (never fabricates points).
export default function DepartmentTrend({ data = [], color = '#0b3558', height = 36, emptyLabel = 'No trend data' }) {
  if (!data || data.length < 2) {
    return (
      <span role="img" aria-label={emptyLabel} className="text-[11px] text-ink-300">
        {emptyLabel}
      </span>
    )
  }
  const summary = data.map((point) => `${point.month}: ${point.value} open`).join(', ')
  return (
    <div
      role="img"
      aria-label={`Grievance trend — ${summary}`}
      style={{ height, width: '100%' }}
      className="min-w-0"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 0, bottom: 2, left: 0 }}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2, fill: color }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
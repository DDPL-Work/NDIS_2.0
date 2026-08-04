import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function CoverageDonut({ value, size = 96, color = '#1f7a54', label }) {
  const data = [{ v: value }, { v: 100 - value }]
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="v" innerRadius={size / 2 - 12} outerRadius={size / 2} startAngle={90} endAngle={-270} stroke="none">
            <Cell fill={color} />
            <Cell fill="#e4e7ec" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center flex-col text-center">
        <span className="font-display text-lg font-semibold text-ink-950 block">{value}%</span>
        {label && <span className="text-[10px] text-ink-400 block -mt-1">{label}</span>}
      </div>
    </div>
  )
}

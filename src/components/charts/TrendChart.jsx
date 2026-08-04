import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function TrendChart({ data, dataKey = 'value', xKey = 'month', color = '#0b3558', height = 140 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#7488a0' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#7488a0' }} axisLine={false} tickLine={false} width={30} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e7ec' }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.25} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

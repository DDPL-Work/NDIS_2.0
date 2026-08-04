import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { DEPARTMENT_MAP } from '../../config/constants'
import { formatCurrencyINR } from '../../utils/format'

export default function BudgetBarChart({ data, height = 260 }) {
  const rows = data.map((d) => ({ name: DEPARTMENT_MAP[d.departmentId]?.label, ...d }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: '#7488a0' }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={54} />
        <YAxis tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`} tick={{ fontSize: 10.5, fill: '#7488a0' }} axisLine={false} tickLine={false} width={54} />
        <Tooltip formatter={(v) => formatCurrencyINR(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e7ec' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="sanctioned" name="Sanctioned" fill="#c9d2dc" radius={[4, 4, 0, 0]} />
        <Bar dataKey="utilized" name="Utilized" fill="#0b3558" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

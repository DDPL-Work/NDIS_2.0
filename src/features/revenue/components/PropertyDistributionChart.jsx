import React from 'react';
import { Card } from '../../../components/ui';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#06b6d4'];

export function PropertyDistributionChart({ data = [] }) {
  const chartData = React.useMemo(() => {
    return [
      { name: 'Residential', value: 150 },
      { name: 'Commercial', value: 50 },
      { name: 'Industrial', value: 25 },
      { name: 'Institutional', value: 25 }
    ];
  }, [data]);

  return (
    <Card className="h-full p-4 flex flex-col">
      <h3 className="text-base font-semibold text-ink-900 mb-1">
        Property Classification Distribution
      </h3>
      <p className="text-xs text-ink-500 mb-3">Distribution across usage types</p>
      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

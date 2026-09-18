import React from 'react';
import { Card } from '../../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../utils/revenueFormatters';

const BUCKET_COLORS = {
  '<1 year': '#f97316',
  '1-3 years': '#ef4444',
  '3-5 years': '#dc2626',
  '5+ years': '#991b1b'
};

export function ArrearsAgingChart({ data = [] }) {
  const agingSummary = React.useMemo(() => {
    return [
      { name: '<1 year', amount: 350000 },
      { name: '1-3 years', amount: 620000 },
      { name: '3-5 years', amount: 480000 },
      { name: '5+ years', amount: 290000 }
    ];
  }, [data]);

  return (
    <Card className="h-full p-4 flex flex-col">
      <h3 className="text-base font-semibold text-ink-900 mb-1">
        Arrears Aging Breakdown
      </h3>
      <p className="text-xs text-ink-500 mb-3">Outstanding tax arrears categorized by pending duration</p>
      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={agingSummary} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => formatCurrency(v, { compact: true })} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(val) => [formatCurrency(val), 'Arrears Amount']} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {agingSummary.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BUCKET_COLORS[entry.name] || '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

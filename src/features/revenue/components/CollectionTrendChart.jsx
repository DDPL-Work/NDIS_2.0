import React from 'react';
import { Card } from '../../../components/ui';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency } from '../utils/revenueFormatters';

export function CollectionTrendChart({ data = [] }) {
  return (
    <Card className="h-full p-4 flex flex-col">
      <h3 className="text-base font-semibold text-ink-900 mb-1">
        12-Month Revenue Demand vs Collection Trend
      </h3>
      <p className="text-xs text-ink-500 mb-3">Comparison of generated monthly demand vs actual tax collections</p>
      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => formatCurrency(v, { compact: true })} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [formatCurrency(value), '']} />
            <Legend />
            <Area type="monotone" dataKey="demand" name="Monthly Demand" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDemand)" />
            <Area type="monotone" dataKey="collected" name="Collected Tax" stroke="#10b981" fillOpacity={1} fill="url(#colorCollected)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

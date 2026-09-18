import React from 'react';
import { Card, Badge, DataTable } from '../../../components/ui';
import { formatCurrency } from '../utils/revenueFormatters';

export function BlockPerformanceTable({ data = [] }) {
  const columns = [
    { key: 'blockName', header: 'Block Name', render: r => <span className="font-medium text-ink-900">{r.blockName}</span> },
    { key: 'totalProperties', header: 'Properties', align: 'right', render: r => <span className="text-ink-700">{r.totalProperties}</span> },
    { key: 'demand', header: 'Demand', align: 'right', render: r => <span className="text-ink-900 font-semibold">{formatCurrency(r.demand)}</span> },
    { key: 'collected', header: 'Collected', align: 'right', render: r => <span className="text-emerald-600 font-bold">{formatCurrency(r.collected)}</span> },
    { key: 'arrears', header: 'Arrears', align: 'right', render: r => <span className="text-red-600 font-semibold">{formatCurrency(r.arrears)}</span> },
    {
      key: 'collectionRate',
      header: 'Efficiency Rate',
      align: 'center',
      render: r => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${r.collectionRate > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, r.collectionRate)}%` }}
            />
          </div>
          <Badge className={`text-xs ${r.collectionRate > 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {r.collectionRate}%
          </Badge>
        </div>
      )
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-ink-900 mb-1">
        Block & Administrative Performance Ranking
      </h3>
      <p className="text-xs text-ink-500 mb-4">Collection efficiency across sub-districts</p>
      <DataTable data={data} columns={columns} keyField="blockId" striped hoverable />
    </Card>
  );
}

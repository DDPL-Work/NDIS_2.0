import React from 'react';
import { Card, Badge, Button, DataTable } from '../../../components/ui';
import { Eye } from 'lucide-react';
import { formatCurrency } from '../utils/revenueFormatters';

export function ReviewCandidatesPanel({ candidates = [], onSelectProperty }) {
  const columns = [
    { key: 'propertyId', header: 'Property ID', render: r => <span className="font-mono font-bold text-ink-900">{r.propertyId}</span> },
    { key: 'ownerName', header: 'Owner Name', render: r => <span className="text-ink-900">{r.ownerName}</span> },
    { key: 'location', header: 'Block / Village', render: r => <span className="text-ink-600">{r.blockName} ({r.villageName})</span> },
    { key: 'propertyType', header: 'Type', render: r => <Badge variant="outline" className="text-xs uppercase">{r.propertyType}</Badge> },
    { key: 'annualDemand', header: 'Demand', align: 'right', render: r => <span className="font-semibold text-ink-900">{formatCurrency(r.annualDemand)}</span> },
    {
      key: 'riskScore',
      header: 'Risk Score',
      align: 'center',
      render: r => (
        <Badge className={`text-xs ${r.riskScore > 70 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
          {r.riskScore}/100
        </Badge>
      )
    },
    { key: 'reviewReason', header: 'Flagged Reason', render: r => <span className="text-xs text-ink-500">{r.reviewReason || 'High Arrears Accumulation'}</span> },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: r => (
        <Button
          size="sm"
          variant="primary"
          className="gap-1 text-xs py-1"
          onClick={() => onSelectProperty(r.id)}
        >
          <Eye className="w-3.5 h-3.5" />
          Inspect
        </Button>
      )
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-ink-900 mb-1">
        AI & GIS Audit Review Candidates ({candidates.length})
      </h3>
      <p className="text-xs text-ink-500 mb-4">
        Properties flagged for under-assessment, usage discrepancy, or high arrears
      </p>
      <DataTable data={candidates} columns={columns} keyField="id" striped hoverable />
    </Card>
  );
}

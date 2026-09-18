import React from 'react';
import { CollectionTrendChart } from './CollectionTrendChart';
import { ArrearsAgingChart } from './ArrearsAgingChart';
import { PropertyDistributionChart } from './PropertyDistributionChart';
import { BlockPerformanceTable } from './BlockPerformanceTable';
import { ReviewCandidatesPanel } from './ReviewCandidatesPanel';

export function RevenueAnalyticsPanel({ trends, blockAnalytics, reviewCandidates, onSelectProperty }) {
  return (
    <div className="py-4 flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CollectionTrendChart data={trends} />
        </div>
        <div>
          <PropertyDistributionChart />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ArrearsAgingChart />
        <BlockPerformanceTable data={blockAnalytics || []} />
      </div>

      <ReviewCandidatesPanel candidates={reviewCandidates || []} onSelectProperty={onSelectProperty} />
    </div>
  );
}

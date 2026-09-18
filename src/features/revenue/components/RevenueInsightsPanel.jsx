import React from 'react';
import { Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '../../../components/ui';
import { REVENUE_ANALYTICAL_MODES } from '../utils/revenueGisUtils';
import { formatCurrency } from '../utils/revenueFormatters';

export function RevenueInsightsPanel({ activeMode, kpis, onSelectReviewCandidate }) {
  const mode = activeMode || 'PROPERTY'
  const getInsightsContent = () => {
    switch (mode) {
      case REVENUE_ANALYTICAL_MODES.COLLECTION:
        return {
          title: 'Collection Efficiency Insights',
          alertClass: 'bg-blue-50 border-blue-200 text-blue-800',
          message: `Current collection efficiency is ${kpis?.collectionRatePercentage || 0}%. Target is 85%.`,
          highlights: [
            { label: 'Total Demand', value: formatCurrency(kpis?.totalAnnualDemand || 0) },
            { label: 'Collected Amount', value: formatCurrency(kpis?.totalCollected || 0) },
            { label: 'Shortfall to Target', value: formatCurrency(kpis?.gapToTarget || 0) }
          ],
          recommendation: 'Target high-demand commercial properties in Bihar Sharif ward 6 to quickly bridge collection gap.'
        };

      case REVENUE_ANALYTICAL_MODES.ARREARS:
        return {
          title: 'Arrears & Recovery Risk Insights',
          alertClass: 'bg-amber-50 border-amber-200 text-amber-800',
          message: `${kpis?.arrearsPropertiesCount || 0} properties hold accumulated arrears totaling ${formatCurrency(kpis?.totalArrears || 0)}.`,
          highlights: [
            { label: 'Total Arrears', value: formatCurrency(kpis?.totalArrears || 0) },
            { label: 'Active Recovery Cases', value: String(kpis?.activeRecoveryCasesCount || 0) },
            { label: 'Pending Inspections', value: String(kpis?.pendingInspectionsCount || 0) }
          ],
          recommendation: 'Issue final demand notices for arrears older than 3 years to initiate statutory attachment proceedings.'
        };

      case REVENUE_ANALYTICAL_MODES.RISK:
        return {
          title: 'AI Revenue Risk Detection',
          alertClass: 'bg-red-50 border-red-200 text-red-800',
          message: `${kpis?.highRiskProperties || 0} properties flagged for potential under-assessment or structural usage mismatch.`,
          highlights: [
            { label: 'High Risk Properties', value: String(kpis?.highRiskProperties || 0) },
            { label: 'Review Candidates', value: String(kpis?.reviewCandidatesCount || 0) }
          ],
          recommendation: 'Prioritize physical inspection for commercial structures classified as residential in GIS satellite layer.'
        };

      case REVENUE_ANALYTICAL_MODES.PROPERTY:
      default:
        return {
          title: 'GIS Cadastral Intelligence Summary',
          alertClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          message: `Managing ${kpis?.totalProperties || 0} total properties across 3 blocks with ${kpis?.assessmentCoveragePercentage || 0}% assessment coverage.`,
          highlights: [
            { label: 'Total Properties', value: String(kpis?.totalProperties || 0) },
            { label: 'Assessed Properties', value: String(kpis?.assessedProperties || 0) },
            { label: 'Unassessed Coverage', value: String(kpis?.unassessedProperties || 0) }
          ],
          recommendation: 'Click any property point marker on the GIS map to open its complete financial & spatial intelligence record.'
        };
    }
  };

  const content = getInsightsContent();

  return (
    <div className="h-full overflow-y-auto bg-white border-l border-ink-200 p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-ink-200">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-ink-900 text-base">
          {content.title}
        </h3>
      </div>

      <div className={`p-3 rounded-lg border text-xs leading-relaxed mb-4 ${content.alertClass}`}>
        {content.message}
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {content.highlights.map((h, i) => (
          <div key={i} className="flex justify-between items-center p-2.5 bg-ink-50 rounded-lg text-xs">
            <span className="text-ink-500">{h.label}</span>
            <span className="font-bold text-ink-900">{h.value}</span>
          </div>
        ))}
      </div>

      <div className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg mb-4 mt-auto">
        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">
          RECOMMENDED ACTION
        </p>
        <p className="text-xs text-ink-700 leading-snug">
          {content.recommendation}
        </p>
      </div>

      {onSelectReviewCandidate && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={onSelectReviewCandidate}
        >
          <TrendingUp className="w-4 h-4" />
          View AI Flagged Candidates
        </Button>
      )}
    </div>
  );
}

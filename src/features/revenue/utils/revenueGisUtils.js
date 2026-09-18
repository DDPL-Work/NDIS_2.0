/**
 * Spatial intelligence utilities for NDISP Revenue & Property module
 */

export const REVENUE_ANALYTICAL_MODES = {
  PROPERTY: 'PROPERTY',
  COLLECTION: 'COLLECTION',
  ARREARS: 'ARREARS',
  ASSESSMENT: 'ASSESSMENT',
  RISK: 'RISK',
  RECOVERY: 'RECOVERY',
  INSPECTION: 'INSPECTION',
  REVENUE_POTENTIAL: 'REVENUE_POTENTIAL'
};

export function colorPropertyByMode(property, mode = REVENUE_ANALYTICAL_MODES.PROPERTY) {
  switch (mode) {
    case REVENUE_ANALYTICAL_MODES.COLLECTION:
      if (property.taxStatus === 'PAID' || property.taxStatus === 'paid') return '#10b981'; // emerald-500
      if (property.taxStatus === 'PARTIAL' || property.taxStatus === 'partial') return '#f59e0b'; // amber-500
      return '#ef4444'; // red-500

    case REVENUE_ANALYTICAL_MODES.ARREARS:
      if (property.arrearsAmount > 100000 || property.arrearsAgingBucket === '5+_years') return '#991b1b'; // dark red
      if (property.arrearsAmount > 50000 || property.arrearsAgingBucket === '3-5_years') return '#dc2626'; // red-600
      if (property.arrearsAmount > 0) return '#f97316'; // orange-500
      return '#6b7280'; // gray-500

    case REVENUE_ANALYTICAL_MODES.ASSESSMENT:
      if (!property.isAssessed || property.assessmentGap) return '#a855f7'; // purple-500 (unassessed/gap)
      return '#3b82f6'; // blue-500 (assessed)

    case REVENUE_ANALYTICAL_MODES.RISK:
      if (property.riskScore > 70) return '#dc2626'; // high risk red
      if (property.riskScore > 40) return '#eab308'; // medium risk yellow
      return '#10b981'; // low risk green

    case REVENUE_ANALYTICAL_MODES.RECOVERY:
      if (property.taxStatus === 'ARREARS' && property.arrearsAmount > 50000) return '#7c3aed'; // violet recovery target
      return '#6b7280';

    case REVENUE_ANALYTICAL_MODES.INSPECTION:
      if (property.hasUnassessedStructure || property.hasUsageMismatch) return '#ec4899'; // pink inspection trigger
      return '#3b82f6';

    case REVENUE_ANALYTICAL_MODES.REVENUE_POTENTIAL:
      if (property.reviewCandidate) return '#059669'; // potential goldmine green
      return '#9ca3af';

    case REVENUE_ANALYTICAL_MODES.PROPERTY:
    default:
      if (property.propertyType === 'COMMERCIAL' || property.propertyType === 'commercial') return '#3b82f6';
      if (property.propertyType === 'INDUSTRIAL' || property.propertyType === 'industrial') return '#8b5cf6';
      if (property.propertyType === 'INSTITUTIONAL' || property.propertyType === 'institutional') return '#06b6d4';
      return '#10b981'; // residential green
  }
}

export function computeHeatPoints(properties = [], mode = REVENUE_ANALYTICAL_MODES.PROPERTY) {
  return properties.map(p => {
    let intensity = 0.5;

    if (mode === REVENUE_ANALYTICAL_MODES.COLLECTION) {
      intensity = p.totalPaid ? Math.min(1.0, p.totalPaid / 50000) : 0.1;
    } else if (mode === REVENUE_ANALYTICAL_MODES.ARREARS) {
      intensity = p.totalArrears ? Math.min(1.0, p.totalArrears / 100000) : 0;
    } else if (mode === REVENUE_ANALYTICAL_MODES.RISK) {
      intensity = p.riskScore ? p.riskScore / 100 : 0.2;
    } else if (mode === REVENUE_ANALYTICAL_MODES.REVENUE_POTENTIAL) {
      intensity = p.reviewCandidate ? 0.9 : 0.2;
    } else {
      intensity = Math.min(1.0, (p.currentDemand || 10000) / 50000);
    }

    return {
      lat: p.latitude,
      lng: p.longitude,
      intensity
    };
  }).filter(pt => pt.lat && pt.lng && pt.intensity > 0);
}

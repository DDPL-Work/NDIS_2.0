/**
 * NDISP Revenue & Property Intelligence — Mock Analytics & Aggregations
 */

import { MOCK_PROPERTIES } from './propertyMock.js';

export function computeMockKpis(properties = MOCK_PROPERTIES) {
  const totalProperties = properties.length;
  const assessedProperties = properties.filter(p => p.isAssessed).length;
  const unassessedProperties = totalProperties - assessedProperties;

  const totalDemand = properties.reduce((acc, p) => acc + p.annualDemand, 0);
  const totalCollected = properties.reduce((acc, p) => acc + p.paidAmount, 0);
  const totalOutstanding = properties.reduce((acc, p) => acc + p.outstandingAmount, 0);
  const totalArrears = properties.reduce((acc, p) => acc + p.arrearsAmount, 0);

  const collectionRate = totalDemand > 0 ? (totalCollected / totalDemand) * 100 : 0;
  const assessmentCoverage = totalProperties > 0 ? (assessedProperties / totalProperties) * 100 : 0;

  const highRiskCount = properties.filter(p => p.isHighRisk).length;
  const arrearsCount = properties.filter(p => p.taxStatus === 'ARREARS').length;
  const reviewCandidateCount = properties.filter(p => p.reviewCandidate).length;

  return {
    totalProperties,
    assessedProperties,
    unassessedProperties,
    assessmentCoveragePercentage: Math.round(assessmentCoverage * 10) / 10,
    
    totalAnnualDemand: totalDemand,
    totalCollected,
    totalOutstanding,
    totalArrears,
    collectionRatePercentage: Math.round(collectionRate * 10) / 10,

    highRiskProperties: highRiskCount,
    arrearsPropertiesCount: arrearsCount,
    reviewCandidatesCount: reviewCandidateCount,
    pendingInspectionsCount: 18,
    activeRecoveryCasesCount: 12,

    // Additional summary indicators
    growthYoY: 14.2,
    targetCollectionAmount: Math.round(totalDemand * 0.85),
    gapToTarget: Math.max(0, Math.round(totalDemand * 0.85) - totalCollected)
  };
}

export function computeBlockWardAnalytics(properties = MOCK_PROPERTIES) {
  const blockMap = {};

  properties.forEach(p => {
    if (!blockMap[p.blockId]) {
      blockMap[p.blockId] = {
        blockId: p.blockId,
        blockName: p.blockName,
        totalProperties: 0,
        assessedProperties: 0,
        demand: 0,
        collected: 0,
        outstanding: 0,
        arrears: 0,
        wards: {}
      };
    }

    const b = blockMap[p.blockId];
    b.totalProperties += 1;
    if (p.isAssessed) b.assessedProperties += 1;
    b.demand += p.annualDemand;
    b.collected += p.paidAmount;
    b.outstanding += p.outstandingAmount;
    b.arrears += p.arrearsAmount;

    if (!b.wards[p.wardId]) {
      b.wards[p.wardId] = {
        wardId: p.wardId,
        wardNumber: p.wardNumber,
        totalProperties: 0,
        demand: 0,
        collected: 0,
        outstanding: 0,
        arrears: 0
      };
    }

    const w = b.wards[p.wardId];
    w.totalProperties += 1;
    w.demand += p.annualDemand;
    w.collected += p.paidAmount;
    w.outstanding += p.outstandingAmount;
    w.arrears += p.arrearsAmount;
  });

  return Object.values(blockMap).map(b => ({
    ...b,
    collectionRate: b.demand > 0 ? Math.round((b.collected / b.demand) * 1000) / 10 : 0,
    wards: Object.values(b.wards).map(w => ({
      ...w,
      collectionRate: w.demand > 0 ? Math.round((w.collected / w.demand) * 1000) / 10 : 0
    }))
  }));
}

export const MOCK_REVENUE_TRENDS = [
  { month: 'Apr 2025', demand: 1000000, collected: 650000, arrears: 200000 },
  { month: 'May 2025', demand: 1000000, collected: 720000, arrears: 180000 },
  { month: 'Jun 2025', demand: 1000000, collected: 680000, arrears: 220000 },
  { month: 'Jul 2025', demand: 1000000, collected: 810000, arrears: 150000 },
  { month: 'Aug 2025', demand: 1000000, collected: 750000, arrears: 190000 },
  { month: 'Sep 2025', demand: 1000000, collected: 890000, arrears: 110000 },
  { month: 'Oct 2025', demand: 1000000, collected: 790000, arrears: 160000 },
  { month: 'Nov 2025', demand: 1000000, collected: 840000, arrears: 140000 },
  { month: 'Dec 2025', demand: 1000000, collected: 920000, arrears: 100000 },
  { month: 'Jan 2026', demand: 1000000, collected: 880000, arrears: 120000 },
  { month: 'Feb 2026', demand: 1000000, collected: 950000, arrears: 90000 },
  { month: 'Mar 2026', demand: 1000000, collected: 980000, arrears: 80000 },
];

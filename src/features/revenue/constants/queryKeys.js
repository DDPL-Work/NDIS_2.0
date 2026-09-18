// Revenue & Property Intelligence — Centralized TanStack Query Keys
// All consumers reference these instead of hardcoding arrays.

export const revenueDashboardKeys = {
  all: ['revenue', 'dashboard'],
  kpis: (filters = {}) => ['revenue', 'dashboard', 'kpis', filters],
  analytics: (filters = {}) => ['revenue', 'dashboard', 'analytics', filters],
  heatmap: (filters = {}) => ['revenue', 'dashboard', 'heatmap', filters],
  trends: (filters = {}) => ['revenue', 'dashboard', 'trends', filters],
  anomalies: (filters = {}) => ['revenue', 'dashboard', 'anomalies', filters],
}

export const propertyKeys = {
  all: ['revenue', 'properties'],
  list: (filters = {}) => ['revenue', 'properties', 'list', filters],
  detail: (id) => ['revenue', 'properties', 'detail', id],
  search: (query) => ['revenue', 'properties', 'search', query],
  gis: (filters = {}) => ['revenue', 'properties', 'gis', filters],
  byLocation: (blockId, wardId, villageId) => ['revenue', 'properties', 'location', blockId, wardId, villageId],
  assessment: (propertyId) => ['revenue', 'properties', 'assessment', propertyId],
  taxHistory: (propertyId) => ['revenue', 'properties', 'taxHistory', propertyId],
  notices: (propertyId) => ['revenue', 'properties', 'notices', propertyId],
  inspections: (propertyId) => ['revenue', 'properties', 'inspections', propertyId],
  audit: (propertyId) => ['revenue', 'properties', 'audit', propertyId],
}

export const assessmentKeys = {
  all: ['revenue', 'assessments'],
  list: (filters = {}) => ['revenue', 'assessments', 'list', filters],
  detail: (id) => ['revenue', 'assessments', 'detail', id],
  rules: (filters = {}) => ['revenue', 'assessments', 'rules', filters],
  ruleDetail: (id) => ['revenue', 'assessments', 'rule', 'detail', id],
  byProperty: (propertyId) => ['revenue', 'assessments', 'property', propertyId],
  history: (propertyId) => ['revenue', 'assessments', 'history', propertyId],
  pendingReview: (filters = {}) => ['revenue', 'assessments', 'pendingReview', filters],
}

export const demandKeys = {
  all: ['revenue', 'demands'],
  list: (filters = {}) => ['revenue', 'demands', 'list', filters],
  detail: (id) => ['revenue', 'demands', 'detail', id],
  byProperty: (propertyId) => ['revenue', 'demands', 'property', propertyId],
  byFinancialYear: (fy) => ['revenue', 'demands', 'financialYear', fy],
  history: (filters = {}) => ['revenue', 'demands', 'history', filters],
  generation: (filters = {}) => ['revenue', 'demands', 'generation', filters],
}

export const paymentKeys = {
  all: ['revenue', 'payments'],
  list: (filters = {}) => ['revenue', 'payments', 'list', filters],
  detail: (id) => ['revenue', 'payments', 'detail', id],
  byProperty: (propertyId) => ['revenue', 'payments', 'property', propertyId],
  byDemand: (demandId) => ['revenue', 'payments', 'demand', demandId],
  receipt: (paymentId) => ['revenue', 'payments', 'receipt', paymentId],
  history: (filters = {}) => ['revenue', 'payments', 'history', filters],
}

export const arrearsKeys = {
  all: ['revenue', 'arrears'],
  list: (filters = {}) => ['revenue', 'arrears', 'list', filters],
  detail: (id) => ['revenue', 'arrears', 'detail', id],
  byProperty: (propertyId) => ['revenue', 'arrears', 'property', propertyId],
  aging: (filters = {}) => ['revenue', 'arrears', 'aging', filters],
  recovery: (filters = {}) => ['revenue', 'arrears', 'recovery', filters],
  recoveryDetail: (id) => ['revenue', 'arrears', 'recovery', 'detail', id],
}

export const noticeKeys = {
  all: ['revenue', 'notices'],
  list: (filters = {}) => ['revenue', 'notices', 'list', filters],
  detail: (id) => ['revenue', 'notices', 'detail', id],
  byProperty: (propertyId) => ['revenue', 'notices', 'property', propertyId],
}

export const inspectionKeys = {
  all: ['revenue', 'inspections'],
  list: (filters = {}) => ['revenue', 'inspections', 'list', filters],
  detail: (id) => ['revenue', 'inspections', 'detail', id],
  byProperty: (propertyId) => ['revenue', 'inspections', 'property', propertyId],
  assigned: (officerId) => ['revenue', 'inspections', 'assigned', officerId],
  scheduled: (filters = {}) => ['revenue', 'inspections', 'scheduled', filters],
}

export const reassessmentKeys = {
  all: ['revenue', 'reassessments'],
  list: (filters = {}) => ['revenue', 'reassessments', 'list', filters],
  detail: (id) => ['revenue', 'reassessments', 'detail', id],
  byProperty: (propertyId) => ['revenue', 'reassessments', 'property', propertyId],
}

export const recoveryKeys = {
  all: ['revenue', 'recovery'],
  list: (filters = {}) => ['revenue', 'recovery', 'list', filters],
  detail: (id) => ['revenue', 'recovery', 'detail', id],
  byProperty: (propertyId) => ['revenue', 'recovery', 'property', propertyId],
}

export const timelineKeys = {
  all: ['revenue', 'timeline'],
  byProperty: (propertyId) => ['revenue', 'timeline', 'property', propertyId],
}

export const riskKeys = {
  all: ['revenue', 'risk'],
  byProperty: (propertyId) => ['revenue', 'risk', 'property', propertyId],
}

export const complianceKeys = {
  all: ['revenue', 'compliance'],
  byProperty: (propertyId) => ['revenue', 'compliance', 'property', propertyId],
}

export const revenueAnalyticsKeys = {
  all: ['revenue', 'analytics'],
  collectionHeatmap: (filters = {}) => ['revenue', 'analytics', 'collectionHeatmap', filters],
  arrearsHeatmap: (filters = {}) => ['revenue', 'analytics', 'arrearsHeatmap', filters],
  demandHeatmap: (filters = {}) => ['revenue', 'analytics', 'demandHeatmap', filters],
  revenueGap: (filters = {}) => ['revenue', 'analytics', 'revenueGap', filters],
  propertyDensity: (filters = {}) => ['revenue', 'analytics', 'propertyDensity', filters],
  highValueMap: (filters = {}) => ['revenue', 'analytics', 'highValueMap', filters],
  assessmentChange: (filters = {}) => ['revenue', 'analytics', 'assessmentChange', filters],
  blockWard: (filters = {}) => ['revenue', 'analytics', 'blockWard', filters],
  trends: (filters = {}) => ['revenue', 'analytics', 'trends', filters],
  reviewCandidates: (filters = {}) => ['revenue', 'analytics', 'reviewCandidates', filters],
}

export const reportKeys = {
  all: ['revenue', 'reports'],
  list: (filters = {}) => ['revenue', 'reports', 'list', filters],
  detail: (id) => ['revenue', 'reports', 'detail', id],
  generate: (type, filters = {}) => ['revenue', 'reports', 'generate', type, filters],
}

// Authoritative Backend Endpoint Query Keys
export const taxKeys = {
  all: ['revenue', 'tax'],
  taxList: (filters = {}) => ['revenue', 'tax', 'list', filters],
  taxRecord: (id) => ['revenue', 'tax', 'record', id],
  cadastral: (filters = {}) => ['revenue', 'tax', 'cadastral', filters],
  paymentStatus: (params = {}) => ['revenue', 'tax', 'paymentStatus', params],
  taxSlip: (params = {}) => ['revenue', 'tax', 'slip', params],
}

export const scheduleTaskKeys = {
  all: ['revenue', 'scheduleTasks'],
  list: (filters = {}) => ['revenue', 'scheduleTasks', 'list', filters],
  detail: (id) => ['revenue', 'scheduleTasks', 'detail', id],
}
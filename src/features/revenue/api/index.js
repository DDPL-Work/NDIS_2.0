// Revenue & Property Intelligence — API Index
// Centralized exports for all revenue module APIs

// New Tax & Revenue APIs (authoritative per PROPERTY_TAX_FRONTEND_API_GUIDE.md)
export * from './taxRevenueApi'

// Authoritative production backend contract APIs
export * from './propertyTaxApi'
export * from './cadastralGisApi'
export * from './taxPaymentApi'
export * from './taxSlipApi'

// Legacy / un-backed APIs
export * from './propertyApi'
export * from './assessmentApi'
export * from './demandApi'
export * from './paymentApi'
export * from './arrearsApi'
export * from './revenueAnalyticsApi'
export * from './noticeInspectionReassessmentApi'
export * from './timelineRiskComplianceApi'
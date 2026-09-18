// Revenue & Property Intelligence — Constants
// Mirrors LLD Vol 2 Ch 14 (RBAC), Vol 3 Ch 15-16 (Workflow & Department Modules)
// and Vol 4 (GIS Revenue Visualization)

// Revenue-specific roles (extends base ROLES from config/constants.js)
export const REVENUE_ROLES = {
  REVENUE_OFFICER: 'revenue_officer',
  REVENUE_INSPECTOR: 'revenue_inspector',
  REVENUE_ADMIN: 'revenue_admin',
  CITIZEN: 'citizen',
}

// Property Types
export const PROPERTY_TYPES = [
  { id: 'residential', label: 'Residential', color: '#22c55e' },
  { id: 'commercial', label: 'Commercial', color: '#3b82f6' },
  { id: 'industrial', label: 'Industrial', color: '#f97316' },
  { id: 'agricultural', label: 'Agricultural', color: '#84cc16' },
  { id: 'institutional', label: 'Institutional', color: '#a855f7' },
  { id: 'vacant_land', label: 'Vacant Land', color: '#94a3b8' },
]

export const PROPERTY_TYPE_MAP = Object.fromEntries(PROPERTY_TYPES.map(t => [t.id, t]))

// Construction Types
export const CONSTRUCTION_TYPES = [
  { id: 'pucca', label: 'Pucca (RCC/Stone)', multiplier: 1.0 },
  { id: 'semi_pucca', label: 'Semi-Pucca', multiplier: 0.7 },
  { id: 'kutcha', label: 'Kutcha', multiplier: 0.4 },
]

export const CONSTRUCTION_TYPE_MAP = Object.fromEntries(CONSTRUCTION_TYPES.map(t => [t.id, t]))

// Usage Types
export const USAGE_TYPES = [
  { id: 'self_occupied', label: 'Self Occupied', rebate: 0.15 },
  { id: 'rented', label: 'Rented', rebate: 0.0 },
  { id: 'commercial_use', label: 'Commercial Use', rebate: 0.0 },
  { id: 'mixed_use', label: 'Mixed Use', rebate: 0.05 },
  { id: 'vacant', label: 'Vacant', rebate: 0.0 },
]

export const USAGE_TYPE_MAP = Object.fromEntries(USAGE_TYPES.map(t => [t.id, t]))

// Tax Status
export const TAX_STATUS = {
  PAID: 'paid',
  DUE: 'due',
  PARTIAL: 'partial',
  ARREARS: 'arrears',
  EXEMPT: 'exempt',
  DISPUTED: 'disputed',
}

export const TAX_STATUS_LABELS = {
  [TAX_STATUS.PAID]: 'Paid',
  [TAX_STATUS.DUE]: 'Due',
  [TAX_STATUS.PARTIAL]: 'Partial',
  [TAX_STATUS.ARREARS]: 'Arrears',
  [TAX_STATUS.EXEMPT]: 'Exempt',
  [TAX_STATUS.DISPUTED]: 'Disputed',
}

export const TAX_STATUS_COLORS = {
  [TAX_STATUS.PAID]: '#22c55e',
  [TAX_STATUS.DUE]: '#ef4444',
  [TAX_STATUS.PARTIAL]: '#f97316',
  [TAX_STATUS.ARREARS]: '#dc2626',
  [TAX_STATUS.EXEMPT]: '#3b82f6',
  [TAX_STATUS.DISPUTED]: '#a855f7',
}

// Payment Modes
export const PAYMENT_MODES = [
  { id: 'online', label: 'Online (UPI/Net Banking/Card)', icon: 'CreditCard' },
  { id: 'cash', label: 'Cash', icon: 'Banknote' },
  { id: 'cheque', label: 'Cheque/DD', icon: 'FileText' },
  { id: 'bank_transfer', label: 'Bank Transfer (NEFT/RTGS)', icon: 'Building2' },
]

export const PAYMENT_MODE_MAP = Object.fromEntries(PAYMENT_MODES.map(m => [m.id, m]))

// Demand Status
export const DEMAND_STATUS = {
  GENERATED: 'generated',
  SENT: 'sent',
  PARTIALLY_PAID: 'partially_paid',
  FULLY_PAID: 'fully_paid',
  CANCELLED: 'cancelled',
  REVISED: 'revised',
}

export const DEMAND_STATUS_LABELS = {
  [DEMAND_STATUS.GENERATED]: 'Generated',
  [DEMAND_STATUS.SENT]: 'Notice Sent',
  [DEMAND_STATUS.PARTIALLY_PAID]: 'Partially Paid',
  [DEMAND_STATUS.FULLY_PAID]: 'Fully Paid',
  [DEMAND_STATUS.CANCELLED]: 'Cancelled',
  [DEMAND_STATUS.REVISED]: 'Revised',
}

// Arrears Aging Buckets
export const ARREARS_AGING = [
  { id: 'current', label: 'Current FY', minYears: 0, maxYears: 1, color: '#f97316' },
  { id: '1_3_years', label: '1-3 Years', minYears: 1, maxYears: 3, color: '#ef4444' },
  { id: '3_5_years', label: '3-5 Years', minYears: 3, maxYears: 5, color: '#dc2626' },
  { id: '5_plus_years', label: '5+ Years', minYears: 5, maxYears: 99, color: '#991b1b' },
]

// Recovery Status
export const RECOVERY_STATUS = {
  INITIATED: 'initiated',
  NOTICE_SENT: 'notice_sent',
  FIELD_VISIT: 'field_visit',
  ATTACHMENT: 'attachment',
  AUCTION: 'auction',
  SETTLED: 'settled',
  WRITE_OFF: 'write_off',
}

export const RECOVERY_STATUS_LABELS = {
  [RECOVERY_STATUS.INITIATED]: 'Initiated',
  [RECOVERY_STATUS.NOTICE_SENT]: 'Notice Sent',
  [RECOVERY_STATUS.FIELD_VISIT]: 'Field Visit Scheduled',
  [RECOVERY_STATUS.ATTACHMENT]: 'Property Attached',
  [RECOVERY_STATUS.AUCTION]: 'Auction Scheduled',
  [RECOVERY_STATUS.SETTLED]: 'Settled',
  [RECOVERY_STATUS.WRITE_OFF]: 'Written Off',
}

// Inspection Types
export const INSPECTION_TYPES = [
  { id: 'routine', label: 'Routine Verification' },
  { id: 'reassessment', label: 'Reassessment Inspection' },
  { id: 'arrears_verification', label: 'Arrears Verification' },
  { id: 'gis_verification', label: 'GIS Verification' },
  { id: 'dispute', label: 'Dispute Investigation' },
]

// Notice Types
export const NOTICE_TYPES = [
  { id: 'demand_notice', label: 'Demand Notice (Section 131)' },
  { id: 'arrears_notice', label: 'Arrears Notice (Section 133)' },
  { id: 'reassessment_notice', label: 'Reassessment Notice' },
  { id: 'final_notice', label: 'Final Notice Before Recovery' },
  { id: 'attachment_notice', label: 'Attachment Notice' },
]

// GIS Layer Types for Revenue
export const REVENUE_GIS_LAYERS = [
  { id: 'property_parcels', label: 'Property Parcels', defaultVisible: true, category: 'base' },
  { id: 'paid_properties', label: 'Paid Properties', defaultVisible: true, category: 'status', color: '#22c55e' },
  { id: 'due_properties', label: 'Due Properties', defaultVisible: true, category: 'status', color: '#ef4444' },
  { id: 'partial_properties', label: 'Partial Payment', defaultVisible: true, category: 'status', color: '#f97316' },
  { id: 'arrears_properties', label: 'Arrears Properties', defaultVisible: true, category: 'status', color: '#dc2626' },
  { id: 'high_value_properties', label: 'High Value Properties', defaultVisible: false, category: 'analytics', color: '#a855f7' },
  { id: 'revenue_gap', label: 'Revenue Gap Areas', defaultVisible: false, category: 'analytics', color: '#6366f1' },
  { id: 'collection_heatmap', label: 'Collection Heatmap', defaultVisible: false, category: 'heatmap' },
  { id: 'arrears_heatmap', label: 'Arrears Heatmap', defaultVisible: false, category: 'heatmap' },
  { id: 'assessment_change', label: 'Assessment Change Candidates', defaultVisible: false, category: 'analytics', color: '#eab308' },
  { id: 'inspection_due', label: 'Inspection Due', defaultVisible: false, category: 'actions', color: '#f97316' },
  { id: 'recovery_cases', label: 'Recovery Cases', defaultVisible: false, category: 'actions', color: '#dc2626' },
  { id: 'disputed_properties', label: 'Disputed Properties', defaultVisible: false, category: 'actions', color: '#a855f7' },
]

// Financial Year options (current and previous)
export const FINANCIAL_YEARS = [
  { id: '2024-25', label: 'FY 2024-25', isCurrent: false },
  { id: '2025-26', label: 'FY 2025-26 (Current)', isCurrent: true },
  { id: '2026-27', label: 'FY 2026-27 (Upcoming)', isCurrent: false },
]

// Revenue Task Types (for Schedule & Tasks integration)
export const REVENUE_TASK_TYPES = [
  { id: 'PROPERTY_INSPECTION', label: 'Property Inspection', icon: 'ClipboardList', color: '#3b82f6', defaultSlaHours: 24 },
  { id: 'REASSESSMENT', label: 'Reassessment', icon: 'Calculator', color: '#8b5cf6', defaultSlaHours: 72 },
  { id: 'TAX_NOTICE', label: 'Issue Tax Notice', icon: 'FileText', color: '#f97316', defaultSlaHours: 12 },
  { id: 'PAYMENT_FOLLOWUP', label: 'Payment Follow-up', icon: 'Phone', color: '#22c55e', defaultSlaHours: 6 },
  { id: 'ARREAR_RECOVERY', label: 'Arrear Recovery Action', icon: 'Gavel', color: '#dc2626', defaultSlaHours: 48 },
  { id: 'GIS_VERIFICATION', label: 'GIS Verification', icon: 'MapPin', color: '#06b6d4', defaultSlaHours: 48 },
  { id: 'DISPUTE_REVIEW', label: 'Dispute Review', icon: 'Scale', color: '#a855f7', defaultSlaHours: 72 },
  { id: 'ESCALATION', label: 'Escalation', icon: 'AlertTriangle', color: '#ef4444', defaultSlaHours: 4 },
]

export const REVENUE_TASK_TYPE_MAP = Object.fromEntries(REVENUE_TASK_TYPES.map(t => [t.id, t]))

// Report Types
export const REVENUE_REPORT_TYPES = [
  { id: 'property_register', label: 'Property Register', category: 'registry' },
  { id: 'demand_register', label: 'Demand Register', category: 'demand' },
  { id: 'collection_register', label: 'Collection Register', category: 'collection' },
  { id: 'outstanding_register', label: 'Outstanding Register', category: 'arrears' },
  { id: 'arrears_register', label: 'Arrears Register', category: 'arrears' },
  { id: 'assessment_register', label: 'Assessment Register', category: 'assessment' },
  { id: 'reassessment_register', label: 'Reassessment Register', category: 'assessment' },
  { id: 'payment_register', label: 'Payment Register', category: 'collection' },
  { id: 'recovery_register', label: 'Recovery Register', category: 'recovery' },
  { id: 'revenue_gap_report', label: 'Revenue Gap Analysis', category: 'analytics' },
  { id: 'block_revenue_report', label: 'Block Revenue Report', category: 'analytics' },
  { id: 'ward_revenue_report', label: 'Ward Revenue Report', category: 'analytics' },
  { id: 'monthly_revenue_report', label: 'Monthly Revenue Report', category: 'analytics' },
  { id: 'annual_revenue_report', label: 'Annual Revenue Report', category: 'analytics' },
  { id: 'gis_revenue_report', label: 'GIS Revenue Report', category: 'analytics' },
]

// Anomaly/Review Candidate Types
export const REVIEW_CANDIDATE_TYPES = [
  { id: 'large_property_low_assessment', label: 'Large Property + Low Assessment', severity: 'high', color: '#dc2626' },
  { id: 'high_value_no_payment', label: 'High Value Property + No Payment', severity: 'high', color: '#dc2626' },
  { id: 'repeated_partial_payment', label: 'Repeated Partial Payment', severity: 'medium', color: '#f97316' },
  { id: 'gis_assessment_mismatch', label: 'GIS/Assessment Area Mismatch', severity: 'high', color: '#dc2626' },
  { id: 'sudden_assessment_change', label: 'Sudden Assessment Change', severity: 'medium', color: '#eab308' },
  { id: 'long_term_arrears', label: 'Long-term Arrears (>5 years)', severity: 'high', color: '#991b1b' },
]

// Map style configuration for revenue layers
export const REVENUE_MAP_STYLES = {
  property_parcels: {
    fillColor: '#3b82f6',
    fillOpacity: 0.3,
    color: '#1d4ed8',
    weight: 1.5,
    opacity: 0.8,
  },
  paid: {
    fillColor: '#22c55e',
    fillOpacity: 0.6,
    color: '#15803d',
    weight: 2,
    opacity: 0.9,
  },
  due: {
    fillColor: '#ef4444',
    fillOpacity: 0.5,
    color: '#b91c1c',
    weight: 1.5,
    opacity: 0.9,
  },
  partial: {
    fillColor: '#f97316',
    fillOpacity: 0.5,
    color: '#c2410c',
    weight: 1.5,
    opacity: 0.9,
  },
  arrears: {
    fillColor: '#dc2626',
    fillOpacity: 0.6,
    color: '#991b1b',
    weight: 2,
    opacity: 0.95,
  },
  high_value: {
    fillColor: '#a855f7',
    fillOpacity: 0.4,
    color: '#7e22ce',
    weight: 2,
    opacity: 0.9,
  },
  revenue_gap: {
    fillColor: '#6366f1',
    fillOpacity: 0.35,
    color: '#3730a3',
    weight: 1.5,
    opacity: 0.8,
  },
}

// Property Drawer Sections
export const PROPERTY_DRAWER_SECTIONS = [
  { id: 'identity', label: 'Property Identity', icon: 'Home', order: 1 },
  { id: 'location', label: 'Location', icon: 'MapPin', order: 2 },
  { id: 'gis', label: 'GIS', icon: 'Map', order: 3 },
  { id: 'assessment', label: 'Assessment', icon: 'Calculator', order: 4 },
  { id: 'demand', label: 'Current Demand', icon: 'FileText', order: 5 },
  { id: 'payment', label: 'Payment History', icon: 'CreditCard', order: 6 },
  { id: 'arrears', label: 'Arrears', icon: 'AlertTriangle', order: 7 },
  { id: 'tax_history', label: 'Tax History', icon: 'History', order: 8 },
  { id: 'notices', label: 'Notices', icon: 'Bell', order: 9 },
  { id: 'inspections', label: 'Inspections', icon: 'ClipboardList', order: 10 },
  { id: 'dm_actions', label: 'DM Actions', icon: 'Gavel', order: 11 },
  { id: 'audit', label: 'Audit Trail', icon: 'Shield', order: 12 },
]

// Default pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Export formats
export const EXPORT_FORMATS = [
  { id: 'pdf', label: 'PDF', mime: 'application/pdf' },
  { id: 'excel', label: 'Excel', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { id: 'csv', label: 'CSV', mime: 'text/csv' },
]

// Central Z-Index Strategy for Revenue GIS Overlays
export const REVENUE_Z_INDEX = {
  BASE_MAP: 0,
  MAP_OVERLAYS: 100,
  TOOLBAR: 300,
  SEARCH_DROPDOWN: 310,
  LAYER_PANEL: 400,
  FILTER_PANEL: 410,
  LEGEND: 420,
  PROPERTY_DRAWER: 500,
  MODAL: 1000,
  TOAST: 1100,
}
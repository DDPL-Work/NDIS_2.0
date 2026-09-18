/**
 * NDISP Revenue & Property Intelligence — Mock Workflow Entities
 * Seeded notices, inspections, reassessments, and recovery actions.
 */

export const MOCK_NOTICES = [
  {
    id: 'NTC-2026-001',
    propertyId: 'PROP-NAL-0004',
    noticeType: 'DEMAND_NOTICE',
    issueDate: '2026-07-10',
    dueDate: '2026-08-10',
    amountDue: 45000,
    status: 'ISSUED',
    servedBy: 'Inspector Rajesh Kumar',
    description: 'First reminder notice for annual tax dues'
  },
  {
    id: 'NTC-2026-002',
    propertyId: 'PROP-NAL-0012',
    noticeType: 'SHOW_CAUSE',
    issueDate: '2026-06-15',
    dueDate: '2026-07-15',
    amountDue: 120000,
    status: 'SERVED',
    servedBy: 'Inspector Amit Singh',
    description: 'Show cause notice for unassessed commercial extension'
  },
  {
    id: 'NTC-2026-003',
    propertyId: 'PROP-NAL-0025',
    noticeType: 'FINAL_DEMAND',
    issueDate: '2026-05-01',
    dueDate: '2026-06-01',
    amountDue: 85000,
    status: 'EXPIRED',
    servedBy: 'Inspector Suresh Prasad',
    description: 'Final demand before initiating revenue recovery proceedings'
  }
];

export const MOCK_INSPECTIONS = [
  {
    id: 'INSP-2026-001',
    propertyId: 'PROP-NAL-0004',
    scheduledDate: '2026-09-22',
    inspectorName: 'Field Officer R. K. Mishra',
    status: 'SCHEDULED',
    purpose: 'Verify built-up area discrepancy detected by GIS layer',
    notes: 'Assign task in DM Schedule system'
  },
  {
    id: 'INSP-2026-002',
    propertyId: 'PROP-NAL-0018',
    scheduledDate: '2026-09-10',
    inspectorName: 'Field Officer Sunita Verma',
    status: 'COMPLETED',
    outcome: 'DISCREPANCY_FOUND',
    builtUpAreaVerified: 4200,
    usageTypeVerified: 'COMMERCIAL',
    notes: 'Owner converted ground floor into 3 retail shops without reassessment'
  }
];

export const MOCK_REASSESSMENTS = [
  {
    id: 'REASS-2026-001',
    propertyId: 'PROP-NAL-0018',
    initiatedDate: '2026-09-12',
    previousAnnualDemand: 18000,
    proposedAnnualDemand: 48000,
    status: 'PENDING_APPROVAL',
    reason: 'GIS discrepancy verified during field inspection (Res -> Comm)',
    initiatedBy: 'Revenue Officer P. K. Jha'
  }
];

export const MOCK_RECOVERY_ACTIONS = [
  {
    id: 'REC-2026-001',
    propertyId: 'PROP-NAL-0025',
    caseNumber: 'RC/NAL/2026/089',
    initiatedDate: '2026-06-10',
    totalArrearsAmount: 185000,
    stage: 'ATTACHMENT_WARNING',
    assignedOfficer: 'ADM Revenue Nalanda',
    status: 'ACTIVE'
  }
];

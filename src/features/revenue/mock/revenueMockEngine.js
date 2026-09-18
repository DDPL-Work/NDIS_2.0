/**
 * NDISP Revenue & Property Intelligence — Centralized Mock Engine & Query Service
 */

import { MOCK_PROPERTIES } from './propertyMock.js';
import { computeMockKpis, computeBlockWardAnalytics, MOCK_REVENUE_TRENDS } from './analyticsMock.js';
import { MOCK_NOTICES, MOCK_INSPECTIONS, MOCK_REASSESSMENTS, MOCK_RECOVERY_ACTIONS } from './workflowMock.js';

class RevenueMockEngine {
  constructor() {
    this.properties = [...MOCK_PROPERTIES];
    this.notices = [...MOCK_NOTICES];
    this.inspections = [...MOCK_INSPECTIONS];
    this.reassessments = [...MOCK_REASSESSMENTS];
    this.recoveryActions = [...MOCK_RECOVERY_ACTIONS];
  }

  // --- PROPERTIES ---
  getProperties(filters = {}) {
    let result = [...this.properties];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p => 
        p.propertyId.toLowerCase().includes(q) ||
        p.holdingNumber.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
      );
    }

    if (filters.blockId) {
      result = result.filter(p => p.blockId === filters.blockId);
    }

    if (filters.wardId) {
      result = result.filter(p => p.wardId === filters.wardId);
    }

    if (filters.propertyType && filters.propertyType !== 'ALL') {
      result = result.filter(p => p.propertyType === filters.propertyType);
    }

    if (filters.taxStatus && filters.taxStatus !== 'ALL') {
      result = result.filter(p => p.taxStatus === filters.taxStatus);
    }

    if (filters.isHighRisk !== undefined) {
      result = result.filter(p => p.isHighRisk === Boolean(filters.isHighRisk));
    }

    if (filters.reviewCandidate !== undefined) {
      result = result.filter(p => p.reviewCandidate === Boolean(filters.reviewCandidate));
    }

    const total = result.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 50;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  getPropertyById(id) {
    return this.properties.find(p => p.id === id || p.propertyId === id) || null;
  }

  getPropertiesGisData(filters = {}) {
    const listResult = this.getProperties({ ...filters, limit: 1000 });
    return listResult.items.map(p => ({
      id: p.id,
      propertyId: p.propertyId,
      holdingNumber: p.holdingNumber,
      ownerName: p.ownerName,
      latitude: p.latitude,
      longitude: p.longitude,
      propertyType: p.propertyType,
      taxStatus: p.taxStatus,
      annualDemand: p.annualDemand,
      paidAmount: p.paidAmount,
      outstandingAmount: p.outstandingAmount,
      arrearsAmount: p.arrearsAmount,
      isHighRisk: p.isHighRisk,
      blockId: p.blockId,
      wardId: p.wardId
    }));
  }

  // --- ANALYTICS & KPIS ---
  getKpis(filters = {}) {
    const filteredProps = this.getProperties({ ...filters, limit: 1000 }).items;
    return computeMockKpis(filteredProps);
  }

  getBlockWardAnalytics(filters = {}) {
    const filteredProps = this.getProperties({ ...filters, limit: 1000 }).items;
    return computeBlockWardAnalytics(filteredProps);
  }

  getRevenueTrends() {
    return MOCK_REVENUE_TRENDS;
  }

  getReviewCandidates(filters = {}) {
    return this.properties.filter(p => p.reviewCandidate);
  }

  // --- WORKFLOWS ---
  getPropertyWorkflows(propertyId) {
    return {
      notices: this.notices.filter(n => n.propertyId === propertyId),
      inspections: this.inspections.filter(i => i.propertyId === propertyId),
      reassessments: this.reassessments.filter(r => r.propertyId === propertyId),
      recoveryActions: this.recoveryActions.filter(rc => rc.propertyId === propertyId)
    };
  }

  createInspection(propertyId, payload) {
    const newInsp = {
      id: `INSP-2026-${String(this.inspections.length + 1).padStart(3, '0')}`,
      propertyId,
      scheduledDate: payload.scheduledDate || new Date().toISOString().split('T')[0],
      inspectorName: payload.inspectorName || 'Assigned Officer',
      status: 'SCHEDULED',
      purpose: payload.purpose || 'Property inspection',
      notes: payload.notes || ''
    };
    this.inspections.push(newInsp);
    return newInsp;
  }

  createNotice(propertyId, payload) {
    const property = this.getPropertyById(propertyId);
    const newNotice = {
      id: `NTC-2026-${String(this.notices.length + 1).padStart(3, '0')}`,
      propertyId,
      noticeType: payload.noticeType || 'DEMAND_NOTICE',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: payload.dueDate || '2026-10-30',
      amountDue: property ? property.outstandingAmount : 0,
      status: 'ISSUED',
      servedBy: payload.servedBy || 'System Generated',
      description: payload.description || 'Notice issued via Revenue Intelligence Workspace'
    };
    this.notices.push(newNotice);
    return newNotice;
  }
}

export const revenueMockEngine = new RevenueMockEngine();

// Project Bill DTO normalization verified against the live serializer
// metadata (OPTIONS /bills/) during Phase 2.1. Canonical vocabulary:
// bill_number, bill_type, claimed/verified amounts, deductions,
// net_payable_amount, submission_date, payment_status, transaction_reference.
// The live payment_status starts at `submitted` (the guide's
// draft/pending_approval set is not produced by this backend).
const amount = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

export function mapBill(dto = {}) {
  return {
    id: dto.id,
    billNumber: dto.bill_number || dto.bill_no || `BILL-${dto.id}`,
    billType: dto.bill_type || '',
    projectId: dto.project ?? dto.project_id ?? null,
    projectName: dto.project_title || dto.project_name || '',
    claimedAmount: amount(dto.claimed_amount),
    verifiedAmount: amount(dto.verified_amount),
    deductions: amount(dto.deductions),
    netPayableAmount: amount(dto.net_payable_amount ?? dto.net_payable),
    paymentStatus: dto.payment_status || '',
    pfmsReference: dto.transaction_reference || dto.pfms_reference || '',
    remarks: dto.remarks || '',
    createdAt: dto.created_at || null,
    raw: dto,
  }
}

export const mapBillList = (response) => (Array.isArray(response) ? response : response?.results || response?.data || []).map(mapBill)
// State budget & finance DTO normalization (backend_next_guide §21–§22).
// Amounts arrive in crore rupees from the backend; the frontend preserves the
// backend's numbers verbatim and only formats for display.  Unrecognized
// fields stay untouched inside `raw`.  There is NO fallback to example
// figures — any missing amount is 0 so screens render EMPTY states honestly.
const rows = (value) => (Array.isArray(value) ? value : value?.results || value?.data || [])

const amount = (value) => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function mapBudgetRecord(dto = {}) {
  return {
    id: dto.id,
    name: dto.name || dto.title || dto.scheme_name || '',
    financialYear: dto.financial_year || dto.financialYear || '',
    departmentId: dto.department ?? dto.department_id,
    departmentName: dto.department_name || '',
    districtId: dto.district ?? dto.district_id,
    districtName: dto.district_name || '',
    schemeId: dto.scheme ?? dto.scheme_id,
    schemeName: dto.scheme_name || '',
    category: dto.category || '',
    head: dto.head || dto.account_head || '',
    status: dto.status || '',
    statusDisplay: dto.status_display || '',
    authorizedCr: amount(dto.authorized_budget_cr ?? dto.authorized_amount_cr ?? dto.authorized_cr),
    approvedCr: amount(dto.approved_budget_cr ?? dto.approved_amount_cr ?? dto.approved_cr),
    allocatedCr: amount(dto.allocated_amount_cr ?? dto.allocated_cr ?? dto.district_allocated_cr),
    releasedCr: amount(dto.released_amount_cr ?? dto.released_cr),
    utilizedCr: amount(dto.utilized_amount_cr ?? dto.utilized_cr),
    balanceCr: amount(dto.balance_amount_cr ?? dto.balance_cr ?? dto.remaining_cr),
    amountCr: amount(dto.amount_cr ?? dto.amount),
    date: dto.date || dto.transaction_date || null,
    remarks: dto.remarks || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

export function mapStateBudgetSummary(dto = {}) {
  const source = dto.summary || dto.data || dto
  return {
    financialYear: source.financial_year || source.financialYear || '',
    totalAuthorizedCr: amount(source.total_authorized_cr ?? source.total_budget_cr ?? source.authorized_cr),
    totalAllocatedCr: amount(source.total_allocated_cr ?? source.allocated_cr),
    totalReleasedCr: amount(source.total_released_cr ?? source.released_cr),
    totalUtilizedCr: amount(source.total_utilized_cr ?? source.utilized_cr),
    utilizationPercent: amount(source.utilization_percent ?? source.utilization_pct),
    departmentCount: amount(source.department_count),
    districtCount: amount(source.district_count),
    schemeCount: amount(source.scheme_count),
    financialYearCount: amount(source.financial_year_count),
    generatedAt: source.generated_at || source.generatedAt || null,
    raw: dto,
  }
}

export const mapBudgetList = (response) => rows(response).map(mapBudgetRecord)
export const mapSchemeList = (response) => rows(response).map(mapBudgetRecord)
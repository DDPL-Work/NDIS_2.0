// Measurement Book (e-MB) DTO normalization verified against the live
// serializer metadata (OPTIONS /measurement-books/) and responses during
// Phase 2.1. Canonical vocabulary: mb_number, item_description, unit,
// estimated_quantity, quantity_measured, rate, total_amount, measurement_date,
// measured_by, verified_by, status.
const amount = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

export function mapMeasurementBook(dto = {}) {
  const status = dto.status || ''
  return {
    id: dto.id,
    mbNumber: dto.mb_number || '',
    projectId: dto.project ?? dto.project_id ?? null,
    projectName: dto.project_title || dto.project_name || '',
    date: dto.measurement_date || dto.date || null,
    itemDescription: dto.item_description || dto.work_item || dto.item || '',
    unit: dto.unit || dto.unit_of_measurement || '',
    estimatedQuantity: amount(dto.estimated_quantity),
    measuredQuantity: amount(dto.quantity_measured ?? dto.measured_quantity ?? dto.quantity ?? dto.executed_quantity),
    itemRate: amount(dto.rate ?? dto.item_rate),
    totalAmount: amount(dto.total_amount ?? dto.calculated_amount ?? dto.amount),
    measuringOfficer: dto.measured_by || dto.measuring_officer || dto.measuring_officer_name || '',
    verifyingEngineer: dto.verified_by || dto.verifying_engineer || dto.verifying_engineer_name || '',
    status,
    verified: dto.verified ?? (status === 'verified'),
    createdAt: dto.created_at || null,
    raw: dto,
  }
}

export const mapMeasurementBookList = (response) => (Array.isArray(response) ? response : response?.results || response?.data || []).map(mapMeasurementBook)
// Report DTO normalization. Field vocabulary verified against the live
// serializer metadata (OPTIONS /reports/) and GET /api/reports/ records —
// code/title/category/file_size_str/download_format/generated_at are the
// backend's own presentation fields.
export function mapReport(dto = {}) {
  return {
    id: dto.id,
    code: dto.code || `REP-${dto.id}`,
    title: dto.title || '',
    category: dto.category || '',
    format: dto.download_format || (dto.file ? String(dto.file).split('.').pop().toUpperCase() : 'PDF'),
    fileSize: dto.file_size_str || dto.size || '—',
    generatedAt: dto.generated_at || dto.generated_date_str || null,
    generatedBy: dto.generated_by_name || '',
    departmentName: dto.department_name || '',
    districtName: dto.district_name || '',
    file: dto.file || null,
    raw: dto,
  }
}

export const mapReportList = (response) => (Array.isArray(response) ? response : response?.results || response?.data || []).map(mapReport)

export const mapGeneratedReport = (response) => {
  const report = response?.report || response
  return { message: response?.message || '', report: mapReport(report) }
}
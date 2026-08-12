// Execution Risk DTO normalization verified against the live serializer
// metadata (OPTIONS /execution-risks/) during Phase 2.1. Canonical vocabulary:
// project, risk_type, severity, risk_signal, recommendation, status,
// reported_at. Risk records come from the backend — no signal is derived from
// project progress in this layer.
export function mapExecutionRisk(dto = {}) {
  const status = dto.status || ''
  return {
    id: dto.id,
    projectId: dto.project ?? dto.project_id ?? null,
    projectName: dto.project_title || dto.project_name || '',
    riskType: dto.risk_type || '',
    severity: dto.severity || '',
    signal: dto.risk_signal || dto.signal || dto.description || dto.title || '',
    recommendation: dto.recommendation || '',
    status,
    resolved: Boolean(dto.resolved ?? dto.is_resolved ?? status === 'resolved'),
    reportedAt: dto.reported_at || null,
    createdAt: dto.created_at || null,
    raw: dto,
  }
}

export const mapExecutionRiskList = (response) => (Array.isArray(response) ? response : response?.results || response?.data || []).map(mapExecutionRisk)
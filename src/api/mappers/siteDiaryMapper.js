// Site Diary DTO normalization verified against the live serializer metadata
// (OPTIONS /site-diaries/) and POST responses during Phase 2.1. The canonical
// read vocabulary is log_date / work_description / labour_count / materials_used
// / weather_condition / progress_logged; the backend additionally echoes legacy
// aliases, so both sets are normalized here.
const amount = (value) => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function mapSiteDiary(dto = {}) {
  return {
    id: dto.id,
    projectId: dto.project ?? dto.project_id ?? null,
    projectName: dto.project_title || dto.project_name || '',
    date: dto.log_date || dto.date || dto.entry_date || null,
    workPerformed: dto.work_description || dto.work_performed || dto.description || '',
    labour: amount(dto.labour_count ?? dto.labour ?? dto.labour_deployed ?? dto.labourCount),
    materials: dto.materials_used || dto.materials || dto.materials_consumed || '',
    observations: dto.observations || dto.remarks || dto.notes || '',
    weather: dto.weather_condition || dto.weather || '',
    progressLogged: amount(dto.progress_logged ?? dto.physical_progress),
    status: dto.status || '',
    photos: Array.isArray(dto.photos) ? dto.photos : [],
    createdAt: dto.created_at || null,
    raw: dto,
  }
}

export const mapSiteDiaryList = (response) => (Array.isArray(response) ? response : response?.results || response?.data || []).map(mapSiteDiary)
import { apiRequest } from '../services/httpClient'

// Master-data reference endpoints (verified against the production backend:
// /api/complaint-categories/ and /api/districts/ are public).  Complaint
// create payloads require integer PKs for category / district / subdivision /
// block / village_ward, and the names exposed here match the wizard's
// routing-rule vocabulary exactly, so they can be resolved into the name ->
// pk reference catalog used by toComplaintDto.
//
// The administrative hierarchy (SubDivision / Block / VillageWard) endpoints
// are read opportunistically: they are optional on the backend, so every
// collection call degrades to [] on 404 and the wizard falls back to its
// hardcoded slug options — nothing breaks until those viewsets ship.
const rows = (response) => Array.isArray(response) ? response : response.results || response.data || []

async function masterCollection(url, params = {}, normalize = () => ({})) {
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([, value]) => value != null && value !== '').map(([key, value]) => [key, String(value)])
  ).toString()
  let data
  try { data = await apiRequest(`${url}${query ? `?${query}` : ''}`, { authenticated: false }) } catch (error) { data = [] }
  return rows(data).map((dto) => normalize(dto))
}

export const backendMasterApi = {
  async complaintCategories() {
    return masterCollection('/complaint-categories/', {}, (dto) => ({
      id: String(dto.id),
      name: dto.name,
      departmentId: String(dto.department ?? ''),
      departmentName: dto.department_name || '',
      defaultPriority: dto.default_priority || 'MEDIUM',
      defaultSlaHours: dto.default_sla_hours,
      raw: dto,
    }))
  },
  async districts() {
    return masterCollection('/districts/', {}, (dto) => ({ id: String(dto.id), name: dto.name, state: dto.state_name || '', raw: dto }))
  },
  async subdivisions(params = {}) {
    return masterCollection('/subdivisions/', params, (dto) => ({
      id: String(dto.id),
      name: dto.name,
      districtId: String(dto.district ?? dto.district_id ?? ''),
      raw: dto,
    }))
  },
  async blocks(params = {}) {
    return masterCollection('/blocks/', params, (dto) => ({
      id: String(dto.id),
      name: dto.name,
      subdivisionId: String(dto.subdivision ?? dto.subdivision_id ?? ''),
      raw: dto,
    }))
  },
  async villageWards(params = {}) {
    return masterCollection('/village-wards/', params, (dto) => ({
      id: String(dto.id),
      name: dto.name,
      blockId: String(dto.block ?? dto.block_id ?? ''),
      raw: dto,
    }))
  },
}
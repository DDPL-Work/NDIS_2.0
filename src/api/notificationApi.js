import { apiRequest } from './apiClient'

const query = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params)
    .filter(([, item]) => item !== undefined && item !== null && item !== '')
    .map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}

const mapNotification = (dto = {}) => {
  const template = String(dto.template_name || dto.type || '').toLowerCase()
  return {
    id: String(dto.id),
    message: dto.message || dto.body || dto.title || '',
    createdAt: dto.dispatched_at || dto.created_at || dto.createdAt || dto.timestamp,
    read: Boolean(dto.read ?? dto.is_read),
    channel: String(dto.channel || 'portal').toLowerCase(),
    status: dto.status || '',
    templateName: dto.template_name || dto.type || '',
    targetRole: template.includes('complaint') ? 'complaint' : template.includes('sla') ? 'sla' : 'portal',
    label: template.includes('sla') ? 'SLA Warning' : template.includes('emergency') ? 'Emergency' : 'Complaint Update',
    departmentId: dto.department_slug || dto.department_id || dto.departmentId,
    raw: dto,
  }
}

const listRows = (response) => Array.isArray(response) ? response : response.results || response.data || []

export const backendNotificationApi = {
  async list(params = {}) { return listRows(await apiRequest(`/notifications/${query(params)}`)).map(mapNotification) },
}

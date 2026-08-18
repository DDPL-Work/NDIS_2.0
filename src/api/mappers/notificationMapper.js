// Notification DTO normalization (backend_next_guide §9).  Backend channel
// values (PORTAL / EMAIL / SMS / WHATSAPP) are preserved verbatim; labels are
// presentation-only and derived from the backend's own type/template fields.
const rows = (value) => (Array.isArray(value) ? value : value?.results || value?.data || [])

export function mapNotification(dto = {}) {
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

export const mapNotificationList = (response) => rows(response).map(mapNotification)
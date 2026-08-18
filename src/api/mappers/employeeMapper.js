// Employee DTO normalization (backend_next_guide §20).  The backend lifecycle
// status (INVITED → PENDING → ACCEPTED → USER CREATED → ROLE ASSIGNED →
// ACTIVE) is preserved verbatim; presentation labels derive from the
// backend's own status_display where present.
const rows = (value) => (Array.isArray(value) ? value : value?.results || value?.data || [])

export function mapEmployee(dto = {}) {
  return {
    id: dto.id,
    name: dto.name || dto.full_name || [dto.first_name, dto.last_name].filter(Boolean).join(' '),
    email: dto.email || '',
    phone: dto.phone || '',
    designation: dto.designation || '',
    role: dto.role || '',
    roleDisplay: dto.role_display || '',
    departmentId: dto.department ?? dto.department_id,
    departmentName: dto.department_name || '',
    employeeNumber: dto.employee_number || dto.employee_code || '',
    office: dto.office || '',
    block: dto.block || '',
    status: dto.status || '',
    statusDisplay: dto.status_display || '',
    joinedAt: dto.joined_at || dto.date_joined || null,
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    invitationSentAt: dto.invitation_sent_at || null,
    invitationAcceptedAt: dto.invitation_accepted_at || null,
    profileImage: dto.profile_image || '',
    raw: dto,
  }
}

export const mapEmployeeList = (response) => rows(response).map(mapEmployee)
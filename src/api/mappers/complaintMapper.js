import { CATEGORY_ROUTING_RULES } from '../../config/constants'

// Backend workflow states (UPPERCASE, see backend_guide.md §10.4/10.5) mapped
// onto the app's lowercase state vocabulary used by badges + steppers.
const BACKEND_STATUS = {
  SUBMITTED: 'submitted',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  INSPECTION_STARTED: 'inspection_started',
  EVIDENCE_UPLOADED: 'evidence_uploaded',
  RESOLVED: 'resolved',
  CITIZEN_VERIFICATION: 'verification_pending',
  CITIZEN_CONFIRMATION: 'verification_pending',
  CLOSED: 'closed',
  REOPENED: 'reopened',
  TRANSFERRED: 'transferred',
  ESCALATED: 'escalated',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  DRAFT: 'draft',
}

// Backend department names → app department slug (used by DEPARTMENT_MAP and
// the department chips). Unknown names fall back to a deterministic slug.
const DEPARTMENT_SLUGS = [
  ['water', /water|jj|wr\b/i],
  ['health', /health|family welfare/i],
  ['education', /education|school/i],
  ['pwd', /pwd|public works|road|transport/i],
  ['electricity', /electricity|power|transformer|bihar state electric/i],
  ['urban', /urban/i],
  ['solar', /solar|renewable|energy/i],
  ['tourism', /tourism|heritage|culture/i],
]
export function departmentSlugFromName(name = '') {
  const match = DEPARTMENT_SLUGS.find(([, pattern]) => pattern.test(String(name)))
  return match ? match[0] : String(name).toLowerCase().replace(/department|&|/gi, '').replace(/[^a-z]/g, '').slice(0, 12) || ''
}

// The category vocabulary of the wizard uses slug ids (broken_handpump, ...);
// the backend returns numeric category ids + names.  Resolve a slug from the
// name so both vocabularies stay usable.
export function categorySlugFromName(name = '') {
  const rule = CATEGORY_ROUTING_RULES.find((item) => String(item.categoryName).trim().toLowerCase() === String(name || '').trim().toLowerCase())
  if (rule) return rule.categoryId
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

const mapEvidence = (item = {}) => {
  if (typeof item === 'string') return { id: null, url: item, name: '', type: 'IMAGE' }
  const position = (item.latitude != null && item.longitude != null) ? [Number(item.longitude), Number(item.latitude)] : null
  const url = item.file || item.file_url || item.url || ''
  return {
    id: item.id,
    url,
    name: item.file_name || item.name,
    type: String(item.file_type || item.type || '').toUpperCase(),
    stage: item.stage,
    uploadedByName: item.uploaded_by_name || item.uploadedBy,
    isGeotagVerified: Boolean(item.is_geotag_verified ?? item.geotag_validated),
    distanceFromPinM: item.distance_from_pin_m ?? item.distanceMeters,
    position,
    lat: item.latitude,
    lng: item.longitude,
    createdAt: item.created_at || item.timestamp,
  }
}

export function mapTimelineEntry(dto = {}) {
  return {
    id: String(dto.id),
    complaintId: dto.complaint_id ?? dto.complaint,
    action: String(dto.action || ''),
    actionLabel: String(dto.action || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    fromStatus: String((dto.from_status ?? dto.from) || '').toLowerCase(),
    toStatus: String((dto.to_status ?? dto.to) || '').toLowerCase(),
    actorName: dto.performed_by_name || dto.actor_name || dto.actor,
    actorRole: dto.performer_role || dto.actor_role || 'user',
    remarks: dto.remarks || '',
    attachments: Array.isArray(dto.attachments) ? dto.attachments.map(mapEvidence) : [],
    metadata: dto.metadata || {},
    timestamp: dto.created_at || dto.at || dto.timestamp,
  }
}

// Backend priority vocabulary (ComplaintPriority.TextChoices in backend_guide.md
// §10.5) is LOW/MEDIUM/HIGH/CRITICAL.  Internally the app uses
// urgent/high/medium/low, so "urgent" <-> CRITICAL in both directions.
const PRIORITY_ALIAS = { critical: 'urgent', urgent: 'urgent' }
const PRIORITY_TO_BACKEND = { urgent: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW' }

export function mapComplaint(dto = {}) {
  const rawStatus = String(dto.status || dto.state || 'SUBMITTED').trim().toUpperCase()
  const state = BACKEND_STATUS[rawStatus] || String(rawStatus).toLowerCase()
  const rawPriority = String(dto.priority || 'medium').trim().toLowerCase()
  const priority = PRIORITY_ALIAS[rawPriority] || rawPriority
  const point = (dto.longitude != null && dto.latitude != null)
    ? [Number(dto.longitude), Number(dto.latitude)]
    : (dto.geom?.coordinates || dto.location_coordinates || null)
  const evidences = Array.isArray(dto.evidences) ? dto.evidences.map(mapEvidence) : (Array.isArray(dto.attachments) ? dto.attachments.map(mapEvidence) : [])
  const resolutionPhotos = evidences.filter((item) => /RESOLUTION|INSPECTION/.test(item.type || item.stage || '') || /RESOLUTION|INSPECTION/.test(item.stage || '')).map((item) => item.url)
  const departmentName = dto.department_name || (typeof dto.department === 'object' ? dto.department?.name : '') || ''
  const resolutionDetails = dto.resolution_summary || dto.resolved_at
    ? {
        resolvedAt: dto.resolved_at || dto.updated_at,
        resolvedBy: dto.assigned_officer_name,
        remarks: dto.resolution_summary || '',
        photos: resolutionPhotos.length ? resolutionPhotos : evidences.filter((item) => /IMAGE/.test(item.type)).map((item) => item.url),
      }
    : null
  return {
    id: String(dto.id ?? ''),
    ticketNumber: dto.tracking_no || `CMP-${dto.id}`,
    trackingCode: dto.tracking_no,
    title: dto.title || dto.subject || 'Complaint',
    description: dto.description || '',
    categoryId: String(dto.category ?? ''),
    categorySlug: categorySlugFromName(dto.category_name),
    categoryName: dto.category_name || '',
    departmentId: String(dto.department ?? ''),   // backend department id (matches chips)
    departmentSlug: departmentSlugFromName(departmentName),
    departmentName,
    priority,
    state,
    status: state,
    rawStatus,
    slaTargetHours: dto.sla_target_hours,
    slaHours: dto.sla_target_hours,
    slaDueAt: dto.sla_deadline || dto.sla_due_at,
    isSlaBreached: Boolean(dto.is_sla_breached),
    location: {
      position: point,
      longitude: dto.longitude,
      latitude: dto.latitude,
      village: dto.village_ward || dto.village || '',
      ward: dto.ward || '',
      block: dto.block || '',
      subdivision: dto.subdivision || '',
      districtId: String(dto.district ?? ''),
      districtName: dto.district_name || '',
      address: dto.address || [dto.subdivision, dto.block, dto.village_ward].filter(Boolean).join(', '),
      nearestName: dto.nearest_facility_name || '',
      nearestFacility: dto.nearest_facility_name || dto.nearest_facility || '',
      nearestFacilityDistanceM: dto.nearest_facility_distance_m,
    },
    citizen: {
      id: dto.citizen_user,
      name: dto.citizen_name || 'Citizen',
      phone: dto.citizen_phone || '',
      email: dto.citizen_email || '',
      isMasked: Boolean(dto.is_identity_masked),
      altPhone: '',
    },
    assignedOfficer: { id: dto.assigned_officer, name: dto.assigned_officer_name || '' },
    assignedName: dto.assigned_officer_name || '',
    assignedInspector: { id: dto.assigned_inspector, name: dto.assigned_inspector_name || '' },
    position: point,
    NearestFacility: dto.nearest_facility_name,
    evidences,
    attachments: evidences,
    resolutionSummary: dto.resolution_summary || '',
    rejectionReason: dto.rejection_reason || '',
    transferReason: dto.transfer_reason || '',
    escalationReason: dto.escalation_reason || '',
    rating: dto.rating,
    feedbackComment: dto.feedback_comment || '',
    resolutionDetails,
    createdAt: dto.created_at || dto.submitted_at || dto.createdAt,
    updatedAt: dto.updated_at,
    resolvedAt: dto.resolved_at,
    closedAt: dto.closed_at,
    submittedAt: dto.created_at || dto.submitted_at,
    timeline: Array.isArray(dto.timeline) ? dto.timeline.map(mapTimelineEntry) : [],
    raw: dto,
  }
}

export function mapComplaintList(response) {
  const rows = Array.isArray(response) ? response : (response?.results || response?.data || response?.complaints || [])
  return rows.map(mapComplaint)
}

// The backend stores category / department / district / block / village_ward
// as integer PKs and exposes no master-data index endpoints, so the only
// legitimate source of name -> id mappings is the complaint collection the
// session can already read.  Rows are registered here as they load; the
// create DTO then resolves identifiers from this reference catalog.
const referenceCatalog = { category: new Map(), department: new Map(), district: new Map() }

const normalizeKey = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, ' ')

const isPk = (value) => /^\d+$/.test(String(value ?? ''))

// Register name -> pk mappings from any loaded rows (complaints AND
// facilities carry department/district ids; only complaints carry category
// ids).  Only numeric ids are stored — slugs would be rejected by the backend.
export function registerReferenceCatalog(rows = []) {
  rows.forEach((row) => {
    const categoryId = row.categoryId
    if (row.categoryName && isPk(categoryId)) referenceCatalog.category.set(normalizeKey(row.categoryName), String(categoryId))
    const departmentId = row.departmentId
    if (row.departmentName && isPk(departmentId)) referenceCatalog.department.set(normalizeKey(row.departmentName), String(departmentId))
    const districtId = row.districtId ?? row.location?.districtId
    const districtName = row.districtName || row.location?.districtName
    if (districtName && isPk(districtId)) referenceCatalog.district.set(normalizeKey(districtName), String(districtId))
  })
}

export function registerComplaintReference(complaints = []) {
  registerReferenceCatalog(complaints)
}

// Resolve a writable PK: prefer an explicit numeric id, else the runtime
// reference catalog, else nothing (unresolved fields are omitted from the
// body so the backend can default them).
function resolvePk(catalog, name, explicitId) {
  if (isPk(explicitId)) return String(explicitId)
  if (name) {
    const pk = catalog.get(normalizeKey(name))
    if (pk != null && pk !== '') return String(pk)
  }
  return undefined
}

// The admin-hierarchy columns (subdivision / block / village_ward) are
// ForeignKey fields on the backend and accept ONLY integer primary keys —
// free text is rejected with 400 ("Expected pk value, received str.").  A
// value is emitted only when a real numeric PK was resolved; otherwise the
// field is omitted so the backend stores null instead of failing the whole
// submission.
function hierarchyPk(value) {
  const normalized = String(value ?? '').trim()
  return /^\d+$/.test(normalized) ? normalized : undefined
}

// Complaint create DTO.  Coordinates are sent as longitude/latitude pairs;
// category / department / district are resolved to integer PKs when the
// master is known.  The administrative hierarchy endpoints are not deployed on
// the backend, so subdivision / block / village_ward are transmitted ONLY as
// numeric PKs — names are never sent for those FK columns.
export function toComplaintDto(model = {}) {
  const position = model.location?.position
  return {
    title: model.title,
    description: model.description,
    category: resolvePk(referenceCatalog.category, model.categoryName, model.categoryId),
    department: resolvePk(referenceCatalog.department, model.departmentName, model.departmentId),
    priority: PRIORITY_TO_BACKEND[String(model.priority || 'medium').toLowerCase()] || String(model.priority || 'medium').toUpperCase(),
    district: resolvePk(referenceCatalog.district, model.location?.districtName || model.districtName, model.location?.districtId),
    subdivision: hierarchyPk(model.location?.subdivision || model.subdivision),
    block: hierarchyPk(model.location?.block),
    village_ward: hierarchyPk(model.location?.village ?? model.location?.ward),
    latitude: Array.isArray(position) ? position[1] : model.location?.latitude,
    longitude: Array.isArray(position) ? position[0] : model.location?.longitude,
    citizen_name: model.citizen?.name,
    citizen_phone: model.citizen?.phone,
    citizen_email: model.citizen?.email,
    is_identity_masked: model.anonymous ?? Boolean(model.citizen?.isMasked),
  }
}
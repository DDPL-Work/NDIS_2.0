const slugPart = (value) => String(value || '')
  .toLowerCase()
  .replace(/department|district|&/g, ' ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

// Production facility routes use {department}-{district}-{id}.  The helper
// intentionally derives every segment from backend facility data.
export function createFacilitySlug(facility = {}) {
  const department = facility.department_slug || facility.departmentName || facility.department_name || facility.department
  const district = facility.district_slug || facility.districtName || facility.district_name || facility.district_code
  const id = facility.id
  return [slugPart(department), slugPart(district), id].filter(Boolean).join('-')
}

export function facilityIdFromSlug(slug = '') {
  const match = String(slug).match(/-(\d+)$/)
  return match ? match[1] : null
}

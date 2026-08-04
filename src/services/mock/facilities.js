import { makeRng, pickWeighted, randInt, randFloat } from '../../utils/random'
import { jitterPoint } from '../../utils/geo'
import { DISTRICTS } from '../../config/constants'
import { FACILITY_SCHEMAS, FACILITY_STATUSES, GEOCODE_METHODS } from './facilitySchemas'

const FACILITY_NAME_PARTS = {
  district_hospital: ['Sadar Hospital', 'District Hospital'],
  chc: ['Community Health Centre'],
  phc: ['Primary Health Centre'],
  subcentre: ['Health Subcentre'],
  ambulance: ['Ambulance Station'],
  vaccination_centre: ['Vaccination Centre'],
  borewell: ['Borewell'],
  water_tank: ['Overhead Tank'],
  reservoir: ['Reservoir'],
  jjm_connection: ['JJM Connection Point'],
  school: ['Upgraded Middle School', 'Govt. High School', 'Govt. Primary School'],
  college: ['Degree College'],
  anganwadi: ['Anganwadi Centre'],
  heritage_site: ['Archaeological Site', 'Heritage Monument'],
  museum: ['Site Museum'],
  hotel: ['Tourist Lodge', 'Hotel'],
  visitor_facility: ['Tourist Facilitation Centre'],
  govt_building: ['Block Office', 'Panchayat Bhawan'],
  solar_installation: ['Rooftop Solar Unit'],
  solar_park: ['Solar Park'],
  road: ['Village Road', 'PMGSY Road'],
  land_parcel: ['Gram Panchayat Land'],
}

const VILLAGE_NAMES = [
  'Silao', 'Harnaut', 'Islampur', 'Biharsharif', 'Rajgir', 'Hilsa', 'Nagarnausa', 'Chandi',
  'Ekangarsarai', 'Rahui', 'Sarmera', 'Karaiparshurai', 'Parbalpur', 'Bind', 'Noorsarai',
  'Katrisarai', 'Giriak', 'Thariyai', 'Asthawan', 'Bihar Sharif Sadar',
]

function facilityCount(districtId) {
  // Pilot district (Nalanda/Rajgir) is data-rich; others are lightly seeded so
  // the district switcher still shows something believable at Phase 2/3 districts.
  const rich = districtId === 'nalanda' || districtId === 'rajgir'
  return rich ? 42 : 14
}

function buildAttributes(rng, departmentId, categoryId) {
  const attrs = {}
  switch (departmentId) {
    case 'health':
      attrs.bed_count = categoryId === 'district_hospital' ? randInt(rng, 80, 250) : categoryId === 'chc' ? randInt(rng, 20, 50) : randInt(rng, 0, 10)
      attrs.has_emergency = rng() > 0.35
      attrs.has_maternity = rng() > 0.4
      attrs.staff_count = randInt(rng, 3, 60)
      attrs.oxygen_supply_status = pickWeighted(rng, [['adequate', 5], ['low', 2], ['critical', 1]])
      break
    case 'water':
      attrs.capacity_liters = categoryId === 'reservoir' ? randInt(rng, 500000, 5000000) : randInt(rng, 5000, 80000)
      attrs.source_type = pickWeighted(rng, [['borewell', 5], ['surface', 2], ['piped', 3]])
      attrs.quality_test_status = pickWeighted(rng, [['pass', 7], ['fail', 1], ['pending', 2]])
      attrs.connection_count = randInt(rng, 20, 900)
      break
    case 'education':
      attrs.institution_type = pickWeighted(rng, [['govt', 8], ['aided', 2], ['private', 1]])
      attrs.board_affiliation = pickWeighted(rng, [['BSEB', 6], ['CBSE', 2], ['ICSE', 1]])
      attrs.student_count = randInt(rng, 40, 1200)
      attrs.teacher_count = randInt(rng, 2, 40)
      attrs.has_digital_classroom = rng() > 0.6
      break
    case 'tourism':
      attrs.site_category = pickWeighted(rng, [['Buddhist Heritage', 4], ['Archaeological', 3], ['Natural', 2], ['Pilgrimage', 3]])
      attrs.visiting_hours = '09:00 – 17:30'
      attrs.entry_fee = pickWeighted(rng, [[0, 5], [25, 3], [40, 2]])
      attrs.heritage_protection_status = pickWeighted(rng, [['ASI Protected', 4], ['State Protected', 3], ['Unprotected', 2]])
      attrs.avg_footfall_monthly = randInt(rng, 500, 45000)
      break
    case 'solar':
      attrs.rooftop_area_sqm = randInt(rng, 80, 2500)
      attrs.installed_capacity_kw = categoryId === 'solar_park' ? randInt(rng, 500, 5000) : randInt(rng, 0, 120)
      attrs.generation_status = pickWeighted(rng, [['generating', 4], ['grid_connected', 2], ['installed', 2], ['planned', 3]])
      attrs.subsidy_scheme_id = 'PM-SURYA-GHAR'
      break
    default:
      attrs.condition_rating = pickWeighted(rng, [['good', 4], ['fair', 3], ['poor', 2], ['critical', 1]])
      attrs.lifecycle_state = pickWeighted(rng, [['operational', 6], ['under_maintenance', 2], ['planned', 1], ['constructed', 1]])
      attrs.scheme_id = pickWeighted(rng, [['PMGSY', 3], ['MGNREGA', 3], [null, 4]])
  }
  return attrs
}

function buildOneFacility(rng, district, departmentId, index) {
  const schema = FACILITY_SCHEMAS[departmentId]
  const category = pickWeighted(rng, schema.categories.map((c) => [c, c.weight]))
  const village = VILLAGE_NAMES[randInt(rng, 0, VILLAGE_NAMES.length - 1)]
  const nameOptions = FACILITY_NAME_PARTS[category.id] || ['Facility']
  const namePrefix = nameOptions[randInt(rng, 0, nameOptions.length - 1)]
  const position = jitterPoint(rng, district.center, 0.14)
  const status = pickWeighted(rng, [['active', 8], ['under_construction', 1.5], ['inactive', 0.5]])
  const confidence = randFloat(rng, 0.55, 0.99, 2)
  const gapScore = randFloat(rng, 0.02, 0.95, 2)

  return {
    id: `${departmentId}-${district.id}-${index}`,
    departmentId,
    categoryId: category.id,
    categoryLabel: category.label,
    radiusKm: category.radiusKm,
    name: `${namePrefix}, ${village}`,
    village,
    districtId: district.id,
    position, // [lng, lat]
    status,
    custodian: schema.custodian,
    geocodeMethod: GEOCODE_METHODS[randInt(rng, 0, GEOCODE_METHODS.length - 1)],
    confidence,
    gapScore,
    ingestionBatchId: `BATCH-${district.id.toUpperCase()}-${String(randInt(rng, 1, 24)).padStart(2, '0')}`,
    lastUpdated: new Date(Date.now() - randInt(rng, 1, 200) * 86400000).toISOString(),
    attributes: buildAttributes(rng, departmentId, category.id),
    contact: {
      phone: `+91 ${randInt(rng, 60000, 99999)}${randInt(rng, 10000, 99999)}`,
      hours: departmentId === 'health' ? '24x7' : '10:00 – 17:00',
    },
    photos: [],
  }
}

let _cache = null

export function getAllFacilities() {
  if (_cache) return _cache
  const facilities = []
  for (const district of DISTRICTS) {
    const count = facilityCount(district.id)
    for (const departmentId of Object.keys(FACILITY_SCHEMAS)) {
      const rng = makeRng(`facilities-${district.id}-${departmentId}`)
      const n = Math.max(4, Math.round(count * (FACILITY_SCHEMAS[departmentId].categories.length / 4)))
      for (let i = 0; i < n; i++) {
        facilities.push(buildOneFacility(rng, district, departmentId, i))
      }
    }
  }
  _cache = facilities
  return facilities
}

export function getFacilitiesBy({ districtId, departmentId, categoryId, query, status } = {}) {
  let list = getAllFacilities()
  if (districtId) list = list.filter((f) => f.districtId === districtId)
  if (departmentId) list = list.filter((f) => f.departmentId === departmentId)
  if (categoryId) list = list.filter((f) => f.categoryId === categoryId)
  if (status) list = list.filter((f) => f.status === status)
  if (query) {
    const q = query.toLowerCase()
    list = list.filter((f) => f.name.toLowerCase().includes(q) || f.village.toLowerCase().includes(q) || f.categoryLabel.toLowerCase().includes(q))
  }
  return list
}

export function getFacilityById(id) {
  return getAllFacilities().find((f) => f.id === id) || null
}

export { FACILITY_STATUSES }

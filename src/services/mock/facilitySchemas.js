// Per-department facility categories + attribute schema, mirroring the
// `mst_asset_category.field_schema` / generic `ast_facility` + JSONB `attributes`
// extension pattern from LLD Vol 1 §9.2 and Vol 3 Ch 16.1–16.6.
// Each category also carries the custodian office from the Nalanda data-custodian
// registry (LLD Vol 2 §13.5) so provenance shows up next to every facility.

export const FACILITY_SCHEMAS = {
  health: {
    custodian: 'Civil Surgeon Office, Nalanda',
    categories: [
      { id: 'district_hospital', label: 'District Hospital', radiusKm: 15, weight: 1 },
      { id: 'chc', label: 'Community Health Centre', radiusKm: 8, weight: 3 },
      { id: 'phc', label: 'Primary Health Centre', radiusKm: 3, weight: 8 },
      { id: 'subcentre', label: 'Health Subcentre', radiusKm: 3, weight: 14 },
      { id: 'ambulance', label: 'Ambulance Station', radiusKm: 10, weight: 4 },
      { id: 'vaccination_centre', label: 'Vaccination Centre', radiusKm: 3, weight: 6 },
    ],
    attributeFields: ['bed_count', 'has_emergency', 'has_maternity', 'staff_count', 'oxygen_supply_status'],
  },
  water: {
    custodian: 'PHED Division, Nalanda',
    categories: [
      { id: 'borewell', label: 'Borewell', radiusKm: 1, weight: 16 },
      { id: 'water_tank', label: 'Overhead Water Tank', radiusKm: 2, weight: 8 },
      { id: 'reservoir', label: 'Reservoir', radiusKm: 5, weight: 2 },
      { id: 'jjm_connection', label: 'Jal Jeevan Mission Connection', radiusKm: 1, weight: 10 },
    ],
    attributeFields: ['capacity_liters', 'source_type', 'quality_test_status', 'connection_count'],
  },
  education: {
    custodian: 'District Education Office (DEO), Nalanda',
    categories: [
      { id: 'school', label: 'School', radiusKm: 3, weight: 18 },
      { id: 'college', label: 'College', radiusKm: 10, weight: 3 },
      { id: 'anganwadi', label: 'Anganwadi Centre', radiusKm: 2, weight: 12 },
    ],
    attributeFields: ['institution_type', 'board_affiliation', 'student_count', 'teacher_count', 'has_digital_classroom'],
  },
  urban: {
    custodian: 'Urban Local Body, Nalanda',
    categories: [
      { id: 'heritage_site', label: 'Heritage Site', radiusKm: 5, weight: 6 },
      { id: 'museum', label: 'Museum', radiusKm: 5, weight: 2 },
      { id: 'hotel', label: 'Hotel', radiusKm: 5, weight: 8 },
      { id: 'visitor_facility', label: 'Visitor Facility', radiusKm: 3, weight: 5 },
    ],
    attributeFields: ['site_category', 'visiting_hours', 'entry_fee', 'heritage_protection_status', 'avg_footfall_monthly'],
  },
  electricity: {
    custodian: 'BREDA / SBPDCL (Bihar Renewable Energy & Power)',
    categories: [
      { id: 'govt_building', label: 'Government Building (Rooftop Candidate)', radiusKm: 2, weight: 10 },
      { id: 'solar_installation', label: 'Solar Installation', radiusKm: 2, weight: 6 },
      { id: 'solar_park', label: 'Solar Park / Substation', radiusKm: 8, weight: 1 },
    ],
    attributeFields: ['rooftop_area_sqm', 'installed_capacity_kw', 'generation_status', 'subsidy_scheme_id'],
  },
  pwd: {
    custodian: 'Public Works Dept / DM Office, Nalanda',
    categories: [
      { id: 'road', label: 'Road Segment', radiusKm: 2, weight: 10 },
      { id: 'govt_building', label: 'Public Building', radiusKm: 2, weight: 8 },
      { id: 'land_parcel', label: 'Public Land Parcel', radiusKm: 2, weight: 6 },
    ],
    attributeFields: ['condition_rating', 'lifecycle_state', 'scheme_id'],
  },
}

export const FACILITY_STATUSES = ['active', 'under_construction', 'inactive']
export const GEOCODE_METHODS = ['exact_coordinate', 'address_geocoded', 'manually_placed']

// Department Decision Support — configuration registry.
//
// ONE reusable workspace renders EVERY department listed here (and any added
// later).  Nothing in this file is imported by components; the workspace
// renders only what these objects declare.  Every layer, entity group and
// indicator is anchored to the REAL backend catalog (GET /api/gis/catalog/)
// and the REAL facilities collection (GET /api/facilities/) — a config entry
// that names a layer the catalog does not contain is surfaced honestly as
// "not available" instead of being invented.
//
// `match` values are regex SOURCE strings (kept as strings so configs stay
// JSON-serializable and testable) tested against facility categoryLabel.
//
// Adding a department = adding one entry here + (when the backend provides
// data) wiring the data contract in departmentSupportApi.  No new components,
// no new routes, no new model code.
import { DEPARTMENTS } from '../../config/constants.js'

// Default priority bands — config-driven, disclosed on every priority card.
// When the backend ships an explicit priority classification it overrides
// these per department via the same config field.
export const DEFAULT_PRIORITY_BANDS = [
  { band: 'P1', label: 'Critical', min: 0.8 },
  { band: 'P2', label: 'High', min: 0.6 },
  { band: 'P3', label: 'Medium', min: 0.4 },
  { band: 'P4', label: 'Low', min: 0 },
]

// Default priority components — weights are configuration, disclosed in the
// explainable-priority UI.  A component whose data source is absent is
// excluded from the score (and shown as "no data"), never zeroed silently.
export const DEFAULT_PRIORITY_COMPONENTS = [
  { key: 'gap', label: 'Coverage gap', weight: 0.35, source: 'entity.gapScore (Phase 1 facility coverage-isolation heuristic)' },
  { key: 'exposure', label: 'Hazard exposure', weight: 0.25, source: 'point-in-polygon against real hazard layers' },
  { key: 'burden', label: 'Population burden', weight: 0.25, source: 'nearest census block population (Rural_population / Urban_population)' },
  { key: 'tier', label: 'Entity type', weight: 0.15, source: 'entity category weight from this config' },
]

const make = (overrides) => ({ ...overrides })

export const DEPARTMENT_CONFIGS = {
  // -------------------------------------------------------------------------
  // HEALTH — example 1
  // -------------------------------------------------------------------------
  health: make({
    departmentId: 'health',
    departmentName: 'Health Department',
    description: 'Public health service delivery — facilities, coverage, referral capacity and service telemetry.',
    terminology: { entity: 'Health facility', entities: 'Health facilities', location: 'Block / village' },
    serviceDistanceKm: 5,
    entityGroups: [
      { id: 'hospital', label: 'Hospitals', source: 'facility-category', match: '^hospital$', tier: 4 },
      { id: 'phc', label: 'Primary Health Centres', source: 'facility-category', match: '^primary health', tier: 3 },
      { id: 'chc', label: 'Community Health Centres', source: 'facility-category', match: '^community health', tier: 3 },
      { id: 'dispensary', label: 'Dispensaries', source: 'facility-category', match: '^dispensary', tier: 2 },
      { id: 'blood_bank', label: 'Blood Banks', source: 'facility-category', match: '^blood bank', tier: 2 },
      { id: 'veterinary', label: 'Veterinary Hospitals', source: 'facility-category', match: '^veterinary', tier: 1 },
    ],
    hazardLayers: ['Flood_hazard', 'Earthquake', 'Wind_Hazard'],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Urban_population', label: 'Urban population', role: 'population' },
      { layerName: 'Other_Roads', label: 'Roads', role: 'roads' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
    ],
    indicators: [
      { key: 'doctors', label: 'Doctors', attributeFields: ['doctor_count', 'medical_officer_count', 'doctors'] },
      { key: 'nurses', label: 'Nurses', attributeFields: ['staff_nurse_count', 'nurse_count', 'nurses'] },
      { key: 'lab_technicians', label: 'Lab technicians', attributeFields: ['lab_technician_count', 'lab_technicians'] },
      { key: 'asha', label: 'ASHA', attributeFields: ['asha_count', 'asha'] },
      { key: 'anm', label: 'ANM', attributeFields: ['anm_count', 'anm'] },
      { key: 'beds', label: 'Beds', attributeFields: ['bed_count', 'beds'] },
      { key: 'icu', label: 'ICU beds', attributeFields: ['icu_beds', 'icu_count'] },
      { key: 'nicu', label: 'NICU beds', attributeFields: ['nicu_beds', 'nicu_count'] },
      { key: 'oxygen', label: 'Oxygen', attributeFields: ['oxygen_plant_kw', 'oxygen_cylinders', 'oxygen'] },
      { key: 'toilets', label: 'Toilets', attributeFields: ['toilet_count', 'toilets'] },
      { key: 'ramps', label: 'Ramps', attributeFields: ['ramp_count', 'has_ramp', 'ramps'] },
      { key: 'cold_chain', label: 'Cold chain', attributeFields: ['cold_chain_status', 'vaccine_cold_chain'] },
    ],
    kpis: [
      { key: 'entity-count', label: 'Health facilities', kind: 'entity-count' },
      { key: 'coverage-pct', label: 'Population within 5 km', kind: 'coverage-pct' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Facilities reporting attributes', kind: 'reporting-pct' },
      { key: 'hr', label: 'HR sanctioned / available', kind: 'telemetry', source: 'GET /api/health/human-resources/' },
      { key: 'medicines', label: 'Critical medicine stock', kind: 'telemetry', source: 'GET /api/medicines/' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Service coverage gap', kind: 'coverage', description: 'Census population without a health facility within the service distance.' },
      { key: 'accessibility', label: 'Accessibility gap', kind: 'accessibility', description: 'Blocks with poor road accessibility (distance to nearest road).' },
      { key: 'infrastructure', label: 'Infrastructure gap', kind: 'infrastructure', indicatorKeys: ['beds', 'icu', 'nicu', 'oxygen', 'toilets', 'ramps', 'cold_chain'], source: 'facility attributes (bed_count, icu_beds, nicu_beds, oxygen_plant_kw, toilet_count, ramp_count, cold_chain_status)' },
      { key: 'staffing', label: 'HR gap', kind: 'staffing', indicatorKeys: ['doctors', 'nurses', 'lab_technicians', 'asha', 'anm'], source: 'GET /api/health/human-resources/ or facility attributes (doctor_count, staff_nurse_count, anm_count, asha_count, lab_technician_count)' },
      { key: 'service', label: 'Workload / burden gap', kind: 'service', indicatorKeys: [], source: 'GET /api/health/workload/ (patient_visits, admissions, referrals)' },
    ],
    dataEndpoints: [
      { label: 'Human resources', endpoint: '/health/human-resources/' },
      { label: 'Health telemetry', endpoint: '/health/telemetry/' },
      { label: 'Ambulances', endpoint: '/ambulances/' },
      { label: 'Vaccinations', endpoint: '/vaccinations/' },
      { label: 'Medicines', endpoint: '/medicines/' },
      { label: 'Disease surveillance', endpoint: '/disease-surveillance/' },
    ],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'inspect', label: 'Schedule field inspection', appliesTo: 'priority' },
      { key: 'escalate', label: 'Escalate to district administration', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'priorities', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),

  // -------------------------------------------------------------------------
  // EDUCATION — example 2
  // -------------------------------------------------------------------------
  education: make({
    departmentId: 'education',
    departmentName: 'School Education',
    description: 'School infrastructure and teacher coverage across the district.',
    terminology: { entity: 'Institution', entities: 'Institutions', location: 'Block / village' },
    serviceDistanceKm: 5,
    entityGroups: [
      { id: 'school', label: 'Schools', source: 'facility-category', match: '^school$', tier: 4 },
      { id: 'collage', label: 'Colleges', source: 'facility-category', match: '^collage', tier: 3 },
      { id: 'university', label: 'Universities', source: 'facility-category', match: '^university', tier: 3 },
    ],
    hazardLayers: [],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Urban_population', label: 'Urban population', role: 'population' },
      { layerName: 'Other_Roads', label: 'Roads', role: 'roads' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
    ],
    indicators: [
      { key: 'students', label: 'Students', attributeFields: ['student_count', 'students'] },
      { key: 'teachers', label: 'Teachers', attributeFields: ['teacher_count', 'teachers'] },
      { key: 'teacher_vacancies', label: 'Teacher vacancies', attributeFields: ['teacher_vacancy_count', 'teacher_vacancies'] },
      { key: 'classrooms', label: 'Classrooms', attributeFields: ['classroom_count', 'classrooms'] },
      { key: 'toilets', label: 'Toilets', attributeFields: ['toilet_count', 'toilets'] },
      { key: 'drinking_water', label: 'Drinking water', attributeFields: ['drinking_water', 'has_drinking_water'] },
      { key: 'electricity', label: 'Electricity', attributeFields: ['electricity', 'has_electricity'] },
    ],
    kpis: [
      { key: 'entity-count', label: 'Institutions', kind: 'entity-count' },
      { key: 'coverage-pct', label: 'Population within 5 km', kind: 'coverage-pct' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Institutions reporting attributes', kind: 'reporting-pct' },
      { key: 'student-teacher', label: 'Student-teacher ratio', kind: 'telemetry', source: 'school attributes (student_count, teacher_count) or GET /api/education/indicators/' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Service coverage gap', kind: 'coverage', description: 'Census population without an institution within the service distance.' },
      { key: 'accessibility', label: 'Accessibility gap', kind: 'accessibility', description: 'Blocks with poor road accessibility.' },
      { key: 'staffing', label: 'Teacher gap', kind: 'staffing', indicatorKeys: ['teachers', 'teacher_vacancies'], source: 'school attributes (teacher_count, teacher_vacancy_count) or GET /api/education/indicators/' },
      { key: 'infrastructure', label: 'Classroom & facility gap', kind: 'infrastructure', indicatorKeys: ['classrooms', 'toilets', 'drinking_water', 'electricity'], source: 'school attributes (classroom_count, toilet_count, drinking_water, electricity)' },
      { key: 'service', label: 'Student-service gap', kind: 'service', indicatorKeys: ['students'], source: 'school attributes (student_count) — derived ratio when teachers exist' },
    ],
    dataEndpoints: [
      { label: 'Education indicators', endpoint: '/education/indicators/' },
      { label: 'School telemetry', endpoint: '/education/schools/' },
    ],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'inspect', label: 'Schedule field inspection', appliesTo: 'priority' },
      { key: 'escalate', label: 'Escalate to district administration', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'priorities', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),

  // -------------------------------------------------------------------------
  // WATER RESOURCES — example 3
  // -------------------------------------------------------------------------
  water: make({
    departmentId: 'water',
    departmentName: 'Water Resources (JJM)',
    description: 'Water assets, coverage and functional status across the district.',
    terminology: { entity: 'Water asset', entities: 'Water assets', location: 'Block / village' },
    serviceDistanceKm: 3,
    entityGroups: [
      { id: 'tubewell', label: 'Tubewells', source: 'facility-category', match: '^tubewell', tier: 4 },
      { id: 'well', label: 'Wells', source: 'facility-category', match: '^well$', tier: 2 },
      { id: 'spring', label: 'Springs', source: 'facility-category', match: '^spring', tier: 1 },
      { id: 'waterbody', label: 'Water bodies', source: 'gis-layer', layerName: 'Waterbody', geometryType: 'Polygon', tier: 1 },
      { id: 'canal', label: 'Canals', source: 'gis-layer', layerName: 'Canal_poly', geometryType: 'Polygon', tier: 1 },
      { id: 'river', label: 'Rivers', source: 'gis-layer', layerName: 'River', geometryType: 'Polygon', tier: 1 },
      { id: 'groundwater', label: 'Groundwater potential', source: 'gis-layer', layerName: 'GroundWater_Potential', geometryType: 'Polygon', tier: 1 },
    ],
    hazardLayers: ['Flood_hazard'],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Urban_population', label: 'Urban population', role: 'population' },
      { layerName: 'Other_Roads', label: 'Roads', role: 'roads' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
    ],
    indicators: [
      { key: 'supply_status', label: 'Supply status', attributeFields: ['supply_status', 'status'] },
      { key: 'capacity', label: 'Capacity', attributeFields: ['capacity_litres', 'capacity', 'yield'] },
      { key: 'functional', label: 'Functional assets', attributeFields: ['functional', 'is_functional'] },
      { key: 'coverage', label: 'Coverage', attributeFields: ['coverage_pct', 'coverage'] },
    ],
    kpis: [
      { key: 'entity-count', label: 'Water assets', kind: 'entity-count' },
      { key: 'coverage-pct', label: 'Population within 3 km', kind: 'coverage-pct' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Assets reporting attributes', kind: 'reporting-pct' },
      { key: 'functional', label: 'Functional / non-functional', kind: 'telemetry', source: 'asset attributes (functional, supply_status) or GET /api/water/indicators/' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Coverage gap', kind: 'coverage', description: 'Census population without a water asset within the service distance.' },
      { key: 'accessibility', label: 'Accessibility gap', kind: 'accessibility', description: 'Blocks with poor road accessibility.' },
      { key: 'capacity', label: 'Capacity gap', kind: 'capacity', indicatorKeys: ['capacity'], source: 'asset attributes (capacity_litres, yield) or GET /api/water/indicators/' },
      { key: 'resource', label: 'Functional asset gap', kind: 'resource', indicatorKeys: ['functional', 'supply_status'], source: 'asset attributes (functional, supply_status) or GET /api/water/indicators/' },
    ],
    dataEndpoints: [
      { label: 'Water indicators', endpoint: '/water/indicators/' },
      { label: 'Water supply', endpoint: '/water/supply/' },
    ],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'inspect', label: 'Schedule field inspection', appliesTo: 'priority' },
      { key: 'escalate', label: 'Escalate to district administration', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'priorities', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),

  // -------------------------------------------------------------------------
  // URBAN DEVELOPMENT & INFRASTRUCTURE — example 4
  // -------------------------------------------------------------------------
  urban: make({
    departmentId: 'urban',
    departmentName: 'Urban Development & Infrastructure',
    description: 'Civic infrastructure, public assets and service coverage in urban areas.',
    terminology: { entity: 'Civic asset', entities: 'Civic assets', location: 'Ward / town' },
    serviceDistanceKm: 3,
    entityGroups: [
      { id: 'headquarters', label: 'Headquarters & offices', source: 'facility-category', match: '^headquarters', tier: 3 },
      { id: 'market', label: 'Markets', source: 'facility-category', match: '^market', tier: 2 },
      { id: 'police', label: 'Police stations', source: 'facility-category', match: '^policestation|police', tier: 3 },
      { id: 'postoffice', label: 'Post offices', source: 'facility-category', match: '^postoffice', tier: 2 },
      { id: 'circuit_house', label: 'Circuit houses', source: 'facility-category', match: '^circuit', tier: 2 },
      { id: 'bungalow', label: 'Inspection bungalows', source: 'facility-category', match: '^inspection', tier: 2 },
      { id: 'industry', label: 'Industries', source: 'facility-category', match: '^industry', tier: 1 },
    ],
    hazardLayers: [],
    contextLayers: [
      { layerName: 'Urban_population', label: 'Urban population', role: 'population' },
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Other_Roads', label: 'Roads', role: 'roads' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
    ],
    indicators: [
      { key: 'asset_condition', label: 'Asset condition', attributeFields: ['asset_condition', 'condition'] },
      { key: 'service_coverage', label: 'Service coverage', attributeFields: ['service_coverage_pct', 'coverage_pct', 'coverage'] },
      { key: 'population_served', label: 'Population served', attributeFields: ['population_served', 'population'] },
    ],
    kpis: [
      { key: 'entity-count', label: 'Civic assets', kind: 'entity-count' },
      { key: 'coverage-pct', label: 'Population within 3 km', kind: 'coverage-pct' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Assets reporting attributes', kind: 'reporting-pct' },
      { key: 'condition', label: 'Asset condition profile', kind: 'telemetry', source: 'asset attributes (asset_condition, condition) or GET /api/urban/indicators/' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Service coverage gap', kind: 'coverage', description: 'Census population without a civic asset within the service distance.' },
      { key: 'accessibility', label: 'Accessibility gap', kind: 'accessibility', description: 'Blocks with poor road accessibility.' },
      { key: 'infrastructure', label: 'Asset condition gap', kind: 'infrastructure', indicatorKeys: ['asset_condition'], source: 'asset attributes (asset_condition, condition)' },
      { key: 'service', label: 'Service coverage gap', kind: 'service', indicatorKeys: ['service_coverage', 'population_served'], source: 'asset attributes (service_coverage_pct, population_served)' },
    ],
    dataEndpoints: [
      { label: 'Urban indicators', endpoint: '/urban/indicators/' },
    ],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'inspect', label: 'Schedule field inspection', appliesTo: 'priority' },
      { key: 'escalate', label: 'Escalate to district administration', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'priorities', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),

  // -------------------------------------------------------------------------
  // PUBLIC WORKS & TRANSPORT — example 5
  // -------------------------------------------------------------------------
  pwd: make({
    departmentId: 'pwd',
    departmentName: 'Public Works & Transport',
    description: 'Road network, connectivity and transport infrastructure.',
    terminology: { entity: 'Network asset', entities: 'Network assets', location: 'Block / corridor' },
    serviceDistanceKm: 10,
    entityGroups: [
      { id: 'other_roads', label: 'Other roads', source: 'gis-layer', layerName: 'Other_Roads', geometryType: 'LineString', tier: 1 },
      { id: 'state_highway', label: 'State highways', source: 'gis-layer', layerName: 'State_Highway', geometryType: 'MultiLineString', tier: 4 },
      { id: 'national_highway', label: 'National highways', source: 'gis-layer', layerName: 'National_Highway', geometryType: 'LineString', tier: 4 },
      { id: 'railway', label: 'Railway lines', source: 'gis-layer', layerName: 'Railway_line', geometryType: 'LineString', tier: 3 },
      { id: 'railway_station', label: 'Railway stations', source: 'facility-category', match: '^railway station', tier: 3 },
    ],
    hazardLayers: ['Flood_hazard', 'Earthquake', 'Wind_Hazard'],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Urban_population', label: 'Urban population', role: 'population' },
      { layerName: 'Other_Roads', label: 'Roads', role: 'roads' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
    ],
    indicators: [
      { key: 'road_condition', label: 'Road condition', attributeFields: ['road_condition', 'condition', 'surface_type'] },
      { key: 'bridge_condition', label: 'Bridge condition', attributeFields: ['bridge_condition', 'bridge_status'] },
      { key: 'connectivity', label: 'Connectivity', attributeFields: ['connectivity', 'is_connected'] },
    ],
    kpis: [
      { key: 'entity-count', label: 'Road network features', kind: 'entity-count' },
      { key: 'coverage-pct', label: 'Population within 10 km of highway/rail', kind: 'coverage-pct' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Features reporting attributes', kind: 'reporting-pct' },
      { key: 'condition', label: 'Road condition profile', kind: 'telemetry', source: 'road attributes (road_condition, surface_type) or GET /api/pwd/indicators/' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Connectivity gap', kind: 'coverage', description: 'Census population without highway or rail within the service distance.' },
      { key: 'accessibility', label: 'Accessibility gap', kind: 'accessibility', description: 'Blocks with poor road accessibility.' },
      { key: 'infrastructure', label: 'Road condition gap', kind: 'infrastructure', indicatorKeys: ['road_condition', 'bridge_condition'], source: 'road attributes (road_condition, surface_type, bridge_condition)' },
      { key: 'service', label: 'Connectivity gap', kind: 'service', indicatorKeys: ['connectivity'], source: 'road attributes (connectivity, is_connected)' },
    ],
    dataEndpoints: [
      { label: 'PWD indicators', endpoint: '/pwd/indicators/' },
      { label: 'Road telemetry', endpoint: '/roads/' },
    ],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'inspect', label: 'Schedule field inspection', appliesTo: 'priority' },
      { key: 'escalate', label: 'Escalate to district administration', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'priorities', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),

  // -------------------------------------------------------------------------
  // ELECTRICITY / ENERGY — no dedicated catalog layers; telemetry-driven
  // -------------------------------------------------------------------------
  electricity: make({
    departmentId: 'electricity',
    departmentName: 'Electricity Board',
    description: 'Power infrastructure and supply reliability.',
    terminology: { entity: 'Power asset', entities: 'Power assets', location: 'Block / feeder' },
    serviceDistanceKm: 5,
    entityGroups: [],
    hazardLayers: [],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Urban_population', label: 'Urban population', role: 'population' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
    ],
    indicators: [
      { key: 'transformer_capacity', label: 'Transformer capacity', attributeFields: ['capacity_kva', 'capacity'] },
      { key: 'operational', label: 'Operational status', attributeFields: ['operational_status', 'status'] },
    ],
    kpis: [
      { key: 'entity-count', label: 'Power assets', kind: 'entity-count', source: 'GIS catalog has no power layer — count unavailable' },
      { key: 'coverage-pct', label: 'Population coverage', kind: 'telemetry', source: 'GET /api/electricity/indicators/' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Assets reporting attributes', kind: 'reporting-pct' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Supply coverage gap', kind: 'coverage', description: 'Unavailable — no power layer in the GIS catalog.' },
      { key: 'resource', label: 'Capacity gap', kind: 'resource', indicatorKeys: ['transformer_capacity', 'operational'], source: 'asset attributes (capacity_kva, operational_status) or GET /api/electricity/indicators/' },
    ],
    dataEndpoints: [
      { label: 'Electricity indicators', endpoint: '/electricity/indicators/' },
      { label: 'Transformers', endpoint: '/transformers/' },
    ],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'inspect', label: 'Schedule field inspection', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),

  // -------------------------------------------------------------------------
  // SOLAR — no dedicated catalog layers; telemetry-driven
  // -------------------------------------------------------------------------
  solar: make({
    departmentId: 'solar',
    departmentName: 'Solar & Renewable Energy',
    description: 'Solar assets, capacity and operational status.',
    terminology: { entity: 'Solar asset', entities: 'Solar assets', location: 'Block / village' },
    serviceDistanceKm: 5,
    entityGroups: [],
    hazardLayers: [],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Urban_population', label: 'Urban population', role: 'population' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
    ],
    indicators: [
      { key: 'capacity', label: 'Capacity', attributeFields: ['capacity_kw', 'capacity'] },
      { key: 'operational', label: 'Operational status', attributeFields: ['operational_status', 'status'] },
      { key: 'coverage', label: 'Coverage', attributeFields: ['coverage_pct', 'coverage'] },
    ],
    kpis: [
      { key: 'entity-count', label: 'Solar assets', kind: 'entity-count', source: 'GIS catalog has no solar layer — count unavailable' },
      { key: 'coverage-pct', label: 'Population coverage', kind: 'telemetry', source: 'GET /api/solar/plants/' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Assets reporting attributes', kind: 'reporting-pct' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Coverage gap', kind: 'coverage', description: 'Unavailable — no solar layer in the GIS catalog.' },
      { key: 'capacity', label: 'Capacity gap', kind: 'capacity', indicatorKeys: ['capacity', 'operational'], source: 'asset attributes (capacity_kw, operational_status) or GET /api/solar/plants/' },
    ],
    dataEndpoints: [
      { label: 'Solar plants', endpoint: '/solar/plants/' },
    ],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'inspect', label: 'Schedule field inspection', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),

  // -------------------------------------------------------------------------
  // TOURISM & HERITAGE — real point layers exist
  // -------------------------------------------------------------------------
  tourism: make({
    departmentId: 'tourism',
    departmentName: 'Tourism & Heritage',
    description: 'Heritage and tourism assets across the district.',
    terminology: { entity: 'Heritage asset', entities: 'Heritage assets', location: 'Block / site' },
    serviceDistanceKm: 10,
    entityGroups: [
      { id: 'tourist', label: 'Tourist interest sites', source: 'facility-category', match: 'places of tourist', tier: 4 },
      { id: 'temple', label: 'Temples', source: 'facility-category', match: '^temple', tier: 2 },
      { id: 'mosque', label: 'Mosques', source: 'facility-category', match: '^mosque', tier: 2 },
      { id: 'church', label: 'Churches', source: 'facility-category', match: '^church', tier: 2 },
    ],
    hazardLayers: ['Flood_hazard', 'Earthquake', 'Wind_Hazard'],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Other_Roads', label: 'Roads', role: 'roads' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
    ],
    indicators: [
      { key: 'visitors', label: 'Visitors', attributeFields: ['visitor_count', 'visitors'] },
      { key: 'conservation', label: 'Conservation status', attributeFields: ['conservation_status', 'status'] },
    ],
    kpis: [
      { key: 'entity-count', label: 'Heritage assets', kind: 'entity-count' },
      { key: 'coverage-pct', label: 'Population within 10 km', kind: 'coverage-pct' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Assets reporting attributes', kind: 'reporting-pct' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Access gap', kind: 'coverage', description: 'Census population without a heritage asset within the service distance.' },
      { key: 'accessibility', label: 'Accessibility gap', kind: 'accessibility', description: 'Blocks with poor road accessibility.' },
      { key: 'resource', label: 'Conservation gap', kind: 'resource', indicatorKeys: ['conservation', 'visitors'], source: 'site attributes (conservation_status, visitor_count)' },
    ],
    dataEndpoints: [
      { label: 'Tourism indicators', endpoint: '/tourism/indicators/' },
    ],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'inspect', label: 'Schedule field inspection', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'priorities', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),

  // -------------------------------------------------------------------------
  // FOREST & ENVIRONMENT — no forest layer in the catalog; land-use + hazards
  // -------------------------------------------------------------------------
  forest: make({
    departmentId: 'forest',
    departmentName: 'Forest & Environment',
    description: 'Land cover, environmental risk and vulnerability.',
    terminology: { entity: 'Land unit', entities: 'Land units', location: 'Block / beat' },
    serviceDistanceKm: 10,
    entityGroups: [
      { id: 'landuse', label: 'Land use units', source: 'gis-layer', layerName: 'Landuse_NALANDA_NRSC', geometryType: 'MultiPolygon', tier: 1 },
      { id: 'slope', label: 'Slope zones', source: 'gis-layer', layerName: 'Slope', geometryType: 'Polygon', tier: 1 },
      { id: 'soil', label: 'Soil zones', source: 'gis-layer', layerName: 'Soil', geometryType: 'Polygon', tier: 1 },
    ],
    hazardLayers: ['Flood_hazard', 'Earthquake', 'Wind_Hazard', 'Rainfall_Zone'],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
      { layerName: 'Other_Roads', label: 'Roads', role: 'roads' },
    ],
    indicators: [
      { key: 'forest_area', label: 'Forest area', attributeFields: ['forest_area_ha', 'forest_area', 'area_ha'] },
      { key: 'incidents', label: 'Incidents', attributeFields: ['incident_count', 'incidents'] },
      { key: 'coverage', label: 'Coverage', attributeFields: ['coverage_pct', 'coverage'] },
    ],
    kpis: [
      { key: 'entity-count', label: 'Land units', kind: 'entity-count' },
      { key: 'coverage-pct', label: 'Population within 10 km', kind: 'coverage-pct' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Units reporting attributes', kind: 'reporting-pct' },
      { key: 'forest', label: 'Forest cover', kind: 'telemetry', source: 'GET /api/forest/ — no forest layer in the GIS catalog' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Coverage gap', kind: 'coverage', description: 'Census population without a land unit within the service distance.' },
      { key: 'accessibility', label: 'Accessibility gap', kind: 'accessibility', description: 'Blocks with poor road accessibility.' },
      { key: 'resource', label: 'Environmental asset gap', kind: 'resource', indicatorKeys: ['forest_area', 'incidents', 'coverage'], source: 'GET /api/forest/ (forest_area_ha, incident_count, coverage_pct)' },
    ],
    dataEndpoints: [
      { label: 'Forest telemetry', endpoint: '/forest/' },
      { label: 'Environment indicators', endpoint: '/environment/indicators/' },
    ],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'inspect', label: 'Schedule field inspection', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'priorities', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),

  // -------------------------------------------------------------------------
  // REVENUE & ADMINISTRATION
  // -------------------------------------------------------------------------
  revenue: make({
    departmentId: 'revenue',
    departmentName: 'Revenue & Administration',
    description: 'Administrative presence and service coverage.',
    terminology: { entity: 'Office', entities: 'Offices', location: 'Block / circle' },
    serviceDistanceKm: 10,
    entityGroups: [
      { id: 'headquarters', label: 'Headquarters & offices', source: 'facility-category', match: '^headquarters', tier: 4 },
      { id: 'rfpf', label: 'Revenue / forest boundaries', source: 'gis-layer', layerName: 'RF_PF_boundary', geometryType: 'LineString', tier: 1 },
    ],
    hazardLayers: ['Flood_hazard'],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Urban_population', label: 'Urban population', role: 'population' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
      { layerName: 'Other_Roads', label: 'Roads', role: 'roads' },
    ],
    indicators: [
      { key: 'pending_cases', label: 'Pending cases', attributeFields: ['pending_cases', 'case_count'] },
      { key: 'service_burden', label: 'Service burden', attributeFields: ['service_burden', 'population_served'] },
    ],
    kpis: [
      { key: 'entity-count', label: 'Offices', kind: 'entity-count' },
      { key: 'coverage-pct', label: 'Population within 10 km', kind: 'coverage-pct' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Offices reporting attributes', kind: 'reporting-pct' },
      { key: 'cases', label: 'Pending service cases', kind: 'telemetry', source: 'GET /api/revenue/cases/' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Service coverage gap', kind: 'coverage', description: 'Census population without an office within the service distance.' },
      { key: 'accessibility', label: 'Accessibility gap', kind: 'accessibility', description: 'Blocks with poor road accessibility.' },
      { key: 'service', label: 'Service burden gap', kind: 'service', indicatorKeys: ['pending_cases', 'service_burden'], source: 'office attributes (pending_cases, service_burden) or GET /api/revenue/cases/' },
    ],
    dataEndpoints: [
      { label: 'Revenue cases', endpoint: '/revenue/cases/' },
    ],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'inspect', label: 'Schedule field inspection', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'priorities', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),

  // -------------------------------------------------------------------------
  // GENERAL / DISTRICT ADMINISTRATION — district-wide oversight workspace
  // -------------------------------------------------------------------------
  general: make({
    departmentId: 'general',
    departmentName: 'District Administration',
    description: 'District-wide oversight across all departmental workspaces.',
    terminology: { entity: 'Serving point', entities: 'Serving points', location: 'Block / village' },
    serviceDistanceKm: 5,
    entityGroups: [
      { id: 'headquarters', label: 'Headquarters & offices', source: 'facility-category', match: '^headquarters', tier: 4 },
      { id: 'police', label: 'Police stations', source: 'facility-category', match: '^policestation|police', tier: 3 },
      { id: 'postoffice', label: 'Post offices', source: 'facility-category', match: '^postoffice', tier: 2 },
      { id: 'bank', label: 'Banks', source: 'facility-category', match: '^bank', tier: 3 },
      { id: 'block', label: 'Block boundaries', source: 'gis-layer', layerName: 'Block_boundary', geometryType: 'Polygon', tier: 1 },
    ],
    hazardLayers: ['Flood_hazard', 'Earthquake', 'Wind_Hazard', 'Rainfall_Zone'],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population' },
      { layerName: 'Urban_population', label: 'Urban population', role: 'population' },
      { layerName: 'Other_Roads', label: 'Roads', role: 'roads' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' },
      { layerName: 'District_boundary', label: 'District boundary', role: 'boundary' },
    ],
    indicators: [],
    kpis: [
      { key: 'entity-count', label: 'Serving points', kind: 'entity-count' },
      { key: 'coverage-pct', label: 'Population within 5 km', kind: 'coverage-pct' },
      { key: 'high-priority', label: 'Critical / high priority', kind: 'high-priority' },
      { key: 'reporting-pct', label: 'Points reporting attributes', kind: 'reporting-pct' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Service coverage gap', kind: 'coverage', description: 'Census population without a serving point within the service distance.' },
      { key: 'accessibility', label: 'Accessibility gap', kind: 'accessibility', description: 'Blocks with poor road accessibility.' },
    ],
    dataEndpoints: [],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [
      { key: 'propose', label: 'Propose intervention / DPR', appliesTo: 'priority' },
      { key: 'escalate', label: 'Escalate to district administration', appliesTo: 'priority' },
    ],
    sections: ['situation', 'map', 'priorities', 'gaps', 'resources', 'citizen', 'projects', 'actions'],
  }),
}

// Default template for any department the registry does not define.  The
// workspace renders it honestly (zero entities, every indicator unavailable
// with its dependency) — this is the EXTENSIBILITY guarantee: a department
// added here without any other code change gets a fully rendered workspace.
export function defaultDepartmentConfig(departmentId) {
  const known = DEPARTMENTS.find((d) => String(d.id) === String(departmentId))
  return make({
    departmentId: String(departmentId),
    departmentName: known?.label || 'New Department',
    description: 'Department decision support workspace. Configure departmentConfigs.js to define entities, indicators, KPIs and data contracts.',
    terminology: { entity: 'Entity', entities: 'Entities', location: 'Block / village' },
    serviceDistanceKm: 5,
    entityGroups: [],
    hazardLayers: [],
    contextLayers: [
      { layerName: 'Rural_population', label: 'Rural population', role: 'population'},
      { layerName: 'Urban_population', label: 'Urban population', role: 'population' },
      { layerName: 'Block_boundary', label: 'Block boundary', role: 'boundary' }, 
    ],
    indicators: [],
    kpis: [
      { key: 'entity-count', label: 'Entities', kind: 'entity-count', source: 'no entity groups configured' },
      { key: 'coverage-pct', label: 'Population coverage', kind: 'coverage-pct' },
      { key: 'reporting-pct', label: 'Entities reporting attributes', kind: 'reporting-pct' },
    ],
    gapDimensions: [
      { key: 'coverage', label: 'Coverage gap', kind: 'coverage', description: 'Not computable — no entity groups configured.' },
    ],
    dataEndpoints: [],
    priority: { components: DEFAULT_PRIORITY_COMPONENTS, bands: DEFAULT_PRIORITY_BANDS },
    actions: [],
    sections: ['situation', 'map', 'gaps', 'citizen', 'projects'],
  })
}

// Registry resolution with fallback — the ONLY entry point components use.
export function getDepartmentConfig(departmentId) {
  return DEPARTMENT_CONFIGS[String(departmentId)] || defaultDepartmentConfig(departmentId)
}

// District-wide oversight role set: these roles see every department's
// workspace.  Department-bound roles (dept_head, dept_officer, supervisor,
// engineer, field_inspector) see only their own department.
export const DISTRICT_OVERSIGHT_ROLES = new Set([
  'district_collector', 'dm', 'adm', 'system_admin', 'state_admin', 'state_super_admin', 'state_dept_admin', 'state_monitoring_officer',
])

export function canAccessDepartment(user = {}, departmentId = '') {
  if (!user || typeof user !== 'object') return false
  if (DISTRICT_OVERSIGHT_ROLES.has(user.role)) return true
  if (user.departmentId) return String(user.departmentId) === String(departmentId)
  if (user.department) return String(user.department) === String(departmentId)
  return false
}

// Department pickers — admin sees all registered configs; a department user
// sees only their own workspace (RBAC enforced by canAccessDepartment).
export function accessibleDepartmentConfigs(user = {}) {
  const ids = Object.keys(DEPARTMENT_CONFIGS)
  if (DISTRICT_OVERSIGHT_ROLES.has(user.role)) return ids.map(getDepartmentConfig)
  return ids.filter((id) => canAccessDepartment(user, id)).map(getDepartmentConfig)
}

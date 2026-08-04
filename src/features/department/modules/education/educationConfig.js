// School Education Reference Configuration (LLD Vol 3 §16.1 & Part 12 Requirements)

export const EDUCATION_CONFIG = {
  id: 'education',
  code: 'EDUC',
  label: 'School Education',
  tagline: 'Elementary, Secondary & Digital Education Infrastructure',
  color: '#1f7a54',
  accent: 'leaf',
  icon: 'GraduationCap',
  custodian: 'District Education Officer (DEO) Office, Nalanda',

  // Asset Types & Schemas
  assetTypes: [
    {
      id: 'high_school',
      label: 'Government High School (GHS)',
      radiusKm: 10,
      icon: 'Building2',
      attributeFields: ['student_count', 'classroom_count', 'has_drinking_water', 'has_girl_toilets', 'has_smart_class', 'teacher_count'],
    },
    {
      id: 'middle_school',
      label: 'Government Middle School (GMS)',
      radiusKm: 5,
      icon: 'Building',
      attributeFields: ['student_count', 'classroom_count', 'has_drinking_water', 'has_girl_toilets', 'teacher_count'],
    },
    {
      id: 'primary_school',
      label: 'Government Primary School (GPS)',
      radiusKm: 3,
      icon: 'Home',
      attributeFields: ['student_count', 'has_midday_meal', 'teacher_count', 'building_condition'],
    },
    {
      id: 'digital_library',
      label: 'Subdivision Digital Library',
      radiusKm: 15,
      icon: 'BookOpen',
      attributeFields: ['computer_count', 'active_subscribers', 'internet_speed_mbps', 'librarian_name'],
    },
  ],

  // Specific Complaint Categories for Education
  complaintCategories: [
    { id: 'school_infrastructure', name: 'School Building / Roof Structure Leakage', defaultPriority: 'high', slaHours: 24 },
    { id: 'midday_meal_issue', name: 'Midday Meal Quality / Delivery Defect', defaultPriority: 'urgent', slaHours: 6 },
    { id: 'toilet_dysfunctional', name: 'Girls / Boys Toilet Dysfunctional', defaultPriority: 'high', slaHours: 12 },
    { id: 'teacher_absenteeism', name: 'Teacher Absenteeism / Staff Deficit', defaultPriority: 'medium', slaHours: 48 },
  ],

  // Default Dashboard Widgets Configuration
  dashboardWidgets: [
    { id: 'kpi_strip', type: 'kpis', title: 'School Infrastructure KPIs', span: 12 },
    { id: 'toilet_hygiene_index', type: 'toilet_hygiene', title: 'School Functional Toilet & Water Telemetry', span: 6 },
    { id: 'digital_learning_stats', type: 'digital_learning', title: 'Smart Classroom Enrollment & Connectivity Logs', span: 6 },
    { id: 'critical_complaints_queue', type: 'complaint_queue', title: 'Active School Grievances Queue', span: 8 },
    { id: 'education_gis_map', type: 'gis_mini_map', title: 'Nalanda Government School Spatial Layers', span: 4 },
  ],

  // Analytics Metrics
  analyticsMetrics: {
    targetSlaPct: 88,
    girlToiletFunctionalPct: 94.5,
    studentTeacherRatio: 32.1,
    smartClassroomCoveragePct: 41.2,
  },

  // Document Categories
  documentCategories: [
    'Samagra Shiksha Audit Reports',
    'Midday Meal Hygiene Certs',
    'School Building Fitness Reports',
    'ICT Lab Assets Inventory',
    'DEO Directives & Circulars',
  ],

  // Sample Reference Assets for Education
  sampleAssets: [
    {
      id: 'EDU-AST-101',
      name: 'Government High School Rajgir',
      type: 'high_school',
      typeLabel: 'Government High School',
      village: 'Rajgir',
      block: 'Silao',
      position: [85.4211, 25.0294],
      status: 'active',
      attributes: {
        student_count: 520,
        classroom_count: 14,
        has_drinking_water: true,
        has_girl_toilets: true,
        has_smart_class: true,
        teacher_count: 18,
      },
      lastInspected: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    },
    {
      id: 'EDU-AST-102',
      name: 'Government Girls Middle School Silao',
      type: 'middle_school',
      typeLabel: 'Government Middle School',
      village: 'Silao Bazar',
      block: 'Silao',
      position: [85.4434, 25.1372],
      status: 'active',
      attributes: {
        student_count: 310,
        classroom_count: 8,
        has_drinking_water: true,
        has_girl_toilets: true,
        teacher_count: 9,
      },
      lastInspected: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    },
  ],
}

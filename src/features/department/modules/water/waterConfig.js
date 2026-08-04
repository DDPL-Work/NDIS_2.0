// Water & Sanitation (JJM) Reference Configuration (LLD Vol 3 §16.1 & Part 12 Requirements)

export const WATER_CONFIG = {
  id: 'water',
  code: 'WATR',
  label: 'Water & Sanitation (JJM)',
  tagline: 'Piped Water Supply, Over Head Tanks & Water Quality Telemetry',
  color: '#1d7ab5',
  accent: 'sky',
  icon: 'Droplets',
  custodian: 'Executive Engineer Office, PHED, Nalanda',

  // Asset Types & Schemas
  assetTypes: [
    {
      id: 'water_treatment_plant',
      label: 'Water Treatment Plant (WTP)',
      radiusKm: 25,
      icon: 'Factory',
      attributeFields: ['capacity_mld', 'chlorination_status', 'turbidity_ntu', 'power_backup_status', 'operator_name'],
    },
    {
      id: 'elevated_reservoir',
      label: 'Elevated Service Reservoir (OHT / Tank)',
      radiusKm: 5,
      icon: 'Container',
      attributeFields: ['capacity_litres', 'water_level_pct', 'structural_integrity', 'last_cleaned_date'],
    },
    {
      id: 'distribution_pipeline',
      label: 'JJM Distribution Pipeline Net',
      radiusKm: 12,
      icon: 'GitCommit',
      attributeFields: ['length_km', 'material_type', 'average_pressure_bar', 'leakage_points_detected'],
    },
    {
      id: 'hand_pump',
      label: 'Government Hand Pump / Borewell',
      radiusKm: 2,
      icon: 'MapPin',
      attributeFields: ['depth_feet', 'static_water_level', 'fluoride_content_ppm', 'working_status'],
    },
  ],

  // Specific Complaint Categories for Water
  complaintCategories: [
    { id: 'water_leakage', name: 'JJM Pipeline Burst / Main Leakage', defaultPriority: 'urgent', slaHours: 12 },
    { id: 'broken_handpump', name: 'Broken Hand Pump / Borewell Defect', defaultPriority: 'high', slaHours: 24 },
    { id: 'water_contamination', name: 'Contaminated / Muddy Water Supply', defaultPriority: 'high', slaHours: 12 },
    { id: 'no_water_supply', name: 'Complete Supply Disruption in Village', defaultPriority: 'urgent', slaHours: 8 },
  ],

  // Default Dashboard Widgets Configuration
  dashboardWidgets: [
    { id: 'kpi_strip', type: 'kpis', title: 'Water Infrastructure KPIs', span: 12 },
    { id: 'reservoir_levels', type: 'reservoir_levels', title: 'District OHT Water Levels & Pressure Telemetry', span: 6 },
    { id: 'wtp_capacity_utilization', type: 'wtp_capacity', title: 'WTP Daily Flow Rate & Chlorination Logs', span: 6 },
    { id: 'critical_complaints_queue', type: 'complaint_queue', title: 'Active Water Complaints Queue', span: 8 },
    { id: 'water_gis_map', type: 'gis_mini_map', title: 'Nalanda JJM Asset Map Layer', span: 4 },
  ],

  // Analytics Metrics
  analyticsMetrics: {
    targetSlaPct: 92,
    waterQualityPassPct: 97.2,
    avgRepairTimeHours: 16.5,
    dailyWaterDispatchedMld: 42.6,
  },

  // Document Categories
  documentCategories: [
    'Detailed Project Report (DPR)',
    'Water Quality Lab Reports',
    'Bill of Quantities (BOQ)',
    'Pipeline Layout Drawings',
    'OHT Structural Certificates',
  ],

  // Sample Reference Assets for Water
  sampleAssets: [
    {
      id: 'WTR-AST-101',
      name: 'Silao Central Water Treatment Plant',
      type: 'water_treatment_plant',
      typeLabel: 'Water Treatment Plant',
      village: 'Silao Bazar',
      block: 'Silao',
      position: [85.4434, 25.1372],
      status: 'active',
      attributes: {
        capacity_mld: 15,
        chlorination_status: 'Optimal (2.1 ppm)',
        turbidity_ntu: 1.4,
        power_backup_status: 'Active (125kVA Generator)',
        operator_name: 'Dinesh Yadav',
      },
      lastInspected: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'WTR-AST-102',
      name: 'Surajpur Elevated Reservoir (OHT-2)',
      type: 'elevated_reservoir',
      typeLabel: 'Elevated Reservoir',
      village: 'Surajpur',
      block: 'Silao',
      position: [85.4312, 25.0811],
      status: 'active',
      attributes: {
        capacity_litres: 100000,
        water_level_pct: 84,
        structural_integrity: 'Certified Safe',
        last_cleaned_date: '2026-06-15',
      },
      lastInspected: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  ],
}

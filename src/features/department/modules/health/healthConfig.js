// Health Department Reference Configuration (LLD Vol 3 §16.1 & Part 12 Requirements)

export const HEALTH_CONFIG = {
  id: 'health',
  code: 'HLTH',
  label: 'Health Department',
  tagline: 'Healthcare Infrastructure, Emergency Medical Services & Public Health Telemetry',
  color: '#c0392b',
  accent: 'alert',
  icon: 'HeartPulse',
  custodian: 'Civil Surgeon Office, District Health Society, Nalanda',

  // Asset Types & Schemas
  assetTypes: [
    {
      id: 'district_hospital',
      label: 'District Hospital / Sadar Hospital',
      radiusKm: 15,
      icon: 'Building2',
      attributeFields: ['bed_count', 'icu_beds', 'ventilator_count', 'has_emergency', 'has_blood_bank', 'doctor_count', 'oxygen_plant_kw'],
    },
    {
      id: 'chc',
      label: 'Community Health Centre (CHC)',
      radiusKm: 8,
      icon: 'Building',
      attributeFields: ['bed_count', 'has_emergency', 'has_maternity', 'doctor_count', 'ambulance_count'],
    },
    {
      id: 'phc',
      label: 'Primary Health Centre (PHC)',
      radiusKm: 3,
      icon: 'Heart',
      attributeFields: ['bed_count', 'doctor_count', 'staff_nurse_count', 'cold_chain_status'],
    },
    {
      id: 'subcentre',
      label: 'Health Subcentre / Ayushman Arogya Mandir',
      radiusKm: 3,
      icon: 'Activity',
      attributeFields: ['anm_count', 'asha_count', 'vaccine_stock_status'],
    },
    {
      id: 'ambulance',
      label: '102 / 108 Emergency Ambulance Station',
      radiusKm: 10,
      icon: 'Truck',
      attributeFields: ['vehicle_reg', 'gps_tracker_id', 'driver_name', 'driver_phone', 'status'],
    },
    {
      id: 'blood_bank',
      label: 'District Blood Bank & Storage Unit',
      radiusKm: 20,
      icon: 'Droplet',
      attributeFields: ['o_pos_units', 'a_pos_units', 'b_pos_units', 'ab_pos_units', 'refrigeration_temp_c'],
    },
  ],

  // Specific Complaint Categories for Health
  complaintCategories: [
    { id: 'oxygen_supply_failure', name: 'Oxygen Plant / Cylinder Supply Defect', defaultPriority: 'urgent', slaHours: 6 },
    { id: 'ambulance_delay', name: 'Ambulance Non-Availability / Delayed Dispatch', defaultPriority: 'urgent', slaHours: 4 },
    { id: 'doctor_absenteeism', name: 'Doctor / Medical Staff Absenteeism', defaultPriority: 'high', slaHours: 12 },
    { id: 'vaccine_cold_chain_break', name: 'Vaccine Cold-Chain Temperature Failure', defaultPriority: 'high', slaHours: 12 },
    { id: 'medicine_stockout', name: 'Essential Drug Stockout at PHC', defaultPriority: 'medium', slaHours: 24 },
  ],

  // Default Dashboard Widgets Configuration
  dashboardWidgets: [
    { id: 'kpi_strip', type: 'kpis', title: 'Health Sector Operational KPIs', span: 12 },
    { id: 'hospital_bed_occupancy', type: 'bed_occupancy', title: 'District Hospital Bed & ICU Occupancy', span: 6 },
    { id: 'emergency_ambulance_telemetry', type: 'ambulance_telemetry', title: '102/108 Ambulance Fleet Telemetry', span: 6 },
    { id: 'critical_complaints_queue', type: 'complaint_queue', title: 'Active Health Grievances & SLA Countdowns', span: 8 },
    { id: 'ai_health_recommendations', type: 'recommendations', title: 'AI Public Health Epidemiological Alerts', span: 4 },
    { id: 'health_gis_map', type: 'gis_mini_map', title: 'Nalanda Health Asset Spatial Layer', span: 12 },
  ],

  // Analytics Metrics
  analyticsMetrics: {
    targetSlaPct: 90,
    targetBedOccupancyPct: 75,
    avgAmbulanceResponseMins: 14,
    vaccineColdChainIntegrityPct: 98.4,
  },

  // Document Categories
  documentCategories: [
    'Inspection Reports',
    'Equipment Calibration Certificates',
    'Drug Audit Reports',
    'Civil Surgeon Directives',
    'Ambulance Logbooks',
  ],

  // Sample Reference Assets for Health
  sampleAssets: [
    {
      id: 'HLTH-AST-101',
      name: 'Sadar Hospital Rajgir (District Facility)',
      type: 'district_hospital',
      typeLabel: 'District Hospital',
      village: 'Rajgir',
      block: 'Silao',
      position: [85.4211, 25.0294],
      status: 'active',
      attributes: {
        bed_count: 150,
        icu_beds: 18,
        ventilator_count: 12,
        has_emergency: true,
        has_blood_bank: true,
        doctor_count: 24,
        oxygen_plant_kw: 250,
      },
      lastInspected: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
    {
      id: 'HLTH-AST-102',
      name: 'Community Health Centre Silao',
      type: 'chc',
      typeLabel: 'Community Health Centre',
      village: 'Silao Bazar',
      block: 'Silao',
      position: [85.4434, 25.1372],
      status: 'active',
      attributes: {
        bed_count: 30,
        has_emergency: true,
        has_maternity: true,
        doctor_count: 6,
        ambulance_count: 2,
      },
      lastInspected: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    },
    {
      id: 'HLTH-AST-103',
      name: 'Primary Health Centre Surajpur',
      type: 'phc',
      typeLabel: 'Primary Health Centre',
      village: 'Surajpur',
      block: 'Silao',
      position: [85.4312, 25.0811],
      status: 'active',
      attributes: {
        bed_count: 6,
        doctor_count: 2,
        staff_nurse_count: 4,
        cold_chain_status: 'Optimal (4°C)',
      },
      lastInspected: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    },
  ],
}

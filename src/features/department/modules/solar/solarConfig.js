// Solar & Renewable Energy Reference Configuration (LLD Vol 3 §16.1 & Part 12 Requirements)

export const SOLAR_CONFIG = {
  id: 'solar',
  code: 'SOLR',
  label: 'Solar & Renewable Energy',
  tagline: 'Grid-Connected Solar, Rooftop Plants, Mini Grids & Smart Streetlighting',
  color: '#d35400',
  accent: 'saffron',
  icon: 'Sun',
  custodian: 'BREDA District Office, Nalanda',

  // Asset Types & Schemas
  assetTypes: [
    {
      id: 'solar_power_plant',
      label: 'Mega Solar Power Plant',
      radiusKm: 30,
      icon: 'Factory',
      attributeFields: ['capacity_kw', 'inverter_status', 'generation_kwh_today', 'battery_soc_pct', 'panel_efficiency_pct'],
    },
    {
      id: 'rooftop_solar',
      label: 'Institutional Rooftop Solar Unit',
      radiusKm: 5,
      icon: 'Home',
      attributeFields: ['capacity_kw', 'building_name', 'grid_connected', 'monthly_savings_inr'],
    },
    {
      id: 'solar_street_light',
      label: 'Smart Solar Street Light (LED)',
      radiusKm: 1,
      icon: 'Lightbulb',
      attributeFields: ['pole_height_meters', 'battery_charge_status', 'dusk_dawn_sensor_working', 'lumen_output'],
    },
    {
      id: 'solar_pump',
      label: 'JJM Solar Water Pump Unit',
      radiusKm: 3,
      icon: 'Zap',
      attributeFields: ['motor_hp', 'discharge_lpm', 'solar_array_wattage', 'borewell_depth_feet'],
    },
  ],

  // Specific Complaint Categories for Solar
  complaintCategories: [
    { id: 'inverter_fault', name: 'Inverter Tripping / Generation Zero', defaultPriority: 'high', slaHours: 12 },
    { id: 'street_light_out', name: 'Non-Functional Solar Street Light', defaultPriority: 'low', slaHours: 48 },
    { id: 'battery_theft_damage', name: 'Battery Bank Theft / Physical Damage', defaultPriority: 'urgent', slaHours: 6 },
    { id: 'solar_pump_failure', name: 'Solar Submersible Pump Non-Operation', defaultPriority: 'high', slaHours: 24 },
  ],

  // Default Dashboard Widgets Configuration
  dashboardWidgets: [
    { id: 'kpi_strip', type: 'kpis', title: 'Solar Infrastructure KPIs', span: 12 },
    { id: 'generation_telemetry', type: 'generation_chart', title: 'Real-time Solar Generation & Grid Feed Logs', span: 6 },
    { id: 'battery_bank_status', type: 'battery_soc', title: 'Microgrid Battery Health & Charge Matrix', span: 6 },
    { id: 'critical_complaints_queue', type: 'complaint_queue', title: 'Active Solar Fault Alerts Queue', span: 8 },
    { id: 'solar_gis_map', type: 'gis_mini_map', title: 'Nalanda Solar Plant Spatial Grid Layers', span: 4 },
  ],

  // Analytics Metrics
  analyticsMetrics: {
    targetSlaPct: 90,
    averageGenerationMwhDay: 12.8,
    streetLightUptimePct: 98.1,
    carbonOffsetTonsCo2: 340,
  },

  // Document Categories
  documentCategories: [
    'BREDA Technical Approvals',
    'Net Metering Certificates',
    'Inverter Calibration Charts',
    'Battery Health Check Sheets',
    'Solar Plant DPR & Structural Certs',
  ],

  // Sample Reference Assets for Solar
  sampleAssets: [
    {
      id: 'SOL-AST-101',
      name: 'Rajgir 2MW Grid Solar Farm',
      type: 'solar_power_plant',
      typeLabel: 'Mega Solar Power Plant',
      village: 'Rajgir',
      block: 'Silao',
      position: [85.4211, 25.0294],
      status: 'active',
      attributes: {
        capacity_kw: 2000,
        inverter_status: 'Optimal (Grid-Sync Active)',
        generation_kwh_today: 8450,
        battery_soc_pct: 95,
        panel_efficiency_pct: 19.8,
      },
      lastInspected: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
    {
      id: 'SOL-AST-102',
      name: 'Silao Block Office Rooftop Solar',
      type: 'rooftop_solar',
      typeLabel: 'Rooftop Solar Unit',
      village: 'Silao Bazar',
      block: 'Silao',
      position: [85.4434, 25.1372],
      status: 'active',
      attributes: {
        capacity_kw: 25,
        building_name: 'Silao Block Block-A Office',
        grid_connected: true,
        monthly_savings_inr: 18500,
      },
      lastInspected: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    },
  ],
}

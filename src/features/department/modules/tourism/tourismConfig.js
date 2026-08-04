// Tourism & Heritage Development Reference Configuration (LLD Vol 3 §16.1 & Part 12 Requirements)

export const TOURISM_CONFIG = {
  id: 'tourism',
  code: 'TRSM',
  label: 'Tourism & Heritage Development',
  tagline: 'Ancient Site Protection, Visitor Amenities, Guided Trails & Telemetry',
  color: '#8e44ad',
  accent: 'violet',
  icon: 'Compass',
  custodian: 'District Tourism Development Committee, Nalanda',

  // Asset Types & Schemas
  assetTypes: [
    {
      id: 'heritage_monument',
      label: 'Ancient Protected Monument',
      radiusKm: 20,
      icon: 'Milestone',
      attributeFields: ['heritage_rating', 'ticket_cost_inr', 'daily_visitors', 'cctv_surveillance_status', 'guide_count'],
    },
    {
      id: 'visitor_centre',
      label: 'Visitor Information & Facilitation Centre',
      radiusKm: 10,
      icon: 'Building',
      attributeFields: ['staff_count', 'has_drinking_water', 'has_audioguide_kiosks', 'is_wheelchair_accessible'],
    },
    {
      id: 'tourist_lodge',
      label: 'BSTDC Tourist Guest House / Yatri Niwas',
      radiusKm: 15,
      icon: 'Home',
      attributeFields: ['room_count', 'occupancy_rate_pct', 'restaurant_rating', 'has_solar_backup'],
    },
    {
      id: 'public_toilet_tourist',
      label: 'Tourist Cleanliness Sanitation Complex',
      radiusKm: 2,
      icon: 'Trash2',
      attributeFields: ['toilet_type', 'water_supply_status', 'cleanliness_grade', 'has_disabled_toilets'],
    },
  ],

  // Specific Complaint Categories for Tourism
  complaintCategories: [
    { id: 'guide_harassment', name: 'Tourist Harassment / Overcharging Grievance', defaultPriority: 'urgent', slaHours: 4 },
    { id: 'amenity_dysfunctional', name: 'Facilitation Center / Water ATM Out of Service', defaultPriority: 'high', slaHours: 12 },
    { id: 'monument_vandalism', name: 'Heritage Site Vandalism / Illegal Encroachment', defaultPriority: 'urgent', slaHours: 6 },
    { id: 'cleanliness_poor', name: 'Poor Sanitation at Heritage Complex Area', defaultPriority: 'medium', slaHours: 24 },
  ],

  // Default Dashboard Widgets Configuration
  dashboardWidgets: [
    { id: 'kpi_strip', type: 'kpis', title: 'Tourism Sector KPIs', span: 12 },
    { id: 'tourist_footfall_chart', type: 'footfall_tracker', title: 'Daily Heritage Visitor Footfall Matrix', span: 6 },
    { id: 'amenity_health_indices', type: 'amenity_telemetry', title: 'Visitor Hub Amenities Operational Rates', span: 6 },
    { id: 'critical_complaints_queue', type: 'complaint_queue', title: 'Active Tourist Complaints Escalated Queue', span: 8 },
    { id: 'tourism_gis_map', type: 'gis_mini_map', title: 'Nalanda Protected Heritage Spatial Assets', span: 4 },
  ],

  // Analytics Metrics
  analyticsMetrics: {
    targetSlaPct: 94,
    avgVisitorSatisfactionPct: 89.6,
    avgFootfallPerDay: 4800,
    activeLicensedGuidesCount: 34,
  },

  // Document Categories
  documentCategories: [
    'Archaeological Surveys',
    'Visitor Surveys & CSAT Reports',
    'Monument Protection Plan Documents',
    'BSTDC Operational Circulars',
    'Development Masterplans',
  ],

  // Sample Reference Assets for Tourism
  sampleAssets: [
    {
      id: 'TRM-AST-101',
      name: 'Ancient Nalanda Mahavihara ruins (UNESC)',
      type: 'heritage_monument',
      typeLabel: 'Ancient Protected Monument',
      village: 'Surajpur',
      block: 'Silao',
      position: [85.4312, 25.0811],
      status: 'active',
      attributes: {
        heritage_rating: 'UNESCO World Heritage',
        ticket_cost_inr: 40,
        daily_visitors: 1250,
        cctv_surveillance_status: 'Optimal (24 cameras online)',
        guide_count: 14,
      },
      lastInspected: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    },
    {
      id: 'TRM-AST-102',
      name: 'Rajgir Ropeway & Vishwa Shanti Stupa Complex',
      type: 'heritage_monument',
      typeLabel: 'Ancient Protected Monument',
      village: 'Kund Area',
      block: 'Silao',
      position: [85.4211, 25.0294],
      status: 'active',
      attributes: {
        heritage_rating: 'Top District Site',
        ticket_cost_inr: 100,
        daily_visitors: 2800,
        cctv_surveillance_status: 'Optimal (12 cameras online)',
        guide_count: 8,
      },
      lastInspected: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  ],
}

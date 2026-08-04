import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const today = () => new Date().toISOString().split('T')[0]
const event = (entityType, entityId, type, details = '') => ({
  id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  entityType,
  entityId,
  type,
  details,
  at: new Date().toISOString(),
})

const lifecycleFor = (assetId, state, details) => ({
  id: `LFC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  assetId,
  state,
  details,
  at: new Date().toISOString(),
})

const INITIAL_PROPOSALS = [
  {
    id: 'PRP-2026-00101',
    title: 'Rajgir Community Health Centre Solarization',
    departmentId: 'health',
    description: 'Installation of a 50kW grid-tied solar power plant with 4-hour battery backup at CHC Rajgir to ensure continuous power supply for cold chain vaccines and emergency services.',
    state: 'collector',
    needAssessment: 'Frequent load shedding in Rajgir block causes vaccine cold chain failures and disrupts midnight surgeries.',
    problemStatement: 'Unreliable grid power leading to vaccine wastage and failure of emergency medical equipment.',
    objectives: 'Provide 24/7 uninterrupted green power to CHC Rajgir.',
    expectedOutcomes: 'Zero vaccine spoilage, 100% solar self-reliance during daytime, uninterrupted operations.',
    financialEstimate: 4500000,
    timeline: '3 Months',
    gisLocation: { position: [85.4211, 25.0294], address: 'Near Old Sun Temple, Rajgir' },
    photos: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80'],
    supportingDocuments: ['CHC_Solar_DPR_v1.pdf', 'Load_Audit_Report.xlsx'],
    risk: 'medium',
    priority: 'high',
    beneficiary: 'Mothers, infants, and emergency patients visiting CHC Rajgir',
    population: 45000,
    schemeMapping: 'National Health Mission & Solar Rooftop Scheme',
    departmentMapping: 'Health & Family Welfare ↔ Solar & Renewable Energy',
    collaborators: ['solar'],
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    auditTrail: [
      { timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), actorName: 'Dr. Rajesh Kumar', actorRole: 'dept_head', action: 'DRAFT_CREATED', remarks: 'DPR imported and initial draft prepared.' },
      { timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), actorName: 'Smt. S. Sinha', actorRole: 'dept_officer', action: 'SUBMITTED_FOR_REVIEW', remarks: 'Technical feasibility and budget verified.' },
      { timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), actorName: 'Civil Surgeon Office', actorRole: 'dept_head', action: 'FORWARDED_TO_COLLECTOR', remarks: 'Recommended for priority district allocation.' }
    ]
  },
  {
    id: 'PRP-2026-00102',
    title: 'Silao Block Smart Classrooms Upgrade',
    departmentId: 'education',
    description: 'Upgrading 15 Government Middle Schools in Silao Block with Smart LED interactive boards, educational software, and solar panels.',
    state: 'approved',
    needAssessment: 'Digital learning deficit among rural kids leading to low engagement and basic learning gap.',
    problemStatement: 'Traditional chalkboards limit interactive multimedia exposure.',
    objectives: 'Establish 15 interactive smart classrooms across Silao block.',
    expectedOutcomes: 'Increase student enrollment by 15%, improve visual learning skills.',
    financialEstimate: 3200000,
    timeline: '2 Months',
    gisLocation: { position: [85.4434, 25.1372], address: 'Silao Main Market Chowk' },
    photos: ['https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80'],
    supportingDocuments: ['Smart_Class_BOQ.pdf'],
    risk: 'low',
    priority: 'medium',
    beneficiary: 'Students of Grades 5-8',
    population: 8500,
    schemeMapping: 'Samagra Shiksha Abhiyan',
    departmentMapping: 'School Education ↔ Solar & Renewable Energy',
    collaborators: ['solar'],
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    auditTrail: [
      { timestamp: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(), actorName: 'District Education Officer', actorRole: 'dept_head', action: 'DRAFT_CREATED', remarks: 'School selection survey compiled.' },
      { timestamp: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(), actorName: 'District Collector', actorRole: 'district_collector', action: 'PROPOSAL_APPROVED', remarks: 'Highly beneficial scheme. Approved for rollout.' }
    ]
  },
  {
    id: 'PRP-2026-00103',
    title: 'Rajgir Tourist Heritage Facilitation Hub',
    departmentId: 'tourism',
    description: 'Construction of a solar-powered Information and Visitor Facilitation Centre at Giriak Road with smart ticketing kiosk and clean drinking water ATM.',
    state: 'approved',
    needAssessment: 'High footfall of international tourists with zero localized digital guide hubs and drinking water access.',
    problemStatement: 'Tourists struggle with basic guides, hygiene facilities, and ticketing lines.',
    objectives: 'Create a state-of-the-art heritage guidance center.',
    expectedOutcomes: 'Enhanced visitor satisfaction, digitized heritage trails.',
    financialEstimate: 8500000,
    timeline: '6 Months',
    gisLocation: { position: [85.4215, 25.0285], address: 'Giriak Road, near Kund Area' },
    photos: ['https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80'],
    supportingDocuments: ['Visitor_Hub_Masterplan.pdf'],
    risk: 'medium',
    priority: 'high',
    beneficiary: 'Domestic and international pilgrims/tourists visiting Rajgir',
    population: 150000,
    schemeMapping: 'Swadesh Darshan & Jal Jeevan Mission',
    departmentMapping: 'Tourism & Heritage ↔ Water & Sanitation ↔ Solar',
    collaborators: ['water', 'solar'],
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    auditTrail: [
      { timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), actorName: 'Tourism Nodal Officer', actorRole: 'dept_head', action: 'DRAFT_CREATED' },
      { timestamp: new Date(Date.now() - 24 * 24 * 3600 * 1000).toISOString(), actorName: 'District Collector', actorRole: 'district_collector', action: 'PROPOSAL_APPROVED', remarks: 'Crucial for heritage tourism boosting.' }
    ]
  },
  {
    id: 'PRP-2026-00104',
    title: 'Surajpur Ward 3 Elevated Water Reservoir',
    departmentId: 'water',
    description: 'Construction of 1 Lakh Litre Over Head Tank (OHT) and 3.5 km pipeline installation under JJM for drinking water coverage.',
    state: 'execution',
    needAssessment: 'Slightly higher elevation of Ward 3 limits pressure of existing water feeds.',
    problemStatement: 'Households receive low pressure or dry taps.',
    objectives: 'Construct OHT and feed distribution pipelines.',
    expectedOutcomes: 'Provide high-pressure drinking tap water to 800 households.',
    financialEstimate: 12000000,
    timeline: '6 Months',
    gisLocation: { position: [85.4312, 25.0811], address: 'Surajpur Village Main, Silao' },
    photos: ['https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80'],
    supportingDocuments: ['Water_Tank_DPR_Structural.pdf'],
    risk: 'high',
    priority: 'urgent',
    beneficiary: 'Surajpur Ward 3 residents',
    population: 4800,
    schemeMapping: 'Jal Jeevan Mission (JJM)',
    departmentMapping: 'Water & Sanitation (JJM)',
    collaborators: [],
    createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
    auditTrail: [
      { timestamp: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(), actorName: 'Assistant Engineer Water', actorRole: 'engineer', action: 'DRAFT_CREATED' },
      { timestamp: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(), actorName: 'District Collector', actorRole: 'district_collector', action: 'PROPOSAL_APPROVED' }
    ]
  }
]

const INITIAL_PROJECTS = [
  {
    id: 'PRJ-2026-00101',
    proposalId: 'PRP-2026-00102',
    title: 'Silao Block Smart Classrooms Upgrade',
    departmentId: 'education',
    progress: 75,
    budgetSanctioned: 3200000,
    budgetUtilized: 2400000,
    contractor: 'Nalanda Digital Solutions Pvt. Ltd.',
    milestones: [
      { title: 'Interactive Panel Procurement', status: 'completed', progressPct: 30 },
      { title: 'School Site Preparation & Electrical Fittings', status: 'completed', progressPct: 25 },
      { title: 'Interactive Panel Installation & Software Setup', status: 'completed', progressPct: 20 },
      { title: 'Teacher Technical Training & Handover', status: 'pending', progressPct: 25 }
    ],
    workOrderIds: ['WO-2026-00101'],
    inspectionIds: ['INS-2026-00101'],
    risk: 'low',
    delays: [],
    siteVisits: 3,
    status: 'execution'
  },
  {
    id: 'PRJ-2026-00102',
    proposalId: 'PRP-2026-00103',
    title: 'Rajgir Tourist Heritage Facilitation Hub',
    departmentId: 'tourism',
    progress: 20,
    budgetSanctioned: 8500000,
    budgetUtilized: 1700000,
    contractor: 'Bihar State Tourism Dev Corp (BSTDC)',
    milestones: [
      { title: 'Site Layout and Land Clearing', status: 'completed', progressPct: 10 },
      { title: 'Foundation Concrete Work', status: 'completed', progressPct: 10 },
      { title: 'Brickwork and Roofing Structure', status: 'pending', progressPct: 30 },
      { title: 'Solar Plant and Ticketing Kiosks Integration', status: 'pending', progressPct: 30 },
      { title: 'Finishing and Visitor Handover', status: 'pending', progressPct: 20 }
    ],
    workOrderIds: ['WO-2026-00102'],
    inspectionIds: ['INS-2026-00102'],
    risk: 'medium',
    delays: ['Land dispute resolution delay of 5 days'],
    siteVisits: 1,
    status: 'execution'
  },
  {
    id: 'PRJ-2026-00103',
    proposalId: 'PRP-2026-00104',
    title: 'Surajpur Ward 3 Elevated Water Reservoir',
    departmentId: 'water',
    progress: 95,
    budgetSanctioned: 12000000,
    budgetUtilized: 11400000,
    contractor: 'Maata Construction Group, Bihar Sharif',
    milestones: [
      { title: 'Land allocation and soil testing', status: 'completed', progressPct: 10 },
      { title: 'OHT Foundation and Staging Structure', status: 'completed', progressPct: 30 },
      { title: 'Water Tank Reservoir Shell Casting', status: 'completed', progressPct: 25 },
      { title: 'JJM Distribution Pipeline Installation', status: 'completed', progressPct: 20 },
      { title: 'Pressure Testing and Commissioning', status: 'pending', progressPct: 15 }
    ],
    workOrderIds: ['WO-2026-00103'],
    inspectionIds: ['INS-2026-00103'],
    risk: 'high',
    delays: ['Intermittent monsoon waterlogging delayed concrete drying by 8 days.'],
    siteVisits: 6,
    status: 'execution'
  }
]

const INITIAL_WORK_ORDERS = [
  {
    id: 'WO-2026-00101',
    projectId: 'PRJ-2026-00101',
    title: 'Interactive panel mounting and electrical cabling in 15 schools',
    departmentId: 'education',
    assignedOfficer: { name: 'Shri K. K. Pathak', role: 'dept_officer', dept: 'education' },
    assignedEngineer: { name: 'Birendra Prasad', role: 'engineer', dept: 'education' },
    scheduleWork: '2026-08-10',
    priority: 'high',
    deadline: '2026-08-30',
    state: 'in_progress',
    completionDate: null,
    remarks: 'Contractor has finalized panel delivery. Wiring work is active.',
    gisLocation: { position: [85.4434, 25.1372], address: 'Silao Main Market Chowk' },
    history: [{ timestamp: new Date().toISOString(), event: 'WORK_ORDER_ASSIGNED', note: 'Assigned to Executive Engineer Birendra Prasad' }]
  },
  {
    id: 'WO-2026-00102',
    projectId: 'PRJ-2026-00102',
    title: 'Tourist Hub Foundation and Site excavation',
    departmentId: 'tourism',
    assignedOfficer: { name: 'Mukesh Kumar', role: 'dept_officer', dept: 'tourism' },
    assignedEngineer: { name: 'Amit Jha', role: 'engineer', dept: 'tourism' },
    scheduleWork: '2026-08-01',
    priority: 'medium',
    deadline: '2026-09-15',
    state: 'in_progress',
    completionDate: null,
    remarks: 'Excavation completed. Concrete mix being prepared.',
    gisLocation: { position: [85.4215, 25.0285], address: 'Giriak Road, near Kund Area' },
    history: [{ timestamp: new Date().toISOString(), event: 'WORK_ORDER_ASSIGNED', note: 'Assigned to Amit Jha' }]
  },
  {
    id: 'WO-2026-00103',
    projectId: 'PRJ-2026-00103',
    title: 'JJM pipeline testing and OHT pressure testing',
    departmentId: 'water',
    assignedOfficer: { name: 'Anil Mehta', role: 'dept_officer', dept: 'water' },
    assignedEngineer: { name: 'S. K. Choudhary', role: 'engineer', dept: 'water' },
    scheduleWork: '2026-08-05',
    priority: 'urgent',
    deadline: '2026-08-15',
    state: 'in_progress',
    completionDate: null,
    remarks: 'Final pipe line joint inspection completed. Water filling started.',
    gisLocation: { position: [85.4312, 25.0811], address: 'Surajpur Village Main, Silao' },
    history: [{ timestamp: new Date().toISOString(), event: 'WORK_ORDER_ASSIGNED', note: 'Assigned to S. K. Choudhary' }]
  }
]

const INITIAL_INSPECTIONS = [
  {
    id: 'INS-2026-00101',
    projectId: 'PRJ-2026-00101',
    workOrderId: 'WO-2026-00101',
    departmentId: 'education',
    title: 'Silao Middle School Interactive Panel Audit',
    inspector: 'Birendra Prasad (EE)',
    date: '2026-08-02',
    checklist: [
      { item: 'Panel installation and rigid wall mounting', checked: true },
      { item: 'Uninterrupted power line connecting solar inverter', checked: true },
      { item: 'Local offline syllabus sync validation', checked: true },
      { item: 'Touch sensitivity & calibration compliance', checked: false }
    ],
    geoTaggedPhotos: ['https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80'],
    videoUrl: '',
    remarks: 'Panels are fully functional. Calibration needs adjustment in 2 schools.',
    complianceScore: 85,
    status: 'completed',
    followUpTriggered: true,
    followUpDetails: 'Recalibrate panels in Silao Girls Middle school by next week.'
  },
  {
    id: 'INS-2026-00102',
    projectId: 'PRJ-2026-00102',
    workOrderId: 'WO-2026-00102',
    departmentId: 'tourism',
    title: 'Rajgir Tourist Hub foundation layout verification',
    inspector: 'Amit Jha (AE)',
    date: '2026-08-03',
    checklist: [
      { item: 'Silt layer clearing and grading', checked: true },
      { item: 'Boundary wall layout matching master plan', checked: true },
      { item: 'Soil bearing test record approval', checked: true }
    ],
    geoTaggedPhotos: ['https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80'],
    videoUrl: '',
    remarks: 'Layout parameters align with master planning records. Certified.',
    complianceScore: 100,
    status: 'completed',
    followUpTriggered: false,
    followUpDetails: ''
  },
  {
    id: 'INS-2026-00103',
    projectId: 'PRJ-2026-00103',
    workOrderId: 'WO-2026-00103',
    departmentId: 'water',
    title: 'Surajpur OHT Structural safety inspect',
    inspector: 'Manoj Singh (JE)',
    date: '2026-08-12',
    checklist: [
      { item: 'OHT core plaster and waterproofing inspection', checked: false },
      { item: 'High-pressure outlet manifold leakage test', checked: false },
      { item: 'Surrounding safety fencing and signage', checked: false }
    ],
    geoTaggedPhotos: [],
    videoUrl: '',
    remarks: 'Scheduled for middle of August.',
    complianceScore: 0,
    status: 'scheduled',
    followUpTriggered: false,
    followUpDetails: ''
  }
]

const INITIAL_OFFICERS = [
  // Health
  { name: 'Dr. Rajesh Kumar', role: 'dept_head', dept: 'health', email: 'rajesh.k@bihar.gov.in', phone: '+91 94310 11222', attendance: 'Present', inspectionCount: 14, pendingWork: 2, workload: 45, currentLocation: [85.4211, 25.0294], parentOfficer: 'District Collector' },
  { name: 'Smt. Kavita Devi', role: 'dept_officer', dept: 'health', email: 'kavita.d@bihar.gov.in', phone: '+91 94310 22333', attendance: 'Present', inspectionCount: 8, pendingWork: 5, workload: 65, currentLocation: [85.4434, 25.1372], parentOfficer: 'Dr. Rajesh Kumar' },
  { name: 'Dr. Manoj Prabhakar', role: 'field_inspector', dept: 'health', email: 'manoj.p@bihar.gov.in', phone: '+91 94310 33444', attendance: 'On Leave', inspectionCount: 12, pendingWork: 1, workload: 25, currentLocation: [85.4312, 25.0811], parentOfficer: 'Dr. Rajesh Kumar' },

  // Water
  { name: 'Anil Mehta', role: 'dept_head', dept: 'water', email: 'anil.mehta@bihar.gov.in', phone: '+91 94312 44555', attendance: 'Present', inspectionCount: 22, pendingWork: 4, workload: 80, currentLocation: [85.4211, 25.0294], parentOfficer: 'District Collector' },
  { name: 'S. K. Choudhary', role: 'engineer', dept: 'water', email: 'sk.choudhary@bihar.gov.in', phone: '+91 94312 55666', attendance: 'Present', inspectionCount: 19, pendingWork: 6, workload: 70, currentLocation: [85.4434, 25.1372], parentOfficer: 'Anil Mehta' },
  { name: 'Manoj Singh', role: 'field_inspector', dept: 'water', email: 'manoj.singh@bihar.gov.in', phone: '+91 94312 66777', attendance: 'Present', inspectionCount: 31, pendingWork: 3, workload: 90, currentLocation: [85.4312, 25.0811], parentOfficer: 'S. K. Choudhary' },

  // Education
  { name: 'Shri K. K. Pathak', role: 'dept_head', dept: 'education', email: 'kkpathak@bihar.gov.in', phone: '+91 94313 77888', attendance: 'Present', inspectionCount: 5, pendingWork: 1, workload: 35, currentLocation: [85.4211, 25.0294], parentOfficer: 'District Collector' },
  { name: 'Birendra Prasad', role: 'engineer', dept: 'education', email: 'birendra.p@bihar.gov.in', phone: '+91 94313 88999', attendance: 'Present', inspectionCount: 12, pendingWork: 4, workload: 50, currentLocation: [85.4434, 25.1372], parentOfficer: 'Shri K. K. Pathak' },

  // Solar
  { name: 'R. K. Sharma', role: 'dept_head', dept: 'solar', email: 'rksharma@bihar.gov.in', phone: '+91 94314 99000', attendance: 'Present', inspectionCount: 15, pendingWork: 2, workload: 55, currentLocation: [85.4211, 25.0294], parentOfficer: 'District Collector' },
  { name: 'Rajeev Sinha', role: 'engineer', dept: 'solar', email: 'rajeev.s@bihar.gov.in', phone: '+91 94314 00111', attendance: 'Present', inspectionCount: 10, pendingWork: 3, workload: 40, currentLocation: [85.4434, 25.1372], parentOfficer: 'R. K. Sharma' },

  // Tourism
  { name: 'Mukesh Kumar', role: 'dept_head', dept: 'tourism', email: 'mukesh.k@bihar.gov.in', phone: '+91 94315 11222', attendance: 'Present', inspectionCount: 9, pendingWork: 3, workload: 40, currentLocation: [85.4211, 25.0294], parentOfficer: 'District Collector' },
  { name: 'Amit Jha', role: 'engineer', dept: 'tourism', email: 'amit.jha@bihar.gov.in', phone: '+91 94315 22333', attendance: 'Present', inspectionCount: 7, pendingWork: 2, workload: 35, currentLocation: [85.4434, 25.1372], parentOfficer: 'Mukesh Kumar' }
]

export const useProjectEngine = create(
  persist(
    (set, get) => ({
      proposals: INITIAL_PROPOSALS,
      projects: INITIAL_PROJECTS,
      workOrders: INITIAL_WORK_ORDERS,
      inspections: INITIAL_INSPECTIONS,
      officers: INITIAL_OFFICERS,
      // Execution-lifecycle collections. These are deliberately kept in the
      // same reactive transaction as projects so GIS, KPIs and operational
      // workspaces cannot drift from one another.
      assets: [],
      assetOverrides: {},
      maintenanceTasks: [],
      documents: [],
      timelines: [],
      lifecycleEvents: [],
      inventory: [
        { id: 'INV-2026-001', departmentId: 'health', name: 'Vaccine cold-chain doses', category: 'Vaccines', quantity: 420, unit: 'doses', reorderLevel: 120, status: 'in_stock', updatedAt: new Date().toISOString() },
        { id: 'INV-2026-002', departmentId: 'water', name: 'DI pipeline stock', category: 'Pipes', quantity: 860, unit: 'metres', reorderLevel: 300, status: 'in_stock', updatedAt: new Date().toISOString() },
        { id: 'INV-2026-003', departmentId: 'solar', name: 'Solar panels 550W', category: 'Panels', quantity: 24, unit: 'units', reorderLevel: 30, status: 'low_stock', updatedAt: new Date().toISOString() },
      ],
      budgets: [],
      contractors: [],
      meetings: [],
      knowledge: [],
      aiRecommendations: [],
      departmentNotifications: [],
      reports: [],
      executionLogs: [],
      measurementBooks: [],
      bills: [],

      createProposal: (payload) => {
        const id = `PRP-2026-${String(get().proposals.length + 101).padStart(5, '0')}`
        const newProposal = {
          id,
          state: 'draft',
          photos: [],
          supportingDocuments: [],
          createdAt: new Date().toISOString(),
          collaborators: payload.collaborators || [],
          auditTrail: [{
            timestamp: new Date().toISOString(),
            actorName: payload.creatorName || 'Officer',
            actorRole: 'dept_head',
            action: 'DRAFT_CREATED',
            remarks: 'Proposal created in system.'
          }],
          ...payload
        }
        set((s) => ({ proposals: [newProposal, ...s.proposals] }))
        return newProposal
      },

      duplicateProposal: (proposalId) => {
        const base = get().proposals.find(p => p.id === proposalId)
        if (!base) return null
        const id = `PRP-2026-${String(get().proposals.length + 101).padStart(5, '0')}`
        const dup = {
          ...base,
          id,
          state: 'draft',
          title: `Copy of ${base.title}`,
          createdAt: new Date().toISOString(),
          auditTrail: [{
            timestamp: new Date().toISOString(),
            actorName: 'System Duplicator',
            actorRole: 'system',
            action: 'PROPOSAL_DUPLICATED',
            remarks: `Duplicated from ${base.id}`
          }]
        }
        set((s) => ({ proposals: [dup, ...s.proposals] }))
        return dup
      },

      updateProposal: (proposalId, updates) => {
        set((s) => ({
          proposals: s.proposals.map(p => p.id === proposalId ? { ...p, ...updates } : p)
        }))
      },

      transitionProposal: (proposalId, nextState, actorUser, remarks = '') => {
        const now = new Date().toISOString()
        const proposals = get().proposals.map((p) => {
          if (p.id !== proposalId) return p

          const audit = {
            timestamp: now,
            actorName: actorUser.name || 'System User',
            actorRole: actorUser.role || 'dept_head',
            action: `STATE_TRANSITION_${nextState.toUpperCase()}`,
            remarks: remarks || `Moved to ${nextState}`
          }

          const updated = {
            ...p,
            state: nextState,
            auditTrail: [...p.auditTrail, audit]
          }

          // Only a district-level sanction may promote a DPR into execution.
          // Department review can forward to DM, but can never create a project.
          if (nextState === 'approved' && ['district_collector', 'dm', 'adm', 'system_admin'].includes(actorUser.role)) {
            const projects = get().projects
            const projectExists = projects.some(pr => pr.proposalId === p.id)
            if (!projectExists) {
              const prjId = `PRJ-2026-${String(projects.length + 101).padStart(5, '0')}`
              const newProject = {
                id: prjId,
                proposalId: p.id,
                title: p.title,
                departmentId: p.departmentId,
                scheme: p.schemeMapping || 'District Capital Works',
                village: p.gisLocation?.address || 'District Site',
                gps: p.gisLocation?.position || [85.4211, 25.0294],
                timeline: p.timeline || '90 Days',
                priority: p.priority || 'medium',
                beneficiaries: p.population || 0,
                currentStage: 'planning',
                assignedEngineers: [],
                assetIds: [],
                progress: 0,
                budgetSanctioned: p.financialEstimate || 1000000,
                budgetUtilized: 0,
                contractor: 'TBD (Under Tendering)',
                milestones: [
                  { title: 'Project Mobilization', status: 'pending', progressPct: 15 },
                  { title: 'Procurement of Equipment/Materials', status: 'pending', progressPct: 35 },
                  { title: 'Execution Phase 1 (Core works)', status: 'pending', progressPct: 30 },
                  { title: 'Final Inspection & Commissioning', status: 'pending', progressPct: 20 }
                ],
                workOrderIds: [],
                inspectionIds: [],
                risk: p.risk || 'low',
                delays: [],
                siteVisits: 0,
                status: 'planning'
              }
              // Add work order as well
              const woId = `WO-2026-${String(get().workOrders.length + 101).padStart(5, '0')}`
              const newWO = {
                id: woId,
                projectId: prjId,
                assetId: null,
                type: 'construction',
                contractor: 'TBD (Under Tendering)',
                estimatedCost: Math.round((p.financialEstimate || 1000000) * 0.1),
                expectedDuration: '30 days',
                title: `Mobilization and site deployment: ${p.title}`,
                departmentId: p.departmentId,
                assignedOfficer: { name: actorUser.name, role: actorUser.role, dept: p.departmentId },
                assignedEngineer: { name: 'Amit Jha', role: 'engineer', dept: p.departmentId },
                scheduleWork: now.split('T')[0],
                priority: p.priority || 'medium',
                deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
                state: 'assigned',
                completionDate: null,
                remarks: 'Initial mobilization work order automatically scheduled.',
                gisLocation: p.gisLocation || { position: [85.4211, 25.0294], address: 'District Site' },
                history: [{ timestamp: now, event: 'WORK_ORDER_ASSIGNED', note: 'Created upon proposal approval.' }]
              }
              newProject.workOrderIds.push(woId)
              const assetId = `AST-2026-${String(get().assets.length + 101).padStart(5, '0')}`
              const asset = {
                id: assetId, name: p.title, type: 'project_asset', typeLabel: 'Project Asset',
                departmentId: p.departmentId, village: p.gisLocation?.address || 'District Site', block: 'Nalanda',
                position: p.gisLocation?.position || [85.4211, 25.0294], status: 'planned', health: 100,
                lifecycleState: 'planned', projectId: prjId, attributes: { scheme: p.schemeMapping || 'Capital Works' },
                lastInspected: null,
              }
              newProject.assetIds.push(assetId)
              newWO.assetId = assetId
              const maintenance = {
                id: `MNT-2026-${String(get().maintenanceTasks.length + 101).padStart(5, '0')}`,
                assetId, projectId: prjId, departmentId: p.departmentId, type: 'preventive',
                status: 'scheduled', dueDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
                priority: 'medium', title: `Commissioning maintenance plan: ${p.title}`,
              }
              set(s => ({
                projects: [...s.projects, newProject], workOrders: [...s.workOrders, newWO], assets: [...s.assets, asset],
                maintenanceTasks: [...s.maintenanceTasks, maintenance],
                documents: [...s.documents, ...(p.supportingDocuments || []).map((name, index) => ({ id: `DOC-${prjId}-${index + 1}`, projectId: prjId, name, category: index ? 'DPR' : 'Estimate', version: 1, uploadedAt: now }))],
                timelines: [...s.timelines, event('project', prjId, 'PROJECT_CREATED', `Created from approved proposal ${p.id}`), event('work_order', woId, 'WORK_ORDER_CREATED', 'Initial mobilization scheduled'), event('asset', assetId, 'LIFECYCLE_PLANNED', 'Asset created from project')],
                lifecycleEvents: [...s.lifecycleEvents, lifecycleFor(assetId, 'planned', 'Created from approved project')],
              }))
            }
          }

          return updated
        })

        set({ proposals })
      },

      createProjectFromProposal: (proposalId, actorUser, remarks = 'Administrative and financial sanction granted.') => {
        const proposal = get().proposals.find((item) => item.id === proposalId)
        if (!proposal || proposal.state === 'approved') return null
        get().transitionProposal(proposalId, 'approved', actorUser, remarks)
        return get().projects.find((project) => project.proposalId === proposalId) || null
      },

      recordDailyProgress: (payload) => set((s) => {
        const log = { id: `LOG-${Date.now()}`, recordedAt: new Date().toISOString(), photos: [], weather: 'Clear', labour: 0, machinery: '', materials: '', ...payload }
        return {
          executionLogs: [log, ...s.executionLogs],
          projects: s.projects.map((project) => project.id === payload.projectId ? { ...project, progress: Math.max(project.progress || 0, Number(payload.progress || 0)), status: 'execution', currentStage: 'execution' } : project),
          timelines: [...s.timelines, event('project', payload.projectId, 'DAILY_PROGRESS_RECORDED', `${payload.progress}% progress: ${payload.remarks || 'Site diary updated'}`)],
        }
      }),
      recordMeasurement: (payload) => set((s) => ({ measurementBooks: [{ id: `MB-${Date.now()}`, date: new Date().toISOString().split('T')[0], verified: false, ...payload }, ...s.measurementBooks], timelines: [...s.timelines, event('project', payload.projectId, 'MEASUREMENT_BOOK_ENTRY', payload.workItem)] })),
      recordBill: (payload) => set((s) => ({ bills: [{ id: `BILL-${Date.now()}`, status: 'pending_verification', createdAt: new Date().toISOString(), ...payload }, ...s.bills], timelines: [...s.timelines, event('project', payload.projectId, 'RUNNING_BILL_SUBMITTED', `${payload.amount} submitted for verification`)] })),
      completeProject: (projectId, actor, remarks = 'Engineer completion certification recorded.') => set((s) => ({
        projects: s.projects.map((project) => project.id === projectId ? { ...project, status: 'completed', currentStage: 'asset_handover', progress: 100, completionCertifiedAt: new Date().toISOString() } : project),
        assets: s.assets.map((asset) => asset.projectId === projectId ? { ...asset, status: 'active', lifecycleState: 'operational', handoverAt: new Date().toISOString() } : asset),
        timelines: [...s.timelines, event('project', projectId, 'PROJECT_COMPLETED', `${actor?.name || 'Officer'}: ${remarks}`)],
      })),

      createWorkOrder: (woPayload) => {
        const id = `WO-2026-${String(get().workOrders.length + 101).padStart(5, '0')}`
        const now = new Date().toISOString()
        const newWO = {
          id,
          state: 'assigned',
          type: woPayload.type || 'construction',
          contractor: woPayload.contractor || 'Department-approved contractor',
          estimatedCost: woPayload.estimatedCost || 0,
          expectedDuration: woPayload.expectedDuration || '15 days',
          completionDate: null,
          history: [{ timestamp: now, event: 'WORK_ORDER_ASSIGNED', note: 'Assigned to field staff.' }],
          ...woPayload
        }
        set((s) => ({
          workOrders: [...s.workOrders, newWO],
          projects: s.projects.map(p => p.id === woPayload.projectId ? { ...p, workOrderIds: [...p.workOrderIds, id], currentStage: 'work_order', status: 'work_order' } : p),
          timelines: [...s.timelines, event('work_order', id, 'WORK_ORDER_CREATED', `Assigned to ${newWO.assignedEngineer?.name || 'field staff'}`)]
        }))
        return newWO
      },

      updateWorkOrder: (woId, updates) => {
        set((s) => ({
          workOrders: s.workOrders.map(wo => wo.id === woId ? { ...wo, ...updates, history: [...(wo.history || []), { timestamp: new Date().toISOString(), event: `WORK_ORDER_${(updates.state || 'UPDATED').toUpperCase()}`, note: updates.remarks || 'Work order updated.' }] } : wo),
          timelines: [...s.timelines, event('work_order', woId, `WORK_ORDER_${(updates.state || 'UPDATED').toUpperCase()}`, updates.remarks || 'Work order updated')]
        }))
      },

      scheduleInspection: (insPayload) => {
        const id = `INS-2026-${String(get().inspections.length + 101).padStart(5, '0')}`
        const newIns = {
          id,
          status: 'scheduled',
          checklist: insPayload.checklist || [
            { item: 'Validate construction measurements', checked: false },
            { item: 'Verify material compliance parameters', checked: false },
            { item: 'Capture high-res geotagged site photo', checked: false }
          ],
          geoTaggedPhotos: [],
          complianceScore: 0,
          assetId: insPayload.assetId || get().workOrders.find((wo) => wo.id === insPayload.workOrderId)?.assetId || null,
          gpsValidated: false,
          signature: '',
          recommendation: '',
          ...insPayload
        }
        set((s) => ({
          inspections: [...s.inspections, newIns],
          projects: s.projects.map(p => p.id === insPayload.projectId ? { ...p, inspectionIds: [...p.inspectionIds, id], currentStage: 'inspection' } : p),
          timelines: [...s.timelines, event('inspection', id, 'INSPECTION_SCHEDULED', `Scheduled for ${newIns.date}`)]
        }))
        return newIns
      },

      completeInspection: (insId, checklist, score, remarks, photos, outcome = {}) => {
        set((s) => ({
          inspections: s.inspections.map((ins) => {
            if (ins.id !== insId) return ins
            return {
              ...ins,
              checklist,
              complianceScore: score,
              remarks,
              geoTaggedPhotos: photos || [],
              status: 'completed',
              gpsValidated: Boolean(outcome.gpsValidated ?? photos?.length),
              signature: outcome.signature || ins.signature || 'Digitally signed by inspector',
              recommendation: outcome.recommendation || (score >= 80 ? 'Pass — proceed to next milestone.' : 'Fail — corrective action required.'),
              result: score >= 80 ? 'pass' : 'fail',
            }
          }),
          assets: s.assets.map((asset) => {
            const ins = s.inspections.find((item) => item.id === insId)
            if (!ins?.assetId || asset.id !== ins.assetId) return asset
            return { ...asset, lastInspected: new Date().toISOString(), health: score, lifecycleState: score >= 80 ? 'operational' : 'repair', status: score >= 80 ? 'active' : 'maintenance' }
          }),
          lifecycleEvents: (() => { const ins = s.inspections.find((item) => item.id === insId); return ins?.assetId ? [...s.lifecycleEvents, lifecycleFor(ins.assetId, score >= 80 ? 'operational' : 'repair', `Inspection ${insId}: ${score}%`)] : s.lifecycleEvents })(),
          timelines: [...s.timelines, event('inspection', insId, 'INSPECTION_COMPLETED', `${score}% compliance; ${score >= 80 ? 'pass' : 'fail'}`)]
        }))
      },

      updateAssetLifecycle: (assetId, lifecycleState, details = '') => set((s) => ({
        assets: s.assets.map((asset) => asset.id === assetId ? { ...asset, lifecycleState, status: lifecycleState === 'operational' ? 'active' : lifecycleState } : asset),
        assetOverrides: { ...s.assetOverrides, [assetId]: { ...(s.assetOverrides[assetId] || {}), lifecycleState, status: lifecycleState === 'operational' ? 'active' : lifecycleState } },
        lifecycleEvents: [...s.lifecycleEvents, lifecycleFor(assetId, lifecycleState, details)],
        timelines: [...s.timelines, event('asset', assetId, `LIFECYCLE_${lifecycleState.toUpperCase()}`, details)],
      })),

      registerAsset: (payload) => {
        const id = `AST-2026-${String(get().assets.length + 101).padStart(5, '0')}`
        const asset = { id, status: 'planned', lifecycleState: 'planned', health: 100, attributes: {}, lastInspected: null, ...payload }
        set((s) => ({
          assets: [...s.assets, asset],
          maintenanceTasks: [...s.maintenanceTasks, { id: `MNT-2026-${String(s.maintenanceTasks.length + 101).padStart(5, '0')}`, assetId: id, departmentId: asset.departmentId, type: 'preventive', status: 'scheduled', priority: 'medium', dueDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0], title: `Preventive maintenance: ${asset.name}` }],
          lifecycleEvents: [...s.lifecycleEvents, lifecycleFor(id, 'planned', 'Asset registered')],
          timelines: [...s.timelines, event('asset', id, 'ASSET_REGISTERED', asset.name)]
        }))
        return asset
      },

      recordInventoryTransaction: (inventoryId, type, quantity, notes = '') => set((s) => {
        const item = s.inventory.find((record) => record.id === inventoryId)
        if (!item) return s
        const direction = ['receive', 'repair'].includes(type) ? 1 : -1
        const nextQuantity = Math.max(0, item.quantity + direction * Number(quantity))
        const updated = { ...item, quantity: nextQuantity, status: nextQuantity <= item.reorderLevel ? 'low_stock' : 'in_stock', updatedAt: new Date().toISOString(), transactions: [...(item.transactions || []), { type, quantity: Number(quantity), notes, at: new Date().toISOString() }] }
        return { inventory: s.inventory.map((record) => record.id === inventoryId ? updated : record), departmentNotifications: nextQuantity <= item.reorderLevel ? [...s.departmentNotifications, { id: `NTF-${Date.now()}`, departmentId: item.departmentId, type: 'inventory_alert', message: `${item.name} is at or below reorder level.`, createdAt: new Date().toISOString() }] : s.departmentNotifications }
      }),
      addInventoryItem: (payload) => set((s) => ({ inventory: [...s.inventory, { id: `INV-2026-${String(s.inventory.length + 101).padStart(5, '0')}`, quantity: 0, reorderLevel: 0, status: 'in_stock', updatedAt: new Date().toISOString(), transactions: [], ...payload }] })),
      saveBudget: (payload) => set((s) => ({ budgets: [...s.budgets.filter((budget) => budget.id !== payload.id), { id: payload.id || `BGT-2026-${String(s.budgets.length + 101).padStart(5, '0')}`, released: 0, expenditure: 0, additionalRequests: [], ...payload }] })),
      recordBudgetExpenditure: (budgetId, amount, remarks = '') => set((s) => ({ budgets: s.budgets.map((budget) => budget.id === budgetId ? { ...budget, expenditure: budget.expenditure + Number(amount), transactions: [...(budget.transactions || []), { type: 'expenditure', amount: Number(amount), remarks, at: new Date().toISOString() }] } : budget) })),
      saveContractor: (payload) => set((s) => ({ contractors: [...s.contractors.filter((contractor) => contractor.id !== payload.id), { id: payload.id || `CTR-2026-${String(s.contractors.length + 101).padStart(5, '0')}`, rating: 0, status: 'empanelled', projects: [], payments: [], penalties: [], documents: [], ...payload }] })),
      scheduleMeeting: (payload) => set((s) => ({ meetings: [...s.meetings, { id: `MTG-2026-${String(s.meetings.length + 101).padStart(5, '0')}`, attendance: [], actionItems: [], status: 'scheduled', ...payload }], departmentNotifications: [...s.departmentNotifications, { id: `NTF-${Date.now()}`, departmentId: payload.departmentId, type: 'meeting_reminder', message: `Meeting scheduled: ${payload.title}`, createdAt: new Date().toISOString() }] })),
      addKnowledge: (payload) => set((s) => ({ knowledge: [...s.knowledge, { id: `KB-2026-${String(s.knowledge.length + 101).padStart(5, '0')}`, publishedAt: new Date().toISOString(), ...payload }] })),
      addDepartmentNotification: (payload) => set((s) => ({ departmentNotifications: [...s.departmentNotifications, { id: `NTF-${Date.now()}`, createdAt: new Date().toISOString(), ...payload }] })),
      addDocument: (payload) => set((s) => ({ documents: [...s.documents, { id: `DOC-2026-${String(s.documents.length + 101).padStart(5, '0')}`, version: 1, uploadedAt: new Date().toISOString(), signatureStatus: 'Pending', ...payload }] })),

      completeMaintenance: (maintenanceId, notes = '') => set((s) => ({
        maintenanceTasks: s.maintenanceTasks.map((task) => task.id === maintenanceId ? { ...task, status: 'completed', completedAt: today(), notes } : task),
        timelines: [...s.timelines, event('maintenance', maintenanceId, 'MAINTENANCE_COMPLETED', notes || 'Maintenance task completed')]
      })),

      // Simulation Engine ticks (updates active projects, work orders, inspections)
      advanceSimulationTime: (hours = 6) => {
        // 1. Advance project milestones randomly
        const projects = get().projects.map((p) => {
          if (p.progress >= 100) return p
          const randomInc = Math.floor(Math.random() * 3) + 1 // 1-3%
          const newProgress = Math.min(100, p.progress + randomInc)

          // Update milestones based on progress
          const milestones = p.milestones.map((m, idx) => {
            const triggerVal = (idx + 1) * 25
            if (newProgress >= triggerVal) {
              return { ...m, status: 'completed' }
            }
            return m
          })

          const budgetUtilized = Math.round(p.budgetSanctioned * (newProgress / 100))

          const completed = newProgress === 100
          return {
            ...p,
            progress: newProgress,
            budgetUtilized,
            milestones,
            status: completed ? 'completed' : 'execution',
            currentStage: completed ? 'completed' : 'execution',
          }
        })

        // 2. Complete random scheduled inspections
        const inspections = get().inspections.map((ins) => {
          if (ins.status === 'scheduled' && Math.random() > 0.7) {
            const score = Math.floor(Math.random() * 20) + 80 // 80 to 100
            const checklist = ins.checklist.map(item => ({ ...item, checked: true }))
            return {
              ...ins,
              status: 'completed',
              checklist,
              complianceScore: score,
              remarks: 'Simulation verified: standard compliance parameters tested and approved by Field Inspector.',
              geoTaggedPhotos: ['https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80']
            }
          }
          return ins
        })

        // 3. Complete work orders whose projects progressed
        const workOrders = get().workOrders.map((wo) => {
          if (wo.state === 'in_progress' && Math.random() > 0.6) {
            return {
              ...wo,
              state: 'completed',
              completionDate: new Date().toISOString().split('T')[0],
              remarks: 'Work order successfully completed and verified by Executive Engineer.'
            }
          }
          return wo
        })

        const timelineEvents = projects.flatMap((project) => {
          const previous = get().projects.find((item) => item.id === project.id)
          return previous?.progress !== project.progress ? [event('project', project.id, 'SIMULATION_PROGRESS_UPDATED', `${previous.progress}% → ${project.progress}% after ${hours} simulated hours`)] : []
        })
        const overdueMaintenance = get().maintenanceTasks.map((task) => task.status === 'scheduled' && new Date(task.dueDate) < new Date()
          ? { ...task, status: 'missed', alert: 'Maintenance overdue — operational alert raised.' }
          : task)
        set((s) => ({ projects, inspections, workOrders, maintenanceTasks: overdueMaintenance, timelines: [...s.timelines, ...timelineEvents] }))
      }
    }),
    { name: 'ndisp-project-engine-v2' }
  )
)

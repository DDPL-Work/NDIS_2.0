import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CATEGORY_ROUTING_RULES, PRIORITY_CONFIG, DEPARTMENTS } from '../../config/constants'
import { distanceMeters } from '../../utils/geo'

// Initial seed dataset for demo resilience
const INITIAL_COMPLAINTS = [
  {
    id: 'CMP-2026-00101',
    ticketNumber: 'TK-WTR-88101',
    trackingCode: 'NDISP-WT-100101',
    categoryId: 'broken_handpump',
    categoryName: 'Broken Handpump / Borewell Defect',
    departmentId: 'water',
    priority: 'high',
    title: 'Submersible Pump Motor Burnt Out',
    description: 'The main handpump and connected JJM submersible motor at Rajgir Ward 02 has failed completely. Over 400 households without potable water.',
    location: {
      position: [85.4211, 25.0294],
      state: 'Bihar',
      districtId: 'nalanda',
      block: 'Silao',
      village: 'Rajgir',
      ward: 'Ward 02',
      address: 'Near Old Sun Temple, Rajgir Kund Road',
      nearestFacility: 'Primary Health Centre Rajgir (240m)',
      nearestLandmark: 'Old Sun Temple',
    },
    citizen: {
      name: 'Sunita Devi',
      phone: '+91 9835210492',
      email: 'sunita.d@bihar.gov.in',
      altPhone: '+91 9431029104',
      isMasked: false,
    },
    attachments: [
      {
        id: 'att-1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80',
        name: 'handpump_damaged.jpg',
        geotagged: true,
        coords: [85.4211, 25.0294],
        distMeters: 12,
        timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      },
    ],
    state: 'work_started',
    assignedOfficer: { name: 'Anil Mehta', role: 'dept_officer', dept: 'water' },
    assignedInspector: { name: 'Manoj Singh', role: 'field_inspector', dept: 'water' },
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    slaDueAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    slaHours: 48,
    inspectionDetails: {
      scheduledDate: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      completedDate: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      remarks: 'Inspected site. Motor winding burnt due to voltage spike. Replacement motor required.',
      materialsUsed: '1x 5HP Submersible Motor Assembly, 40m PVC Armored Cable',
      estimatedCost: 28500,
      completionTimeHours: 6,
      beforePhoto: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80',
      afterPhoto: null,
      signature: 'Manoj_Singh_JE_Sign',
    },
    resolutionDetails: null,
    citizenFeedback: null,
  },
  {
    id: 'CMP-2026-00102',
    ticketNumber: 'TK-URB-88102',
    trackingCode: 'NDISP-UR-100102',
    categoryId: 'garbage_accumulation',
    categoryName: 'Garbage Accumulation / Sanitation',
    departmentId: 'urban',
    priority: 'medium',
    title: 'Overflowing Municipal Garbage Dump near Market',
    description: 'Uncleared solid waste dump accumulating near Silao Market for 4 days creating health hazard.',
    location: {
      position: [85.4434, 25.1372],
      state: 'Bihar',
      districtId: 'nalanda',
      block: 'Silao',
      village: 'Silao Bazar',
      ward: 'Ward 04',
      address: 'Main Market Square, Silao',
      nearestFacility: 'Govt. High School Silao (150m)',
      nearestLandmark: 'Silao Main Chowk',
    },
    citizen: {
      name: 'Ramesh Yadav',
      phone: '+91 9122485920',
      email: 'ramesh.yadav@gmail.com',
      altPhone: '',
      isMasked: true,
    },
    attachments: [
      {
        id: 'att-2',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
        name: 'garbage_dump.jpg',
        geotagged: true,
        coords: [85.4434, 25.1372],
        distMeters: 8,
        timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      },
    ],
    state: 'submitted',
    assignedOfficer: { name: 'Sunil Verma', role: 'dept_officer', dept: 'urban' },
    assignedInspector: null,
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    slaDueAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    slaHours: 24,
    inspectionDetails: null,
    resolutionDetails: null,
    citizenFeedback: null,
  },
  {
    id: 'CMP-2026-00103',
    ticketNumber: 'TK-ELE-88103',
    trackingCode: 'NDISP-EL-100103',
    categoryId: 'power_outage',
    categoryName: 'Transformer Failure / Power Outage',
    departmentId: 'electricity',
    priority: 'urgent',
    title: '250 KVA Transformer Explosion',
    description: 'Distribution transformer caught fire causing blackout across entire Kund Area, Rajgir.',
    location: {
      position: [85.419, 25.031],
      state: 'Bihar',
      districtId: 'nalanda',
      block: 'Silao',
      village: 'Rajgir',
      ward: 'Ward 01',
      address: 'Kund Road, Substation feeder 3',
      nearestFacility: 'Rajgir Tourist Lodge (100m)',
      nearestLandmark: 'Hot Springs Entrance',
    },
    citizen: {
      name: 'Md. Iqbal',
      phone: '+91 9771204812',
      email: 'iqbal.rajgir@gmail.com',
      altPhone: '',
      isMasked: false,
    },
    attachments: [],
    state: 'escalated',
    assignedOfficer: { name: 'Praveen Kumar', role: 'dept_officer', dept: 'electricity' },
    assignedInspector: { name: 'Rajiv Sharma', role: 'field_inspector', dept: 'electricity' },
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    slaDueAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), // SLA Breached
    slaHours: 6,
    inspectionDetails: null,
    resolutionDetails: null,
    citizenFeedback: null,
  },
]

const INITIAL_AUDIT_LOGS = [
  {
    id: 'AUD-9001',
    complaintId: 'CMP-2026-00101',
    timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    actorName: 'Sunita Devi',
    actorRole: 'citizen',
    departmentId: 'water',
    action: 'COMPLAINT_REGISTERED',
    oldValue: null,
    newValue: 'submitted',
    location: 'Rajgir Ward 02 (85.4211°E, 25.0294°N)',
    device: 'Mobile Web App (Android 14)',
  },
  {
    id: 'AUD-9002',
    complaintId: 'CMP-2026-00101',
    timestamp: new Date(Date.now() - 34 * 3600 * 1000).toISOString(),
    actorName: 'Auto Routing Engine',
    actorRole: 'system',
    departmentId: 'water',
    action: 'AUTOMATIC_ROUTED',
    oldValue: 'submitted',
    newValue: 'assigned',
    location: 'NDISP Rule Engine v2.4',
    device: 'System Gateway',
  },
  {
    id: 'AUD-9003',
    complaintId: 'CMP-2026-00101',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    actorName: 'Anil Mehta',
    actorRole: 'dept_officer',
    departmentId: 'water',
    action: 'INSPECTION_SCHEDULED',
    oldValue: 'assigned',
    newValue: 'inspection_scheduled',
    location: 'Nalanda Water Dept HQ',
    device: 'Desktop (Chrome 127)',
  },
  {
    id: 'AUD-9004',
    complaintId: 'CMP-2026-00101',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    actorName: 'Manoj Singh',
    actorRole: 'field_inspector',
    departmentId: 'water',
    action: 'FIELD_WORK_STARTED',
    oldValue: 'inspection_completed',
    newValue: 'work_started',
    location: 'Rajgir Kund Road (GPS Verified)',
    device: 'NDISP Inspector App (Mobile PWA)',
  },
]

const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-1',
    complaintId: 'CMP-2026-00101',
    targetRole: 'citizen',
    recipientName: 'Sunita Devi',
    channel: 'sms',
    message: 'Your complaint CMP-2026-00101 has been assigned to Manoj Singh (Field Inspector, Water Dept). Work started.',
    read: false,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    departmentId: 'water',
  },
  {
    id: 'NOTIF-2',
    complaintId: 'CMP-2026-00103',
    targetRole: 'district_collector',
    recipientName: 'Dr. Ashok Kumar Sinha',
    channel: 'portal',
    message: 'CRITICAL ESCALATION: Complaint CMP-2026-00103 (Electricity Transformer Blackout) has BREACHED 6h SLA target!',
    read: false,
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    departmentId: 'electricity',
  },
]

export const useComplaintEngine = create(
  persist(
    (set, get) => ({
      complaints: INITIAL_COMPLAINTS,
      auditLogs: INITIAL_AUDIT_LOGS,
      notifications: INITIAL_NOTIFICATIONS,

      // Simulation engine flags
      simulationActive: false,
      simSpeedMultiplier: 1,
      simClockTime: new Date().toISOString(),

      // Automatic Routing Engine (Part 4)
      routeComplaintPayload(payload) {
        // Find matching routing rule
        const matchedRule = CATEGORY_ROUTING_RULES.find((r) => r.categoryId === payload.categoryId) || {
          departmentId: payload.departmentId || 'pwd',
          defaultPriority: 'medium',
          slaHours: 24,
        }

        const deptId = matchedRule.departmentId
        const priority = payload.priority || matchedRule.defaultPriority
        const slaHours = PRIORITY_CONFIG[priority]?.defaultSlaHours || matchedRule.slaHours

        const count = get().complaints.length + 1
        const id = `CMP-2026-${String(100 + count).padStart(5, '0')}`
        const ticketNumber = `TK-${deptId.slice(0, 3).toUpperCase()}-${88100 + count}`
        const trackingCode = `NDISP-${deptId.slice(0, 2).toUpperCase()}-${100100 + count}`

        const now = new Date()
        const slaDueAt = new Date(now.getTime() + slaHours * 3600 * 1000).toISOString()

        const newComplaint = {
          id,
          ticketNumber,
          trackingCode,
          categoryId: payload.categoryId,
          categoryName: payload.categoryName || matchedRule.categoryName || 'General Infrastructure Defect',
          departmentId: deptId,
          priority,
          title: payload.title,
          description: payload.description,
          location: payload.location,
          citizen: payload.citizen,
          attachments: payload.attachments || [],
          state: 'assigned', // Automatically routed to assigned queue!
          assignedOfficer: { name: 'Officer ' + deptId.toUpperCase(), role: 'dept_officer', dept: deptId },
          assignedInspector: { name: 'Inspector ' + deptId.toUpperCase(), role: 'field_inspector', dept: deptId },
          createdAt: now.toISOString(),
          slaDueAt,
          slaHours,
          inspectionDetails: null,
          resolutionDetails: null,
          citizenFeedback: null,
        }

        // Add audit record
        const newAudit = {
          id: `AUD-${Date.now()}`,
          complaintId: id,
          timestamp: now.toISOString(),
          actorName: payload.citizen?.name || 'Citizen',
          actorRole: 'citizen',
          departmentId: deptId,
          action: 'COMPLAINT_REGISTERED_AUTO_ROUTED',
          oldValue: 'submitted',
          newValue: 'assigned',
          location: `${payload.location?.village || 'District'} (${payload.location?.position?.[1]?.toFixed(4)}°N, ${payload.location?.position?.[0]?.toFixed(4)}°E)`,
          device: 'Citizen Web Portal',
        }

        // Add notifications
        const notifCitizen = {
          id: `NOTIF-CIT-${Date.now()}`,
          complaintId: id,
          targetRole: 'citizen',
          recipientName: payload.citizen?.name || 'Citizen',
          channel: 'sms',
          message: `Complaint ${id} registered. Tracking Code: ${trackingCode}. Automatically routed to ${DEPARTMENTS.find((d) => d.id === deptId)?.label}. SLA: ${slaHours}h.`,
          read: false,
          createdAt: now.toISOString(),
          departmentId: deptId,
        }

        const notifOfficer = {
          id: `NOTIF-OFF-${Date.now()}`,
          complaintId: id,
          targetRole: 'dept_officer',
          recipientName: 'Department Officer',
          channel: 'portal',
          message: `NEW ASSIGNED TICKET: ${id} (${priority.toUpperCase()}) in ${payload.location?.village || 'District'}.`,
          read: false,
          createdAt: now.toISOString(),
          departmentId: deptId,
        }

        set((s) => ({
          complaints: [newComplaint, ...s.complaints],
          auditLogs: [newAudit, ...s.auditLogs],
          notifications: [notifCitizen, notifOfficer, ...s.notifications],
        }))

        return newComplaint
      },

      // Transition complaint state machine
      transitionComplaintState(complaintId, nextState, actorUser, remarks = '', extraData = {}) {
        const now = new Date().toISOString()
        const complaints = get().complaints.map((c) => {
          if (c.id !== complaintId) return c

          const updated = {
            ...c,
            state: nextState,
            ...extraData,
          }

          if (nextState === 'resolved') {
            updated.resolutionDetails = {
              resolvedAt: now,
              resolvedBy: actorUser.name,
              remarks: remarks || 'Resolved and verified by Department Officer.',
              photos: extraData.resolutionPhotos || [c.inspectionDetails?.afterPhoto || c.attachments?.[0]?.url].filter(Boolean),
            }
          }

          if (nextState === 'closed') {
            updated.closedAt = now
          }

          return updated
        })

        const targetComplaint = complaints.find((c) => c.id === complaintId)

        // Audit Record
        const audit = {
          id: `AUD-${Date.now()}`,
          complaintId,
          timestamp: now,
          actorName: actorUser?.name || 'System User',
          actorRole: actorUser?.role || 'user',
          departmentId: targetComplaint?.departmentId || 'general',
          action: `WORKFLOW_TRANSITION_${nextState.toUpperCase()}`,
          oldValue: get().complaints.find((c) => c.id === complaintId)?.state,
          newValue: nextState,
          location: actorUser?.jurisdiction?.village || 'District Office',
          device: 'NDISP Web Gateway',
        }

        // Notification
        const notification = {
          id: `NOTIF-${Date.now()}`,
          complaintId,
          targetRole: 'citizen',
          recipientName: targetComplaint?.citizen?.name || 'Citizen',
          channel: 'portal',
          message: `Update on Ticket ${complaintId}: Status is now "${nextState.replace(/_/g, ' ').toUpperCase()}". ${remarks ? `Remarks: ${remarks}` : ''}`,
          read: false,
          createdAt: now,
          departmentId: targetComplaint?.departmentId,
        }

        set((s) => ({
          complaints,
          auditLogs: [audit, ...s.auditLogs],
          notifications: [notification, ...s.notifications],
        }))
      },

      // Simulation Engine Functions (Part 16)
      toggleSimulation(active) {
        set({ simulationActive: active })
      },

      setSimSpeed(speed) {
        set({ simSpeedMultiplier: speed })
      },

      advanceSimulationTime(hours = 6) {
        const now = new Date()
        const complaints = get().complaints.map((c) => {
          // Check for SLA breaches
          const isPending = !['resolved', 'closed', 'rejected', 'cancelled'].includes(c.state)
          const isBreached = isPending && new Date(c.slaDueAt).getTime() < now.getTime() + hours * 3600 * 1000

          if (isBreached && c.state !== 'escalated') {
            // Trigger escalation notification
            const notifCollector = {
              id: `NOTIF-ESC-${Date.now()}-${c.id}`,
              complaintId: c.id,
              targetRole: 'district_collector',
              recipientName: 'District Collector',
              channel: 'portal',
              message: `SIMULATION ESCALATION: Complaint ${c.id} in ${c.departmentId.toUpperCase()} has BREACHED SLA target! Auto-escalating to Executive Review.`,
              read: false,
              createdAt: now.toISOString(),
              departmentId: c.departmentId,
            }
            set((s) => ({ notifications: [notifCollector, ...s.notifications] }))
            return { ...c, state: 'escalated' }
          }
          return c
        })

        set({ complaints })
      },

      simulateRandomComplaintCreation() {
        const categories = CATEGORY_ROUTING_RULES
        const randomCategory = categories[Math.floor(Math.random() * categories.length)]
        const villages = ['Silao', 'Rajgir', 'Bihar Sharif', 'Harnaut', 'Sohsarai']
        const randomVillage = villages[Math.floor(Math.random() * villages.length)]

        const payload = {
          categoryId: randomCategory.categoryId,
          categoryName: randomCategory.categoryName,
          title: `Simulated Issue: ${randomCategory.categoryName}`,
          description: `Auto-generated simulation ticket reported in ${randomVillage}. Requires immediate sector response.`,
          priority: randomCategory.defaultPriority,
          location: {
            position: [85.42 + Math.random() * 0.05, 25.02 + Math.random() * 0.05],
            state: 'Bihar',
            districtId: 'nalanda',
            block: 'Silao',
            village: randomVillage,
            ward: 'Ward ' + Math.floor(1 + Math.random() * 8),
            address: `Near ${randomVillage} Main Square`,
            nearestFacility: `${randomCategory.departmentId.toUpperCase()} Center (${Math.floor(100 + Math.random() * 400)}m)`,
          },
          citizen: {
            name: `Citizen ${Math.floor(100 + Math.random() * 900)}`,
            phone: `+91 9${Math.floor(100000009 + Math.random() * 899999990)}`,
            email: 'simulated.citizen@bihar.gov.in',
            isMasked: Math.random() > 0.5,
          },
        }

        get().routeComplaintPayload(payload)
      },

      simulateEngineerInspectionAction(complaintId) {
        const user = { name: 'Manoj Singh (Inspector)', role: 'field_inspector' }
        const extra = {
          inspectionDetails: {
            scheduledDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            completedDate: new Date().toISOString(),
            remarks: 'Field inspection completed. Tested equipment and replaced defective fittings. Site geotag verified.',
            materialsUsed: 'Standard Field Repair Kit, Cable Joints & Seals',
            estimatedCost: 14200,
            completionTimeHours: 3.5,
            beforePhoto: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80',
            afterPhoto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
            signature: 'Manoj_Singh_JE_Sign',
          },
        }

        get().transitionComplaintState(complaintId, 'work_completed', user, 'Field inspection and work completed by Engineer.', extra)
      },
    }),
    { name: 'ndisp-complaint-engine-v2' }
  )
)

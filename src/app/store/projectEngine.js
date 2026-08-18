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

// Execution-lifecycle engine — a reactive projection layer for work orders,
// inspections, maintenance, inventory and documents. Proposals and projects
// are backend-authoritative (GET /api/proposals/, GET /api/projects/); this
// store starts EMPTY and only holds records the execution workspaces create
// locally while work-order endpoints remain a BACKEND GAP.

export const useProjectEngine = create(
  persist(
    (set, get) => ({
      proposals: [],
      projects: [],
      workOrders: [],
      inspections: [],
      officers: [],
      // Execution-lifecycle collections. These are deliberately kept in the
      // same reactive transaction as projects so GIS, KPIs and operational
      // workspaces cannot drift from one another.
      assets: [],
      assetOverrides: {},
      maintenanceTasks: [],
      documents: [],
      timelines: [],
      lifecycleEvents: [],
      inventory: [],
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

      advanceSimulationTime: (hours = 6) => {
        // Simulation ticks are kept OFF for proposals/projects — those are
        // backend-authoritative now. The tick only advances local execution
        // projections (maintenance overdue markers).
        const overdueMaintenance = get().maintenanceTasks.map((task) => task.status === 'scheduled' && new Date(task.dueDate) < new Date()
          ? { ...task, status: 'missed', alert: 'Maintenance overdue — operational alert raised.' }
          : task)
        set((s) => ({ maintenanceTasks: overdueMaintenance, timelines: [...s.timelines, event('system', 'simulation', 'SIMULATION_TICK', `${hours} simulated hours`)] }))
      }
    }),
    { name: 'ndisp-project-engine-v3' }
  )
)
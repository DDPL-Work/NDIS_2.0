import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { DepartmentContext } from './DepartmentContext'
import { DepartmentRegistry } from './DepartmentRegistry'
import { useAuthStore } from '../../../app/store/authStore'
import { useComplaintEngine } from '../../../app/store/complaintEngine'
import { useProjectEngine } from '../../../app/store/projectEngine'
import { useIdentityStore } from '../identity/identityStore'
import { useAuthorization } from '../identity/hooks/useAuthorization'
import { departmentSlugFromName } from '../../../api/mappers/complaintMapper'

export default function DepartmentWorkspaceProvider({ departmentIdOverride, children }) {
  const user = useAuthStore((s) => s.user)
  // The authenticated session is the only department source. The department
  // slug is derived from the backend profile name (never hardcoded); an
  // override is retained solely for embedded/test use, never from routing.
  const activeDeptId = useMemo(() => {
    if (departmentIdOverride) return departmentIdOverride
    const rawId = String(user?.departmentId || '')
    if (rawId && DepartmentRegistry.get(rawId)?.id === rawId) return rawId
    const profileName = typeof user?.department === 'object' ? user.department.name || user.department.label : ''
    const slug = departmentSlugFromName(user?.departmentName || profileName || '')
    if (slug && DepartmentRegistry.get(slug)?.id === slug) return slug
    return rawId || 'health'
  }, [departmentIdOverride, user?.departmentId, user?.departmentName, user?.department])
  const employees = useIdentityStore((s) => s.employees)
  const roles = useIdentityStore((s) => s.roles)
  const { permissions, can } = useAuthorization()
  const complaints = useComplaintEngine((s) => s.complaints)

  // ProjectEngine store states
  const proposals = useProjectEngine((s) => s.proposals)
  const projects = useProjectEngine((s) => s.projects)
  const workOrders = useProjectEngine((s) => s.workOrders)
  const inspections = useProjectEngine((s) => s.inspections)
  const officers = useProjectEngine((s) => s.officers)
  const lifecycleAssets = useProjectEngine((s) => s.assets)
  const assetOverrides = useProjectEngine((s) => s.assetOverrides)
  const maintenanceTasks = useProjectEngine((s) => s.maintenanceTasks)
  const documents = useProjectEngine((s) => s.documents)
  const timelines = useProjectEngine((s) => s.timelines)
  const lifecycleEvents = useProjectEngine((s) => s.lifecycleEvents)
  const inventory = useProjectEngine((s) => s.inventory)
  const budgets = useProjectEngine((s) => s.budgets)
  const contractors = useProjectEngine((s) => s.contractors)
  const meetings = useProjectEngine((s) => s.meetings)
  const knowledge = useProjectEngine((s) => s.knowledge)
  const departmentNotifications = useProjectEngine((s) => s.departmentNotifications)

  // Load configuration dynamically from registry, but always display the
  // department name from the authenticated user profile (GET /api/auth/me/)
  // — never the static registry label. This flows into every dept.label read.
  const deptConfig = useMemo(() => {
    const config = DepartmentRegistry.get(activeDeptId) || {}
    const name = String(user?.departmentName || '').trim()
    return { ...config, label: name || config.label }
  }, [activeDeptId, user?.departmentName])

  // Filter complaints for active department (backend ids vs. app slugs)
  const departmentComplaints = useMemo(() => {
    return complaints.filter((c) => c.departmentSlug === activeDeptId)
  }, [complaints, activeDeptId])

  // Filter project-related items
  const departmentProposals = useMemo(() => {
    return proposals.filter((p) => p.departmentId === activeDeptId)
  }, [proposals, activeDeptId])

  const departmentProjects = useMemo(() => {
    return projects.filter((p) => p.departmentId === activeDeptId)
  }, [projects, activeDeptId])

  const departmentWorkOrders = useMemo(() => {
    return workOrders.filter((w) => w.departmentId === activeDeptId)
  }, [workOrders, activeDeptId])

  const departmentInspections = useMemo(() => {
    return inspections.filter((i) => i.departmentId === activeDeptId)
  }, [inspections, activeDeptId])

  const departmentOfficers = useMemo(() => {
    return officers.filter((o) => o.dept === activeDeptId)
  }, [officers, activeDeptId])

  const departmentAssets = useMemo(() => [
    ...(deptConfig.sampleAssets || []).map((asset) => ({ ...asset, ...(assetOverrides[asset.id] || {}), departmentId: activeDeptId, lifecycleState: assetOverrides[asset.id]?.lifecycleState || asset.lifecycleState || 'operational', health: asset.health || 85 })),
    ...lifecycleAssets.filter((asset) => asset.departmentId === activeDeptId),
  ], [deptConfig, lifecycleAssets, assetOverrides, activeDeptId])
  const departmentMaintenance = useMemo(() => {
    const stored = maintenanceTasks.filter((task) => task.departmentId === activeDeptId)
    const scheduledAssetIds = new Set(stored.map((task) => task.assetId))
    return [...stored, ...departmentAssets.filter((asset) => !scheduledAssetIds.has(asset.id)).map((asset) => ({ id: `MNT-BASE-${asset.id}`, assetId: asset.id, departmentId: activeDeptId, type: 'preventive', status: 'scheduled', priority: 'medium', dueDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0], title: `Preventive maintenance: ${asset.name}` }))]
  }, [maintenanceTasks, activeDeptId, departmentAssets])
  const departmentDocuments = useMemo(() => documents.filter((document) => departmentProjects.some((project) => project.id === document.projectId)), [documents, departmentProjects])
  const departmentTimelines = useMemo(() => timelines.filter((item) => {
    const project = departmentProjects.some((p) => p.id === item.entityId)
    const workOrder = departmentWorkOrders.some((w) => w.id === item.entityId)
    const inspection = departmentInspections.some((i) => i.id === item.entityId)
    return project || workOrder || inspection
  }), [timelines, departmentProjects, departmentWorkOrders, departmentInspections])
  const departmentInventory = useMemo(() => inventory.filter((item) => item.departmentId === activeDeptId), [inventory, activeDeptId])
  const departmentBudgets = useMemo(() => budgets.filter((item) => item.departmentId === activeDeptId), [budgets, activeDeptId])
  const departmentContractors = useMemo(() => contractors.filter((item) => item.departmentId === activeDeptId), [contractors, activeDeptId])
  const departmentMeetings = useMemo(() => meetings.filter((item) => item.departmentId === activeDeptId), [meetings, activeDeptId])
  const departmentKnowledge = useMemo(() => knowledge.filter((item) => !item.departmentId || item.departmentId === activeDeptId), [knowledge, activeDeptId])
  const resourceNotifications = useMemo(() => departmentNotifications.filter((item) => item.departmentId === activeDeptId), [departmentNotifications, activeDeptId])
  const analytics = useMemo(() => ({
    budgetUsed: departmentBudgets.reduce((sum, item) => sum + item.expenditure, 0), budgetAllocated: departmentBudgets.reduce((sum, item) => sum + item.allocation, 0),
    inventoryLow: departmentInventory.filter((item) => item.status === 'low_stock').length,
    officerProductivity: departmentOfficers.length ? Math.round(departmentOfficers.reduce((sum, officer) => sum + officer.inspectionCount, 0) / departmentOfficers.length) : 0,
    assetHealth: departmentAssets.length ? Math.round(departmentAssets.reduce((sum, asset) => sum + (asset.health || 85), 0) / departmentAssets.length) : 0,
  }), [departmentBudgets, departmentInventory, departmentOfficers, departmentAssets])

  // Compute live KPIs reacting to simulation engine
  const kpiMetrics = useMemo(() => {
    const total = departmentComplaints.length
    const resolved = departmentComplaints.filter((c) => ['resolved', 'closed'].includes(c.state)).length
    const pending = total - resolved
    const escalated = departmentComplaints.filter((c) => c.state === 'escalated').length
    const slaBreached = departmentComplaints.filter((c) => new Date(c.slaDueAt).getTime() < Date.now() && !['resolved', 'closed'].includes(c.state)).length
    const slaPct = total ? Math.round(((total - slaBreached) / total) * 100) : 100

    return {
      total,
      pending,
      resolved,
      escalated,
      slaBreached,
      slaPct,
    }
  }, [departmentComplaints])

  const contextValue = useMemo(() => {
    return {
      dept: deptConfig,
      deptName: String(user?.departmentName || deptConfig?.label || '').trim(),
      currentDepartment: deptConfig,
      currentDepartmentConfig: deptConfig,
      user,
      currentUser: user,
      currentRole: user?.role,
      permissions,
      can,
      employees: employees.filter((employee) => employee.departmentId === activeDeptId),
      roles,
      complaints: departmentComplaints,
      kpis: kpiMetrics,
      assets: departmentAssets,
      proposals: departmentProposals,
      projects: departmentProjects,
      workOrders: departmentWorkOrders,
      inspections: departmentInspections,
      officers: departmentOfficers,
      maintenanceTasks: departmentMaintenance,
      documents: departmentDocuments,
      timelines: departmentTimelines,
      lifecycleEvents,
      inventory: departmentInventory, budgets: departmentBudgets, contractors: departmentContractors, meetings: departmentMeetings, knowledge: departmentKnowledge, resourceNotifications, analytics,
    }
  }, [deptConfig, user, permissions, can, employees, roles, activeDeptId, departmentComplaints, kpiMetrics, departmentAssets, departmentProposals, departmentProjects, departmentWorkOrders, departmentInspections, departmentOfficers, departmentMaintenance, departmentDocuments, departmentTimelines, lifecycleEvents, departmentInventory, departmentBudgets, departmentContractors, departmentMeetings, departmentKnowledge, resourceNotifications, analytics])

  return (
    <DepartmentContext.Provider value={contextValue}>
      {children || <Outlet />}
    </DepartmentContext.Provider>
  )
}

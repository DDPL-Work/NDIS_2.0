// Department Decision Support Workspace — ONE reusable workspace for EVERY
// department.  The department config (departmentConfigs.js) decides which
// sections render, which layers load, which indicators and KPIs show and how
// priority is computed.  Adding a department never adds a component.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Map, Target, BarChart3, Boxes, MessageSquare, FolderKanban, ListChecks, Lock, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useProjectEngine } from '../../app/store/projectEngine'
import { getDepartmentConfig, canAccessDepartment, accessibleDepartmentConfigs } from './departmentConfigs'
import { buildRenderPlan } from './departmentModel'
import { loadDepartmentData } from '../../api/departmentSupportApi'
import PageHeader from '../../components/ui/PageHeader'
import Tabs from '../../components/ui/Tabs'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Skeleton from '../../components/ui/Skeleton'
import KpiSection from './sections/KpiSection'
import MapSection from './sections/MapSection'
import PrioritySection from './sections/PrioritySection'
import GapSection from './sections/GapSection'
import ResourceSection from './sections/ResourceSection'
import CitizenSection from './sections/CitizenSection'
import ProjectSection from './sections/ProjectSection'
import ActionSection from './sections/ActionSection'
import DrilldownPanel from './sections/DrilldownPanel'

const SECTION_TABS = {
  situation: { label: 'Situation', icon: LayoutDashboard, component: KpiSection },
  map: { label: 'Map', icon: Map, component: MapSection },
  priorities: { label: 'Priorities', icon: Target, component: PrioritySection },
  gaps: { label: 'Gaps', icon: BarChart3, component: GapSection },
  resources: { label: 'Resources', icon: Boxes, component: ResourceSection },
  citizen: { label: 'Citizen', icon: MessageSquare, component: CitizenSection },
  projects: { label: 'Projects & Budget', icon: FolderKanban, component: ProjectSection },
  actions: { label: 'Actions', icon: ListChecks, component: ActionSection },
}

export default function DepartmentDecisionWorkspace({ departmentId, adminView = false, onOpenWorkflow, onOpenSpatial }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const config = useMemo(() => getDepartmentConfig(departmentId), [departmentId])

  const complaints = useComplaintEngine((s) => s.complaints)
  const hydrateComplaints = useComplaintEngine((s) => s.hydrate)
  const proposals = useProjectEngine((s) => s.proposals)
  const projects = useProjectEngine((s) => s.projects)
  const budgets = useProjectEngine((s) => s.budgets)
  const workOrders = useProjectEngine((s) => s.workOrders)
  const maintenanceTasks = useProjectEngine((s) => s.maintenanceTasks)

  const [state, setState] = useState({ plan: null, loadedAt: null, loading: true, error: null })
  const [activeTab, setActiveTab] = useState(config.sections?.[0] || 'situation')
  const [selectedEntity, setSelectedEntity] = useState(null)

  useEffect(() => { hydrateComplaints().catch(() => {}) }, [hydrateComplaints])

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await loadDepartmentData(config)
      const plan = buildRenderPlan({
        config,
        catalog: data.catalog,
        facilities: data.facilities,
        layersByName: data.layersByName,
        populationLayers: data.populationLayers,
        roadLayers: data.roadLayers,
        hazardLayerData: data.hazardLayerData,
      })
      data.endpointsPromise?.then((endpoints) => { plan.endpoints = endpoints }).catch(() => {})
      setState({ plan, loadedAt: new Date(), loading: false, error: null })
    } catch (error) {
      setState({ plan: null, loadedAt: null, loading: false, error: error?.message || 'Failed to load department data' })
    }
  }, [config])

  useEffect(() => { load() }, [load])
  useEffect(() => { setActiveTab(config.sections?.[0] || 'situation') }, [config])

  const accessible = canAccessDepartment(user, departmentId)
  const switcher = useMemo(() => (adminView ? accessibleDepartmentConfigs(user) : []), [adminView, user])

  const sections = (config.sections || [])
    .map((key) => ({ key, ...SECTION_TABS[key] }))
    .filter((section) => section.component)

  const handleAction = useCallback((action, entity) => {
    if (action.key === 'propose' || action.key === 'inspect') {
      if (onOpenWorkflow) onOpenWorkflow(action.key, entity, config)
      else navigate(adminView ? '/admin/approvals' : '/linedept/planning/new')
      return
    }
    if (action.key === 'escalate') {
      if (onOpenWorkflow) onOpenWorkflow('escalate', entity, config)
    }
  }, [navigate, adminView, onOpenWorkflow, config])

  if (!accessible) {
    return (
      <div className="m-6 rounded-xl border border-alert-200 bg-alert-50 p-10 text-center">
        <Lock className="mx-auto text-alert-500 mb-2" size={28} />
        <h1 className="text-lg font-semibold text-ink-950">403 · Access denied</h1>
        <p className="mt-1 text-sm text-ink-600">Your role does not grant access to the {config.departmentName} decision support workspace.</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 space-y-5">
      <PageHeader
        eyebrow={adminView ? 'District Administration · Department Decision Support' : 'Department Decision Support'}
        title={config.departmentName}
        description={config.description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {adminView && switcher.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {switcher.map((department) => (
                  <button
                    key={department.departmentId}
                    data-testid={`dept-switcher-${department.departmentId}`}
                    onClick={() => navigate(`/admin/department/${department.departmentId}`)}
                    className={`rounded-full px-3 py-1 text-[11.5px] font-medium border transition ${String(department.departmentId) === String(departmentId) ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'}`}
                  >
                    {department.departmentName}
                  </button>
                ))}
              </div>
            )}
            {!adminView && <Badge tone="info">Own department workspace</Badge>}
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={load} loading={state.loading}>Refresh</Button>
          </div>
        }
      />

      {state.error && (
        <div className="rounded-lg border border-alert-200 bg-alert-50 p-4 text-[13px] text-alert-700">
          Failed to load department data: {state.error}. The workspace renders from the real backend — retry or check the backend.
        </div>
      )}

      {state.loading && !state.plan ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      ) : state.plan ? (
        <>
          <Tabs
            tabs={sections.map((section) => ({ value: section.key, label: section.label }))}
            active={activeTab}
            onChange={setActiveTab}
          />
          <div className="space-y-5">
            {sections.map((section) => {
              const Section = section.component
              if (section.key !== activeTab) return null
              return <Section key={section.key} plan={state.plan} departmentId={departmentId} loadedAt={state.loadedAt} complaints={complaints} proposals={proposals} projects={projects} budgets={budgets} workOrders={workOrders} maintenanceTasks={maintenanceTasks} onSelectEntity={setSelectedEntity} onOpenSpatial={onOpenSpatial} onOpenWorkflow={onOpenWorkflow} onAction={handleAction} />
            })}
          </div>
        </>
      ) : null}

      <DrilldownPanel entity={selectedEntity} config={config} onClose={() => setSelectedEntity(null)} onAction={handleAction} />
    </div>
  )
}
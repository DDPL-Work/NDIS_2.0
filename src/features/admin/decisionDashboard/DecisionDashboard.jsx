import { useRef, useState, useEffect, useCallback } from 'react'
import { RefreshCw, Crosshair, Activity } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import ComplaintDetailHub from '../../shared/ComplaintDetailHub'
import { useDecisionDashboard } from './useDecisionDashboard'
import { SECTION_LABELS, DASHBOARD_SCOPES } from './decisionDashboardConfig'
import KpiRow from './KpiRow'
import SituationMap from './SituationMap'
import PriorityAreas from './PriorityAreas'
import HealthSnapshot from './HealthSnapshot'
import CitizenSignals from './CitizenSignals'
import PlanningPipeline from './PlanningPipeline'
import BudgetCard from './BudgetCard'
import ActionQueue from './ActionQueue'
import PriorityDetailPanel from './PriorityDetailPanel'
import { formatDateTime } from '../../../utils/format'

// Defer mounting expensive sections (Leaflet map + heavy lists) until they
// scroll near the viewport.  The data is already in memory — this only avoids
// paying for DOM/map initialisation before the user reaches them.
function LazyMount({ children, className = '', placeholder }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') { setVisible(true); return }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setVisible(true); observer.disconnect() }
    }, { rootMargin: '300px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={className}>{visible ? children : placeholder}</div>
}

const SECTION_ID = {
  kpis: 'critical-signals',
  situationMap: 'district-situation-map',
  priorityAreas: 'priority-areas',
  health: 'health-snapshot',
  signals: 'citizen-signals',
  pipeline: 'planning-pipeline',
  budget: 'budget',
  actions: 'action-queue',
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function DecisionDashboard() {
  const {
    role, district, districtId, config, complaints,
    complaintsHydrating, sources, budget, derived, refetch,
  } = useDecisionDashboard()

  const [selectedArea, setSelectedArea] = useState(null)
  const [complaintToOpen, setComplaintToOpen] = useState(null)
  const [proposalToOpen, setProposalToOpen] = useState(null)

  const scope = DASHBOARD_SCOPES[config.scope] || DASHBOARD_SCOPES.district

  const handleSelectArea = useCallback((area) => {
    setSelectedArea(area)
    scrollToSection(SECTION_ID.situationMap)
  }, [])

  const handleOpenComplaint = useCallback((complaint) => {
    if (!complaint) return
    setComplaintToOpen(String(complaint.id || complaint.complaintId || complaint))
    setSelectedArea(null)
  }, [])

  const handleOpenProposal = useCallback((proposal) => {
    if (!proposal) return
    setProposalToOpen(proposal)
    setSelectedArea(null)
  }, [])

  const handleDrill = useCallback((kpi) => {
    if (kpi.key === 'critical_gaps' || kpi.key === 'facilities_at_risk') {
      const target = derived.areas[0]
      if (target) { setSelectedArea(target); scrollToSection(SECTION_ID.situationMap) }
    } else if (kpi.key === 'high_priority_locations') {
      scrollToSection(SECTION_ID.priorityAreas)
    } else if (kpi.key === 'projects_pending_action') {
      scrollToSection(SECTION_ID.pipeline)
    }
  }, [derived.areas])

  const handleAction = useCallback((item) => {
    if (item.complaintId) handleOpenComplaint(item.complaintId)
    else if (item.proposalId) {
      const proposal = derived.pipeline.flatMap((stage) => stage.items).find((p) => String(p.proposalId) === String(item.proposalId))
      handleOpenProposal(proposal || item.entity)
    } else if (item.type === 'inspection_due') {
      scrollToSection(SECTION_ID.pipeline)
    }
  }, [handleOpenComplaint, handleOpenProposal, derived.pipeline])

  const sections = config.sections || []
  const hasSection = (key) => sections.includes(key)

  const lastLoaded = sources.facilities.loadedAt || sources.proposals.loadedAt || sources.dashboard.loadedAt

  const dashboardLoading = sources.dashboard.status === 'loading' || sources.proposals.status === 'loading' || sources.facilities.status === 'loading'
  const primaryError = [sources.dashboard, sources.proposals, sources.facilities, sources.projectSummary].find((s) => s.status === 'error')

  return (
    <div className="min-h-full p-3 sm:p-6 space-y-5">
      <PageHeader
        eyebrow={`Admin Portal · ${String(role).toUpperCase()}`}
        title={config.title}
        description={`${scope.label} decision view — ${district?.label || districtId}. Everything below is computed from live backend data; hover any number to see its source and definition.`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {lastLoaded && <Badge tone="ink" className="kbd-mono hidden sm:inline-flex">Updated {formatDateTime(lastLoaded)}</Badge>}
            <Button size="sm" variant="outline" onClick={refetch} disabled={dashboardLoading}>
              <RefreshCw size={13} className={dashboardLoading ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        }
      />

      {primaryError && (
        <div className="rounded-xl border border-alert-200 bg-alert-50 px-4 py-3 text-[13px] text-alert-700">
          Some data sources failed to load: {primaryError.error}. The dashboard keeps working from the sources that succeeded — use Refresh to retry.
        </div>
      )}

      {complaintsHydrating && (
        <div className="rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3 text-[12.5px] text-ink-500 flex items-center gap-2">
          <Activity size={14} className="animate-pulse text-ink-400" /> Loading the shared complaint registry…
        </div>
      )}

      <div className="space-y-5">
        {hasSection('kpis') && (
          <KpiRow kpis={derived.kpis.kpis} facilitiesLoadedAt={sources.facilities.loadedAt} onDrill={handleDrill} />
        )}

        {hasSection('situationMap') && (
          <LazyMount placeholder={<div className="card h-[380px] animate-pulse bg-ink-50/60 rounded-xl" />}>
            <SituationMap
              district={district}
              districtId={districtId}
              facilities={sources.facilities.data || []}
              heatmap={sources.heatmap.data}
              areas={derived.areas}
              selectedArea={selectedArea}
              onSelect={handleSelectArea}
              onOpenComplaint={handleOpenComplaint}
              onOpenProposal={handleOpenProposal}
              complaints={complaints}
              proposals={derived.pipeline.flatMap((stage) => stage.items)}
              loadedAt={sources.facilities.loadedAt || sources.heatmap.loadedAt}
            />
          </LazyMount>
        )}

        {hasSection('priorityAreas') && (
          <PriorityAreas areas={derived.areas} onSelect={handleSelectArea} loadedAt={sources.facilities.loadedAt || sources.proposals.loadedAt} />
        )}

        {(hasSection('health') || hasSection('signals')) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {hasSection('health') && (
              <div className="lg:col-span-1">
                <HealthSnapshot health={derived.health} loadedAt={sources.facilities.loadedAt} />
              </div>
            )}
            {hasSection('signals') && (
              <div className="lg:col-span-2">
                <CitizenSignals signals={derived.signals} onOpenComplaint={handleOpenComplaint} loadedAt={sources.dashboard.loadedAt} />
              </div>
            )}
          </div>
        )}

        {hasSection('pipeline') && (
          <LazyMount placeholder={<div className="card h-40 animate-pulse bg-ink-50/60 rounded-xl" />}>
            <PlanningPipeline pipeline={derived.pipeline} onOpenProposal={handleOpenProposal} loadedAt={sources.proposals.loadedAt} />
          </LazyMount>
        )}

        {(hasSection('budget') || hasSection('actions')) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {hasSection('budget') && (
              <div className="lg:col-span-1">
                <BudgetCard budget={budget} status={sources.budget.status} error={sources.budget.error} onRetry={refetch} loadedAt={sources.budget.loadedAt} />
              </div>
            )}
            {hasSection('actions') && (
              <div className={hasSection('budget') ? 'lg:col-span-2' : 'lg:col-span-3'}>
                <ActionQueue actions={derived.actions} onAction={handleAction} loadedAt={sources.dashboard.loadedAt} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complaint detail drill-down */}
      {complaintToOpen && (
        <ComplaintDetailHub complaintId={complaintToOpen} onClose={() => setComplaintToOpen(null)} />
      )}

      {/* Proposal drill-down */}
      {proposalToOpen && (
        <Modal open={Boolean(proposalToOpen)} onClose={() => setProposalToOpen(null)} title="Intervention detail">
          <PriorityDetailPanel
            area={{
              id: `proposal-${proposalToOpen.proposalId}`,
              type: 'planning',
              title: proposalToOpen.title,
              village: proposalToOpen.village || '',
              block: proposalToOpen.block || '',
              score: 0.75,
              priorityLevel: 'high',
              scoreComponents: [
                { label: 'Priority', value: String(proposalToOpen.priority || '').toUpperCase(), note: 'priority field from backend' },
                { label: 'Stage', value: proposalToOpen.statusDisplay || String(proposalToOpen.status).replace(/_/g, ' '), note: 'proposal status from GET /api/proposals/' },
                { label: 'Population impact', value: proposalToOpen.populationImpact != null ? Number(proposalToOpen.populationImpact).toLocaleString('en-IN') : 'Not available', note: 'populationImpact field from backend' },
              ],
              affectedPopulation: proposalToOpen.populationImpact != null ? Number(proposalToOpen.populationImpact) : null,
              departmentId: proposalToOpen.departmentId,
              departmentName: proposalToOpen.departmentName,
              recommendedAction: 'Review the intervention and decide the next stage of the planning pipeline.',
              proposalIds: [proposalToOpen.proposalId],
              complaintIds: proposalToOpen.linkedComplaint ? [proposalToOpen.linkedComplaint] : [],
              source: 'planning-pipeline',
            }}
            complaints={complaints}
            proposals={derived.pipeline.flatMap((stage) => stage.items)}
            onOpenComplaint={handleOpenComplaint}
            onOpenProposal={handleOpenProposal}
            onClose={() => setProposalToOpen(null)}
          />
        </Modal>
      )}

      {/* Quick hint for first-time DM users */}
      <div className="text-[11.5px] text-ink-400 flex items-center gap-1.5 px-1">
        <Crosshair size={12} /> Priority question in 3 interactions: click any KPI → read the priority areas → open a location's detail to see why it scored high and what to do next.
      </div>
    </div>
  )
}
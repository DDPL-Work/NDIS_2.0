import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, LayoutDashboard, BarChart2, MapPin } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Tabs from '../../../components/ui/Tabs'
import GapDetail from './GapDetail'
import ScoreExplanation from './ScoreExplanation'
import PriorityDisplay from './PriorityDisplay'
import GapMap from './GapMap'
import Ranking from './Ranking'
import { ModelVersion, WeightsDisplay } from './ModelVersion'
import { backendGapApi } from '../../../api/gapApi'
import { useAuthStore } from '../../../app/store/authStore'
import { DISTRICTS } from '../../../config/constants'
import { formatDateTime } from '../../../utils/format'

const SECTIONS = [
  { id: 'overview', label: 'Priority overview', icon: LayoutDashboard },
  { id: 'map', label: 'Priority map', icon: MapPin },
  { id: 'rankings', label: 'Ranked locations', icon: BarChart2 },
]

export default function GapPriorityDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const role = user?.role || user?.roles?.[0] || 'dm'
  const districtId = user?.districtId || 'nalanda'
  const district = DISTRICTS.find((d) => d.id === districtId) || DISTRICTS[0]

  const [activeSection, setActiveSection] = useState('overview')
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [explanationEntity, setExplanationEntity] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Data states
  const [districtSummary, setDistrictSummary] = useState(null)
  const [modelMetadata, setModelMetadata] = useState(null)

  // Load district-level data
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summary, metadata] = await Promise.allSettled([
        backendGapApi.districtSummary(districtId),
        backendGapApi.modelMetadata(districtId),
      ])

      if (summary.status === 'fulfilled') setDistrictSummary(summary.value)
      if (metadata.status === 'fulfilled') setModelMetadata(metadata.value)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [districtId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleEntitySelect = useCallback((entity) => {
    setSelectedEntity(entity)
    // Also fetch detailed gap data for this entity if not already present
    if (entity.id && !entity.gapData) {
      // Determine endpoint based on entity type
      const fetchDetail = async () => {
        try {
          let detail
          if (entity.type === 'facility') {
            detail = await backendGapApi.facilityDetail(entity.id)
          } else if (entity.type === 'village') {
            detail = await backendGapApi.villageDetail(entity.id)
          } else if (entity.type === 'block') {
            detail = await backendGapApi.blockDetail(entity.id)
          }
          if (detail) {
            setSelectedEntity((prev) => prev?.id === entity.id ? { ...prev, gapData: detail } : prev)
          }
        } catch (e) {
          console.warn('Failed to load entity detail:', e)
        }
      }
      fetchDetail()
    }
  }, [])

  const handleExplain = useCallback((entity) => {
    setExplanationEntity(entity)
  }, [])

  const handleAction = useCallback((entity) => {
    // Carry analytical context forward into the existing DPR wizard. The
    // wizard remains the single proposal-authoring workflow; this only
    // eliminates duplicate entry of the DDST decision evidence.
    const gap = entity.gapData || entity
    const evidence = [
      ...(Array.isArray(gap.sources) ? gap.sources : []),
      ...(Array.isArray(entity.evidence) ? entity.evidence.map((item) => typeof item === 'string' ? item : item.description || item.title || '') : []),
    ].filter(Boolean).join('; ')
    const reasons = entity.reason || entity.reasonSummary || entity.explanation?.summary || ''
    const params = new URLSearchParams({
      title: `Intervention: ${entity.name || entity.title || 'priority location'}`,
      village: entity.village || gap.village || '',
      block: entity.block || gap.block || '',
      gapScore: String(gap.overallScore ?? gap.score ?? entity.score ?? ''),
      department: entity.departmentName || gap.departmentName || '',
      facility: entity.facilityName || entity.name || '',
      reason: reasons,
      evidence,
      recommendedAction: entity.recommendedAction || entity.action || '',
      priority: entity.priority || entity.priorityLevel || '',
    })
    navigate(`/linedept/planning/new?${params.toString()}`)
  }, [navigate])

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-5">
            {/* District Summary + Model Version */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <GapDetail
                  gapData={districtSummary}
                  onExplain={handleExplain}
                />
              </div>
              <div className="space-y-5">
                <ModelVersion metadata={modelMetadata} />
                <WeightsDisplay weights={districtSummary?.weights} />
              </div>
            </div>

            {/* Priority Overview */}
            {districtSummary?.priorityBreakdown && (
              <div className="rounded-xl border border-ink-100 bg-white p-5">
                <h3 className="text-[13px] font-semibold text-ink-950 mb-4">Priority Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['P1', 'P2', 'P3', 'P4'].map((p) => {
                    const count = districtSummary.priorityBreakdown[p] || 0
                    const meta = { P1: { tone: 'alert' }, P2: { tone: 'saffron' }, P3: { tone: 'sky' }, P4: { tone: 'leaf' } }[p]
                    return (
                      <div key={p} className="rounded-xl border border-ink-100 p-4 text-center">
                        <Badge tone={meta.tone} className="mb-2 text-[10px]">{p}</Badge>
                        <p className="text-[28px] font-bold text-ink-950 tabular-nums">{count}</p>
                        <p className="text-[10.5px] text-ink-500 mt-1">{meta.tone === 'alert' ? 'Critical' : meta.tone === 'saffron' ? 'High' : meta.tone === 'sky' ? 'Medium' : 'Low'}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )

      case 'map':
        return (
          <GapMap
            districtId={districtId}
            onFeatureClick={handleEntitySelect}
            filters={{}}
          />
        )

      case 'rankings':
        return (
          <Ranking
            districtId={districtId}
            onSelect={handleEntitySelect}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-full p-3 sm:p-6 space-y-5">
      <PageHeader
        eyebrow={`Admin Portal · ${String(role).toUpperCase()}`}
        title="Gap & Priority Dashboard"
        description={`${district?.label || districtId} — find priority locations, understand why they need attention, and move evidence into an intervention. Scores and sources are shown for every decision.`}
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-alert-200 bg-alert-50 px-4 py-3 text-[13px] text-alert-700">
          Failed to load data: {error}
          <Button size="sm" variant="outline" className="ml-3" onClick={loadData}>Retry</Button>
        </div>
      )}

      {/* Keep only the three core decision tasks. Detailed evidence opens from
          a selected location instead of creating another permanent tab. */}
      <Tabs
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={setActiveSection}
        className="mb-5"
      />

      {/* Section Content */}
      <div className="space-y-5">
        {renderSection()}
      </div>

      {/* Entity Detail Modal */}
      {selectedEntity && (
        <Modal
          open={true}
          onClose={() => setSelectedEntity(null)}
          title={selectedEntity.name || selectedEntity.title || 'Entity Detail'}
          size="lg"
        >
          <div className="space-y-5">
            {/* Tabs for detail view */}
            <Tabs
              tabs={[
                { id: 'detail', label: 'Gap Detail' },
                { id: 'explanation', label: 'Score Explanation' },
                { id: 'priority', label: 'Priority & Action' },
              ]}
              activeTab={selectedEntity.detailTab || 'detail'}
              onChange={(tab) => setSelectedEntity((prev) => ({ ...prev, detailTab: tab }))}
            />

            {selectedEntity.detailTab === 'detail' && (
              <GapDetail
                gapData={selectedEntity.gapData || selectedEntity}
                onExplain={handleExplain}
              />
            )}

            {selectedEntity.detailTab === 'explanation' && (
              <ScoreExplanation
                explanationData={selectedEntity.gapData?.explanation || selectedEntity.explanation}
                onClose={() => setSelectedEntity((prev) => ({ ...prev, detailTab: 'detail' }))}
              />
            )}

            {selectedEntity.detailTab === 'priority' && (
              <PriorityDisplay
                priorityData={selectedEntity}
                onAction={handleAction}
              />
            )}
          </div>
        </Modal>
      )}

      {/* Explanation Modal */}
      {explanationEntity && (
        <Modal
          open={true}
          onClose={() => setExplanationEntity(null)}
          title="Score Explanation"
          size="lg"
        >
          <ScoreExplanation
            explanationData={explanationEntity.gapData?.explanation || explanationEntity.explanation || explanationEntity}
            onClose={() => setExplanationEntity(null)}
          />
        </Modal>
      )}
    </div>
  )
}

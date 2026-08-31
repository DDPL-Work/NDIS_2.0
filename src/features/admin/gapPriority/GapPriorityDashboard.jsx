import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, LayoutDashboard, BarChart2, MapPin } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Tabs from '../../../components/ui/Tabs'
import GapDetail from './GapDetail'
import ScoreExplanation from './ScoreExplanation'
import PriorityDisplay from './PriorityDisplay'
import GapMap from './GapMap'
import Ranking from './Ranking'
import { ModelVersion, WeightsDisplay } from './ModelVersion'
import { backendGapApi } from '../../../api/gapApi'
import { useAuthStore } from '../../../app/store/authStore'
import { useDistricts } from '../../../hooks/useMasterData'

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
  const { data: districts } = useDistricts()
  const district = (districts || []).find((d) => String(d.id) === String(districtId))

  const [activeSection, setActiveSection] = useState('overview')
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [explanationEntity, setExplanationEntity] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Data states — all from backend
  const [overview, setOverview] = useState(null)
  const [rankings, setRankings] = useState([])
  const [modelMetadata, setModelMetadata] = useState(null)
  const [filters, setFilters] = useState({ department: '', priority: '' })

  // Load all gap-priority data from single primary endpoint
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filters.department) params.department = filters.department
      if (filters.priority) params.priority = filters.priority

      // Primary call: GET /gap-priority/ — returns overview + results
      const data = await backendGapApi.list(params)

      setOverview(data.overview)
      setRankings(data.results)

      // Also load model metadata
      const meta = await backendGapApi.modelMetadata(districtId)
      if (meta) setModelMetadata(meta)
    } catch (err) {
      setError(err.message || 'Failed to load gap priority data')
    } finally {
      setLoading(false)
    }
  }, [districtId, filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Click ranked location → open detail modal
  const handleEntitySelect = useCallback(async (entity) => {
    setSelectedEntity({ ...entity, detailTab: 'detail' })
    // Fetch full detail from backend
    if (entity.id) {
      try {
        const detail = await backendGapApi.facilityDetail(entity.id)
        if (detail) {
          setSelectedEntity((prev) => prev?.id === entity.id
            ? { ...prev, gapData: detail, detailTab: prev.detailTab }
            : prev
          )
        }
      } catch (e) {
        console.warn('Failed to load entity detail:', e)
      }
    }
  }, [])

  // Click "explain" → open score explanation
  const handleExplain = useCallback((entity) => {
    setExplanationEntity(entity)
  }, [])

  // Click "create intervention" → navigate to planning wizard
  const handleAction = useCallback((entity) => {
    const gap = entity.gapData || entity
    const evidence = [
      ...(Array.isArray(gap.sources) ? gap.sources : []),
      ...(Array.isArray(entity.evidence) ? entity.evidence.map((item) => typeof item === 'string' ? item : item.description || item.title || '') : []),
    ].filter(Boolean).join('; ')
    const reasons = entity.reason || entity.reasonCodes?.join(', ') || ''
    const params = new URLSearchParams({
      title: `Intervention: ${entity.name || 'priority location'}`,
      gapScore: String(entity.gapScore ?? ''),
      department: entity.departmentCode || '',
      reason: reasons,
      evidence,
      priority: entity.priority || '',
    })
    navigate(`/linedept/planning/new?${params.toString()}`)
  }, [navigate])

  // Build explanation data from backend components
  const buildExplanation = (entity) => {
    const gap = entity.gapData || entity
    const components = gap.components || entity.components || {}
    const weightsUsed = gap.weightsUsed || entity.weightsUsed || {}
    const componentList = Object.entries(components).map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      rawValue: value,
      normalizedValue: typeof value === 'number' ? value / 100 : null,
      weight: weightsUsed[key] ?? null,
      contribution: typeof value === 'number' && weightsUsed[key] != null
        ? (value / 100) * weightsUsed[key]
        : null,
      source: gap.modelVersion || 'Backend',
    }))
    return {
      components: componentList,
      overall: {
        normalizedValue: entity.gapScore != null ? entity.gapScore / 100 : null,
        modelVersion: gap.modelVersion || entity.modelVersion || null,
        calculatedAt: gap.calculatedAt || null,
      },
      methodology: gap.modelDescription || gap.methodology || null,
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-5">
            {/* District Summary + Model Version */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <GapDetail
                  gapData={overview}
                  onExplain={handleExplain}
                />
              </div>
              <div className="space-y-5">
                <ModelVersion metadata={modelMetadata} />
                <WeightsDisplay weights={overview?.weights} />
              </div>
            </div>

            {/* Priority Breakdown from backend */}
            {overview && (overview.criticalCount > 0 || overview.highCount > 0) && (
              <div className="rounded-xl border border-ink-100 bg-white p-5">
                <h3 className="text-[13px] font-semibold text-ink-950 mb-4">Priority Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'P1', count: overview.criticalCount, tone: 'alert', label: 'Critical' },
                    { key: 'P2', count: overview.highCount, tone: 'saffron', label: 'High' },
                    { key: 'P3', count: overview.mediumCount, tone: 'sky', label: 'Medium' },
                    { key: 'P4', count: overview.lowCount, tone: 'leaf', label: 'Low' },
                  ].map(({ key, count, tone, label }) => (
                    <div key={key} className="rounded-xl border border-ink-100 p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-${tone}-50 text-${tone}-700 mb-2`}>{key}</span>
                      <p className="text-[28px] font-bold text-ink-950 tabular-nums">{count}</p>
                      <p className="text-[10.5px] text-ink-500 mt-1">{label}</p>
                    </div>
                  ))}
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
            filters={filters}
          />
        )

      case 'rankings':
        return (
          <Ranking
            districtId={districtId}
            onSelect={handleEntitySelect}
            filters={filters}
            onFilterChange={setFilters}
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
        description={`${district?.name || districtId} — find priority locations, understand why they need attention, and move evidence into an intervention. Scores and sources are shown for every decision.`}
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

      <Tabs
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={setActiveSection}
        className="mb-5"
      />

      <div className="space-y-5">
        {loading && !overview ? (
          <div className="rounded-xl border border-ink-100 bg-white p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent mx-auto mb-3" />
            <p className="text-ink-500 text-[13px]">Loading gap priority data…</p>
          </div>
        ) : renderSection()}
      </div>

      {/* Entity Detail Modal */}
      {selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedEntity(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-[15px] font-semibold text-ink-950">{selectedEntity.name || 'Location Detail'}</h2>
              <button onClick={() => setSelectedEntity(null)} className="text-ink-400 hover:text-ink-700 text-[13px]">✕</button>
            </div>
            <div className="p-5 space-y-5">
              <GapDetail
                gapData={selectedEntity.gapData || selectedEntity}
                onExplain={handleExplain}
              />
              <ScoreExplanation
                explanationData={buildExplanation(selectedEntity)}
              />
              <PriorityDisplay
                priorityData={selectedEntity}
                onAction={() => handleAction(selectedEntity)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      {explanationEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setExplanationEntity(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-[15px] font-semibold text-ink-950">Score Explanation</h2>
              <button onClick={() => setExplanationEntity(null)} className="text-ink-400 hover:text-ink-700 text-[13px]">✕</button>
            </div>
            <div className="p-5">
              <ScoreExplanation
                explanationData={buildExplanation(explanationEntity)}
                onClose={() => setExplanationEntity(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

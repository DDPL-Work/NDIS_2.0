// Situation Matrix — cross-department deficit GIS view for Admin portal.
// FR-AP-01 (LLD Vol 3 §17): facility map + gap-score heatmap + hotspot overlay.
// Phase 2 additions: facility detail slide-out panel, district boundary polygon,
// gap-score filter slider, map tools toolbar.
import { useState, useMemo, useRef, useCallback } from 'react'
import { Flame, Layers, SlidersHorizontal, X, MapPin, AlertTriangle, ClipboardCheck } from 'lucide-react'
import MapView from '../../components/map/MapView'
import MapToolbar from '../../components/map/MapToolbar'
import { DepartmentLegend, GapScoreLegend } from '../../components/map/MapLegend'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import GapScoreRing from '../../components/ui/GapScoreRing'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAsync } from '../../hooks/useAsync'
import { useMapTools, MAP_TOOLS, BASEMAPS } from '../../hooks/useMapTools'
import { gisApi, analyticsApi, workflowApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { DEPARTMENTS, DISTRICTS, DEPARTMENT_MAP } from '../../config/constants'
import { formatDate } from '../../utils/format'

export default function SituationMatrix() {
  const user = useAuthStore((s) => s.user)
  const districtId = user?.districtId || 'nalanda'
  const district = DISTRICTS.find((d) => d.id === districtId)

  const [activeDepts, setActiveDepts] = useState(DEPARTMENTS.map((d) => d.id))
  const [colorBy, setColorBy] = useState('gap')
  const [showHeat, setShowHeat] = useState(false)
  const [gapThreshold, setGapThreshold] = useState(0) // 0 = show all
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [showBoundary, setShowBoundary] = useState(true)

  const mapRef = useRef(null)
  const tools = useMapTools()

  const { data: facilities, loading } = useAsync(() => gisApi.getAllFacilities(districtId), [districtId])
  const { data: hotspots } = useAsync(() => analyticsApi.getHotspots(districtId), [districtId])
  const { data: boundary } = useAsync(() => gisApi.getDistrictBoundary(districtId), [districtId])
  const { data: facilityGrievances } = useAsync(
    () => selectedFacility ? workflowApi.listGrievances({ facilityId: selectedFacility.id }) : Promise.resolve([]),
    [selectedFacility?.id]
  )

  const filtered = useMemo(() => {
    if (!facilities) return []
    return facilities.filter(
      (f) => activeDepts.includes(f.departmentId) && f.gapScore >= gapThreshold
    )
  }, [facilities, activeDepts, gapThreshold])

  function toggleDept(id) {
    setActiveDepts((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  const handleFacilityClick = useCallback((id) => {
    if (!facilities) return
    setSelectedFacility(facilities.find((f) => f.id === id) || null)
  }, [facilities])

  const handleMapClick = useCallback((lngLat) => {
    tools.handleMapClick(lngLat)
  }, [tools])

  // Fit to district
  const handleFitDistrict = useCallback(() => {
    mapRef.current?.flyTo(district.center, district.zoom)
  }, [district])

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        eyebrow="Admin Portal · FR-AP-01"
        title="Situation Matrix"
        description={`Cross-department deficit view for ${district?.label}. Deficit radius: ${tools.radiusKm}km (configurable via map toolbar).`}
      />
      <div className="flex-1 px-6 pb-6 min-h-0 flex gap-3">
        {/* Map area */}
        <div className="relative flex-1 min-w-0">
          <MapView
            ref={mapRef}
            center={district?.center}
            zoom={district?.zoom}
            facilities={filtered}
            colorBy={colorBy}
            showHeat={showHeat}
            heatPoints={hotspots || []}
            className="h-full"
            onFacilityClick={handleFacilityClick}
            onMapClick={handleMapClick}
            selectedId={selectedFacility?.id}
            activeTool={tools.activeTool}
            radiusCenter={tools.radiusCenter}
            radiusKm={tools.radiusKm}
            measurePoints={tools.measurePoints}
            measureDistKm={tools.measureDistKm}
            clusterEnabled={tools.clusterEnabled}
            basemapUrl={tools.currentBasemap.url}
          />

          {/* Top-left: department legend + boundary toggle */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 max-w-xs z-10">
            <DepartmentLegend activeIds={activeDepts} onToggle={toggleDept} />
            {colorBy === 'gap' && <GapScoreLegend />}
            <button
              onClick={() => setShowBoundary((v) => !v)}
              className={`card !px-2.5 !py-1.5 text-[11.5px] font-medium flex items-center gap-1.5 w-full ${showBoundary ? 'text-ink-900' : 'text-ink-400'}`}
            >
              <MapPin size={12} /> {showBoundary ? 'Hide' : 'Show'} district boundary
            </button>
          </div>

          {/* Top-right controls */}
          <div className="absolute top-4 right-16 flex flex-col gap-2 z-10">
            <div className="card p-1 flex gap-1">
              <button
                onClick={() => setColorBy('department')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium ${colorBy === 'department' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
              >
                <Layers size={13} /> By dept
              </button>
              <button
                onClick={() => setColorBy('gap')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium ${colorBy === 'gap' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
              >
                <Flame size={13} /> By gap
              </button>
            </div>
            <button
              onClick={() => setShowHeat((v) => !v)}
              className={`card px-2.5 py-1.5 text-[12px] font-medium flex items-center gap-1.5 ${showHeat ? 'ring-2 ring-alert-400' : ''}`}
            >
              <Flame size={13} className={showHeat ? 'text-alert-500' : 'text-ink-500'} /> Hotspot overlay
            </button>

            {/* Gap threshold filter */}
            <div className="card !p-2.5 text-[11.5px]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <SlidersHorizontal size={12} className="text-ink-500" />
                <span className="font-medium text-ink-700">Min gap ≥</span>
                <span className="kbd-mono ml-auto">{(gapThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min={0} max={0.9} step={0.05}
                value={gapThreshold}
                onChange={(e) => setGapThreshold(Number(e.target.value))}
                className="w-full accent-ink-900"
              />
            </div>
          </div>

          {/* Map toolbar */}
          <div className="absolute bottom-4 right-16 z-10">
            <MapToolbar
              activeTool={tools.activeTool}
              onSelectTool={tools.selectTool}
              clusterEnabled={tools.clusterEnabled}
              onToggleCluster={tools.toggleCluster}
              basemapId={tools.basemapId}
              onBasemapChange={tools.setBasemapId}
              radiusKm={tools.radiusKm}
              onRadiusKmChange={tools.setRadiusKm}
              radiusCenter={tools.radiusCenter}
              onClearRadius={tools.clearRadius}
              measureDistKm={tools.measureDistKm}
              measurePoints={tools.measurePoints}
              onClearMeasure={tools.clearMeasure}
              onFitDistrict={handleFitDistrict}
              onMyLocation={() => mapRef.current?.locateUser()}
              onSnapshot={() => mapRef.current?.snapshot()}
            />
          </div>

          {/* Asset count badge */}
          <div className="absolute bottom-4 left-4 z-10">
            <Badge tone="neutral">{loading ? 'Loading…' : `${filtered.length} assets shown`}</Badge>
          </div>
        </div>

        {/* Facility detail slide-out panel */}
        {selectedFacility && (
          <div className="w-80 shrink-0 card overflow-y-auto animate-slide-in-right">
            <div className="flex items-start justify-between p-4 border-b border-ink-100">
              <div>
                <h3 className="text-[14px] font-semibold text-ink-950 leading-snug">{selectedFacility.name}</h3>
                <p className="text-[12px] text-ink-500 mt-0.5">{selectedFacility.categoryLabel}</p>
              </div>
              <button onClick={() => setSelectedFacility(null)} className="text-ink-400 hover:text-ink-700 ml-2 shrink-0">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Gap score ring */}
              <div className="flex items-center gap-4">
                <GapScoreRing score={selectedFacility.gapScore} size={64} strokeWidth={7} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Gap score</p>
                  <p className="text-[13px] font-semibold text-ink-900 mt-0.5">
                    {selectedFacility.gapScore >= 0.66 ? 'High deficit' : selectedFacility.gapScore >= 0.33 ? 'Moderate' : 'Well served'}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-[12.5px]">
                <Row label="Status"><StatusBadge status={selectedFacility.status} /></Row>
                <Row label="Department">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: DEPARTMENT_MAP[selectedFacility.departmentId]?.color }}
                    />
                    {DEPARTMENT_MAP[selectedFacility.departmentId]?.label}
                  </span>
                </Row>
                <Row label="Village">{selectedFacility.village}</Row>
                <Row label="Block">{selectedFacility.block}</Row>
                <Row label="Geo-tagged">
                  <span className={selectedFacility.position ? 'text-leaf-600 font-medium' : 'text-ink-400'}>
                    {selectedFacility.position ? '✓ Yes' : 'No'}
                  </span>
                </Row>
                <Row label="Last inspection">
                  {selectedFacility.lastInspectionAt ? formatDate(selectedFacility.lastInspectionAt) : <span className="text-ink-400">Never</span>}
                </Row>
              </div>

              {/* Open grievances */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={11} /> Open grievances
                </p>
                {(facilityGrievances || []).length === 0 ? (
                  <p className="text-[12px] text-ink-400">No open grievances</p>
                ) : (
                  <div className="space-y-1.5">
                    {facilityGrievances.slice(0, 3).map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-[12px] bg-alert-50 rounded-lg px-2.5 py-1.5">
                        <span className="text-ink-700 truncate">{g.title}</span>
                        <StatusBadge status={g.state} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Coordinates */}
              {selectedFacility.position && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1 flex items-center gap-1.5">
                    <MapPin size={11} /> Coordinates
                  </p>
                  <p className="kbd-mono text-[11px] text-ink-600">
                    {selectedFacility.position[1].toFixed(5)}°N, {selectedFacility.position[0].toFixed(5)}°E
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-ink-500 shrink-0">{label}</span>
      <span className="text-ink-800 font-medium text-right">{children}</span>
    </div>
  )
}

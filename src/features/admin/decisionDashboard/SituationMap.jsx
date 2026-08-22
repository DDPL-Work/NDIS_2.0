import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import clsx from 'clsx'
import { Layers, Flame, MapPin, SlidersHorizontal } from 'lucide-react'
import MapView from '../../../components/map/MapView'
import { GapScoreLegend } from '../../../components/map/MapLegend'
import SectionCard from './SectionCard'
import Provenance from './Provenance'
import PriorityDetailPanel from './PriorityDetailPanel'
import { useDepartments, departmentMapFrom } from '../../../hooks/useDepartments'
import { useGISCatalog } from '../../../hooks/useGISCatalog'
import { useLeafletLayers } from '../../../hooks/useLeafletLayers'
import { DEPARTMENTS } from '../../../config/constants'
import { formatDateTime } from '../../../utils/format'

const NO_DEFAULT_LAYERS = []

// Section B — the district situation map.  Overlays are configurable: facilities
// (by department or gap), grievance hotspots, priority locations, the district
// boundary and department layers.  Clicking a marker or a priority area opens
// the decision detail panel that explains the score and its evidence.
export default function SituationMap({
  district,
  districtId,
  facilities,
  heatmap,
  areas,
  selectedArea,
  onSelect,
  onOpenComplaint,
  onOpenProposal,
  complaints,
  proposals,
  loadedAt,
}) {
  const mapRef = useRef(null)
  const [colorBy, setColorBy] = useState('gap')
  const [showHeat, setShowHeat] = useState(false)
  const [showBoundary, setShowBoundary] = useState(false)
  const [minGap, setMinGap] = useState(0)
  const [activeDepts, setActiveDepts] = useState(null)
  const [displayOpen, setDisplayOpen] = useState(false)

  const { data: departmentsData } = useDepartments()
  const departments = departmentsData && departmentsData.length ? departmentsData : DEPARTMENTS
  const departmentColors = useMemo(() => Object.fromEntries(departments.map((d) => [String(d.id), d.color])), [departments])
  const deptMap = useMemo(() => departmentMapFrom(departmentsData && departmentsData.length ? departmentsData : DEPARTMENTS), [departmentsData])

  const { data: catalog } = useGISCatalog()
  const [leafletMap, setLeafletMap] = useState(null)
  const layers = useLeafletLayers(leafletMap, { defaults: NO_DEFAULT_LAYERS })

  useEffect(() => {
    if (!catalog || !leafletMap) return
    layers.toggle('District_boundary', showBoundary)
  }, [catalog, leafletMap, layers.toggle, showBoundary])

  const activeIds = useMemo(
    () => activeDepts || departments.map((department) => String(department.id)),
    [activeDepts, departments]
  )

  function toggleDept(id) {
    setActiveDepts((current) => {
      const normalizedId = String(id)
      const base = current || departments.map((department) => String(department.id))
      return base.includes(normalizedId) ? base.filter((item) => item !== normalizedId) : [...base, normalizedId]
    })
  }

  const hotspots = useMemo(() => {
    const points = heatmap?.points
    if (!Array.isArray(points)) return []
    return points
      .map((point) => {
        const position = Array.isArray(point.position) ? point.position : Array.isArray(point.coordinates) ? point.coordinates : [point.longitude ?? point.lng, point.latitude ?? point.lat]
        return { position, intensity: Number(point.intensity ?? point.weight ?? 0.5) }
      })
      .filter((point) => Array.isArray(point.position) && point.position.length >= 2)
  }, [heatmap])

  const visibleFacilities = useMemo(() => {
    return (facilities || []).filter(
      (facility) => (
        (!departmentsData?.length || activeIds.includes(String(facility.departmentId)))
        && Array.isArray(facility.position)
        && facility.position.length >= 2
        && facility.gapScore >= minGap
      )
    )
  }, [facilities, departmentsData, activeIds, minGap])

  const flyToArea = useCallback((area) => {
    const point = area?.position || (area?.facilityIds?.[0] ? visibleFacilities.find((f) => f.id === area.facilityIds[0])?.position : null)
    if (point && mapRef.current) mapRef.current.flyTo(point, Math.max(12, mapRef.current?.getZoom?.() || 12))
  }, [visibleFacilities])

  const selectArea = useCallback((area) => {
    onSelect(area)
    flyToArea(area)
  }, [onSelect, flyToArea])

  const selectedFacilityId = selectedArea?.type === 'facility_gap' ? selectedArea.facilityIds?.[0] : selectedArea?.id
  const selectedId = selectedArea ? selectedArea.facilityIds?.[0] || selectedArea.id : null

  return (
    <SectionCard
      id="district-situation-map"
      title="District situation map"
      subtitle={`What the district looks like right now — ${district?.label || 'the district'} (data from the live backend).`}
      className="p-0 overflow-hidden"
      foot={<Provenance source="GET /api/facilities/ · /api/complaints/heatmap/ · /api/gis/layers/District_boundary/" definition="Facility markers colored by department or gap score; hotspots weighted by complaint density." updatedAt={loadedAt ? formatDateTime(loadedAt) : undefined} />}
    >
      <div className="flex flex-col lg:flex-row min-h-0">
        {/* Map area */}
        <div className="relative min-w-0 flex-1 h-[380px] lg:h-[520px]">
          <MapView
            ref={mapRef}
            onReady={setLeafletMap}
            center={district?.center}
            zoom={district?.zoom}
            facilities={visibleFacilities}
            colorBy={colorBy}
            departmentColors={departmentColors}
            showHeat={showHeat}
            heatPoints={hotspots}
            className="h-full"
            onFacilityClick={(facility) => selectArea({
              id: facility.id,
              type: 'facility_gap',
              title: facility.name,
              village: facility.village,
              position: facility.position,
              score: facility.gapScore,
              facilityIds: [facility.id],
              complaintIds: [],
              proposalIds: [],
              priorityLevel: 'high',
            })}
            onMapClick={() => onSelect(null)}
            selectedId={selectedId}
          />

          {/* Overlay controls */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 w-[min(280px,calc(100%-24px))]">
            <div className="card p-1.5 flex gap-1 w-fit">
              <button
                onClick={() => setColorBy('gap')}
                className={clsx('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium', colorBy === 'gap' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}
              >
                <Flame size={13} /> By gap
              </button>
              <button
                onClick={() => setColorBy('department')}
                className={clsx('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium', colorBy === 'department' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}
              >
                <Layers size={13} /> By dept
              </button>
            </div>

            {colorBy === 'gap' && <GapScoreLegend />}

            <button
              onClick={() => setShowHeat((v) => !v)}
              className={clsx('card px-2.5 py-1.5 text-[11.5px] font-medium flex items-center gap-1.5 w-fit', showHeat && 'ring-2 ring-alert-400')}
            >
              <Flame size={12} className={showHeat ? 'text-alert-500' : 'text-ink-500'} /> Grievance hotspots
            </button>

            <button
              onClick={() => setShowBoundary((v) => !v)}
              className={clsx('card px-2.5 py-1.5 text-[11.5px] font-medium flex items-center gap-1.5 w-fit', showBoundary ? 'text-ink-900' : 'text-ink-400')}
            >
              <MapPin size={12} /> {showBoundary ? 'Hide' : 'Show'} district boundary
            </button>

            {/* Department chips */}
            <div className="card !p-2 flex flex-wrap gap-1 w-fit max-w-full">
              {departments.map((department) => {
                const active = activeIds.includes(String(department.id))
                return (
                  <button
                    key={department.id}
                    onClick={() => toggleDept(department.id)}
                    className={clsx('flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border transition', active ? 'border-ink-200 bg-ink-900 text-white' : 'border-ink-100 bg-white text-ink-500')}
                    style={active ? {} : {}}
                  >
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: department.color }} />
                    {deptMap[String(department.id)]?.label || department.name || department.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Gap threshold */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="card !p-2.5 text-[11px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={12} className="text-ink-500" />
                <span className="font-medium text-ink-600">Min gap ≥</span>
                <span className="kbd-mono font-semibold">{(minGap * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min={0} max={0.9} step={0.1} value={minGap} onChange={(e) => setMinGap(Number(e.target.value))} className="mt-1 w-40 accent-ink-900" />
            </div>
          </div>

          {/* Display toggle (mobile) */}
          <button
            onClick={() => setDisplayOpen((v) => !v)}
            className="md:hidden absolute top-3 right-3 z-10 card px-2.5 py-1.5 text-[12px] font-medium flex items-center gap-1.5"
          >
            <SlidersHorizontal size={12} /> Display
          </button>
        </div>

        {/* Decision detail panel */}
        {selectedArea && (
          <div className="w-full lg:w-[360px] shrink-0 border-t lg:border-t-0 lg:border-l border-ink-100 bg-white">
            <PriorityDetailPanel
              area={selectedArea}
              facilities={facilities}
              complaints={complaints}
              proposals={proposals}
              onOpenComplaint={onOpenComplaint}
              onOpenProposal={onOpenProposal}
              onClose={() => onSelect(null)}
              deptMap={deptMap}
            />
          </div>
        )}
      </div>
    </SectionCard>
  )
}

// Situation Matrix — cross-department deficit GIS view for Admin portal.
// FR-AP-01 (LLD Vol 3 §17): facility map + gap-score heatmap + hotspot overlay.
// Backend data sources (backend_guide.md): /api/departments/, /api/gis/catalog/,
// /api/gis/layers/{name}/, /api/facilities/ (department/catalog filters),
// /api/complaints/heatmap/.  Reuses the citizen GIS pipeline verbatim:
// DepartmentRepository/useDepartments, GISRepository (catalog, layers,
// facilities, complaints), useLeafletLayers, CitizenLayerPanel,
// FacilityInfoPanel and the shared facility mapper — no duplicate GIS logic.
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Flame, Layers, SlidersHorizontal, MapPin } from 'lucide-react'
import MapView from '../../components/map/MapView'
import MapToolbar from '../../components/map/MapToolbar'
import { DepartmentLegend, GapScoreLegend } from '../../components/map/MapLegend'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import FacilityInfoPanel from '../../components/map/FacilityInfoPanel'
import CitizenLayerPanel from '../citizen/CitizenLayerPanel'
import { useAsync } from '../../hooks/useAsync'
import { useMapTools } from '../../hooks/useMapTools'
import { useDepartments, departmentMapFrom } from '../../hooks/useDepartments'
import { useGISCatalog } from '../../hooks/useGISCatalog'
import { useLeafletLayers } from '../../hooks/useLeafletLayers'
import { useFacilityClickHandler } from '../../hooks/useFacilityClickHandler'
import { useRoute } from '../../hooks/useRoute'
import GISSearchPanel from '../../gis/components/GISSearchPanel'
import RouteSummary from '../../gis/components/RouteSummary'
import { GISRepository } from '../../gis/repositories/GISRepository'
import { useAuthStore } from '../../app/store/authStore'
import { DEPARTMENTS, DISTRICTS } from '../../config/constants'

export default function SituationMatrix() {
  const user = useAuthStore((s) => s.user)
  const districtId = user?.districtId || 'nalanda'
  const district = DISTRICTS.find((d) => d.id === districtId) || DISTRICTS[0]

  // Backend department ids (multi-select; seeded once /api/departments/ loads)
  const [activeDepts, setActiveDepts] = useState(null)
  const [colorBy, setColorBy] = useState('gap')
  const [showHeat, setShowHeat] = useState(false)
  const [gapThreshold, setGapThreshold] = useState(0) // 0 = show all
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [showBoundary, setShowBoundary] = useState(true)
  const [leafletMap, setLeafletMap] = useState(null)
  const [spatialResults, setSpatialResults] = useState(null)

  const mapRef = useRef(null)
  const tools = useMapTools()
  const routing = useRoute()
  const routeActiveId = routing.routeActiveId

  // Backend data sources — same shared hooks as the citizen GIS map.
  const { data: departmentsData } = useDepartments()
  const { data: catalog } = useGISCatalog()
  const layers = useLeafletLayers(leafletMap)

  // Fallback to the legacy constants while /api/departments/ loads so the
  // first paint stays identical; backend departments take over once loaded.
  const departments = departmentsData && departmentsData.length ? departmentsData : DEPARTMENTS
  const departmentColors = useMemo(() => Object.fromEntries(departments.map((d) => [String(d.id), d.color])), [departments])
  const deptMap = useMemo(
    () => departmentMapFrom(departmentsData && departmentsData.length ? departmentsData : DEPARTMENTS),
    [departmentsData]
  )

  // Seed the legend from the backend department ids exactly once.  Departments
  // behave like multi-select checkboxes: toggling one never disables the rest.
  useEffect(() => {
    if (departmentsData?.length && activeDepts === null) {
      setActiveDepts(departmentsData.map((d) => String(d.id)))
    }
  }, [departmentsData, activeDepts])
  const activeIds = activeDepts || DEPARTMENTS.map((d) => d.id)

  function toggleDept(id) {
    setActiveDepts((cur) => {
      const base = cur || DEPARTMENTS.map((d) => d.id)
      const normalizedId = String(id)
      return base.includes(normalizedId)
        ? base.filter((x) => x !== normalizedId)
        : [...base, normalizedId]
    })
  }

  // One facility-type layer enabled in the layer panel narrows the markers to
  // that catalog layer's facilities (catalog_entry filter, backend_guide §6.1);
  // boundary layers never filter facilities.
  const facilityCatalogFilter = useMemo(() => {
    if (!catalog) return null
    const enabledNames = Object.entries(layers.visible).filter(([, value]) => value).map(([name]) => name)
    const allLayers = Object.values(catalog.categories || {}).flat()
    const matches = allLayers.filter((layer) => enabledNames.includes(layer.name) && layer.category !== 'Administrative & Boundaries')
    return matches.length === 1 ? matches[0] : null
  }, [catalog, layers.visible])

  // Facilities come from GET /api/facilities/ per active department
  // (?department={pk}, optionally &catalog_entry={id}) and are merged client
  // side — a department that is toggled off never contributes markers.
  const { data: facilities, loading } = useAsync(async () => {
    if (!activeDepts?.length) return []
    const filter = facilityCatalogFilter ? { catalogEntry: facilityCatalogFilter.id } : {}
    const results = await Promise.all(activeDepts.map((departmentId) => GISRepository.facilities({ districtId, departmentId, ...filter })))
    const merged = new Map()
    results.flat().forEach((facility) => merged.set(facility.id, facility))
    return [...merged.values()]
  }, [activeDepts?.join(','), districtId, facilityCatalogFilter?.id || 'none'])

  // Hotspot heatmap overlay — same backend endpoint as /api/complaints/heatmap/
  // (weighted spatial points), normalized to { position, intensity }.
  const { data: heatmap } = useAsync(() => GISRepository.complaintHeatmap({ districtId }), [districtId])
  const hotspots = useMemo(() => {
    const points = heatmap?.points
    if (!Array.isArray(points)) return []
    return points
      .map((point) => {
        const position = Array.isArray(point.position)
          ? point.position
          : Array.isArray(point.coordinates)
            ? point.coordinates
            : [point.longitude ?? point.lng, point.latitude ?? point.lat]
        return { position, intensity: Number(point.intensity ?? point.weight ?? 0.5) }
      })
      .filter((point) => Array.isArray(point.position) && point.position.length >= 2)
  }, [heatmap])

  const { data: facilityGrievances } = useAsync(
    () => selectedFacility ? GISRepository.complaints({ facility_id: selectedFacility.id }) : Promise.resolve([]),
    [selectedFacility?.id]
  )

  const filtered = useMemo(() => {
    if (!facilities) return []
    return facilities.filter(
      (f) => Array.isArray(f.position) && f.position.length >= 2 && f.gapScore >= gapThreshold
    )
  }, [facilities, gapThreshold])

  // Marker click → shared role-aware handler; admin roles open the right-side
  // FacilityInfoPanel (never the citizen Facility Detail page).
  const handleFacilityClick = useFacilityClickHandler({
    onOpenPanel: useCallback((facility) => {
      setSelectedFacility(facility)
    }, []),
  })

  const handleMapClick = useCallback((lngLat) => {
    tools.handleMapClick(lngLat)
  }, [tools])

  // Fit to district
  const handleFitDistrict = useCallback(() => {
    mapRef.current?.flyTo(district.center, district.zoom)
  }, [district])

  // Boundary toggle drives the District_boundary catalog layer (served by
  // GET /api/gis/layers/District_boundary/), matching citizen behaviour.
  const toggleBoundary = useCallback(() => {
    setShowBoundary((value) => {
      const next = !value
      layers.toggle('District_boundary', next)
      return next
    })
  }, [layers])

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        eyebrow="Admin Portal · FR-AP-01"
        title="Situation Matrix"
        description={`Cross-department deficit view for ${district?.label}. Deficit radius: ${tools.radiusKm}km (configurable via map toolbar).`}
        action={
          <div className="w-[340px]">
            <GISSearchPanel user={user} allowedDepartments={activeIds} center={district?.center} onResults={setSpatialResults} onResultClick={(result) => mapRef.current?.showResult(result)} onShowRoute={routing.showRoute} onClearRoute={routing.clearRoute} routeActiveId={routeActiveId} routeLoading={routing.status === 'loading'} onRouteStart={routing.setRouteStart} onRouteDestination={routing.setRouteDestination} routeStartId={routing.routeStartId} routeDestinationId={routing.routeDestinationId} />
          </div>
        }
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
            departmentColors={departmentColors}
            showHeat={showHeat}
            heatPoints={hotspots}
            className="h-full"
            onFacilityClick={handleFacilityClick}
            onMapClick={handleMapClick}
            selectedId={selectedFacility?.id}
            searchResults={spatialResults?.results || []}
            onSearchResultOpen={handleFacilityClick}
            onSearchResultRoute={routing.showRoute}
            onReady={setLeafletMap}
            activeTool={tools.activeTool}
            radiusCenter={tools.radiusCenter}
            radiusKm={tools.radiusKm}
            measurePoints={tools.measurePoints}
            measureDistKm={tools.measureDistKm}
            clusterEnabled={tools.clusterEnabled}
            basemapUrl={tools.currentBasemap.url}
            route={routing.route}
          />

          {/* Route summary (floating, above the map but below panels) */}
          <div className="absolute bottom-4 left-4 z-[115]">
            <RouteSummary status={routing.status} route={routing.route} origin={routing.origin} destination={routing.destination} errorMessage={routing.errorMessage} onCalculate={routing.calculateRoute} onClear={routing.clearRoute} />
          </div>

          {/* Top-left: department legend + gap legend + boundary toggle + layers */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 max-w-xs z-10">
            <DepartmentLegend
              departments={departments.map((d) => ({ id: String(d.id), name: d.name || d.label, color: d.color }))}
              activeIds={activeIds}
              onToggle={toggleDept}
            />
            {colorBy === 'gap' && <GapScoreLegend />}
            <button
              onClick={toggleBoundary}
              className={`card !px-2.5 !py-1.5 text-[11.5px] font-medium flex items-center gap-1.5 w-full ${showBoundary ? 'text-ink-900' : 'text-ink-400'}`}
            >
              <MapPin size={12} /> {showBoundary ? 'Hide' : 'Show'} district boundary
            </button>
            <div className="card !p-0 overflow-hidden">
              <CitizenLayerPanel
                catalog={catalog}
                visible={layers.visible}
                loading={layers.loading}
                toggle={layers.toggle}
                showDefaults={layers.showDefaults}
                clearAll={layers.clearAll}
                activeCount={layers.activeCount}
                selectedDepartments={departments.filter((d) => activeIds.includes(String(d.id)))}
                closedDivider={false}
              />
            </div>
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

        {/* Facility detail slide-out panel — shared admin FacilityInfoPanel */}
        {selectedFacility && (
          <FacilityInfoPanel
            facility={selectedFacility}
            grievances={facilityGrievances || []}
            department={deptMap[selectedFacility.departmentId] ? { ...deptMap[selectedFacility.departmentId], label: deptMap[selectedFacility.departmentId].name } : null}
            onClose={() => setSelectedFacility(null)}
          />
        )}
      </div>
    </div>
  )
}

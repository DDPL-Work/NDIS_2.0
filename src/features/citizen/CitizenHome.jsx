//// Citizen Home — GIS facility search, Map Toolbar, Near Me sorting, and walking distance estimates.
//// Data sources: GET /api/gis/catalog/, /api/gis/layers/{name}/, /api/facilities/,
//// /api/departments/ (backend_guide.md).  UI unchanged but interaction is role-aware:
//// citizens open the Facility Detail page; DM/ADM/Executive/Department Officer roles
//// open the right-side FacilityInfoPanel instead (production NDISP behaviour).
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Search, Navigation, Footprints, MapPin } from 'lucide-react'
import MapView from '../../components/map/MapView'
import MapToolbar from '../../components/map/MapToolbar'
import { DepartmentLegend } from '../../components/map/MapLegend'
import FacilityInfoPanel from '../../components/map/FacilityInfoPanel'
import FacilityCard from '../shared/FacilityCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { useMapTools } from '../../hooks/useMapTools'
import { useGISCatalog } from '../../hooks/useGISCatalog'
import { useLeafletLayers } from '../../hooks/useLeafletLayers'
import { useFacilities } from '../../hooks/useFacilities'
import { useAsync } from '../../hooks/useAsync'
import { useFacilityClickHandler } from '../../hooks/useFacilityClickHandler'
import { useDepartments, departmentMapFrom } from '../../hooks/useDepartments'
import { createPulseMarker } from '../../services/LeafletLayerService'
import { GISRepository } from '../../gis/repositories/GISRepository'
import CitizenLayerPanel from './CitizenLayerPanel'
import { useAuthStore } from '../../app/store/authStore'
import { useI18n } from '../../i18n/i18n'
import { DEPARTMENTS, DISTRICTS, ROLES } from '../../config/constants'
import { distanceMeters } from '../../utils/geo'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import GISSearchPanel from '../../gis/components/GISSearchPanel'

// Visual icon lookup by department name (presentation only — the department
// list itself always comes from /api/departments/).
const DEPT_ICON_TERMS = {
  water: 'Droplets',
  health: 'HeartPulse',
  education: 'GraduationCap',
  public: 'Building2',
  electricity: 'Zap',
  urban: 'Landmark',
  solar: 'Sun',
  tourism: 'Compass',
  transport: 'Car',
}
function iconForDepartment(name) {
  const key = Object.keys(DEPT_ICON_TERMS).find((term) => String(name || '').toLowerCase().includes(term))
  return DEPT_ICON_TERMS[key] || 'Building2'
}
function chipFor(department) {
  if (department.icon) return department
  return {
    ...department,
    label: department.name,
    icon: iconForDepartment(department.name),
  }
}

export default function CitizenHome() {
  const user = useAuthStore((s) => s.user)
  const district = DISTRICTS.find((d) => d.id === user?.districtId) || DISTRICTS[0]
  const { t } = useI18n()
  const mapRef = useRef(null)
  const tools = useMapTools()

  const [query] = useState('')
  const [activeDepts, setActiveDepts] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [userGps, setUserGps] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [gisResults, setGisResults] = useState(null)
  const [leafletMap, setLeafletMap] = useState(null)

  // Backend data sources
  const { data: departmentsData } = useDepartments()
  const { data: catalog } = useGISCatalog()
  const { data: facilities, loading } = useFacilities(district.id)
  const layers = useLeafletLayers(leafletMap)
  const { data: facilityGrievances } = useAsync(
    () => selectedFacility ? GISRepository.complaints({ facility_id: selectedFacility.id }) : Promise.resolve([]),
    [selectedFacility?.id]
  )

  // Fallback to the legacy constants while /api/departments/ loads, so the
  // first paint stays identical; backend departments take over once loaded.
  const departments = departmentsData && departmentsData.length ? departmentsData : DEPARTMENTS
  const departmentColors = useMemo(() => Object.fromEntries(departments.map((d) => [String(d.id), d.color])), [departments])
  const deptMap = useMemo(
    () => departmentMapFrom(departmentsData && departmentsData.length ? departmentsData : DEPARTMENTS),
    [departmentsData]
  )

  // Role decision from the authenticated user (never hardcoded): every role
  // except citizen uses the right-side inspection panel (ISSUE 5).
  const isCitizenRole = user?.role === ROLES.CITIZEN

  // Seed the department chips from the loaded departments exactly once.
  // Departments behave like multi-select checkboxes (ISSUE 1).
  useEffect(() => {
    if (departmentsData?.length && activeDepts === null) {
      setActiveDepts(departmentsData.map((d) => String(d.id)))
    }
  }, [departmentsData, activeDepts])
  const activeIds = activeDepts || DEPARTMENTS.map((d) => d.id)

  // Locate user using Geolocation API
  const handleLocateMe = useCallback(() => {
    setIsLocating(true)
    mapRef.current?.locateUser()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGps([pos.coords.longitude, pos.coords.latitude])
          setIsLocating(false)
        },
        () => setIsLocating(false)
      )
    } else {
      setIsLocating(false)
    }
  }, [])

  const referencePoint = userGps || district.center

  const filtered = useMemo(() => {
    if (!facilities) return []
    // Facilities merge across every active department (ISSUE 1/ISSUE 10) —
    // filtered locally from the single loaded collection (ISSUE 12).  Rows
    // without a valid geometry are dropped: the distance sort below and the
    // map markers both require a real position.
    let list = facilities.filter((f) => activeIds.includes(String(f.departmentId)) && Array.isArray(f.position) && f.position.length >= 2)
    if (tools.radiusCenter) {
      const radiusMeters = tools.radiusKm * 1000
      list = list.filter((f) => f.position && distanceMeters(tools.radiusCenter, f.position) <= radiusMeters)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.categoryLabel.toLowerCase().includes(q) ||
          f.village.toLowerCase().includes(q)
      )
    }
    return list
      .map((f) => {
        const distM = distanceMeters(referencePoint, f.position)
        // Walking estimate: ~80 meters per minute (approx 4.8 km/h)
        const walkMin = Math.round(distM / 80)
        return { ...f, distanceM: distM, walkMin }
      })
      .sort((a, b) => a.distanceM - b.distanceM)
  }, [facilities, activeIds, query, referencePoint, tools.radiusCenter, tools.radiusKm])

  // Multi-select department toggle: adding/removing one department never
  // disables the others (ISSUE 1).
  function toggleDept(id) {
    setActiveDepts((cur) => {
      const base = cur || DEPARTMENTS.map((d) => d.id)
      const normalizedId = String(id)
      return base.includes(normalizedId)
        ? base.filter((x) => x !== normalizedId)
        : [...base, normalizedId]
    })
  }

  const handleFacilityClick = useFacilityClickHandler({
    onOpenPanel: useCallback((facility) => {
      setSelectedFacility(facility)
      setSelectedId(facility.id)
    }, []),
  })

  // Map highlight when arriving from another module with URL params
  // (facility_id / lat / lng / layer), REF.html checkUrlParamsAndHighlight().
  useEffect(() => {
    if (!leafletMap || !catalog) return
    const params = new URLSearchParams(window.location.search)
    const layer = params.get('layer')
    if (layer) layers.toggle(layer, true)
    const lat = parseFloat(params.get('lat'))
    const lng = parseFloat(params.get('lng'))
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      leafletMap.setView([lat, lng], 15)
      createPulseMarker(leafletMap, {
        lat,
        lng,
        name: params.get('name') || undefined,
        facilityId: params.get('facility_id') || undefined,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletMap, catalog])

  return (
    <div className="flex h-full">
      {/* Left: search + list */}
      <div className="w-[380px] shrink-0 border-r border-ink-100 bg-white flex flex-col">
        <div className="p-4 border-b border-ink-100">
          <GISSearchPanel center={referencePoint} user={user} allowedDepartments={activeIds} compact onResults={setGisResults} onResultClick={(result) => mapRef.current?.showResult(result)} />

          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5">
            {departments.map((d) => {
              const chip = chipFor(d)
              const active = activeIds.includes(String(d.id))
              return (
                <button
                  key={String(d.id)}
                  onClick={() => toggleDept(String(d.id))}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors"
                  style={{
                    borderColor: active ? chip.color : '#e4e7ec',
                    background: active ? `${chip.color}14` : 'transparent',
                    color: active ? chip.color : '#7488a0',
                  }}
                >
                  <Icon name={chip.icon} size={12} /> {chip.label}
                </button>
              )
            })}
          </div>
        </div>

        <CitizenLayerPanel
          catalog={catalog}
          visible={layers.visible}
          loading={layers.loading}
          toggle={layers.toggle}
          showDefaults={layers.showDefaults}
          clearAll={layers.clearAll}
          activeCount={layers.activeCount}
          selectedDepartments={departments.filter((department) => activeIds.includes(String(department.id)))}
        />

        <div className="flex items-center justify-between px-4 py-2 border-b border-ink-100 bg-ink-50/50">
          <span className="text-[11.5px] text-ink-500 font-medium">
            {loading ? 'Searching…' : `${filtered.length} facilities near ${userGps ? 'your GPS' : district.label}`}
          </span>
          <Button
            size="sm"
            variant={userGps ? 'positive' : 'outline'}
            icon={Navigation}
            loading={isLocating}
            onClick={handleLocateMe}
            className="!py-1 !text-[11px]"
          >
            {userGps ? 'GPS Active' : 'Near me'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-ink-50">
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <SkeletonCard />
              </div>
            ))}
          {!loading && filtered.length === 0 && (
            <EmptyState
              icon={Search}
              title={t('common.noResults')}
              description="Try a different search term or enable more department layers."
            />
          )}
          {!loading &&
            filtered.slice(0, 60).map((f) => (
              <div key={f.id} className="p-2.5 hover:bg-ink-50/50 transition-colors">
                <FacilityCard
                  facility={f}
                  active={selectedId === f.id}
                  onClick={() => handleFacilityClick(f)}
                  deptMap={deptMap}
                />
                <div className="flex items-center gap-3 px-3 pb-1 text-[11px] text-ink-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {(f.distanceM / 1000).toFixed(1)} km away
                  </span>
                  <span className="flex items-center gap-1 text-leaf-700 font-medium">
                    <Footprints size={11} /> ~{f.walkMin} min walk
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Right: map */}
        <div className="flex-1 relative p-3 z-0">
        <MapView
          ref={mapRef}
          center={district.center}
          zoom={district.zoom}
          facilities={filtered}
          selectedId={selectedId}
          searchResults={gisResults?.results || []}
          onSearchResultOpen={handleFacilityClick}
          onFacilityClick={handleFacilityClick}
          onMapClick={tools.handleMapClick}
          activeTool={tools.activeTool}
          radiusCenter={tools.radiusCenter}
          radiusKm={tools.radiusKm}
          measurePoints={tools.measurePoints}
          measureDistKm={tools.measureDistKm}
          clusterEnabled={tools.clusterEnabled}
          basemapUrl={tools.currentBasemap.url}
          departmentColors={departmentColors}
          onReady={setLeafletMap}
          className="h-full"
        />

        {/* Right-side information panel for administrative roles only.
            Citizens never see this panel — they navigate to Facility Detail. */}
        {!isCitizenRole && selectedFacility && (
          <div className="absolute right-6 top-6 bottom-6 z-[140]">
            <FacilityInfoPanel
              facility={selectedFacility}
              grievances={facilityGrievances || []}
              department={deptMap[selectedFacility.departmentId]}
              onClose={() => setSelectedFacility(null)}
            />
          </div>
        )}

        <div className="absolute top-6 left-6 flex flex-col gap-2 max-w-xs z-[120]">
          <DepartmentLegend departments={departments.map((d) => ({ id: String(d.id), name: d.name || d.label, color: d.color }))} activeIds={activeIds} onToggle={toggleDept} />
        </div>

        <div className="absolute bottom-6 right-6 z-[120]">
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
            onFitDistrict={() => mapRef.current?.flyTo(district.center, district.zoom)}
            onMyLocation={handleLocateMe}
            onSnapshot={() => mapRef.current?.snapshot()}
          />
        </div>
      </div>
    </div>
  )
}

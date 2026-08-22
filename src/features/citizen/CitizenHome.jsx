//// Citizen Home — GIS facility search, Map Toolbar, Near Me sorting, and walking distance estimates.
//// Data sources: GET /api/gis/catalog/, /api/gis/layers/{name}/, /api/facilities/,
//// /api/departments/ (backend_guide.md).
//// Explore Map sidebar states (Google Maps-style):
////   desktop  open (360px) / rail (48px icon column) / closed (0px)
////   mobile   off-canvas drawer / closed
//// Citizens open the in-map CitizenFacilitySheet on any facility click;
//// DM/ADM/Executive/Department Officer roles open the right-side FacilityInfoPanel.
//// Deep links from the dashboard: ?q= runs the shared GIS search,
//// ?dept=health filters one department, ?near=1 starts device location.
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Navigation, Search, X, Footprints, Layers } from 'lucide-react'
import clsx from 'clsx'
import MapView from '../../components/map/MapView'
import MapToolbar from '../../components/map/MapToolbar'
import { DepartmentLegendControl } from '../../components/map/MapLegend'
import FacilityInfoPanel from '../../components/map/FacilityInfoPanel'
import FacilityCard from '../shared/FacilityCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { useMapTools } from '../../hooks/useMapTools'
import { useGISCatalog } from '../../hooks/useGISCatalog'
import { useLeafletLayers } from '../../hooks/useLeafletLayers'
import { useFacilities } from '../../hooks/useFacilities'
import { useAsync } from '../../hooks/useAsync'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useDepartments, departmentMapFrom } from '../../hooks/useDepartments'
import { useRoute } from '../../hooks/useRoute'
import { createPulseMarker } from '../../services/LeafletLayerService'
import { GISRepository } from '../../gis/repositories/GISRepository'
import CitizenLayerPanel from './CitizenLayerPanel'
import CitizenFacilitySheet from './CitizenFacilitySheet'
import RouteSummary from '../../gis/components/RouteSummary'
import GISSearchPanel from '../../gis/components/GISSearchPanel'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { useI18n } from '../../i18n/i18n'
import { DEPARTMENTS, DISTRICTS, ROLES } from '../../config/constants'
import { distanceMeters } from '../../utils/geo'

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
  const [sheetFacility, setSheetFacility] = useState(null)
  const [userGps, setUserGps] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle') // idle | locating | active | denied
  const [gisResults, setGisResults] = useState(null)
  const [leafletMap, setLeafletMap] = useState(null)
  // Sidebar state — desktop: open / rail / closed; mobile: drawer open/closed.
  const [desktopMode, setDesktopMode] = useState('open')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const routing = useRoute()
  const routeActiveId = routing.routeActiveId
  const pushToast = useUiStore((s) => s.pushToast)

  // After a desktop width transition the Leaflet viewport size changes; the
  // MapView ResizeObserver already fires invalidateSize, and this explicit call
  // covers the moment the transition ends.  Transform-based (mobile) toggles
  // never change the map container size, so no invalidateSize is needed.
  const scheduleInvalidate = useCallback(() => {
    setTimeout(() => {
      try { mapRef.current?.map?.invalidateSize?.() } catch { /* map teardown mid-transition */ }
    }, 320)
  }, [])

  const openSidebar = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setDesktopMode('open')
      scheduleInvalidate()
    } else {
      setMobileOpen(true)
    }
  }, [scheduleInvalidate])

  const closeSidebar = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setDesktopMode((mode) => (mode === 'rail' ? 'closed' : 'rail'))
      scheduleInvalidate()
    } else {
      setMobileOpen(false)
    }
  }, [scheduleInvalidate])

  // The citizen guided tour opens the Explore Map sidebar before highlighting
  // targets inside it (desktop width collapse / mobile drawer).
  useEffect(() => {
    window.addEventListener('ndisp-tour-open-sidebar', openSidebar)
    return () => window.removeEventListener('ndisp-tour-open-sidebar', openSidebar)
  }, [openSidebar])

  // ONE route source of truth: facility markers and search results feed the
  // same useRoute instance.  STRICT TWO-POINT semantics: "Route to here" sets
  // the destination (a GPS origin is used when no route exists yet).
  const handleFacilityRouteTo = useCallback(async (entity) => {
    const result = await routing.routeTo(entity)
    if (result?.reason === 'same-as-origin' || result?.reason === 'same-as-destination') {
      pushToast(`${entity?.name || 'This location'} is already ${result.reason === 'same-as-origin' ? 'the start point' : 'the destination'}.`, 'info')
    }
  }, [routing, pushToast])

  // Backend data sources
  const { data: departmentsData } = useDepartments()
  const { data: catalog } = useGISCatalog()
  const { data: facilities, loading, error: facilitiesError, refetch: refetchFacilities } = useFacilities(district.id)
  const layers = useLeafletLayers(leafletMap)
  const { data: facilityGrievances } = useAsync(
    () => selectedFacility ? GISRepository.complaints({ facility_id: selectedFacility.id }) : Promise.resolve([]),
    [selectedFacility?.id]
  )

  // Fallback to the legacy constants while /api/departments/ loads.
  const departments = departmentsData && departmentsData.length ? departmentsData : DEPARTMENTS
  const departmentColors = useMemo(() => Object.fromEntries(departments.map((d) => [String(d.id), d.color])), [departments])
  const deptMap = useMemo(
    () => departmentMapFrom(departmentsData && departmentsData.length ? departmentsData : DEPARTMENTS),
    [departmentsData]
  )

  const isCitizenRole = user?.role === ROLES.CITIZEN

  // Seed the department chips from the loaded departments exactly once.
  useEffect(() => {
    if (departmentsData?.length && activeDepts === null) {
      setActiveDepts(departmentsData.map((d) => String(d.id)))
    }
  }, [departmentsData, activeDepts])
  const activeIds = activeDepts || DEPARTMENTS.map((d) => d.id)
  const allActive = departments.length > 0 && activeIds.length === departments.length

  // Locate user using Geolocation API; a permission denial is surfaced as an
  // honest banner with a retry ("Enable Location") instead of silent failure.
  const handleLocateMe = useCallback(() => {
    setLocationStatus('locating')
    mapRef.current?.locateUser()
    if (!navigator.geolocation) {
      setLocationStatus('idle')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserGps([pos.coords.longitude, pos.coords.latitude])
        setLocationStatus('active')
      },
      (error) => {
        setLocationStatus(error?.code === 1 ? 'denied' : 'idle')
      }
    )
  }, [])

  // Dashboard deep links: ?q= runs the shared GIS search, ?dept= isolates one
  // department, ?near=1 starts location.  Params are consumed once and removed.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const dept = params.get('dept')
    const near = params.get('near')
    if (!q && !dept && !near) return
    if (q) {
      window.dispatchEvent(new CustomEvent('ndisp-gis-ask', { detail: q }))
      openSidebar()
    }
    if (dept && departmentsData?.length) {
      const term = String(dept).toLowerCase()
      const match = departmentsData.find(
        (d) => String(d.id) === dept || String(d.slug || d.name || d.label || '').toLowerCase().includes(term)
      )
      if (match) setActiveDepts([String(match.id)])
    }
    if (near) handleLocateMe()
    window.history.replaceState({}, '', window.location.pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentsData])

  // Escape closes the mobile GIS-layers bottom sheet.
  useEffect(() => {
    if (!layersOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setLayersOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [layersOpen])

  const referencePoint = userGps || district.center

  const filtered = useMemo(() => {
    if (!facilities) return []
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
  // disables the others.
  function toggleDept(id) {
    setActiveDepts((cur) => {
      const base = cur || DEPARTMENTS.map((d) => d.id)
      const normalizedId = String(id)
      return base.includes(normalizedId)
        ? base.filter((x) => x !== normalizedId)
        : [...base, normalizedId]
    })
  }

  function selectAllDepts() {
    setActiveDepts(departments.map((d) => String(d.id)))
  }

  // Single facility-click behaviour: citizens open the in-map sheet (page
  // stays on the map), every other role opens the right-side inspection panel.
  const handleFacilityClick = useCallback((facility) => {
    if (!facility) return
    setSelectedId(facility.id)
    if (isCitizenRole) setSheetFacility(facility)
    else setSelectedFacility(facility)
  }, [isCitizenRole])

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

  const sheetWalkMin = sheetFacility ? filtered.find((f) => f.id === sheetFacility.id)?.walkMin : undefined
  const mobileResults = isMobile && gisResults?.results?.length ? gisResults.results : null

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Left: search + layers + results — collapsible sidebar.
          Desktop: width-animated (360px ↔ 48px ↔ 0).  Mobile: overlay drawer
          translated off-canvas.  The sidebar stays MOUNTED in every state,
          preserving search text, results, GIS layers, selection and the route. */}
      <aside
        data-tour-sidebar={desktopMode}
        className={clsx(
          'flex flex-col overflow-hidden bg-white border-r border-ink-100',
          'absolute inset-y-0 left-0 z-[130] w-[min(88vw,360px)] transition-transform duration-300 ease-out',
          'lg:relative lg:z-auto lg:translate-x-0 lg:transition-[width]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          desktopMode === 'open' && 'lg:translate-x-0 lg:w-[360px]',
          desktopMode === 'rail' && 'lg:w-12',
          desktopMode === 'closed' && 'lg:w-0'
        )}
      >
        {/* Full panel */}
        <div className={clsx('flex w-full min-h-0 flex-1 flex-col lg:w-[360px]', desktopMode === 'rail' && 'lg:hidden')}>
          <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-900">
              <MapPin size={14} className="text-leaf-600" />
              Explore Map
            </span>
            <button
              onClick={closeSidebar}
              aria-label="Collapse explore panel"
              className="flex items-center gap-1 rounded-lg border border-ink-200 px-2 py-1 text-[11px] font-semibold text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors"
            >
              <ChevronLeft size={13} /> Collapse
            </button>
          </div>
          <div className="p-4 border-b border-ink-100" data-tour="citizen-map-searchpanel">
            <GISSearchPanel center={referencePoint} user={user} allowedDepartments={activeIds} compact onResults={setGisResults} onResultClick={(result) => mapRef.current?.showResult(result)} onShowRoute={routing.showRoute} onClearRoute={routing.clearRoute} routeActiveId={routeActiveId} routeLoading={routing.status === 'loading'} onRouteStart={routing.setRouteStart} onRouteDestination={routing.setRouteDestination} routeStartId={routing.routeStartId} routeDestinationId={routing.routeDestinationId} />

            {/* Category pills — "All" + one chip per real department */}
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5" role="group" aria-label="Filter by department">
              <button
                onClick={selectAllDepts}
                className={clsx(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                  allActive ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-transparent text-ink-600 hover:bg-ink-50'
                )}
              >
                All
              </button>
              {departments.map((d) => {
                const chip = chipFor(d)
                const active = activeIds.includes(String(d.id))
                return (
                  <button
                    key={String(d.id)}
                    onClick={() => toggleDept(String(d.id))}
                    aria-pressed={active}
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
              {loading
                ? 'Searching…'
                : facilitiesError
                  ? 'Facility data unavailable'
                  : `${filtered.length} facilities near ${userGps ? 'your GPS' : district.label}`}
            </span>
            <Button
              size="sm"
              variant={userGps ? 'positive' : 'outline'}
              icon={Navigation}
              loading={locationStatus === 'locating'}
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
            {!loading && facilitiesError && (
              <div className="p-4">
                <div className="rounded-xl border border-alert-200 bg-alert-50 p-3.5 text-[12.5px] text-alert-700">
                  <p className="font-semibold">Facilities could not be loaded from the backend.</p>
                  <p className="text-[11.5px] text-alert-600 mt-0.5">{facilitiesError.message || 'Please try again.'}</p>
                  <Button size="sm" variant="outline" className="mt-2.5" onClick={refetchFacilities}>Retry</Button>
                </div>
              </div>
            )}
            {!loading && !facilitiesError && filtered.length === 0 && (
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

        {/* Rail — 48px icon column (desktop only) */}
        <div className={clsx('hidden w-12 flex-col items-center gap-1 border-r border-ink-100 py-3', desktopMode === 'rail' ? 'lg:flex' : 'lg:hidden')}>
          <button onClick={openSidebar} title="Expand explore panel" aria-label="Expand explore panel" className="grid h-9 w-9 place-items-center rounded-lg text-ink-600 hover:bg-ink-100 transition-colors">
            <ChevronRight size={16} />
          </button>
          <button onClick={openSidebar} title="Search places, services or facilities" aria-label="Search" className="grid h-9 w-9 place-items-center rounded-lg text-ink-600 hover:bg-ink-100 transition-colors">
            <Search size={16} />
          </button>
          <button onClick={openSidebar} title="Map layers" aria-label="Map layers" className="grid h-9 w-9 place-items-center rounded-lg text-ink-600 hover:bg-ink-100 transition-colors">
            <Layers size={16} />
          </button>
          <button onClick={handleLocateMe} title="Near me" aria-label="Near me" className="grid h-9 w-9 place-items-center rounded-lg text-ink-600 hover:bg-ink-100 transition-colors">
            <Navigation size={16} />
          </button>
          <button onClick={() => setDesktopMode('closed')} title="Close explore panel" aria-label="Close explore panel" className="grid h-9 w-9 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 transition-colors">
            <X size={16} />
          </button>
        </div>
      </aside>

      {/* Right: map */}
      <div className="flex-1 relative p-2 sm:p-3 z-0 min-w-0" data-tour="citizen-map-canvas">
        <MapView
          ref={mapRef}
          center={district.center}
          zoom={district.zoom}
          facilities={filtered}
          selectedId={selectedId}
          searchResults={gisResults?.results || []}
          onSearchResultOpen={handleFacilityClick}
          onSearchResultRoute={routing.showRoute}
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
          route={routing.route}
          routeOriginKey={routing.routeOriginKey}
          onFacilityRouteTo={handleFacilityRouteTo}
        />

        <div className="absolute left-6 bottom-6 z-[120]">
          <RouteSummary status={routing.status} route={routing.route} origin={routing.origin} destination={routing.destination} errorMessage={routing.errorMessage} onCalculate={routing.calculateRoute} onClear={routing.clearRoute} />
        </div>

        {/* Right-side information panel for administrative roles only.
            Citizens use the in-map CitizenFacilitySheet instead. */}
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

        {/* Google-Maps-style search pill (mobile, panel closed) + open button (desktop) */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 w-[min(180px,calc(100vw-20px))] z-[120]">
          {isMobile && !mobileOpen && (
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open explore panel"
              className="flex items-center gap-2 rounded-full bg-white border border-ink-200 px-4 py-2.5 text-[12.5px] font-medium text-ink-600 shadow-lg hover:bg-ink-50 transition-colors"
            >
              <Search size={14} className="text-leaf-600" />
              Search places or facilities
            </button>
          )}
          {!isMobile && desktopMode === 'closed' && (
            <button
              onClick={openSidebar}
              aria-label="Open explore panel"
              className="flex items-center gap-1.5 rounded-xl bg-white border border-ink-200 px-3 py-2 text-[12px] font-semibold text-ink-800 shadow-lg hover:bg-ink-50 transition-colors"
            >
              <Search size={14} className="text-leaf-600" />
              Open Explore Map
            </button>
          )}
          {!isMobile && desktopMode === 'rail' && (
            <button
              onClick={openSidebar}
              aria-label="Expand explore panel"
              className="flex items-center gap-1.5 rounded-xl bg-white border border-ink-200 px-3 py-2 text-[12px] font-semibold text-ink-800 shadow-lg hover:bg-ink-50 transition-colors"
            >
              <ChevronRight size={14} className="text-leaf-600" />
              Expand panel
            </button>
          )}
          {/* Department selector: full legend on desktop; compact pill + bottom
              sheet on mobile/tablet. Hidden while the drawer is open so it
              never overlaps the panel. GIS filtering logic is untouched. */}
          {(!isMobile || !mobileOpen) && (
            <DepartmentLegendControl
              departments={departments.map((d) => ({ id: String(d.id), name: d.name || d.label, color: d.color }))}
              activeIds={activeIds}
              onToggle={toggleDept}
              allActive={allActive}
            />
          )}
        </div>

        {/* Honest location-permission banner with retry. Sits below the
            Leaflet zoom control (top-right) so the controls never overlap. */}
        {locationStatus === 'denied' && (
          <div className="absolute top-24 right-6 z-[120] flex items-center gap-3 rounded-xl border border-alert-200 bg-white p-3 shadow-popover" role="alert">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-ink-900">Location access is off</p>
              <p className="text-[11px] text-ink-500">Enable location to sort facilities nearest to you.</p>
            </div>
            <Button size="sm" icon={Navigation} onClick={handleLocateMe}>Enable Location</Button>
          </div>
        )}

        <div className="absolute bottom-6 right-6 z-[120] flex flex-col items-end gap-2" data-tour="citizen-map-tools">
          {/* Mobile: dedicated GIS-layers pill opening the bottom sheet.
              Map stays the primary surface; the drawer is only for search. */}
          {isMobile && !mobileOpen && (
            <button
              type="button"
              onClick={() => setLayersOpen(true)}
              aria-label="Open GIS layers"
              aria-expanded={layersOpen}
              className="flex h-11 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[12.5px] font-medium text-ink-800 shadow-lg transition-colors hover:bg-ink-50"
            >
              <Layers size={14} className="text-saffron-600" />
              GIS Layers
              {layers.activeCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink-900 px-1 text-[10.5px] font-semibold text-white">{layers.activeCount}</span>
              )}
            </button>
          )}
          <MapToolbar
            groupAdvanced={isCitizenRole}
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
            onRemoveMeasurePoint={tools.removeLastMeasurePoint}
            onFinishMeasure={tools.finishMeasure}
            onFitDistrict={() => mapRef.current?.flyTo(district.center, district.zoom)}
            onMyLocation={handleLocateMe}
            onSnapshot={() => mapRef.current?.snapshot()}
          />
        </div>
      </div>

      {/* In-map facility detail (citizen portal) */}
      {isCitizenRole && (
        <CitizenFacilitySheet
          facility={sheetFacility}
          deptMap={deptMap}
          walkMin={sheetWalkMin}
          onShowRoute={handleFacilityRouteTo}
          onClose={() => setSheetFacility(null)}
        />
      )}

      {/* Mobile search results bottom sheet */}
      {mobileResults && (
        <div className="ndisp-sheet-up fixed inset-x-0 bottom-[calc(var(--citizen-bottom-nav-height,64px)+var(--safe-bottom,0px))] lg:hidden z-[150] max-h-[45dvh] overflow-hidden rounded-t-2xl border-t border-ink-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-2.5">
            <span className="text-[12px] font-semibold text-ink-800">
              {mobileResults.length} result{mobileResults.length === 1 ? '' : 's'} for “{gisResults.query}”
            </span>
            <button
              onClick={() => { setGisResults(null) }}
              aria-label="Close results"
              className="grid h-7 w-7 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="max-h-[38dvh] overflow-y-auto divide-y divide-ink-50">
            {mobileResults.map((row) => (
              <button
                key={row.id}
                onClick={() => handleFacilityClick(row)}
                className="flex w-full items-start gap-2.5 px-4 py-3 text-left hover:bg-ink-50/60 transition-colors"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-sky-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold leading-snug text-ink-900 line-clamp-2">{row.name}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink-500 line-clamp-1">
                    {row.categoryLabel}{row.departmentName ? ` · ${row.departmentName}` : ''}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Mobile GIS-layers bottom sheet — same pattern as the department
          sheet (ndisp-sheet-up, above the bottom navigation) so the map
          stays the primary visual area. */}
      {layersOpen && (
        <>
          <div onClick={() => setLayersOpen(false)} aria-hidden="true" className="fixed inset-0 z-[145] bg-slate-900/25" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="GIS Layers"
            className="ndisp-sheet-up fixed inset-x-0 bottom-[calc(var(--citizen-bottom-nav-height,64px)+var(--safe-bottom,0px))] z-[150] flex max-h-[75dvh] flex-col overflow-hidden rounded-t-2xl border-t border-ink-100 bg-white shadow-2xl"
          >
            <div className="flex shrink-0 justify-center pt-2.5 pb-1">
              <span className="h-1 w-10 rounded-full bg-ink-200" />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-100 px-4 py-2">
              <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-900">
                <Layers size={14} className="text-saffron-600" />
                GIS Layers
              </h3>
              <button
                type="button"
                onClick={() => setLayersOpen(false)}
                className="grid h-11 min-w-11 place-items-center rounded-lg px-3 text-[12.5px] font-semibold text-sky-700 transition-colors hover:bg-sky-50"
              >
                Done
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
              <CitizenLayerPanel
                catalog={catalog}
                visible={layers.visible}
                loading={layers.loading}
                toggle={layers.toggle}
                showDefaults={layers.showDefaults}
                clearAll={layers.clearAll}
                activeCount={layers.activeCount}
                selectedDepartments={departments.filter((department) => activeIds.includes(String(department.id)))}
                defaultOpen
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
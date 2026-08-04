//// Citizen Home — GIS facility search, Map Toolbar, Near Me sorting, and walking distance estimates.
import { useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Navigation, Footprints, MapPin } from 'lucide-react'
import MapView from '../../components/map/MapView'
import MapToolbar from '../../components/map/MapToolbar'
import { DepartmentLegend } from '../../components/map/MapLegend'
import FacilityCard from '../shared/FacilityCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { useAsync } from '../../hooks/useAsync'
import { useMapTools } from '../../hooks/useMapTools'
import { gisApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { useI18n } from '../../i18n/i18n'
import { DEPARTMENTS, DISTRICTS } from '../../config/constants'
import { distanceMeters } from '../../utils/geo'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'

export default function CitizenHome() {
  const user = useAuthStore((s) => s.user)
  const district = DISTRICTS.find((d) => d.id === user?.districtId) || DISTRICTS[0]
  const { t } = useI18n()
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const tools = useMapTools()

  const [query, setQuery] = useState('')
  const [activeDepts, setActiveDepts] = useState(DEPARTMENTS.map((d) => d.id))
  const [selectedId, setSelectedId] = useState(null)
  const [userGps, setUserGps] = useState(null)
  const [isLocating, setIsLocating] = useState(false)

  const { data: facilities, loading } = useAsync(() => gisApi.getAllFacilities(district.id), [district.id])

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
    let list = facilities.filter((f) => activeDepts.includes(f.departmentId))
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
  }, [facilities, activeDepts, query, referencePoint])

  function toggleDept(id) {
    setActiveDepts((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  const handleFacilityClick = useCallback(
    (id) => {
      setSelectedId(id)
      navigate(`/citizen/facility/${id}`)
    },
    [navigate]
  )

  return (
    <div className="flex h-full">
      {/* Left: search + list */}
      <div className="w-[380px] shrink-0 border-r border-ink-100 bg-white flex flex-col">
        <div className="p-4 border-b border-ink-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('citizen.searchPlaceholder')}
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2.5 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5">
            {DEPARTMENTS.map((d) => {
              const active = activeDepts.includes(d.id)
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDept(d.id)}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors"
                  style={{
                    borderColor: active ? d.color : '#e4e7ec',
                    background: active ? `${d.color}14` : 'transparent',
                    color: active ? d.color : '#7488a0',
                  }}
                >
                  <Icon name={d.icon} size={12} /> {d.label}
                </button>
              )
            })}
          </div>
        </div>

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
                  onClick={() => handleFacilityClick(f.id)}
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
      <div className="flex-1 relative p-3">
        <MapView
          ref={mapRef}
          center={district.center}
          zoom={district.zoom}
          facilities={filtered}
          selectedId={selectedId}
          onFacilityClick={handleFacilityClick}
          onMapClick={tools.handleMapClick}
          activeTool={tools.activeTool}
          radiusCenter={tools.radiusCenter}
          radiusKm={tools.radiusKm}
          measurePoints={tools.measurePoints}
          measureDistKm={tools.measureDistKm}
          clusterEnabled={tools.clusterEnabled}
          basemapUrl={tools.currentBasemap.url}
          className="h-full"
        />

        <div className="absolute top-6 left-6 flex flex-col gap-2 max-w-xs z-10">
          <DepartmentLegend activeIds={activeDepts} onToggle={toggleDept} />
        </div>

        <div className="absolute bottom-6 right-6 z-10">
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

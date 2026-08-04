// Line Department Overview — FR-LD-02 / Vol 3 Ch 16.
// Department dashboard with Map Toolbar, gap score ring, directive inbox, and quick actions.
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Inbox, FilePlus2, Wrench } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import MapView from '../../components/map/MapView'
import MapToolbar from '../../components/map/MapToolbar'
import GapScoreRing from '../../components/ui/GapScoreRing'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAsync } from '../../hooks/useAsync'
import { useMapTools } from '../../hooks/useMapTools'
import { gisApi, analyticsApi, workflowApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { DEPARTMENT_MAP, DISTRICTS } from '../../config/constants'
import { formatNumber, formatPercent } from '../../utils/format'
import Icon from '../../components/ui/Icon'

export default function LineDeptOverview() {
  const user = useAuthStore((s) => s.user)
  const dept = DEPARTMENT_MAP[user?.departmentId] || DEPARTMENT_MAP.health
  const district = DISTRICTS.find((d) => d.id === user?.districtId) || DISTRICTS[0]
  const mapRef = useRef(null)
  const tools = useMapTools()

  const { data: facilities, loading: loadingFac } = useAsync(
    () => gisApi.searchFacilities({ districtId: district.id, departmentId: dept.id }),
    [district.id, dept.id]
  )
  const { data: kpis, loading: loadingKpi } = useAsync(() => analyticsApi.getDepartmentKpis(district.id), [district.id])
  const myKpi = kpis?.find((k) => k.departmentId === dept.id)
  const { data: directives } = useAsync(() => workflowApi.getDirectives(dept.id), [dept.id])
  const { data: grievances } = useAsync(() => workflowApi.listGrievances({ departmentId: dept.id }), [dept.id])

  return (
    <div>
      <PageHeader
        eyebrow="Line Department Portal · FR-LD-02"
        title={`${dept.label} Department — ${district.label}`}
        description="Operational activity feed: department KPIs, thematic GIS layers, workforce and scheme progress."
        action={
          <div className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: dept.color }}>
            <Icon name={dept.icon} size={17} />
          </div>
        }
      />

      <div className="px-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {loadingKpi ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Facilities" value={formatNumber(myKpi?.facilityCount)} sub={`${myKpi?.geoTaggedPct}% geo-tagged`} tone="ink" />
            <StatCard label="Coverage" value={formatPercent(myKpi?.coveragePct)} tone="leaf" sub="vs. 3km service radius" />
            <StatCard label="Open proposals" value={myKpi?.openProposals} tone="saffron" sub="Awaiting DM review or tasking" />
            <StatCard label="Open grievances" value={myKpi?.openGrievances} tone="alert" sub="Assigned to this department" />
          </>
        )}
      </div>

      <div className="px-6 mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Department GIS layer" subtitle={`${dept.label} facility points in ${district.label}`} />
          <CardBody className="!p-3 relative">
            {loadingFac ? (
              <div className="h-80 flex items-center justify-center text-ink-400 text-[12px]">Loading GIS layer…</div>
            ) : (
              <div className="relative h-80">
                <MapView
                  ref={mapRef}
                  center={district.center}
                  zoom={district.zoom}
                  facilities={facilities}
                  colorBy="gap"
                  activeTool={tools.activeTool}
                  onMapClick={tools.handleMapClick}
                  radiusCenter={tools.radiusCenter}
                  radiusKm={tools.radiusKm}
                  measurePoints={tools.measurePoints}
                  measureDistKm={tools.measureDistKm}
                  clusterEnabled={tools.clusterEnabled}
                  basemapUrl={tools.currentBasemap.url}
                  className="h-full"
                />

                <div className="absolute bottom-4 right-4 z-10">
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
                    onMyLocation={() => mapRef.current?.locateUser()}
                    onSnapshot={() => mapRef.current?.snapshot()}
                  />
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Coverage gap score" subtitle="District sector deficit index" />
          <CardBody className="flex flex-col items-center justify-center py-6">
            <GapScoreRing score={myKpi?.avgGapScore ?? 0.5} size={96} strokeWidth={8} />
            <p className="text-[12.5px] font-semibold text-ink-800 mt-4">
              {(myKpi?.avgGapScore ?? 0.5) >= 0.66 ? 'High Deficit' : (myKpi?.avgGapScore ?? 0.5) >= 0.33 ? 'Moderate Deficit' : 'Well Served'}
            </p>
            <p className="text-[11.5px] text-ink-500 text-center mt-1 max-w-[200px]">
              Calculated via Spatial Deficit Detection Engine (Vol 3 §17.1).
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="px-6 mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
        <Card>
          <CardHeader title="Recent directives" icon={Inbox} action={<Link to="/linedept/directives" className="text-[12px] font-semibold text-ink-600 flex items-center gap-1">All <ArrowRight size={12} /></Link>} />
          <CardBody className="!p-0">
            {(directives || []).slice(0, 4).map((d) => (
              <div key={d.id} className="px-5 py-2.5 border-b border-ink-50 last:border-0">
                <p className="text-[12.5px] font-medium text-ink-900 truncate">{d.title}</p>
                <StatusBadge status={d.state} />
              </div>
            ))}
            {(directives || []).length === 0 && <p className="px-5 py-6 text-[12px] text-ink-400">No directives yet.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Assigned grievances" icon={Wrench} action={<Link to="/linedept/field-ops" className="text-[12px] font-semibold text-ink-600 flex items-center gap-1">All <ArrowRight size={12} /></Link>} />
          <CardBody className="!p-0">
            {(grievances || []).slice(0, 4).map((g) => (
              <div key={g.id} className="px-5 py-2.5 border-b border-ink-50 last:border-0">
                <p className="text-[12.5px] font-medium text-ink-900 truncate">{g.title}</p>
                <StatusBadge status={g.state} />
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick actions" icon={FilePlus2} />
          <CardBody className="space-y-2">
            <Button as={Link} to={`/department/${dept.id}`} className="w-full justify-center bg-ink-950 text-white hover:bg-ink-900 font-semibold mb-1">
              Go to Enterprise operations
            </Button>
            <Button as={Link} to="/linedept/proposals" variant="outline" className="w-full justify-center">Submit new proposal</Button>
            <Button as={Link} to="/linedept/data-upload" variant="outline" className="w-full justify-center">Upload CSV data</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

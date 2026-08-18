import { useState } from 'react'
import {
  Clock, CheckCircle2, AlertTriangle, Flame, MapPin, Eye, FileText
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import StatusBadge from '../../../components/ui/StatusBadge'
import Button from '../../../components/ui/Button'
import MapView from '../../../components/map/MapView'
import Modal from '../../../components/ui/Modal'
import ComplaintDetailHub from '../../shared/ComplaintDetailHub'
import { useDepartment } from './DepartmentContext'
import { useAsync } from '../../../hooks/useAsync'
import { backendDashboardApi } from '../../../api/dashboardApi'
import { DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { formatNumber } from '../../../utils/format'

export default function DepartmentDashboardBuilder() {
  const { dept, complaints, kpis, assets } = useDepartment()
  const [selectedTicketId, setSelectedTicketId] = useState(null)

  // Live backend department dashboard envelope (complaint KPIs, queue,
  // SLA + activity).  Engine-derived complaint KPIs remain as the local
  // projection; backend values take precedence when available.
  const backend = useAsync(
    () => backendDashboardApi.department({ department: dept.id }),
    [dept.id],
    { deps: [DATA_SCOPES.DASHBOARD] },
  )
  const dashboard = backend.data || null
  const summary = dashboard?.complaints || null
  const backendKpis = dashboard?.kpis || null

  const widgets = dept.dashboardWidgets || [
    { id: 'kpis', type: 'kpis', span: 12 },
    { id: 'queue', type: 'complaint_queue', span: 8 },
    { id: 'map', type: 'gis_mini_map', span: 4 },
  ]

  const mapFacilities = assets.map((a) => ({
    id: a.id,
    name: a.name,
    departmentId: dept.id,
    categoryLabel: a.typeLabel || a.categoryLabel,
    status: a.status,
    gapScore: 0.25,
    position: a.position,
  }))

  const totalTickets = summary?.total ?? kpis.total
  const pending = summary?.open ?? kpis.pending
  const resolved = summary?.resolved ?? kpis.resolved
  const escalated = summary?.escalated ?? kpis.escalated
  const slaBreached = summary?.slaBreached ?? kpis.slaBreached
  const slaPct = totalTickets ? Math.round(((totalTickets - slaBreached) / totalTickets) * 100) : 100

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-12 gap-4">
        {widgets.map((widget) => {
          const colSpan = widget.span || 12
          const colClass = `col-span-12 lg:col-span-${colSpan}`

          if (widget.type === 'kpis') {
            return (
              <div key={widget.id} className="col-span-12 grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                <StatCard label="Total Tickets" value={formatNumber(totalTickets)} icon={FileText} tone="ink" />
                <StatCard label="Pending Queue" value={formatNumber(pending)} icon={Clock} tone="saffron" />
                <StatCard label="Resolved Work" value={formatNumber(resolved)} icon={CheckCircle2} tone="leaf" />
                <StatCard label="Escalated Tickets" value={formatNumber(escalated)} icon={AlertTriangle} tone="alert" />
                <StatCard label="SLA Compliance" value={`${slaPct}%`} icon={Flame} tone="sky" />
              </div>
            )
          }

          if (widget.type === 'complaint_queue') {
            return (
              <div key={widget.id} className={colClass}>
                <Card>
                  <CardHeader title={widget.title || 'Department Complaint Queue'} subtitle="Active complaints assigned to sector" icon={Clock} />
                  <CardBody className="!p-0">
                    <div className="divide-y divide-ink-100">
                      {complaints.length === 0 ? (
                        <div className="p-6 text-center text-ink-400 text-[12.5px]">No active complaints in queue.</div>
                      ) : (
                        complaints.slice(0, 5).map((c) => (
                          <div key={c.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-ink-50/50 transition-colors">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="kbd-mono text-[11.5px] font-bold text-ink-900">{c.id}</span>
                                <StatusBadge status={c.state} />
                              </div>
                              <h4 className="text-[13px] font-semibold text-ink-950 mt-0.5 truncate">{c.title}</h4>
                            </div>
                            <Button size="sm" variant="outline" icon={Eye} onClick={() => setSelectedTicketId(c.id)}>
                              Inspect
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )
          }

          if (widget.type === 'gis_mini_map') {
            return (
              <div key={widget.id} className={colClass}>
                <Card>
                  <CardHeader title="Sector GIS Map" subtitle="Spatial asset distribution" icon={MapPin} />
                  <CardBody className="!p-2">
                    <div className="h-[clamp(160px,24vh,224px)] rounded-xl overflow-hidden relative">
                      <MapView center={[85.4211, 25.0294]} zoom={12} facilities={mapFacilities} className="h-full" />
                    </div>
                  </CardBody>
                </Card>
              </div>
            )
          }

          return null
        })}
      </div>

      <Modal open={!!selectedTicketId} onClose={() => setSelectedTicketId(null)} width="max-w-4xl">
        {selectedTicketId && <ComplaintDetailHub complaintId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />}
      </Modal>
    </div>
  )
}
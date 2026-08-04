import { useState } from 'react'
import {
  HeartPulse, Building2, Truck, Droplet, Clock, CheckCircle2, AlertTriangle,
  Flame, Sparkles, MapPin, Activity, ArrowRight, Eye, ShieldAlert
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import StatusBadge from '../../../components/ui/StatusBadge'
import Button from '../../../components/ui/Button'
import MapView from '../../../components/map/MapView'
import Modal from '../../../components/ui/Modal'
import ComplaintDetailHub from '../../shared/ComplaintDetailHub'
import { useDepartment } from './DepartmentContext'
import { formatNumber, formatDateTime } from '../../../utils/format'

export default function DepartmentDashboardBuilder() {
  const { dept, complaints, kpis, assets } = useDepartment()
  const [selectedTicketId, setSelectedTicketId] = useState(null)

  const widgets = dept.dashboardWidgets || [
    { id: 'kpis', type: 'kpis', span: 12 },
    { id: 'queue', type: 'complaint_queue', span: 8 },
    { id: 'map', type: 'gis_mini_map', span: 4 },
  ]

  const mapFacilities = assets.map((a) => ({
    id: a.id,
    name: a.name,
    departmentId: dept.id,
    categoryLabel: a.typeLabel,
    status: a.status,
    gapScore: 0.25,
    position: a.position,
  }))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-12 gap-4">
        {widgets.map((widget) => {
          const colSpan = widget.span || 12
          const colClass = `col-span-12 lg:col-span-${colSpan}`

          if (widget.type === 'kpis') {
            return (
              <div key={widget.id} className="col-span-12 grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                <StatCard label="Total Tickets" value={kpis.total} icon={Activity} tone="ink" />
                <StatCard label="Pending Queue" value={kpis.pending} icon={Clock} tone="saffron" />
                <StatCard label="Resolved Work" value={kpis.resolved} icon={CheckCircle2} tone="leaf" />
                <StatCard label="Escalated Tickets" value={kpis.escalated} icon={AlertTriangle} tone="alert" />
                <StatCard label="SLA Compliance" value={`${kpis.slaPct}%`} icon={Flame} tone="sky" />
              </div>
            )
          }

          if (widget.type === 'bed_occupancy') {
            return (
              <div key={widget.id} className={colClass}>
                <Card>
                  <CardHeader title="Hospital Bed & ICU Telemetry" subtitle="District Health Facilities" icon={HeartPulse} />
                  <CardBody className="space-y-3 text-[12.5px]">
                    <div className="grid grid-cols-2 gap-3 p-3 bg-ink-50 rounded-xl">
                      <div>
                        <span className="text-ink-500 block text-[11px]">General Beds Occupancy</span>
                        <span className="text-lg font-display font-semibold text-ink-950">114 / 150 (76%)</span>
                      </div>
                      <div>
                        <span className="text-ink-500 block text-[11px]">ICU / Ventilator Beds</span>
                        <span className="text-lg font-display font-semibold text-alert-600">15 / 18 (83%)</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-leaf-50 border border-leaf-200 text-leaf-900 text-[11.5px] flex items-center justify-between">
                      <span>Oxygen Plant Status: 250 kW PSA Active (99.2% Purity)</span>
                      <Badge tone="positive">Optimal</Badge>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )
          }

          if (widget.type === 'ambulance_telemetry') {
            return (
              <div key={widget.id} className={colClass}>
                <Card>
                  <CardHeader title="102/108 Ambulance Fleet Telemetry" subtitle="Emergency Medical Dispatch" icon={Truck} />
                  <CardBody className="space-y-3 text-[12.5px]">
                    <div className="grid grid-cols-3 gap-2 text-center p-3 bg-ink-50 rounded-xl">
                      <div>
                        <span className="block font-semibold text-leaf-700 text-base">14</span>
                        <span className="text-[10.5px] text-ink-500 uppercase">On Call / Active</span>
                      </div>
                      <div>
                        <span className="block font-semibold text-saffron-700 text-base">4</span>
                        <span className="text-[10.5px] text-ink-500 uppercase">En Route</span>
                      </div>
                      <div>
                        <span className="block font-semibold text-ink-900 text-base">2</span>
                        <span className="text-[10.5px] text-ink-500 uppercase">Under Maintenance</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11.5px] text-ink-600">
                      <span>Average Response Time: <strong>14.2 Mins</strong></span>
                      <span className="font-mono text-leaf-700 font-semibold">GPS Active</span>
                    </div>
                  </CardBody>
                </Card>
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

          if (widget.type === 'recommendations') {
            return (
              <div key={widget.id} className={colClass}>
                <Card>
                  <CardHeader title="AI Decision Support" subtitle="Automated sector intelligence" icon={Sparkles} />
                  <CardBody className="space-y-3 text-[12px]">
                    <div className="p-3 rounded-xl bg-saffron-50 border border-saffron-200 text-saffron-900 space-y-1">
                      <span className="font-semibold block flex items-center gap-1">
                        <ShieldAlert size={14} className="text-saffron-600" /> High Footfall Warning
                      </span>
                      <p className="text-[11.5px] text-saffron-800 leading-snug">
                        Rajgir PHC patient queue spiked 40% in last 24h. Deploy 2 additional ASHA workers.
                      </p>
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
                    <div className="h-56 rounded-xl overflow-hidden relative">
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

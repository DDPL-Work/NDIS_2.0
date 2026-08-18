import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { Flame, ShieldAlert, CloudLightning, PhoneCall, HelpCircle, Navigation } from 'lucide-react'
import { useUiStore } from '../../../app/store/uiStore'

export default function DisasterTab({ shelters, controlRooms, onDispatchTeam }) {
  const pushToast = useUiStore((s) => s.pushToast)

  const shelterColumns = [
    { key: 'name', label: 'Emergency Shelter', render: (r) => <span className="font-semibold text-ink-900">{r.name}</span> },
    { key: 'capacity', label: 'Occupancy', render: (r) => `${r.occupied} / ${r.capacity} (${Math.round((r.occupied/r.capacity)*100)}%)` },
    { key: 'village', label: 'Location Block', render: (r) => `${r.village}, ${r.block}` },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'Operational' ? 'positive' : 'warning'}>{r.status}</Badge> },
  ]

  const controlColumns = [
    { key: 'name', label: 'Control Substation', render: (r) => <span className="font-semibold text-ink-900">{r.name}</span> },
    { key: 'head', label: 'Nodal Officer', render: (r) => `${r.head} (${r.phone})` },
    { key: 'status', label: 'Readiness', render: (r) => <Badge tone={r.status === 'Standby' ? 'info' : 'positive'}>{r.status}</Badge> },
    {
      key: 'action',
      label: 'Emergency Alert',
      render: (r) => (
        <Button size="xs" variant="outline" tone="alert" icon={ShieldAlert} onClick={() => {
          onDispatchTeam(r.id)
          pushToast(`Disaster response team alerted at ${r.name}`, 'info')
        }}>
          Alert Dispatch
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Emergency readiness note — no disaster telemetry endpoint exists */}
      <div className="p-4 rounded-xl bg-ink-50 border border-ink-200 text-ink-800 flex items-start gap-3 text-[12.5px]">
        <CloudLightning size={20} className="text-ink-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-semibold">Disaster Telemetry — Backend Gap</strong>
          <p className="leading-relaxed">
            Shelter registers, control rooms and emergency dispatch are not exposed by the backend yet. This panel will render live readiness data once the endpoint is available.
          </p>
        </div>
      </div>

      {/* Control Rooms & Shelters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Disaster Control Rooms */}
        <Card>
          <CardHeader title="Rapid Response Control Rooms" subtitle="Command centers under active monitor" icon={Flame} />
          <CardBody className="!p-0">
            <DataTable columns={controlColumns} rows={controlRooms} emptyLabel="No control rooms registered on the backend" />
          </CardBody>
        </Card>

        {/* Shelters */}
        <Card>
          <CardHeader title="Emergency Shelters Register" subtitle="Temporary medical & relief shelter stations" icon={HelpCircle} />
          <CardBody className="!p-0">
            <DataTable columns={shelterColumns} rows={shelters} emptyLabel="No shelters registered on the backend" />
          </CardBody>
        </Card>
      </div>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader title="District Emergency Response Directory" subtitle="Standard state helpline lines" icon={PhoneCall} />
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px] font-mono">
          <div className="p-3 bg-ink-50 rounded-xl">
            <span className="text-ink-400 block text-[10px] uppercase font-semibold">National Emergency</span>
            <span className="text-[14px] font-bold text-ink-950">112</span>
          </div>
          <div className="p-3 bg-ink-50 rounded-xl">
            <span className="text-ink-400 block text-[10px] uppercase font-semibold">Disaster Response</span>
            <span className="text-[14px] font-bold text-alert-700">1077 (Toll Free)</span>
          </div>
          <div className="p-3 bg-ink-50 rounded-xl">
            <span className="text-ink-400 block text-[10px] uppercase font-semibold">Citizen Services</span>
            <span className="text-[14px] font-bold text-ink-950">1070 (Toll Free)</span>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

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
      {/* Flood / Heatwave Alerts Banner */}
      <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 flex items-start gap-3 text-[12.5px]">
        <CloudLightning size={20} className="text-orange-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-semibold">Active Orange Alert: Monsoon Flood Watch</strong>
          <p className="leading-relaxed">
            Nalanda District administration has initiated flood patrol along low-lying embankments. 8 shelter stations seeded with dry rations and medical kits.
          </p>
        </div>
      </div>

      {/* Control Rooms & Shelters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Disaster Control Rooms */}
        <Card>
          <CardHeader title="Rapid Response Control Rooms" subtitle="Command centers under active monitor" icon={Flame} />
          <CardBody className="!p-0">
            <DataTable columns={controlColumns} rows={controlRooms} />
          </CardBody>
        </Card>

        {/* Shelters */}
        <Card>
          <CardHeader title="Emergency Shelters Register" subtitle="Temporary medical & relief shelter stations" icon={HelpCircle} />
          <CardBody className="!p-0">
            <DataTable columns={shelterColumns} rows={shelters} />
          </CardBody>
        </Card>
      </div>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader title="District Emergency Response Hotline Directory" subtitle="Standard active call lines" icon={PhoneCall} />
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px] font-mono">
          <div className="p-3 bg-ink-50 rounded-xl">
            <span className="text-ink-400 block text-[10px] uppercase font-semibold">District Control Helpline</span>
            <span className="text-[14px] font-bold text-ink-950">06112-225224</span>
          </div>
          <div className="p-3 bg-ink-50 rounded-xl">
            <span className="text-ink-400 block text-[10px] uppercase font-semibold">Disaster Response Desk</span>
            <span className="text-[14px] font-bold text-alert-700">1077 (Toll Free)</span>
          </div>
          <div className="p-3 bg-ink-50 rounded-xl">
            <span className="text-ink-400 block text-[10px] uppercase font-semibold">Chief Medical Nodal Officer</span>
            <span className="text-[14px] font-bold text-ink-950">+91 94318 22104</span>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

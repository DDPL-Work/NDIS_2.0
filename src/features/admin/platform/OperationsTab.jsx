import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { Truck, Calendar, FileText, ClipboardList, CheckCircle2, PlusCircle, Clock } from 'lucide-react'

export default function OperationsTab({ vehicles, inspections, meetings, onScheduleInspection, onScheduleMeeting }) {
  const [showInsModal, setShowInsModal] = useState(false)
  const [showMeetModal, setShowMeetModal] = useState(false)

  // Form states for new inspection
  const [insTitle, setInsTitle] = useState('')
  const [insDept, setInsDept] = useState('health')
  const [insOfficer, setInsOfficer] = useState('Dr. Rajesh Kumar')

  // Form states for new meeting
  const [meetTitle, setMeetTitle] = useState('')
  const [meetDept, setMeetDept] = useState('Disaster Management')

  const vehicleColumns = [
    { key: 'reg', label: 'Registration', render: (r) => <span className="kbd-mono text-[11px] font-bold text-ink-900">{r.reg}</span> },
    { key: 'type', label: 'Type', render: (r) => r.type },
    { key: 'driver', label: 'Driver Phone', render: (r) => `${r.driver} (${r.phone})` },
    { key: 'fuel', label: 'Fuel level', render: (r) => <span className="font-mono">{r.fuel}%</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'Active' ? 'positive' : 'warning'}>{r.status}</Badge> },
  ]

  const inspectionColumns = [
    { key: 'id', label: 'ID', render: (r) => <span className="font-bold">{r.id}</span> },
    { key: 'title', label: 'Inspection Audit', render: (r) => <span className="font-semibold text-ink-900">{r.title}</span> },
    { key: 'deptLabel', label: 'Department', render: (r) => <Badge tone="info">{r.deptLabel}</Badge> },
    { key: 'inspector', label: 'Assigned Inspector', render: (r) => r.inspector },
    { key: 'score', label: 'Audit Score', render: (r) => <span className="font-mono font-bold text-leaf-700">{r.score || 'Pending'}</span> },
    { key: 'status', label: 'Workflow', render: (r) => <Badge tone={r.status === 'Completed' ? 'positive' : 'warning'}>{r.status}</Badge> },
  ]

  const meetingColumns = [
    { key: 'time', label: 'Schedule', render: (r) => <span className="font-mono text-[11px]">{r.time}</span> },
    { key: 'title', label: 'Meeting Description', render: (r) => <span className="font-semibold text-ink-900">{r.title}</span> },
    { key: 'dept', label: 'Department Segment', render: (r) => <Badge tone="info">{r.dept}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'Minutes Confirmed' ? 'positive' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <div className="space-y-6">
      {/* Fleet Monitoring (Module 5) */}
      <Card>
        <CardHeader title="Emergency & Service Vehicle Fleet Telematics" subtitle="Active municipal vehicle telemetry logs" icon={Truck} />
        <CardBody className="!p-0">
          <DataTable columns={vehicleColumns} rows={vehicles} />
        </CardBody>
      </Card>

      {/* Inspections & Meeting Management side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inspections (Module 6) */}
        <Card>
          <CardHeader
            title="Executive Audits & Inspections"
            subtitle="Field asset inspection scheduling and outcomes"
            icon={ClipboardList}
            action={
              <Button size="xs" icon={PlusCircle} onClick={() => setShowInsModal(true)}>
                Schedule Audit
              </Button>
            }
          />
          <CardBody className="!p-0">
            <DataTable columns={inspectionColumns} rows={inspections} />
          </CardBody>
        </Card>

        {/* Meetings (Module 7) */}
        <Card>
          <CardHeader
            title="District Administration Meetings"
            subtitle="Scheduled conferences & action points tracking"
            icon={Calendar}
            action={
              <Button size="xs" icon={PlusCircle} onClick={() => setShowMeetModal(true)}>
                Schedule Meeting
              </Button>
            }
          />
          <CardBody className="!p-0">
            <DataTable columns={meetingColumns} rows={meetings} />
          </CardBody>
        </Card>
      </div>

      {/* Schedule Inspection Modal */}
      {showInsModal && (
        <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 text-[12.5px]">
            <h3 className="text-[14px] font-bold text-ink-950">Schedule Executive Inspection</h3>
            <div className="space-y-3">
              <div>
                <label className="text-ink-500 block mb-1">Audit Title</label>
                <input
                  value={insTitle}
                  onChange={(e) => setInsTitle(e.target.value)}
                  placeholder="e.g. Rajgir Sadar Hospital Oxygen Plant Inspection"
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-ink-500 block mb-1">Department</label>
                  <select
                    value={insDept}
                    onChange={(e) => setInsDept(e.target.value)}
                    className="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5"
                  >
                    <option value="health">Health & Family Welfare</option>
                    <option value="water">Water & Sanitation</option>
                  </select>
                </div>
                <div>
                  <label className="text-ink-500 block mb-1">Inspector</label>
                  <input
                    value={insOfficer}
                    onChange={(e) => setInsOfficer(e.target.value)}
                    className="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowInsModal(false)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                onScheduleInspection({ title: insTitle, dept: insDept, inspector: insOfficer })
                setShowInsModal(false)
                setInsTitle('')
              }}>Confirm Schedule</Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showMeetModal && (
        <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 text-[12.5px]">
            <h3 className="text-[14px] font-bold text-ink-950">Schedule District Conference</h3>
            <div className="space-y-3">
              <div>
                <label className="text-ink-500 block mb-1">Agenda / Description</label>
                <input
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                  placeholder="e.g. Drought assessment and pipeline status"
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowMeetModal(false)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                onScheduleMeeting({ title: meetTitle, dept: meetDept })
                setShowMeetModal(false)
                setMeetTitle('')
              }}>Schedule Meeting</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

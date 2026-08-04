import { useState, useMemo } from 'react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import MapView from '../../../components/map/MapView'
import { Users, Navigation, ShieldCheck, Mail, Phone, AlertCircle } from 'lucide-react'

export default function PersonnelTab({ officers, fieldStaff }) {
  const [selectedStaff, setSelectedStaff] = useState(null)

  // Map representation of active field staff (Module 4)
  const mapPoints = useMemo(() => {
    return fieldStaff.map((fs) => ({
      id: fs.id,
      name: fs.name,
      departmentId: fs.dept,
      categoryLabel: fs.designation,
      status: fs.status === 'Active' ? 'active' : 'inactive',
      gapScore: fs.status === 'Active' ? 0.1 : 0.8,
      position: fs.coords,
    }))
  }, [fieldStaff])

  const officerColumns = [
    { key: 'name', label: 'Officer Name', render: (r) => <span className="font-semibold text-ink-900">{r.name}</span> },
    { key: 'designation', label: 'Role Designation', render: (r) => r.designation },
    { key: 'deptLabel', label: 'Department', render: (r) => <Badge tone="info">{r.deptLabel}</Badge> },
    { key: 'avgSla', label: 'Avg SLA Resolution', render: (r) => <span className="font-mono">{r.avgSla}h</span> },
    { key: 'status', label: 'Attendance', render: (r) => <Badge tone={r.status === 'Active' ? 'positive' : 'warning'}>{r.status}</Badge> },
  ]

  const staffColumns = [
    { key: 'name', label: 'Staff Name', render: (r) => <span className="font-semibold text-ink-900">{r.name}</span> },
    { key: 'designation', label: 'Designation', render: (r) => r.designation },
    { key: 'assignedArea', label: 'Assigned Area', render: (r) => r.assignedArea },
    { key: 'status', label: 'GPS Status', render: (r) => <Badge tone={r.status === 'Active' ? 'positive' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <div className="space-y-6">
      {/* Officer Directory & Attendance (Module 3) */}
      <Card>
        <CardHeader title="Officer Command Directory" subtitle="Administrative hierarchy & performance metrics" icon={Users} />
        <CardBody className="!p-0">
          <DataTable columns={officerColumns} rows={officers} />
        </CardBody>
      </Card>

      {/* Field Staff GPS & Status Tracking (Module 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Field Staff Live GPS Tracking Map" subtitle="Current positions of survey teams, ASHA & engineers" icon={Navigation} />
            <CardBody className="!p-2">
              <div className="h-72 rounded-xl overflow-hidden relative">
                <MapView
                  center={[85.4211, 25.0294]}
                  zoom={12}
                  facilities={mapPoints}
                  className="h-full"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Field Staff Directory" subtitle="Active personnel telemetry" icon={ShieldCheck} />
            <CardBody className="!p-0 max-h-[300px] overflow-y-auto">
              <DataTable
                columns={staffColumns}
                rows={fieldStaff}
                onRowClick={(row) => setSelectedStaff(row)}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

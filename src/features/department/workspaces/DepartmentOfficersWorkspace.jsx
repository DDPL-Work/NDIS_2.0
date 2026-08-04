import { useState } from 'react'
import {
  Users, UserCheck, Calendar, ShieldCheck, Mail, Phone,
  TrendingUp, Award, BarChart2, CheckCircle
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'

export default function DepartmentOfficersWorkspace() {
  const { dept, officers } = useDepartment()
  const [selectedOfficer, setSelectedOfficer] = useState(null)

  const columns = [
    { key: 'name', label: 'Officer Name', render: (r) => <span className="font-semibold text-ink-950 block">{r.name}</span> },
    { key: 'role', label: 'Designation', render: (r) => <span className="text-[12px] text-ink-600 capitalize">{r.role.replace(/_/g, ' ')}</span> },
    { key: 'attendance', label: 'Attendance', render: (r) => (
      <Badge tone={r.attendance === 'Present' ? 'positive' : r.attendance === 'Absent' ? 'negative' : 'warning'}>
        {r.attendance.toUpperCase()}
      </Badge>
    )},
    { key: 'inspectionCount', label: 'Audits', render: (r) => <span className="font-mono font-bold text-ink-800">{r.inspectionCount}</span> },
    { key: 'workload', label: 'Workload Index', render: (r) => (
      <div className="flex items-center gap-1.5 w-24">
        <div className="h-1.5 w-full bg-ink-150 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${r.workload > 75 ? 'bg-alert-600' : 'bg-leaf-600'}`} style={{ width: `${r.workload}%` }} />
        </div>
        <span className="font-mono text-[11px] font-bold text-ink-600">{r.workload}%</span>
      </div>
    )},
    { key: 'action', label: 'Contact', render: (r) => (
      <Button size="xs" variant="outline" icon={Users} onClick={(e) => { e.stopPropagation(); setSelectedOfficer(r) }}>
        Profile
      </Button>
    )}
  ]

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow={`Administrative Directory · ${dept.code}`}
        title={`${dept.label} Staff & Officers`}
        description="Monitor staff attendance logs, manage workload allocations, verify inspection count metrics, and track field coordinates."
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Department Officers Register" subtitle="Review active personnel and assignment metrics" icon={Users} />
            <CardBody className="!p-0">
              <DataTable columns={columns} rows={officers} onRowClick={(row) => setSelectedOfficer(row)} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          {selectedOfficer ? (
            <Card className="border-sky-300">
              <CardHeader title="Officer Profile Dossier" icon={Award} />
              <CardBody className="space-y-4 text-[12.5px]">
                <div>
                  <h4 className="text-sm font-bold text-ink-950">{selectedOfficer.name}</h4>
                  <span className="text-[11px] text-ink-400 font-semibold uppercase">{selectedOfficer.role.replace(/_/g, ' ')}</span>
                </div>

                <div className="space-y-2 text-ink-700">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-ink-400" />
                    <span>{selectedOfficer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-ink-400" />
                    <span>{selectedOfficer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-ink-400" />
                    <span>Reports to: <span className="font-semibold">{selectedOfficer.parentOfficer || 'District Administrator'}</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center border-t border-ink-100 pt-3">
                  <div className="bg-ink-50/50 p-2.5 rounded-lg border border-ink-100">
                    <span className="text-[10px] text-ink-400 block font-semibold">PENDING ASSIGNMENTS</span>
                    <span className="text-base font-bold text-ink-900">{selectedOfficer.pendingWork} Tasks</span>
                  </div>
                  <div className="bg-ink-50/50 p-2.5 rounded-lg border border-ink-100">
                    <span className="text-[10px] text-ink-400 block font-semibold">AUDITS COMPLETED</span>
                    <span className="text-base font-bold text-leaf-700">{selectedOfficer.inspectionCount} Done</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Select Officer" icon={Award} />
              <CardBody className="text-[12.5px] text-ink-400 text-center py-8">
                Click on any officer record to view their profile, contacts, and workload details.
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="SLA Compliance & Targets" icon={BarChart2} />
            <CardBody className="text-[12px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-800">Target Resolution SLA:</span>
                <span className="font-mono font-bold text-leaf-700">90% compliance</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-800">Average Field Response Time:</span>
                <span className="font-mono font-bold text-ink-900">14 hours</span>
              </div>
              <p className="text-[11.5px] text-ink-500 leading-snug">
                Resolution performance reviews are automatically compiled for quarterly district review.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Settings2, Clock, Users, Calendar, AlertTriangle, ShieldCheck, Save } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { useDepartment } from '../framework/DepartmentContext'
import { useUiStore } from '../../../app/store/uiStore'

export default function DepartmentSettingsWorkspace() {
  const { dept } = useDepartment()
  const pushToast = useUiStore((s) => s.pushToast)

  const [officeHours, setOfficeHours] = useState('10:00 – 17:00 IST (Mon–Sat)')
  const [slaDefault, setSlaDefault] = useState('24')
  const [escalationThreshold, setEscalationThreshold] = useState('48')

  function handleSave() {
    pushToast('Department settings saved successfully (simulation).', 'success')
  }

  const officerDirectory = [
    { name: 'Dr. Rajesh Kumar', designation: 'Civil Surgeon / Department Head', phone: '+91 63122 XXXXX', status: 'Active' },
    { name: 'Smt. Kavita Devi', designation: 'Deputy CMO', phone: '+91 94315 XXXXX', status: 'Active' },
    { name: 'Shri Birendra Prasad', designation: 'Block Medical Officer, Silao', phone: '+91 78704 XXXXX', status: 'Active' },
    { name: 'Shri Md. Iqbal', designation: 'District Programme Manager', phone: '+91 80024 XXXXX', status: 'On Leave' },
  ]

  const holidays = [
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-10-02', name: 'Gandhi Jayanti' },
    { date: '2026-10-24', name: 'Dussehra' },
    { date: '2026-11-14', name: 'Diwali' },
    { date: '2026-01-26', name: 'Republic Day' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Department Settings · ${dept.code}`}
        title={`${dept.label} Configuration & Administration`}
        description="Department profile, SLA policies, escalation rules, officer directory, and holiday calendar."
        action={
          <Button size="sm" icon={Save} onClick={handleSave}>
            Save All Changes
          </Button>
        }
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Department Profile */}
        <Card>
          <CardHeader title="Department Profile" subtitle="Office identity and contact" icon={Settings2} />
          <CardBody className="space-y-3 text-[12.5px]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-ink-500 text-[11px] uppercase block mb-1">Department Name</label>
                <input className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5 text-[12.5px]" value={dept.label} readOnly />
              </div>
              <div>
                <label className="text-ink-500 text-[11px] uppercase block mb-1">Department Code</label>
                <input className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5 text-[12.5px]" value={dept.code} readOnly />
              </div>
            </div>
            <div>
              <label className="text-ink-500 text-[11px] uppercase block mb-1">Custodian Office</label>
              <input className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5 text-[12.5px]" value={dept.custodian} readOnly />
            </div>
            <div>
              <label className="text-ink-500 text-[11px] uppercase block mb-1">Working Hours</label>
              <input
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12.5px]"
                value={officeHours}
                onChange={(e) => setOfficeHours(e.target.value)}
              />
            </div>
          </CardBody>
        </Card>

        {/* SLA & Escalation Rules */}
        <Card>
          <CardHeader title="SLA & Escalation Policy" subtitle="Breach thresholds and auto-escalation" icon={AlertTriangle} />
          <CardBody className="space-y-3 text-[12.5px]">
            <div>
              <label className="text-ink-500 text-[11px] uppercase block mb-1">Default SLA Resolution Time (Hours)</label>
              <input
                type="number"
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12.5px]"
                value={slaDefault}
                onChange={(e) => setSlaDefault(e.target.value)}
              />
            </div>
            <div>
              <label className="text-ink-500 text-[11px] uppercase block mb-1">Auto-Escalation Threshold (Hours)</label>
              <input
                type="number"
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12.5px]"
                value={escalationThreshold}
                onChange={(e) => setEscalationThreshold(e.target.value)}
              />
            </div>
            <div className="p-3 bg-saffron-50 border border-saffron-200 rounded-xl text-[11.5px] text-saffron-900">
              <strong>Escalation Policy:</strong> If a complaint remains unresolved beyond {escalationThreshold}h, it auto-escalates to ADM/DM desk with a priority override.
            </div>
          </CardBody>
        </Card>

        {/* Officer Directory */}
        <Card>
          <CardHeader title="Officer Directory" subtitle="Active personnel register" icon={Users} />
          <CardBody className="!p-0 divide-y divide-ink-100">
            {officerDirectory.map((officer, i) => (
              <div key={i} className="p-3.5 flex items-center justify-between text-[12.5px]">
                <div>
                  <span className="font-semibold text-ink-900 block">{officer.name}</span>
                  <span className="text-ink-500 text-[11.5px]">{officer.designation}</span>
                </div>
                <Badge tone={officer.status === 'Active' ? 'positive' : 'warning'}>{officer.status}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Holiday Calendar */}
        <Card>
          <CardHeader title="Holiday Calendar" subtitle="Non-working days for SLA calculation" icon={Calendar} />
          <CardBody className="!p-0 divide-y divide-ink-100">
            {holidays.map((h, i) => (
              <div key={i} className="p-3.5 flex items-center justify-between text-[12.5px]">
                <span className="font-semibold text-ink-900">{h.name}</span>
                <span className="font-mono text-[11.5px] text-ink-500">{h.date}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

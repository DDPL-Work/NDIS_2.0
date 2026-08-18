import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import StatCard from '../../../components/ui/StatCard'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import {
  Gavel, Sparkles, AlertTriangle, Clock, MapPin, Eye, Search, Building2, CheckCircle2
} from 'lucide-react'

export default function OverviewTab({ stats, brief, onInspectComplaint, onGlobalSearch }) {
  return (
    <div className="space-y-6">
      {/* Search Input (Universal Search - Module 13) */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Global Search (Search Complaints, Officers, Villages, Projects, Schemes, Assets, Inspections)..."
          className="w-full rounded-xl border border-ink-200 bg-white pl-10 pr-4 py-2.5 text-[13px] shadow-xs focus:ring-1 focus:ring-saffron-500 focus:outline-none"
          onChange={(e) => onGlobalSearch(e.target.value)}
        />
      </div>

      {/* Main Grid: Live district statistics & brief */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* District profile stats — live backend complaint & registry figures */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            <StatCard label="Complaints Registered" value={stats.complaintsTotal.toLocaleString('en-IN')} icon={Gavel} tone="ink" />
            <StatCard label="Pending Action" value={stats.complaintsPending} icon={Clock} tone="saffron" />
            <StatCard label="Resolved" value={stats.complaintsResolved} icon={CheckCircle2} tone="leaf" />
            <StatCard label="Escalated" value={stats.complaintsEscalated} icon={AlertTriangle} tone="alert" />
            <StatCard label="SLA Compliance" value={`${stats.slaPct}%`} icon={Sparkles} tone="sky" />
            <StatCard label="Departments" value={stats.departmentsCount} icon={Building2} tone="ink" />
          </div>

          {/* SLA breach focus (live from complaint registry) */}
          <Card>
            <CardHeader title="Governance SLA Focus" subtitle="Complaints currently past their SLA window" icon={Clock} />
            <CardBody className="space-y-3">
              {stats.slaBreached === 0 ? (
                <div className="p-3 rounded-xl bg-leaf-50 border border-leaf-200 text-leaf-900 text-[12.5px]">
                  No complaints are currently past their SLA window.
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 flex items-start gap-2.5 text-[12px]">
                  <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">SLA Breach Alert</span>
                    <p className="mt-0.5 leading-relaxed">{stats.slaBreached} open complaint(s) have exceeded their resolution SLA and require Collector attention.</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Live command brief */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="District Command Brief" subtitle={brief.date} icon={Sparkles} />
            <CardBody className="space-y-3.5 text-[12px]">
              {/* Daily Stats Summary */}
              <div className="grid grid-cols-2 gap-2 bg-ink-50 p-2.5 rounded-xl text-center">
                <div>
                  <span className="text-alert-600 font-bold block text-base">{brief.criticalCount}</span>
                  <span className="text-[10px] text-ink-500 uppercase font-semibold">Critical Queue</span>
                </div>
                <div>
                  <span className="text-saffron-600 font-bold block text-base">{brief.slaBreachesCount}</span>
                  <span className="text-[10px] text-ink-500 uppercase font-semibold">SLA Breaches</span>
                </div>
              </div>

              {/* Critical Complaints */}
              <div>
                <span className="font-semibold text-ink-800 block mb-1">Today's Focus:</span>
                <div className="space-y-1.5">
                  {brief.criticalTickets.length === 0 ? (
                    <p className="p-2 rounded-lg bg-ink-50 text-ink-500">No critical tickets in the live queue.</p>
                  ) : (
                    brief.criticalTickets.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-ink-50 hover:bg-ink-100/50 transition-colors">
                        <span className="truncate font-medium text-ink-900 pr-2">{t.title}</span>
                        <Button size="xs" variant="outline" icon={Eye} onClick={() => onInspectComplaint(t.id)}>
                          Inspect
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Department load focus (derived from live complaints) */}
              {brief.topDept && (
                <div className="p-2.5 rounded-lg bg-saffron-50 border border-saffron-200 text-saffron-900 flex items-center justify-between">
                  <span>Highest open load: <strong>{brief.topDept.slug}</strong> ({brief.topDept.openCount} open)</span>
                  <Badge tone="warning">Focus</Badge>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
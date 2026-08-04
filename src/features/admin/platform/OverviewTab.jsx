import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import StatCard from '../../../components/ui/StatCard'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import {
  Gavel, Sparkles, AlertTriangle, ShieldAlert, CloudLightning,
  Clock, ShieldCheck, MapPin, Building2, Eye, Search, AlertCircle
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

      {/* Main Grid: Statistics & Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* District Profile stats (Module 1) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            <StatCard label="District Population" value={stats.population.toLocaleString('en-IN')} icon={MapPin} tone="ink" />
            <StatCard label="Total Blocks" value={stats.blocksCount} icon={Building2} tone="ink" />
            <StatCard label="Road Length" value={`${stats.roadLengthKm} Km`} icon={Gavel} tone="ink" />
            <StatCard label="Hospitals & PHCs" value={stats.hospitalsCount} icon={Building2} tone="leaf" />
            <StatCard label="Schools Count" value={stats.schoolsCount} icon={Building2} tone="sky" />
            <StatCard label="Active Schemes" value={stats.runningSchemesCount || 7} icon={Sparkles} tone="saffron" />
          </div>

          {/* SLA Breaches / Notifications (Module 12) */}
          <Card>
            <CardHeader title="Governance SLA & Notifications" subtitle="Recent critical events" icon={AlertCircle} />
            <CardBody className="space-y-3">
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 flex items-start gap-2.5 text-[12px]">
                <CloudLightning size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Weather Warning Orange Alert</span>
                  <p className="mt-0.5 leading-relaxed">{brief.weather.condition}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* AI Brief (Module 2) */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="AI District Daily Brief" subtitle={brief.date} icon={Sparkles} />
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
                  {brief.criticalTickets.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-ink-50 hover:bg-ink-100/50 transition-colors">
                      <span className="truncate font-medium text-ink-900 pr-2">{t.title}</span>
                      <Button size="xs" variant="outline" icon={Eye} onClick={() => onInspectComplaint(t.id)}>
                        Inspect
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Absent Staff Warning */}
              <div className="p-2.5 rounded-lg bg-saffron-50 border border-saffron-200 text-saffron-900 flex items-center justify-between">
                <span>Field staff absent count: <strong>{brief.absentStaff}</strong></span>
                <Badge tone="warning">Warning</Badge>
              </div>

              {/* AI Recommendation execution */}
              <div className="space-y-2">
                <span className="font-semibold text-ink-800 block">AI Executive Advisory:</span>
                {brief.aiRecommendations.map((rec, idx) => (
                  <div key={idx} className="p-2.5 bg-leaf-50 border border-leaf-200 rounded-xl text-leaf-950 leading-snug">
                    {rec}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { Calendar, RefreshCw, AlertTriangle, Clock, CheckCircle, Sunrise } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import StatCard from '../../../components/ui/StatCard'
import Button from '../../../components/ui/Button'

export default function ScheduleHeader({ kpis, onRefresh, loading, districtName }) {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="District Magistrate"
        title="Schedule & Tasks"
        description={
          districtName
            ? `${districtName} — Your upcoming inspections, interventions and district actions`
            : 'Your upcoming inspections, interventions and district actions'
        }
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Sunrise size={18} />}
          label="Today"
          value={kpis.today}
          sub="Actions scheduled today"
          tone="saffron"
        />
        <StatCard
          icon={<Calendar size={18} />}
          label="Upcoming"
          value={kpis.upcoming}
          sub="Next 7 days"
          tone="sky"
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Overdue"
          value={kpis.overdue}
          sub="Needs attention"
          tone="alert"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="In Progress"
          value={kpis.inProgress}
          sub="Currently being handled"
          tone="ink"
        />
        <StatCard
          icon={<CheckCircle size={18} />}
          label="Completed"
          value={kpis.completed}
          sub="Completed this period"
          tone="leaf"
        />
      </div>
    </div>
  )
}

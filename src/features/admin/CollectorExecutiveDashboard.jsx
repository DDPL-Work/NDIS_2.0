import { useState, useMemo } from 'react'
import {
  Gavel, Flame, AlertTriangle, CheckCircle2, TrendingUp, BarChart2, MapPin,
  Building2, Users, Sparkles, ShieldAlert, ArrowRight, Eye, RefreshCw, Calculator
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import MapView from '../../components/map/MapView'
import Modal from '../../components/ui/Modal'
import ComplaintDetailHub from '../shared/ComplaintDetailHub'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { DEPARTMENTS, DEPARTMENT_MAP, DISTRICTS } from '../../config/constants'
import { formatNumber, formatPercent, formatCurrencyINR, formatDateTime } from '../../utils/format'

const COLORS = ['#c0392b', '#1d7ab5', '#1f7a54', '#e07a2c', '#8a4fc0', '#546882']

export default function CollectorExecutiveDashboard() {
  const user = useAuthStore((s) => s.user)
  const districtId = user?.districtId || 'nalanda'
  const district = DISTRICTS.find((d) => d.id === districtId) || DISTRICTS[0]

  const complaints = useComplaintEngine((s) => s.complaints)

  const [selectedComplaintId, setSelectedComplaintId] = useState(null)
  const [activeTab, setActiveTab] = useState('critical') // 'critical' | 'rankings' | 'analytics'

  // Top 10 Critical Complaints
  const criticalComplaints = useMemo(() => {
    return complaints
      .filter((c) => c.priority === 'urgent' || c.priority === 'high' || c.state === 'escalated')
      .slice(0, 10)
  }, [complaints])

  // Department Breakdown
  const deptBreakdown = useMemo(() => {
    return DEPARTMENTS.map((d) => {
      const list = complaints.filter((c) => c.departmentSlug === d.id)
      const resolved = list.filter((c) => ['resolved', 'closed'].includes(c.state)).length
      const slaMet = list.filter((c) => c.slaDueAt && new Date(c.slaDueAt).getTime() > new Date(c.createdAt).getTime()).length
      return {
        id: d.id,
        label: d.label,
        color: d.color,
        icon: d.icon,
        total: list.length,
        pending: list.length - resolved,
        resolved,
        slaPct: list.length ? Math.round((slaMet / list.length) * 100) : 100,
      }
    })
  }, [complaints])

  // Block Breakdown Chart Data
  const blockData = useMemo(() => {
    const map = {}
    complaints.forEach((c) => {
      const block = c.location?.block || 'Silao'
      map[block] = (map[block] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, count: value }))
  }, [complaints])

  // Overall Metrics
  const metrics = useMemo(() => {
    const total = complaints.length
    const resolved = complaints.filter((c) => ['resolved', 'closed'].includes(c.state)).length
    const escalated = complaints.filter((c) => c.state === 'escalated').length
    const slaCompliance = total ? Math.round(((total - escalated) / total) * 100) : 100
    const totalEstCost = complaints.reduce((sum, c) => sum + (c.inspectionDetails?.estimatedCost || 0), 0)

    return {
      total,
      pending: total - resolved,
      resolved,
      escalated,
      slaCompliance,
      totalEstCost,
    }
  }, [complaints])

  // Map points
  const mapFacilities = useMemo(() => {
    return complaints
      .filter((c) => Array.isArray(c.location?.position) && c.location.position.length >= 2)
      .map((c) => ({
        id: c.id,
        name: c.title,
        departmentId: c.departmentId,
        categoryLabel: c.categoryName,
        status: c.state === 'resolved' || c.state === 'closed' ? 'active' : 'inactive',
        gapScore: c.state === 'escalated' ? 0.95 : c.priority === 'urgent' ? 0.85 : 0.45,
        position: c.location.position,
      }))
  }, [complaints])

  // Data-driven decision support insights (computed from live complaints)
  const insights = useMemo(() => {
    const hotspots = {}
    complaints.forEach((c) => {
      const block = c.location?.block || 'Unknown Block'
      hotspots[block] = (hotspots[block] || 0) + 1
    })
    const topBlock = Object.entries(hotspots).sort((a, b) => b[1] - a[1])[0]
    const escalatedCount = complaints.filter((c) => c.state === 'escalated').length
    const leadingDept = [...deptBreakdown].sort((a, b) => b.slaPct - a.slaPct)[0]
    return { topBlock, escalatedCount, leadingDept }
  }, [complaints, deptBreakdown])

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="District Collector Command Center · LLD Vol 3 §18"
        title={`${district.label} District — Executive Operations Dashboard`}
        description="Real-time district oversight, SLA compliance leaderboards, critical complaint tracking, and AI-driven decision support."
      />

      {/* KPI Strip */}
      <div className="px-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard label="Total Complaints" value={formatNumber(metrics.total)} icon={Gavel} tone="ink" sub={`${metrics.pending} pending action`} />
        <StatCard label="SLA Compliance Rate" value={`${metrics.slaCompliance}%`} icon={CheckCircle2} tone="leaf" delta={4.2} sub="Target ≥ 85%" />
        <StatCard label="Critical / Escalated" value={metrics.escalated} icon={AlertTriangle} tone="alert" sub="Requires DM Intervention" />
        <StatCard label="Repair Budget Impact" value={formatCurrencyINR(metrics.totalEstCost)} icon={Calculator} tone="saffron" sub="Inspected Field Works" />
      </div>

      {/* Tab Controls */}
      <div className="px-6">
        <div className="card p-1 flex gap-1 bg-ink-100 w-fit text-[12.5px] font-medium">
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${activeTab === 'critical' ? 'bg-white text-ink-950 font-semibold shadow-xs' : 'text-ink-600'}`}
          >
            Critical Queue ({criticalComplaints.length})
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${activeTab === 'rankings' ? 'bg-white text-ink-950 font-semibold shadow-xs' : 'text-ink-600'}`}
          >
            Department Rankings
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-white text-ink-950 font-semibold shadow-xs' : 'text-ink-600'}`}
          >
            GIS & Analytics
          </button>
        </div>
      </div>

      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* TAB 1: CRITICAL QUEUE */}
          {activeTab === 'critical' && (
            <Card>
              <CardHeader
                title="Top Critical & Escalated Complaints"
                subtitle="High priority or SLA breached tickets flagged for Collector review"
                icon={Flame}
              />
              <CardBody className="!p-0">
                <div className="divide-y divide-ink-100">
                  {criticalComplaints.map((c) => {
                    const dept = DEPARTMENT_MAP[c.departmentSlug] || {} 
                    return (
                      <div key={c.id} className="p-4 flex items-center justify-between gap-3 hover:bg-ink-50/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="kbd-mono text-[11.5px] font-bold text-ink-900">{c.id}</span>
                            <StatusBadge status={c.state} />
                            <Badge tone={c.priority === 'urgent' ? 'negative' : 'warning'}>{c.priority.toUpperCase()}</Badge>
                          </div>
                          <h4 className="text-[13.5px] font-semibold text-ink-950 mt-1 truncate">{c.title}</h4>
                          <p className="text-[11.5px] text-ink-500 mt-0.5">
                            {dept?.label} · {c.location.village}, {c.location.block} · SLA Due: {c.slaDueAt ? formatDateTime(c.slaDueAt) : '—'}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" icon={Eye} onClick={() => setSelectedComplaintId(c.id)}>
                          Inspect
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 2: DEPARTMENT RANKINGS */}
          {activeTab === 'rankings' && (
            <Card>
              <CardHeader title="Department Performance Leaderboard" subtitle="SLA compliance % and resolution volumes" icon={BarChart2} />
              <CardBody>
                <div className="space-y-4">
                  {deptBreakdown.map((d) => (
                    <div key={d.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="font-semibold text-ink-900 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                          {d.label}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11.5px] text-ink-500">{d.resolved}/{d.total} Resolved</span>
                          <span className="font-mono font-bold text-leaf-700">{d.slaPct}% SLA</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-ink-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.slaPct}%`, background: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* TAB 3: ANALYTICS & CHARTS */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Complaints Distribution by Block" subtitle="Volume by administrative subdivision" />
                <CardBody>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={blockData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1d7ab5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>
            </div>
          )}
        </div>

        {/* Right Sidebar: AI Recommendations & GIS Quick Map */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="GIS Spatial Hotspot Map" subtitle="Real-time density clusters" icon={MapPin} />
            <CardBody className="!p-2">
              <div className="h-56 rounded-xl overflow-hidden relative">
                <MapView
                  center={district.center}
                  zoom={district.zoom}
                  facilities={mapFacilities}
                  colorBy="gap"
                  showHeat={true}
                  className="h-full"
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="AI Decision Support Engine" subtitle="Automated preventive recommendations" icon={Sparkles} />
            <CardBody className="space-y-3 text-[12px]">
              <div className="p-3 rounded-xl bg-saffron-50 border border-saffron-200 text-saffron-900 space-y-1">
                <span className="font-semibold block flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-saffron-600" /> Preventive Maintenance Warning
                </span>
                <p className="text-[11.5px] text-saffron-800 leading-snug">
                  {insights.topBlock ? (
                    <>Highest complaint density detected in {insights.topBlock[0]} Block ({insights.topBlock[1]} complaints). Schedule preventive maintenance sweeps.</>
                  ) : (
                    <>No complaint density patterns detected in the current dataset.</>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-leaf-50 border border-leaf-200 text-leaf-900 space-y-1">
                <span className="font-semibold block flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-leaf-600" /> Officer SLA Compliance Target
                </span>
                <p className="text-[11.5px] text-leaf-800 leading-snug">
                  {insights.leadingDept?.total
                    ? <>Leading department by SLA is {insights.leadingDept.label} at {insights.leadingDept.slaPct}%. {insights.escalatedCount} tickets currently require escalation review.</>
                    : <>No SLA performance data available yet for ranking departments.</>}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Complaint Detail Hub Modal */}
      <Modal
        open={!!selectedComplaintId}
        onClose={() => setSelectedComplaintId(null)}
        width="max-w-4xl"
        scrollBody={false}
      >
        {selectedComplaintId && (
          <ComplaintDetailHub
            complaintId={selectedComplaintId}
            onClose={() => setSelectedComplaintId(null)}
          />
        )}
      </Modal>
    </div>
  )
}

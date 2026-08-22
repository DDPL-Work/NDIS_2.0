import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, Filter, Download, Clock, Database, BarChart2, MapPin, AlertTriangle, Loader2, Star } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Select from '../../../components/ui/Select'
import { backendFeedbackApi } from '../../../api/feedbackApi'
import { useAuthStore } from '../../../app/store/authStore'
import { DISTRICTS } from '../../../config/constants'
import { FEEDBACK_AGGREGATION_GRANULARITY } from '../../feedback/feedbackConstants'

const PRIORITY_META = {
  P1: { label: 'P1 Critical', tone: 'alert' },
  P2: { label: 'P2 High', tone: 'saffron' },
  P3: { label: 'P3 Medium', tone: 'sky' },
  P4: { label: 'P4 Low', tone: 'leaf' },
}

export default function FeedbackAnalyticsDashboard() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role || user?.roles?.[0] || 'dm'
  const districtId = user?.districtId || 'nalanda'
  const district = DISTRICTS.find((d) => d.id === districtId) || DISTRICTS[0]

  const [loading, setLoading] = useState({ overview: true, questions: true, locations: true, trends: true })
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    department: '',
    serviceType: '',
    questionSet: '',
    dateFrom: '',
    dateTo: '',
    granularity: FEEDBACK_AGGREGATION_GRANULARITY.MONTH,
  })

  // Data states
  const [overview, setOverview] = useState(null)
  const [questionAnalytics, setQuestionAnalytics] = useState([])
  const [locationAnalytics, setLocationAnalytics] = useState([])
  const [trends, setTrends] = useState([])
  const [questionSets, setQuestionSets] = useState([])
  const [departments, setDepartments] = useState([])

  // Load data
  const loadData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, overview: true, questions: true, locations: true, trends: true }))
    setError(null)

    const params = { district: districtId, ...filters }
    Object.keys(params).forEach((k) => params[k] === '' && delete params[k])

    try {
      const results = await Promise.allSettled([
        backendFeedbackApi.getOverviewAnalytics(params),
        backendFeedbackApi.getQuestionAnalytics(params),
        backendFeedbackApi.getLocationAnalytics({ ...params, level: 'block' }),
        backendFeedbackApi.getTrends(params),
        backendFeedbackApi.listQuestionSets({ district: districtId }),
        backendFeedbackApi.getMetadata(),
      ])
      const [overviewRes, questionsRes, locationsRes, trendsRes, qSetsRes, deptsRes] = results

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value)
      if (questionsRes.status === 'fulfilled') setQuestionAnalytics(questionsRes.value)
      if (locationsRes.status === 'fulfilled') setLocationAnalytics(locationsRes.value)
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value)
      if (qSetsRes.status === 'fulfilled') setQuestionSets(qSetsRes.value)
      if (deptsRes.status === 'fulfilled') setDepartments(deptsRes.value?.departments || [])

      if (results.every((result) => result.status === 'rejected')) {
        setError('Feedback analytics endpoints are not available from the current backend.')
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, overview: false, questions: false, locations: false, trends: false }))
    }
  }, [districtId, filters])

  useEffect(() => { loadData() }, [loadData])

  // Computed stats
  const stats = useMemo(() => {
    if (!overview) return { total: 0, avgRating: 0, byDept: {}, byService: {}, trend: 'stable' }
    return overview
  }, [overview])

  if (loading.overview || loading.questions || loading.locations || loading.trends) {
    return (
      <div className="min-h-full p-3 sm:p-6 space-y-5">
        <PageHeader
          eyebrow={`Admin Portal · ${String(role).toUpperCase()}`}
          title="Feedback Analytics"
          description={`${district?.label || districtId} — Structured citizen feedback analytics. All data from backend.`}
          action={
            <Button size="sm" variant="outline" onClick={loadData} disabled={loading.overview}>
              <Loader2 size={13} className={loading.overview ? 'animate-spin' : ''} /> Refresh
            </Button>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="card animate-pulse bg-ink-50/60 rounded-xl h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full p-3 sm:p-6 space-y-5">
      <PageHeader
        eyebrow={`Admin Portal · ${String(role).toUpperCase()}`}
        title="Feedback Analytics"
        description={`${district?.label || districtId} — Structured citizen feedback analytics. All data from backend.`}
        action={
          <Button size="sm" variant="outline" onClick={loadData} disabled={loading.overview}>
            <Loader2 size={13} className={loading.overview ? 'animate-spin' : ''} /> Refresh
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-alert-200 bg-alert-50 px-4 py-3 text-[13px] text-alert-700">
          Failed to load analytics: {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={loadData}>Retry</Button>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 mb-1 block">Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <span className="text-ink-400">to</span>
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 mb-1 block">Department</label>
            <Select value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})} options={[{value: '', label: 'All departments'}, ...departments.map(d => ({value: d.id, label: d.name}))]} />
          </div>
          <div className="min-w-[160px]">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 mb-1 block">Question Set</label>
            <Select value={filters.questionSet} onChange={(e) => setFilters({...filters, questionSet: e.target.value})} options={[{value: '', label: 'All question sets'}, ...questionSets.map(q => ({value: q.id, label: q.title}))]} />
          </div>
          <Button variant="primary" onClick={loadData} disabled={loading.overview} className="h-10">
            <Loader2 size={13} className={loading.overview ? 'animate-spin' : ''} /> Apply
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Database size={20} />} label="Total Responses" value={stats.totalResponses || 0} tone="sky" />
        <StatCard icon={<Star size={20} />} label="Avg Rating" value={stats.averageRating ? Number(stats.averageRating).toFixed(1) : '—'} tone="saffron" />
        <StatCard icon={<BarChart2 size={20} />} label="Question Sets" value={questionSets.length} tone="leaf" />
        <StatCard icon={<MapPin size={20} />} label="Locations" value={locationAnalytics.length} tone="ink" />
      </div>

      {/* Question Analytics */}
      <div className="rounded-xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 px-4 py-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-950">Response Distribution by Question</h3>
          {loading.questions && <Loader2 size={14} className="animate-spin text-sky-500" />}
        </div>
        <div className="p-4">
          {questionAnalytics.length === 0 ? (
            <div className="text-center py-8 text-ink-500">No question-level analytics available.</div>
          ) : (
            <div className="space-y-4">
              {questionAnalytics.map((qa, idx) => (
                <QuestionAnalyticsCard key={qa.questionId || idx} data={qa} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location Analytics */}
      <div className="rounded-xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 px-4 py-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-950">Feedback by Location (Block Level)</h3>
          {loading.locations && <Loader2 size={14} className="animate-spin text-sky-500" />}
        </div>
        <div className="p-4">
          {locationAnalytics.length === 0 ? (
            <div className="text-center py-8 text-ink-500">No location-level analytics available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]" role="grid">
                <thead>
                  <tr className="bg-ink-50/50 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                    <th className="px-3 py-2 text-left">Block</th>
                    <th className="px-3 py-2 text-right">Responses</th>
                    <th className="px-3 py-2 text-right">Avg Rating</th>
                    <th className="px-3 py-2 text-right">Positive %</th>
                    <th className="px-3 py-2 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {locationAnalytics.map((loc, idx) => (
                    <tr key={loc.blockId || idx} className="hover:bg-ink-50/50">
                      <td className="px-3 py-2.5 text-ink-900 font-medium">{loc.blockName || '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-600">{loc.responseCount || 0}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-sky-700">{loc.avgRating != null ? Number(loc.avgRating).toFixed(1) : '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-leaf-700">{loc.positivePct != null ? Number(loc.positivePct).toFixed(1) + '%' : '—'}</td>
                      <td className="px-3 py-2.5 text-right">
                        {loc.trend === 'up' && <span className="text-leaf-600 font-medium">↑ Improving</span>}
                        {loc.trend === 'down' && <span className="text-alert-600 font-medium">↓ Declining</span>}
                        {loc.trend === 'stable' && <span className="text-ink-400">→ Stable</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Trends */}
      <div className="rounded-xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 px-4 py-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-950">Response Trends</h3>
          {loading.trends && <Loader2 size={14} className="animate-spin text-sky-500" />}
        </div>
        <div className="p-4">
          {trends.length === 0 ? (
            <div className="text-center py-8 text-ink-500">No trend data available for the selected period.</div>
          ) : (
            <div className="h-64 flex items-end justify-around px-4">
              {trends.map((t, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-sky-500 rounded-t transition-all hover:bg-sky-600"
                    style={{ height: `${Math.max(4, (t.count / Math.max(1, ...trends.map(x => x.count))) * 100)}%`, minHeight: '4px' }}
                  />
                  <span className="text-[10px] text-ink-400 mt-1">{t.period}</span>
                  <span className="text-[10px] font-mono text-ink-600">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, tone }) {
  return (
    <div className="card rounded-xl border border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
          <p className="text-[24px] font-bold text-ink-950 mt-1 tabular-nums">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-${tone}-50`}>{icon}</div>
      </div>
    </div>
  )
}

function QuestionAnalyticsCard({ data }) {
  const { questionText, responseType, distribution, totalResponses, avgRating } = data
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[12px] font-medium text-ink-950 flex-1">{questionText}</p>
        <span className="text-[10px] font-mono text-ink-400">{totalResponses || 0} responses</span>
      </div>
      {avgRating != null && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-ink-500">Avg Rating:</span>
          <span className="font-mono text-sky-700 text-lg">{Number(avgRating).toFixed(1)}/5</span>
        </div>
      )}
      <div className="space-y-2">
        {distribution?.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-24 text-[11px] text-ink-600 truncate">{item.label || item.value}</div>
            <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${item.percentage || 0}%` }} />
            </div>
            <span className="w-10 text-right font-mono text-[11px] text-ink-500">{item.percentage?.toFixed(1) || 0}%</span>
            <span className="w-12 text-right font-mono text-[11px] text-ink-400">{item.count || 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

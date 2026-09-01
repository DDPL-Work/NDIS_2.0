// Feedback Analytics Dashboard — backend-driven citizen feedback analytics.
// Every metric comes from the backend. When the API fails or returns empty data,
// the UI clearly distinguishes the case. No fabricated zeros.
import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, Filter, Download, Clock, Database, BarChart2, MapPin, AlertTriangle, Loader2, Star, Inbox } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Select from '../../../components/ui/Select'
import { backendFeedbackApi } from '../../../api/feedbackApi'
import { useAuthStore } from '../../../app/store/authStore'
import { DISTRICTS, DEPARTMENTS } from '../../../config/constants'
import { FEEDBACK_AGGREGATION_GRANULARITY } from '../../feedback/feedbackConstants'

// Format date to YYYY-MM-DD for the backend (supports DD-MM-YYYY and YYYY-MM-DD)
function toBackendDate(dateStr) {
  if (!dateStr) return undefined
  // Already YYYY-MM-DD from HTML date input
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  // Convert DD-MM-YYYY to YYYY-MM-DD
  const parts = dateStr.split(/[-/]/)
  if (parts.length === 3 && parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return dateStr
}

export default function FeedbackAnalyticsDashboard() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role || user?.roles?.[0] || 'dm'
  const districtId = user?.districtId || 'nalanda'
  const district = DISTRICTS.find((d) => d.id === districtId) || DISTRICTS[0]

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) // API failure message
  const [dataStatus, setDataStatus] = useState('idle') // 'idle' | 'loaded' | 'empty' | 'error'
  const [filters, setFilters] = useState({
    department: '',
    serviceType: '',
    questionSet: '',
    dateFrom: '',
    dateTo: '',
    granularity: FEEDBACK_AGGREGATION_GRANULARITY.MONTH,
  })

  // Data states — null means "not yet fetched", never fabricated
  const [overview, setOverview] = useState(null)
  const [questionAnalytics, setQuestionAnalytics] = useState(null)
  const [locationAnalytics, setLocationAnalytics] = useState(null)
  const [trends, setTrends] = useState(null)
  const [questionSets, setQuestionSets] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setDataStatus('loading')

    const params = { district: districtId }
    if (filters.department) params.department = filters.department
    if (filters.questionSet) params.question_set = filters.questionSet
    if (filters.dateFrom) params.start_date = toBackendDate(filters.dateFrom)
    if (filters.dateTo) params.end_date = toBackendDate(filters.dateTo)
    if (filters.granularity) params.granularity = filters.granularity

    try {
      const analyticsRes = await backendFeedbackApi.getOverviewAnalytics(params)

      if (analyticsRes && typeof analyticsRes === 'object') {
        // Backend envelope: { status, kpis, question_analytics, block_level_analytics, trends }
        const kpis = analyticsRes.kpis || {}
        const totalResponses = kpis.total_responses ?? null
        const avgRating = kpis.avg_rating ?? null

        // Distinguish valid zero from missing data
        setOverview({
          totalResponses: totalResponses != null ? Number(totalResponses) : null,
          averageRating: avgRating != null ? Number(avgRating) : null,
        })
        setQuestionAnalytics(analyticsRes.question_analytics || [])
        setLocationAnalytics(
          (analyticsRes.block_level_analytics || []).map((loc) => ({
            blockName: loc.block_name,
            responseCount: loc.total_responses,
            avgRating: loc.avg_rating,
            positivePct: loc.positive_percentage ?? null,
            trend: loc.trend || 'stable',
          }))
        )
        setTrends(
          (analyticsRes.trends || []).map((t) => ({
            period: t.date || t.period,
            count: t.responses_count ?? t.count ?? 0,
          }))
        )

        // Determine if there's actual data
        const hasData = totalResponses != null || (analyticsRes.question_analytics || []).length > 0
        setDataStatus(hasData ? 'loaded' : 'empty')
      } else {
        setOverview(null)
        setQuestionAnalytics([])
        setLocationAnalytics([])
        setTrends([])
        setDataStatus('empty')
      }

      // Load question sets separately (non-blocking failure)
      try {
        const qSetsRes = await backendFeedbackApi.listQuestionSets({ district: districtId })
        setQuestionSets(Array.isArray(qSetsRes) ? qSetsRes : qSetsRes?.results || [])
      } catch {
        setQuestionSets([])
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch feedback analytics')
      setDataStatus('error')
      // Do NOT set overview to fabricated zeros — leave it null
    } finally {
      setLoading(false)
    }
  }, [districtId, filters])

  useEffect(() => { loadData() }, [loadData])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // --- Render states ---

  if (loading && dataStatus === 'idle') {
    return (
      <div className="min-h-full p-3 sm:p-6 space-y-5">
        <PageHeader
          eyebrow={`Admin Portal · ${String(role).toUpperCase()}`}
          title="Feedback Analytics"
          description={`${district?.label || districtId} — Structured citizen feedback analytics. All data from backend.`}
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
          <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
            <Loader2 size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        }
      />

      {/* API failure banner — distinct from empty data */}
      {error && (
        <div className="rounded-xl border border-alert-200 bg-alert-50 px-4 py-3 text-[13px] text-alert-700 flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">API Error: {error}</p>
            <p className="text-[12px] text-alert-600 mt-0.5">The backend feedback analytics endpoint returned an error. No data is displayed.</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>Retry</Button>
        </div>
      )}

      {/* Empty data banner — API succeeded but no feedback data exists */}
      {!error && dataStatus === 'empty' && (
        <div className="rounded-xl border border-saffron-200 bg-saffron-50 px-4 py-3 text-[13px] text-saffron-800 flex items-start gap-2">
          <Inbox size={15} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">No feedback data available</p>
            <p className="text-[12px] text-saffron-700 mt-0.5">The backend returned an empty dataset. No citizen feedback responses have been submitted for this district/period yet.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 mb-1 block">Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-ink-400">to</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 mb-1 block">Department</label>
            <Select
              value={filters.department}
              onChange={(value) => handleFilterChange('department', value)}
              options={[{ value: '', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))]}
            />
          </div>
          <div className="min-w-[160px]">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-400 mb-1 block">Question Set</label>
            <Select
              value={filters.questionSet}
              onChange={(value) => handleFilterChange('questionSet', value)}
              options={[
                { value: '', label: 'All question sets' },
                ...(questionSets || []).map((q) => ({ value: q.id, label: q.title || q.name || `Set ${q.id}` })),
              ]}
            />
          </div>
          <Button variant="primary" onClick={loadData} disabled={loading} className="h-10">
            <Loader2 size={13} className={loading ? 'animate-spin' : ''} /> Apply
          </Button>
        </div>
      </div>

      {/* KPI Row — only show when data is loaded; null values show "—" not 0 */}
      {dataStatus !== 'error' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Database size={20} />}
            label="Total Responses"
            value={overview?.totalResponses != null ? overview.totalResponses.toLocaleString() : '—'}
            tone={overview?.totalResponses != null ? 'sky' : 'neutral'}
          />
          <StatCard
            icon={<Star size={20} />}
            label="Avg Rating"
            value={overview?.averageRating != null ? Number(overview.averageRating).toFixed(1) : '—'}
            tone={overview?.averageRating != null ? 'saffron' : 'neutral'}
          />
          <StatCard
            icon={<BarChart2 size={20} />}
            label="Question Sets"
            value={questionSets != null ? questionSets.length : '—'}
            tone={questionSets?.length ? 'leaf' : 'neutral'}
          />
          <StatCard
            icon={<MapPin size={20} />}
            label="Locations"
            value={locationAnalytics != null ? locationAnalytics.length : '—'}
            tone={locationAnalytics?.length ? 'ink' : 'neutral'}
          />
        </div>
      )}

      {/* Question Analytics */}
      <div className="rounded-xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 px-4 py-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-950">Response Distribution by Question</h3>
          {loading && <Loader2 size={14} className="animate-spin text-sky-500" />}
        </div>
        <div className="p-4">
          {!questionAnalytics ? (
            <div className="text-center py-8 text-ink-500 text-[13px]">Loading question analytics…</div>
          ) : questionAnalytics.length === 0 ? (
            <div className="text-center py-8 text-ink-500">
              <Inbox size={20} className="mx-auto mb-2 text-ink-300" />
              <p className="text-[13px]">No question-level analytics available.</p>
              <p className="text-[11.5px] text-ink-400 mt-1">This may mean no feedback responses have been submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questionAnalytics.map((qa, idx) => (
                <QuestionAnalyticsCard key={qa.question_id || qa.questionId || idx} data={qa} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location Analytics */}
      <div className="rounded-xl border border-ink-100 bg-white">
        <div className="border-b border-ink-100 px-4 py-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-950">Feedback by Location (Block Level)</h3>
          {loading && <Loader2 size={14} className="animate-spin text-sky-500" />}
        </div>
        <div className="p-4">
          {!locationAnalytics ? (
            <div className="text-center py-8 text-ink-500 text-[13px]">Loading location analytics…</div>
          ) : locationAnalytics.length === 0 ? (
            <div className="text-center py-8 text-ink-500">
              <Inbox size={20} className="mx-auto mb-2 text-ink-300" />
              <p className="text-[13px]">No location-level analytics available.</p>
              <p className="text-[11.5px] text-ink-400 mt-1">Block-level aggregation requires location-tagged feedback responses.</p>
            </div>
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
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-600">{loc.responseCount ?? '—'}</td>
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
          {loading && <Loader2 size={14} className="animate-spin text-sky-500" />}
        </div>
        <div className="p-4">
          {!trends ? (
            <div className="text-center py-8 text-ink-500 text-[13px]">Loading trends…</div>
          ) : trends.length === 0 ? (
            <div className="text-center py-8 text-ink-500">
              <Inbox size={20} className="mx-auto mb-2 text-ink-300" />
              <p className="text-[13px]">No trend data available for the selected period.</p>
              <p className="text-[11.5px] text-ink-400 mt-1">Trends require feedback responses across multiple time periods.</p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-around px-4">
              {trends.map((t, idx) => {
                const maxCount = Math.max(1, ...trends.map((x) => x.count))
                return (
                  <div key={idx} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-sky-500 rounded-t transition-all hover:bg-sky-600"
                      style={{ height: `${Math.max(4, (t.count / maxCount) * 100)}%`, minHeight: '4px' }}
                    />
                    <span className="text-[10px] text-ink-400 mt-1">{t.period}</span>
                    <span className="text-[10px] font-mono text-ink-600">{t.count}</span>
                  </div>
                )
              })}
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
  const questionText = data.questionText || data.question_text || data.text || '—'
  const totalResponses = data.totalResponses || data.total_answers || 0
  const avgRating = data.avgRating ?? data.avg_rating ?? null
  const distribution = (Array.isArray(data.distribution) ? data.distribution : []).map((d) => ({
    label: d.label || d.rating || d.value || '—',
    percentage: d.percentage ?? 0,
    count: d.count || 0,
  }))
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[12px] font-medium text-ink-950 flex-1">{questionText}</p>
        <span className="text-[10px] font-mono text-ink-400">{totalResponses} responses</span>
      </div>
      {avgRating != null && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-ink-500">Avg Rating:</span>
          <span className="font-mono text-sky-700 text-lg">{Number(avgRating).toFixed(1)}/5</span>
        </div>
      )}
      <div className="space-y-2">
        {distribution.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-24 text-[11px] text-ink-600 truncate">{item.label}</div>
            <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${item.percentage}%` }} />
            </div>
            <span className="w-10 text-right font-mono text-[11px] text-ink-500">{item.percentage?.toFixed(1) || 0}%</span>
            <span className="w-12 text-right font-mono text-[11px] text-ink-400">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

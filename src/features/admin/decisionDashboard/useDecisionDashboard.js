import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../../app/store/authStore'
import { useComplaintEngine } from '../../../app/store/complaintEngine'
import { backendDashboardApi } from '../../../api/dashboardApi'
import { backendProposalApi } from '../../../api/proposalApi'
import { backendProjectApi } from '../../../api/projectApi'
import { backendBudgetApi } from '../../../api/budgetApi'
import { GISRepository } from '../../../gis/repositories/GISRepository'
import { DISTRICTS } from '../../../config/constants'
import { dashboardConfigForRole } from './decisionDashboardConfig'
import {
  computePriorityAreas,
  pipelineBuckets,
  citizenSignals,
  buildActionQueue,
  computeKpis,
  healthSnapshot,
  normalizeStatus,
} from './priorityScoring'
import { backendIndicatorApis } from '../../../api/indicatorApi'
import { ROLES } from '../../../config/constants'

// Performance contract (requirement §5): the dashboard issues a bounded set of
// parallel requests (dashboard envelope, proposals, project summary, district
// allocations, facilities, heatmap) and reuses the app-wide complaint registry.
// No per-card polling — sections refresh from one explicit "Refresh" action or
// when the complaint store bumps its dataVersion after a mutation.

const initial = { status: 'idle', data: null, error: null, loadedAt: null }

function settle(result) {
  if (result.status === 'fulfilled') {
    return { status: 'ready', data: result.value, error: null, loadedAt: new Date().toISOString() }
  }
  return { status: 'error', data: null, error: result.reason?.message || 'Request failed', loadedAt: null }
}

export function useDecisionDashboard() {
  const user = useAuthStore((s) => s.user)
  const complaints = useComplaintEngine((s) => s.complaints)
  const hydrationStatus = useComplaintEngine((s) => s.hydrationStatus)

  const role = user?.role || user?.roles?.[0] || null
  const districtId = user?.districtId || null
  const district = DISTRICTS.find((d) => d.id === districtId) || DISTRICTS[0]
  const config = useMemo(() => dashboardConfigForRole(role), [role])

  const [sources, setSources] = useState({
    dashboard: initial,
    proposals: initial,
    projectSummary: initial,
    budget: initial,
    facilities: initial,
    heatmap: initial,
    indicators: initial,
  })

  const load = useCallback(async () => {
    setSources((current) => Object.fromEntries(
      Object.entries(current).map(([key, value]) => [key, { ...value, status: 'loading' }])
    ))
    const dashboardRequest = role === ROLES.DISTRICT_COLLECTOR
      ? backendDashboardApi.districtCollector({ district: districtId })
      : role === ROLES.ADM
        ? backendDashboardApi.adm({ district: districtId })
        : role === ROLES.STATE_ADMIN
          ? backendDashboardApi.state()
          : backendDashboardApi.dm({ district: districtId })
    
    // Determine which indicators to fetch based on user's department
    const departmentId = user?.departmentId
    let indicatorPromise = Promise.resolve({ metrics: [] })
    
    if (departmentId && backendIndicatorApis[departmentId]) {
      indicatorPromise = backendIndicatorApis[departmentId].get({ district: districtId })
    } else if (role === ROLES.DISTRICT_COLLECTOR || role === ROLES.DM || role === ROLES.ADM || role === ROLES.STATE_ADMIN) {
      // For admin roles, fetch all available indicators
      indicatorPromise = Promise.allSettled([
        backendIndicatorApis.education?.get({ district: districtId }),
        backendIndicatorApis.health?.get({ district: districtId }),
        backendIndicatorApis.water?.get({ district: districtId }),
        backendIndicatorApis.pwd?.get({ district: districtId }),
        backendIndicatorApis.urban?.get({ district: districtId }),
      ]).then((results) => {
        const combined = { metrics: [] }
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value?.metrics) {
            combined.metrics.push(...result.value.metrics)
          }
        })
        return combined
      })
    }

    const results = await Promise.allSettled([
      dashboardRequest,
      backendProposalApi.list({ districtId }),
      backendProjectApi.summary(),
      backendBudgetApi.districtAllocations.list({ district: districtId }),
      GISRepository.facilities({ districtId }),
      GISRepository.complaintHeatmap({ districtId }),
      indicatorPromise,
    ])
    setSources({
      dashboard: settle(results[0]),
      proposals: settle(results[1]),
      projectSummary: settle(results[2]),
      budget: settle(results[3]),
      facilities: settle(results[4]),
      heatmap: settle(results[5]),
      indicators: settle(results[6]),
    })

    // ── TEMPORARY DATA-FLOW DIAGNOSTICS ──────────────────────────────────
    if (import.meta.env.DEV) {
      console.group('[NDISP FLOW] Raw API responses')
      results.forEach((result, idx) => {
        const labels = ['dashboard', 'proposals', 'projectSummary', 'budget', 'facilities', 'heatmap', 'indicators']
        const label = labels[idx] || `result[${idx}]`
        if (result.status === 'fulfilled') {
          const v = result.value
          const isArr = Array.isArray(v)
          console.log(`${label}:`, {
            isArray: isArr,
            type: typeof v,
            count: isArr ? v.length : (v && typeof v === 'object' ? Object.keys(v).length : null),
            keys: !isArr && v && typeof v === 'object' ? Object.keys(v).slice(0, 10) : null,
            preview: isArr ? v.slice(0, 2) : v,
          })
        } else {
          console.warn(`${label}: REJECTED`, result.reason?.message || result.reason)
        }
      })
      console.groupEnd()
    }
  }, [role, districtId, user?.departmentId])

  useEffect(() => { load() }, [load])

  const derived = useMemo(() => {
    const facilities = sources.facilities.data || []
    const proposals = sources.proposals.data || []
    const projectSummary = sources.projectSummary.data || {}
    const indicators = sources.indicators.data || { metrics: [] }

    const _pipeline = pipelineBuckets(proposals)
    const _actions = buildActionQueue({ complaints, proposals, projectSummary })

    // ── COMPREHENSIVE DATA-FLOW DIAGNOSTICS ─────────────────────────────
    if (import.meta.env.DEV) {
      console.group('[NDISP FLOW] Dashboard data verification')
      console.log(`District: ${districtId || 'N/A'}`)

      // Proposals
      const proposalStatusCounts = {}
      proposals.forEach((p) => {
        const s = normalizeStatus(p.status)
        proposalStatusCounts[s] = (proposalStatusCounts[s] || 0) + 1
      })
      console.group('PROPOSALS')
      console.log('  API (raw count):', sources.proposals.data?.length ?? '?')
      console.log('  Mapped count:', proposals.length)
      console.log('  Status breakdown:', proposalStatusCounts)
      console.log('  Pipeline buckets:', _pipeline.map((s) => `${s.key}:${s.count}`).join('  '))
      console.groupEnd()

      // Complaints
      console.group('COMPLAINTS')
      console.log('  Count:', complaints?.length ?? '?')
      console.log('  Hydration:', hydrationStatus)
      const complaintStateCounts = {}
      complaints?.forEach((c) => {
        const s = String(c.state || 'unknown')
        complaintStateCounts[s] = (complaintStateCounts[s] || 0) + 1
      })
      console.log('  State breakdown:', complaintStateCounts)
      console.groupEnd()

      // Facilities
      console.group('FACILITIES')
      console.log('  API (raw count):', sources.facilities.data?.length ?? '?')
      console.log('  Mapped count:', facilities.length)
      const withPosition = facilities.filter((f) => Array.isArray(f.position)).length
      const withGap = facilities.filter((f) => f.gapScore > 0).length
      console.log('  With valid position:', withPosition)
      console.log('  With gapScore > 0:', withGap)
      console.groupEnd()

      // Budget
      console.group('BUDGET')
      const budgetRecords = sources.budget.data || []
      console.log('  API (raw count):', budgetRecords.length)
      if (budgetRecords.length > 0) {
        console.log('  First record keys:', Object.keys(budgetRecords[0]))
      }
      console.groupEnd()

      // Action queue
      console.group('ACTION QUEUE')
      console.log('  Items:', _actions.length)
      _actions.forEach((item) => console.log(`    ${item.urgency}: ${item.typeLabel} — ${item.title}`))
      console.groupEnd()

      console.groupEnd()
    }

    return {
      areas: computePriorityAreas({ facilities, complaints, proposals }),
      kpis: computeKpis({ facilities, complaints, proposals, projectSummary }),
      pipeline: pipelineBuckets(proposals),
      signals: citizenSignals(complaints),
      actions: buildActionQueue({ complaints, proposals, projectSummary }),
      health: healthSnapshot(facilities, indicators),
      complaintsReady: hydrationStatus === 'ready',
    }
  }, [sources.facilities.data, sources.proposals.data, sources.projectSummary.data, sources.indicators.data, complaints, hydrationStatus])

  const budget = useMemo(() => {
    const records = sources.budget.data || []
    if (!records.length) return null
    const sum = (key) => records.reduce((total, record) => total + (Number(record[key]) || 0), 0)
    const allocated = sum('allocatedCr')
    return {
      records,
      sanctionedCr: sum('approvedCr'),
      allocatedCr: allocated,
      releasedCr: sum('releasedCr'),
      utilizedCr: sum('utilizedCr'),
      balanceCr: sum('balanceCr'),
      utilizationPercent: allocated ? Math.round((sum('utilizedCr') / allocated) * 100) : 0,
      loadedAt: sources.budget.loadedAt,
    }
  }, [sources.budget.data, sources.budget.loadedAt])

  const refetch = useCallback(() => { load() }, [load])

  return {
    role,
    district,
    districtId,
    config,
    complaints,
    complaintsHydrating: hydrationStatus === 'idle' || hydrationStatus === 'loading',
    sources,
    budget,
    derived,
    refetch,
  }
}
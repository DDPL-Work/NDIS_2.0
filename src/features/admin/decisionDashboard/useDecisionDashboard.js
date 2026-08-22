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
} from './priorityScoring'

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

  const role = user?.role || user?.roles?.[0] || 'dm'
  const districtId = user?.districtId || 'nalanda'
  const district = DISTRICTS.find((d) => d.id === districtId) || DISTRICTS[0]
  const config = useMemo(() => dashboardConfigForRole(role), [role])

  const [sources, setSources] = useState({
    dashboard: initial,
    proposals: initial,
    projectSummary: initial,
    budget: initial,
    facilities: initial,
    heatmap: initial,
  })

  const load = useCallback(async () => {
    setSources((current) => Object.fromEntries(
      Object.entries(current).map(([key, value]) => [key, { ...value, status: 'loading' }])
    ))
    const dashboardRequest = role === 'district_collector'
      ? backendDashboardApi.districtCollector({ district: districtId })
      : role === 'adm'
        ? backendDashboardApi.adm({ district: districtId })
        : role === 'state_admin'
          ? backendDashboardApi.state()
          : backendDashboardApi.dm({ district: districtId })
    const results = await Promise.allSettled([
      dashboardRequest,
      backendProposalApi.list({ districtId }),
      backendProjectApi.summary(),
      backendBudgetApi.districtAllocations.list({ district: districtId }),
      GISRepository.facilities({ districtId }),
      GISRepository.complaintHeatmap({ districtId }),
    ])
    setSources({
      dashboard: settle(results[0]),
      proposals: settle(results[1]),
      projectSummary: settle(results[2]),
      budget: settle(results[3]),
      facilities: settle(results[4]),
      heatmap: settle(results[5]),
    })
  }, [role, districtId])

  useEffect(() => { load() }, [load])

  const derived = useMemo(() => {
    const facilities = sources.facilities.data || []
    const proposals = sources.proposals.data || []
    const projectSummary = sources.projectSummary.data || {}
    return {
      areas: computePriorityAreas({ facilities, complaints, proposals }),
      kpis: computeKpis({ facilities, complaints, proposals, projectSummary }),
      pipeline: pipelineBuckets(proposals),
      signals: citizenSignals(complaints),
      actions: buildActionQueue({ complaints, proposals, projectSummary }),
      health: healthSnapshot(facilities),
      complaintsReady: hydrationStatus === 'ready',
    }
  }, [sources.facilities.data, sources.proposals.data, sources.projectSummary.data, complaints, hydrationStatus])

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
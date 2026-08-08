import { create } from 'zustand'
import { ComplaintRepository } from '../../gis/repositories/ComplaintRepository'
import { ComplaintService } from '../../gis/services/ComplaintService'
import { backendNotificationApi } from '../../api/notificationApi'
import { useAuthStore } from './authStore'
import { useUiStore } from './uiStore'

// Flatten complaint timelines (mapped entries) into the legacy audit-log
// shape consumed by the Timeline / Audit Trail tabs and Governance tab.
function rebuildAuditLogs(complaints) {
  const entries = []
  complaints.forEach((complaint) => {
    (complaint.timeline || []).forEach((entry) => {
      entries.push({
        id: `${complaint.id}-${entry.id}`,
        complaintId: complaint.id,
        timestamp: entry.timestamp,
        actorName: entry.actorName || 'System',
        actorRole: entry.actorRole || 'user',
        departmentId: complaint.departmentSlug || '',
        action: entry.action,
        oldValue: entry.fromStatus,
        newValue: entry.toStatus,
        location: entry.remarks || complaint.location?.village || 'District Portal',
        device: 'NDISP Portal',
      })
    })
  })
  return entries
}

export const useComplaintEngine = create((set, get) => ({
  complaints: [],
  auditLogs: [],
  notifications: [],
  filters: {},
  hydrationStatus: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
  hydrationError: null,
  hydrationInFlight: false,
  // Monotonic counter bumped after every successful mutation so aggregate
  // dashboards / badge counts that read other APIs can invalidate themselves.
  dataVersion: 0,

  // Simulation engine flags (kept for the dev panel; simulation actions are
  // disabled — the live build routes every action through the backend API).
  simulationActive: false,
  simSpeedMultiplier: 1,
  simClockTime: new Date().toISOString(),

  async hydrate(filters = {}) {
    if (get().hydrationInFlight) return
    set({ hydrationInFlight: true, hydrationStatus: 'loading' })
    try {
      const complaints = await ComplaintRepository.list(filters)
      set({
        complaints,
        filters,
        auditLogs: rebuildAuditLogs(complaints),
        hydrationStatus: 'ready',
        hydrationError: null,
      })
    } catch (error) {
      set({ hydrationStatus: 'error', hydrationError: error?.message || 'Unknown error' })
      useUiStore.getState().pushToast(`Failed to load complaints: ${error?.message || 'Network error'}`, 'error')
    } finally {
      set({ hydrationInFlight: false })
    }
  },

  refresh() {
    return get().hydrate(get().filters)
  },

  // Deep-reload a single complaint from the backend (detail + fresh timeline),
  // replace it in the registry and bump the invalidation counter.
  async ingestComplaint(complaintId) {
    if (!complaintId) return
    try {
      const complaint = await ComplaintRepository.detail(complaintId)
      const timeline = await ComplaintRepository.timeline(complaintId)
      const updated = { ...complaint, timeline }
      set((s) => {
        const complaints = s.complaints.some((c) => String(c.id) === String(complaintId))
          ? s.complaints.map((c) => (String(c.id) === String(complaintId) ? updated : c))
          : [...s.complaints, updated]
        return { complaints, auditLogs: rebuildAuditLogs(complaints), dataVersion: s.dataVersion + 1 }
      })
    } catch (error) {
      useUiStore.getState().pushToast(`Failed to refresh complaint ${complaintId}: ${error?.message || 'Network error'}`, 'error')
    }
  },

  refreshComplaint(complaintId) {
    return get().ingestComplaint(complaintId)
  },

  async refreshNotifications() {
    try {
      const notifications = await backendNotificationApi.list()
      set({ notifications })
    } catch (error) {
      useUiStore.getState().pushToast(`Failed to load notifications: ${error?.message || 'Network error'}`, 'error')
    }
  },

  // Transition complaint state via the backend action endpoints.  The request
  // body is owned by ComplaintService.  After a successful mutation the store
  // re-fetches the freshly committed complaint + timeline (invalidate the
  // detail modal), tears down the audit log and bumps dataVersion so every
  // complaint list, badge and dashboard card reflects the change.
  async transitionComplaintState(complaintId, nextState, actorUser, remarks = '', extraData = {}) {
    const previous = get().complaints.find((c) => String(c.id) === String(complaintId))
    if (previous) set((s) => ({ complaints: s.complaints.map((c) => (String(c.id) === String(complaintId) ? { ...c, state: nextState } : c)) }))
    try {
      await ComplaintService.performAction(complaintId, nextState, { remarks, actorUser, payload: extraData })
      await get().ingestComplaint(complaintId)
      return true
    } catch (error) {
      if (previous) set((s) => ({ complaints: s.complaints.map((c) => (String(c.id) === String(complaintId) ? previous : c)) }))
      useUiStore.getState().pushToast(`Action failed for ${complaintId}: ${error?.message || 'Network error'}`, 'error')
      return false
    }
  },

  async submitCitizenVerification(complaintId, actorUser, feedback) {
    const complaint = get().complaints.find((item) => String(item.id) === String(complaintId))
    if (!complaint || !['verification_pending', 'resolved'].includes(complaint.state) || actorUser?.role !== 'citizen') return false
    try {
      if (feedback.satisfied) {
        await ComplaintService.submitCitizenFeedback(complaintId, {
          rating: feedback.rating,
          comment: feedback.comment || '',
        })
      } else {
        await ComplaintService.reopen(complaintId, feedback.reason || 'Citizen requested rework.')
      }
      await get().ingestComplaint(complaintId)
      return true
    } catch (error) {
      useUiStore.getState().pushToast(`Verification failed: ${error?.message || 'Network error'}`, 'error')
      return false
    }
  },

  async closeCitizenComplaint(complaintId) {
    try {
      await ComplaintService.close(complaintId)
      await get().ingestComplaint(complaintId)
      return true
    } catch (error) {
      useUiStore.getState().pushToast(`Close failed: ${error?.message || 'Network error'}`, 'error')
      return false
    }
  },

  async reopenCitizenComplaint(complaintId, reason) {
    if (!reason) return false
    try {
      await ComplaintService.reopen(complaintId, reason)
      await get().ingestComplaint(complaintId)
      return true
    } catch (error) {
      useUiStore.getState().pushToast(`Reopen failed: ${error?.message || 'Network error'}`, 'error')
      return false
    }
  },

  async escalateCitizenComplaint(complaintId, actorUser, reason) {
    const complaint = get().complaints.find((item) => String(item.id) === String(complaintId))
    const allowed = complaint && (new Date(complaint.slaDueAt) < new Date() || ['verification_pending', 'resolved', 'reopened'].includes(complaint.state))
    if (!allowed || actorUser?.role !== 'citizen' || !reason) return false
    try {
      await ComplaintService.escalate(complaintId, reason)
      await get().ingestComplaint(complaintId)
      return true
    } catch (error) {
      useUiStore.getState().pushToast(`Escalation failed: ${error?.message || 'Network error'}`, 'error')
      return false
    }
  },

  async routeComplaintPayload(payload) {
    try {
      const created = await ComplaintService.create(payload)
      set((s) => ({ complaints: [created, ...s.complaints], dataVersion: s.dataVersion + 1 }))
      useUiStore.getState().pushToast(`Complaint ${created.id} registered and routed!`, 'success')
      return created
    } catch (error) {
      useUiStore.getState().pushToast(`Complaint submission failed: ${error?.message || 'Network error'}`, 'error')
      return null
    }
  },

  // Simulation Engine Functions — disabled in the live build. These actions
  // would otherwise fabricate complaint records; every lifecycle action now
  // runs through the backend API instead.
  toggleSimulation(active) {
    set({ simulationActive: active })
  },

  setSimSpeed(speed) {
    set({ simSpeedMultiplier: speed })
  },

  advanceSimulationTime() {
    useUiStore.getState().pushToast('Simulation time control is disabled in the live build. SLA data comes from the backend.', 'info')
    return false
  },

  advanceComplaintTime() {
    return get().advanceSimulationTime()
  },

  simulateRandomComplaintCreation() {
    useUiStore.getState().pushToast('Complaint generation simulation is disabled in the live build.', 'info')
    return false
  },

  simulateEngineerInspectionAction() {
    useUiStore.getState().pushToast('Engineer inspection simulation is disabled in the live build. Use the Field Inspector portal.', 'info')
    return false
  },
}))

// Kick off one-time hydration + notification load + the dashboard clock.
// Runs at module import (browser only), so every screen shares one registry.
// When a session signs in after the initial load, the registry re-hydrates so
// the role-scoped queue/dashboard populate from the backend.
if (typeof window !== 'undefined') {
  useComplaintEngine.getState().hydrate()
  useComplaintEngine.getState().refreshNotifications()
  useAuthStore.subscribe((state, prev) => {
    if (state.user && !prev.user) {
      useComplaintEngine.getState().hydrate()
      useComplaintEngine.getState().refreshNotifications()
    }
  })
  setInterval(() => useComplaintEngine.setState({ simClockTime: new Date().toISOString() }), 30000)
}
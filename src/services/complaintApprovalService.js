// Service to track and manage Department Head / Officer work approval on complaints
// Before citizen feedback is opened, the department head or officer must approve the work.

const STORAGE_KEY = 'ndisp_dept_approvals'

function getStoredApprovals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStoredApprovals(approvals) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(approvals))
  } catch (e) {
    console.error('Failed to save department approvals', e)
  }
}

export const complaintApprovalService = {
  isWorkApproved(complaintId, complaint = null) {
    if (!complaintId) return { approved: false }
    const idKey = String(complaintId)
    const stored = getStoredApprovals()
    if (stored[idKey]) {
      return { approved: true, ...stored[idKey] }
    }

    // Inspect timeline if complaint object is provided
    if (complaint && Array.isArray(complaint.timeline)) {
      const approvalEntry = complaint.timeline.find((entry) => {
        const action = String(entry.action || '').toLowerCase()
        const remarks = String(entry.remarks || '').toLowerCase()
        const actorRole = String(entry.actorRole || '').toLowerCase()
        return (
          action.includes('approve') ||
          action === 'dept_approved' ||
          action === 'work_approved' ||
          remarks.includes('approved by department') ||
          remarks.includes('[dept_head_approved]') ||
          (actorRole.includes('head') && (action.includes('accept') || action.includes('resolve')))
        )
      })
      if (approvalEntry) {
        return {
          approved: true,
          approvedBy: approvalEntry.actorName || 'Department Head',
          approverRole: approvalEntry.actorRole || 'Department Head',
          approvedAt: approvalEntry.timestamp,
          remarks: approvalEntry.remarks,
        }
      }
    }

    return { approved: false }
  },

  approveWork(complaintId, { actorUser, remarks = '' } = {}) {
    if (!complaintId) return null
    const idKey = String(complaintId)
    const stored = getStoredApprovals()
    const approvalData = {
      approved: true,
      approvedBy: actorUser?.name || 'Department Head',
      approverRole: actorUser?.designation || actorUser?.roleName || actorUser?.role || 'Department Head',
      approvedAt: new Date().toISOString(),
      remarks: remarks || 'Work inspected and approved by department head.',
    }
    stored[idKey] = approvalData
    saveStoredApprovals(stored)

    try {
      window.dispatchEvent(new CustomEvent('ndisp:complaint-approved', { detail: { complaintId, ...approvalData } }))
    } catch {
      // safe fallback
    }

    return approvalData
  },

  requestRework(complaintId, { actorUser, reason = '' } = {}) {
    if (!complaintId) return
    const idKey = String(complaintId)
    const stored = getStoredApprovals()
    delete stored[idKey]
    saveStoredApprovals(stored)

    try {
      window.dispatchEvent(new CustomEvent('ndisp:complaint-rework-requested', { detail: { complaintId, reason, actorUser } }))
    } catch {
      // safe fallback
    }
  },
}

export const isWorkApproved = complaintApprovalService.isWorkApproved
export const approveWork = complaintApprovalService.approveWork
export const requestRework = complaintApprovalService.requestRework
export default complaintApprovalService

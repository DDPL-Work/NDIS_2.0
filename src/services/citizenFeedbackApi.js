import { mapCitizenFeedbackSubmission } from '../utils/citizenFeedbackMapper'

const STORAGE_KEY = 'ndisp.demoCitizenFeedback'

const read = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

// Local demo adapter. Replace its implementation with the future API call;
// callers receive the same normalized record either way.
export const citizenFeedbackApi = {
  async submitFeedback(formModel) {
    const payload = mapCitizenFeedbackSubmission(formModel)
    const id = `FB-DEMO-${String(Date.now()).slice(-8)}`
    const record = { id, status: 'SUBMITTED', submittedAt: new Date().toISOString(), ...payload }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...read()].slice(0, 100))) } catch { /* private mode can reject local persistence */ }
    return record
  },
  async listFeedback() { return read() },
}

import { CATEGORY_ROUTING_RULES, PRIORITY_CONFIG } from '../../../config/constants'
import { distanceMeters } from '../../../utils/geo'
import { ComplaintRepository } from '../repositories/ComplaintRepository'

const questionSets = {
  broken_handpump: ['Is water flowing at all?', 'Is the motor making noise?', 'Is the pipe visibly damaged?', 'Since when has the issue existed?'],
  water_leakage: ['Is the leakage continuous?', 'Is the water contaminated?', 'Is any road or home affected?', 'Since when has the issue existed?'],
  street_light_out: ['What is the pole number?', 'Is the full street affected?', 'Is it a single light or several lights?', 'Is there an exposed wire?'],
  hospital_facility_issue: ['Which hospital or facility?', 'Which ward is affected?', 'Is this an emergency?', 'Which equipment or service is unavailable?'],
  school_infrastructure: ['Which school and classroom?', 'Is student safety affected?', 'Is the toilet or water facility usable?', 'How many students are affected?'],
}

export function analyzeComplaint({ title = '', description = '', position, complaints = [] }) {
  const text = `${title} ${description}`.toLowerCase()
  const ranked = CATEGORY_ROUTING_RULES.map((rule) => ({ rule, score: rule.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score)
  const best = ranked[0]?.score ? ranked[0] : { rule: CATEGORY_ROUTING_RULES.find((rule) => rule.categoryId === 'broken_handpump'), score: 0 }
  // Nearest-asset suggestion needs a real GIS asset index; the backend does
  // not expose one, so nearestAsset is left null (BACKEND GAP) rather than
  // fabricated from mock data.
  const urgentTerms = ['emergency', 'hospital', 'oxygen', 'contamination', 'flood', 'fire', 'danger', 'accident']
  const priority = urgentTerms.some((term) => text.includes(term)) ? 'urgent' : best.score >= 2 ? best.rule.defaultPriority : 'medium'
  const confidence = Math.min(98, best.score ? 70 + best.score * 12 : 45)
  return {
    categoryId: best.rule.categoryId, categoryName: best.rule.categoryName, departmentId: best.rule.departmentId,
    confidence, priority, slaHours: PRIORITY_CONFIG[priority]?.defaultSlaHours || best.rule.slaHours,
    nearestAsset: null,
    smartQuestions: questionSets[best.rule.categoryId] || ['What infrastructure is affected?', 'Is there a safety risk?', 'Since when has the issue existed?'],
    duplicates: position ? ComplaintRepository.findNearbyDuplicates(complaints, best.rule.categoryId, position, distanceMeters) : [],
  }
}

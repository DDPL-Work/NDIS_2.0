import { citizenFeedbackApi } from './citizenFeedbackApi'

// Demo-data boundary for future location/department aggregation. Never use it
// as official analytics until records come from the backend.
export async function getFacilityFeedbackSummary(facilityId) {
  const records = (await citizenFeedbackApi.listFeedback()).filter((item) => String(item.facility_id) === String(facilityId))
  return { facilityId, count: records.length, records }
}

export async function getDepartmentFeedbackSummary(departmentId) {
  const records = (await citizenFeedbackApi.listFeedback()).filter((item) => String(item.department_id) === String(departmentId))
  return { departmentId, count: records.length, records }
}

export async function getDistrictFeedbackSummary(districtId) {
  const records = (await citizenFeedbackApi.listFeedback()).filter((item) => String(item.district_id) === String(districtId))
  return { districtId, count: records.length, records }
}

export async function getQuestionResponseDistribution(questionId, records) {
  const source = records || await citizenFeedbackApi.listFeedback()
  const distribution = source.flatMap((item) => item.responses || [])
    .filter((response) => response.question_id === questionId)
    .reduce((result, response) => ({ ...result, [response.answer]: (result[response.answer] || 0) + 1 }), {})
  return { questionId, distribution }
}

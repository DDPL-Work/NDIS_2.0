// Maps the form model to the backend-safe feedback contract. Keep this
// boundary independent from React so the mock adapter can become an API call.
export function mapCitizenFeedbackSubmission({ facility = {}, answers = {}, questions = [] }) {
  return {
    facility_id: facility.id ?? null,
    department_id: facility.departmentId ?? null,
    district_id: facility.districtId ?? null,
    latitude: facility.position?.[1] ?? facility.latitude ?? null,
    longitude: facility.position?.[0] ?? facility.longitude ?? null,
    category: facility.categoryId || facility.categoryLabel || '',
    location: {
      village: facility.village || '',
      block: facility.block || '',
      district: facility.districtName || '',
    },
    responses: questions
      .filter((question) => question.type !== 'optional_text' && answers[question.id] !== undefined && answers[question.id] !== '')
      .map((question) => ({ question_id: question.id, answer: answers[question.id] })),
    comment: answers.service_note || '',
  }
}

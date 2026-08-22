// DEMO ONLY - replace with backend-configured question sets when available.
// The selector is intentionally context-aware so department/category sets can
// be added later without changing feedback UI components.
export const GENERIC_CITIZEN_FEEDBACK_QUESTIONS = [
  { id: 'facility_condition', question: 'How would you rate the overall condition of this facility?', type: 'single_choice', required: true, options: [
    { value: 'VERY_GOOD', label: 'Very good' }, { value: 'GOOD', label: 'Good' }, { value: 'AVERAGE', label: 'Average' }, { value: 'POOR', label: 'Poor' }, { value: 'VERY_POOR', label: 'Very poor' },
  ] },
  { id: 'accessibility', question: 'How easy is it to access this facility?', type: 'single_choice', required: true, options: [
    { value: 'VERY_EASY', label: 'Very easy' }, { value: 'EASY', label: 'Easy' }, { value: 'AVERAGE', label: 'Average' }, { value: 'DIFFICULT', label: 'Difficult' }, { value: 'VERY_DIFFICULT', label: 'Very difficult' },
  ] },
  { id: 'service_availability', question: 'Is the expected service available?', type: 'yes_no', required: true },
  { id: 'cleanliness', question: 'How would you rate cleanliness and maintenance?', type: 'single_choice', required: true, options: [
    { value: 'VERY_GOOD', label: 'Very good' }, { value: 'GOOD', label: 'Good' }, { value: 'AVERAGE', label: 'Average' }, { value: 'POOR', label: 'Poor' }, { value: 'VERY_POOR', label: 'Very poor' },
  ] },
  { id: 'overall_experience', question: 'How would you rate your overall experience?', type: 'rating', required: true, min: 1, max: 5 },
  { id: 'service_note', question: "Anything else you'd like to tell us?", type: 'optional_text', required: false, maxLength: 300 },
]

export function getCitizenFeedbackQuestions(_context = {}) {
  // `_context` is reserved for future department/category question sets.
  void _context
  return GENERIC_CITIZEN_FEEDBACK_QUESTIONS
}

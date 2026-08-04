export const CitizenFeedbackRepository = { isRequired: (complaint) => ['verification_pending', 'resolved', 'citizen_confirmation'].includes(complaint.state) }

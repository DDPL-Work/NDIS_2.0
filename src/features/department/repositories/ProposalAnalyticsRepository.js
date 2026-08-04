export const ProposalAnalyticsRepository = {
  summarize: (proposals) => ({
    total: proposals.length,
    draft: proposals.filter((item) => item.state === 'draft').length,
    review: proposals.filter((item) => ['department_review', 'dm_review', 'submitted', 'collector'].includes(item.state)).length,
    approved: proposals.filter((item) => item.state === 'approved').length,
    returned: proposals.filter((item) => item.state === 'returned').length,
    rejected: proposals.filter((item) => item.state === 'rejected').length,
    cost: proposals.reduce((sum, item) => sum + (item.financialEstimate || 0), 0),
    beneficiaries: proposals.reduce((sum, item) => sum + (item.population || 0), 0),
  }),
}

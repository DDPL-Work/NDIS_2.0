import { useProjectEngine } from '../../../app/store/projectEngine'

export const PlanningRepository = {
  developmentNeeds: (departmentId, complaints = []) => complaints.filter((item) => item.departmentId === departmentId && (item.priority === 'urgent' || item.state === 'escalated')).map((item) => ({
    id: `NEED-${item.id}`, complaintId: item.id, title: item.title, village: item.location?.village, block: item.location?.block || 'Silao', priority: item.priority, gapScore: item.priority === 'urgent' ? 0.9 : 0.72, population: item.affectedPopulation || 2500,
  })),
  list: (departmentId) => useProjectEngine.getState().proposals.filter((item) => item.departmentId === departmentId),
}

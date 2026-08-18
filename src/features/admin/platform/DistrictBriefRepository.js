// District Brief Repository (Module 2 - Daily Command Brief).
// BACKEND-DRIVEN: the daily brief is computed exclusively from the live
// complaint registry — no simulated weather, staff counts or advisories.

export const DistrictBriefRepository = {
  getDailyBrief(complaints, timestamp) {
    const critical = complaints.filter(
      (c) => (c.priority === 'urgent' || c.state === 'escalated') && c.state !== 'resolved' && c.state !== 'closed'
    )
    const slaBreached = complaints.filter(
      (c) => new Date(c.slaDueAt).getTime() < new Date(timestamp).getTime() && !['resolved', 'closed'].includes(c.state)
    )
    const openByDept = {}
    complaints
      .filter((c) => c.state !== 'resolved' && c.state !== 'closed')
      .forEach((c) => {
        const key = c.departmentSlug || 'unassigned'
        openByDept[key] = (openByDept[key] || 0) + 1
      })
    const topDept = Object.entries(openByDept).sort((a, b) => b[1] - a[1])[0]

    return {
      date: new Date(timestamp).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }),
      criticalCount: critical.length,
      criticalTickets: critical.slice(0, 3).map((c) => ({ id: c.id, title: c.title, state: c.state })),
      slaBreachesCount: slaBreached.length,
      pendingApprovals: complaints.filter((c) => c.state === 'submitted').length,
      topDept: topDept ? { slug: topDept[0], openCount: topDept[1] } : null,
    }
  },
}
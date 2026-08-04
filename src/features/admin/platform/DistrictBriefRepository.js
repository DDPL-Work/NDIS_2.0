// District Brief Repository (Module 2 - AI Daily Brief & Simulation Seam)

export const DistrictBriefRepository = {
  getDailyBrief(complaints, timestamp) {
    const total = complaints.length
    const critical = complaints.filter(
      (c) => (c.priority === 'urgent' || c.state === 'escalated') && c.state !== 'resolved' && c.state !== 'closed'
    )
    const slaBreached = complaints.filter(
      (c) => new Date(c.slaDueAt).getTime() < new Date(timestamp).getTime() && !['resolved', 'closed'].includes(c.state)
    )

    // Simulate weather, meetings and staff based on timestamp hashes to keep it dynamic
    const timeVal = new Date(timestamp).getTime()
    const absentStaff = Math.floor(8 + (timeVal % 12))
    const budgetRiskCount = Math.floor(1 + (timeVal % 4))

    return {
      date: new Date(timestamp).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }),
      weather: {
        temp: 31,
        condition: 'Thunderstorm warning active (Silao & Rajgir blocks)',
        severity: 'orange',
      },
      criticalCount: critical.length,
      criticalTickets: critical.slice(0, 3).map((c) => ({ id: c.id, title: c.title, state: c.state })),
      slaBreachesCount: slaBreached.length,
      todayMeetings: [
        { time: '11:00 AM', title: 'Monsoon Flood Preparedness Review', dept: 'Disaster Management' },
        { time: '03:30 PM', title: 'JJM Tap Connections Phase 2 Audit', dept: 'Water & Sanitation' },
      ],
      pendingApprovals: complaints.filter((c) => c.state === 'submitted').length,
      absentStaff,
      budgetRisks: [
        { dept: 'Health', risk: 'NHM medical equipment invoice pending release beyond 30 days.' },
        { dept: 'PWD', risk: 'Sadar Hospital approach road construction billing exceeds quarterly forecast.' },
      ].slice(0, budgetRiskCount),
      aiRecommendations: [
        `Heatwave/Thunderstorm alert: Direct CDPO to adjust Anganwadi hours to 07:00 – 11:30 AM.`,
        `Transformer capacity deficit at Rajgir Ward 01: Deploy mobile substation units immediately.`,
      ],
    }
  }
}

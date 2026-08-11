import { useState, useMemo } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Modal from '../../../components/ui/Modal'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ComplaintDetailHub from '../../shared/ComplaintDetailHub'
import { useAuthStore } from '../../../app/store/authStore'
import { useComplaintEngine } from '../../../app/store/complaintEngine'
import { useUiStore } from '../../../app/store/uiStore'
import { usePagination } from '../../../hooks/usePagination'
import Pagination from '../../../components/ui/Pagination'

// Import Sub-Tabs
import OverviewTab from './OverviewTab'
import PersonnelTab from './PersonnelTab'
import OperationsTab from './OperationsTab'
import MonitoringTab from './MonitoringTab'
import DisasterTab from './DisasterTab'
import GovernanceTab from './GovernanceTab'

// Import Mock Repositories
import { DistrictStatisticsRepository } from './DistrictStatisticsRepository'
import { DistrictBriefRepository } from './DistrictBriefRepository'

export default function DistrictCommandPlatform() {
  const user = useAuthStore((s) => s.user)
  const pushToast = useUiStore((s) => s.pushToast)

  // Simulation store hooks
  const { complaints, auditLogs, simClockTime } = useComplaintEngine()

  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'personnel' | 'operations' | 'projects' | 'safety' | 'governance'
  const [selectedComplaintId, setSelectedComplaintId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Interactive local list mock states that update on Smart Actions
  const [inspections, setInspections] = useState([
    { id: 'AUD-01', title: 'Rajgir Sadar Hospital Oxygen Plant Inspection', dept: 'health', deptLabel: 'Health & Family Welfare', inspector: 'Dr. Rajesh Kumar', score: 92, status: 'Completed' },
    { id: 'AUD-02', title: 'Silao Primary School Building Roof Safety Audit', dept: 'education', deptLabel: 'School Education', inspector: 'Shri Birendra Prasad', score: null, status: 'Assigned' },
  ])

  const [meetings, setMeetings] = useState([
    { time: '11:00 AM', title: 'Monsoon Flood Preparedness Review', dept: 'Disaster Management', status: 'In Progress' },
    { time: '03:30 PM', title: 'JJM Tap Connections Phase 2 Audit', dept: 'Water & Sanitation', status: 'Scheduled' },
  ])

  const [controlRooms, setControlRooms] = useState([
    { id: 'CR-01', name: 'Sadar Block Disaster Control Room', head: 'Rajeshwar Prasad (ADM)', phone: '06112-225224', status: 'Operational' },
    { id: 'CR-02', name: 'Rajgir Tourist Outpost emergency unit', head: 'Kavita Kumari', phone: '+91 94318 XXXXX', status: 'Standby' },
  ])

  // Mock datasets for monitoring & governance
  const stats = useMemo(() => DistrictStatisticsRepository.getProfile(user?.districtId), [user?.districtId])
  const brief = useMemo(() => DistrictBriefRepository.getDailyBrief(complaints, simClockTime), [complaints, simClockTime])

  const officers = [
    { name: 'Dr. Rajesh Kumar', designation: 'Civil Surgeon / Head', dept: 'health', deptLabel: 'Health', avgSla: 4.8, status: 'Active' },
    { name: 'Smt. Kavita Devi', designation: 'Deputy CMO', dept: 'health', deptLabel: 'Health', avgSla: 6.2, status: 'Active' },
    { name: 'Anil Mehta', designation: 'Assistant Engineer', dept: 'water', deptLabel: 'Water Dept', avgSla: 8.4, status: 'Active' },
    { name: 'Praveen Kumar', designation: 'Junior Engineer', dept: 'electricity', deptLabel: 'Electricity', avgSla: 14.5, status: 'On Leave' },
  ]

  const fieldStaff = [
    { id: 'FS-01', name: 'Manoj Singh', designation: 'Junior Engineer', assignedArea: 'Rajgir Ward 02', status: 'Active', coords: [85.4211, 25.0294] },
    { id: 'FS-02', name: 'Sunita Sharma', designation: 'ASHA Nodal Worker', assignedArea: 'Silao Sector B', status: 'Active', coords: [85.4434, 25.1372] },
    { id: 'FS-03', name: 'Rajiv Mishra', designation: 'Survey Supervisor', assignedArea: 'Harnaut Road Project', status: 'Inactive', coords: [85.4312, 25.0811] },
  ]

  const vehicles = [
    { reg: 'BR-21G-0102', type: '108 Ambulance Unit', driver: 'Raju Paswan', phone: '94302 XXXXX', fuel: 84, status: 'Active' },
    { reg: 'BR-21G-0440', type: 'Water Tanker (JJM)', driver: 'Sohan Yadav', phone: '91131 XXXXX', fuel: 72, status: 'Active' },
    { reg: 'BR-21G-0911', type: 'PWD Survey Jeep', driver: 'Madan Singh', phone: '80024 XXXXX', fuel: 45, status: 'Under Repair' },
  ]

  const projects = [
    { name: 'Silao Block Hospital New Building Block', deptLabel: 'Health', progress: 75, budget: 14500000, risk: 'Low' },
    { name: 'Rajgir Kund Road Widening Highway', deptLabel: 'PWD / Roads', progress: 42, budget: 28000000, risk: 'Medium' },
    { name: 'JJM Pipeline Last-Mile Connection Silao', deptLabel: 'Water', progress: 91, budget: 8500000, risk: 'Low' },
  ]

  const schemes = [
    { name: 'Jal Jeevan Mission (JJM)', coverage: '1.84 Lakh Taps', progress: 82, issues: 4 },
    { name: 'Pradhan Mantri Gram Sadak Yojana (PMGSY)', coverage: '96 Roads', progress: 94, issues: 1 },
    { name: 'PM-JAY Ayushman Bharat', coverage: '5.12 Lakh families', progress: 99, issues: 0 },
  ]

  const budgetUtil = [
    { departmentId: 'health', sanctioned: 12000000, utilized: 8400000 },
    { departmentId: 'water', sanctioned: 18000000, utilized: 11200000 },
    { departmentId: 'electricity', sanctioned: 15000000, utilized: 9200000 },
  ]

  const shelters = [
    { name: 'Rajgir Tourist Shelter Center', capacity: 150, occupied: 42, village: 'Rajgir', block: 'Silao', status: 'Operational' },
    { name: 'Silao High School Relief Camp', capacity: 200, occupied: 0, village: 'Silao Bazar', block: 'Silao', status: 'Operational' },
  ]

  const csat = [
    { deptLabel: 'Health & Family Welfare', rating: 4.6, reviews: 1420 },
    { deptLabel: 'Water & Sanitation', rating: 4.8, reviews: 2110 },
    { deptLabel: 'Electricity Board', rating: 3.9, reviews: 920 },
  ]

  const rankings = [
    { rank: 1, block: 'Rajgir Block', score: 94 },
    { rank: 2, block: 'Silao Block', score: 91 },
    { rank: 3, block: 'Harnaut Block', score: 86 },
  ]

  // Smart Actions Implementation
  function handleScheduleInspection(payload) {
    const newIns = {
      id: `AUD-0${inspections.length + 1}`,
      title: payload.title,
      dept: payload.dept,
      deptLabel: payload.dept === 'health' ? 'Health & Family Welfare' : 'Water & Sanitation',
      inspector: payload.inspector,
      score: null,
      status: 'Assigned',
    }
    setInspections([newIns, ...inspections])
    pushToast(`Executive inspection scheduled: ${payload.title}`, 'success')
  }

  function handleScheduleMeeting(payload) {
    const newMeet = {
      time: '10:30 AM (Tomorrow)',
      title: payload.title,
      dept: payload.dept,
      status: 'Scheduled',
    }
    setMeetings([newMeet, ...meetings])
    pushToast(`Administrative meeting scheduled: ${payload.title}`, 'success')
  }

  function handleDispatchTeam(controlRoomId) {
    setControlRooms((prev) =>
      prev.map((c) => (c.id === controlRoomId ? { ...c, status: 'Response Active' } : c))
    )
  }

  // Universal Search Overlay filter (Module 13)
  const filteredComplaints = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return complaints.filter(
      (c) => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.location.village.toLowerCase().includes(q)
    )
  }, [searchQuery, complaints])

  const { page, setPage, pageEntries, pageCount, pageSize, total } = usePagination(filteredComplaints, 8)

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="District Command & Governance Platform · LLD Vol 3 §18"
        title="District Executive Command Cockpit"
        description="Unified administration platform. Coordinate departments, track vehicle fleet, manage emergency response, and deploy field audits."
        action={
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-semibold text-ink-600">Active command role: {user?.designation || user?.role}</span>
          </div>
        }
      />

      {/* Tabs Menu */}
      <div className="px-6">
        <div className="card p-1 flex flex-wrap gap-1 bg-ink-100 w-fit text-[12.5px] font-medium">
          {['overview', 'personnel', 'operations', 'projects', 'safety', 'governance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-white text-ink-950 font-semibold shadow-xs' : 'text-ink-600'}`}
            >
              {tab === 'safety' ? 'Disaster Hub' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Global Search Results Overlay (Module 13) */}
      {searchQuery.trim() && (
        <div className="px-6">
          <Card className="border-saffron-300 bg-saffron-50/20">
            <CardHeader title={`Global Search Results (${filteredComplaints.length})`} subtitle="Universal match query outcomes" />
            <CardBody className="divide-y divide-ink-100 !p-0">
              {filteredComplaints.length === 0 ? (
                <p className="p-4 text-[12.5px] text-ink-500">No matching items found. Try another keyword.</p>
              ) : (
                pageEntries.map((c) => (
                  <div key={c.id} className="p-3 flex items-center justify-between text-[12.5px]">
                    <div>
                      <span className="font-bold">{c.id}</span>
                      <p className="font-semibold mt-0.5">{c.title}</p>
                    </div>
                    <Button size="xs" variant="outline" onClick={() => setSelectedComplaintId(c.id)}>
                      Inspect
                    </Button>
                  </div>
                ))
              )}
              <Pagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} onChange={setPage} className="!border-t-0 !px-0 !pb-0" />
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab Panels */}
      <div className="px-6">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            brief={brief}
            onInspectComplaint={(id) => setSelectedComplaintId(id)}
            onGlobalSearch={(val) => setSearchQuery(val)}
          />
        )}
        {activeTab === 'personnel' && (
          <PersonnelTab
            officers={officers}
            fieldStaff={fieldStaff}
          />
        )}
        {activeTab === 'operations' && (
          <OperationsTab
            vehicles={vehicles}
            inspections={inspections}
            meetings={meetings}
            onScheduleInspection={handleScheduleInspection}
            onScheduleMeeting={handleScheduleMeeting}
          />
        )}
        {activeTab === 'projects' && (
          <MonitoringTab
            projects={projects}
            schemes={schemes}
            budgetUtil={budgetUtil}
          />
        )}
        {activeTab === 'safety' && (
          <DisasterTab
            shelters={shelters}
            controlRooms={controlRooms}
            onDispatchTeam={handleDispatchTeam}
          />
        )}
        {activeTab === 'governance' && (
          <GovernanceTab
            csat={csat}
            rankings={rankings}
            auditLogs={auditLogs}
          />
        )}
      </div>

      {/* Inspection Modal Details */}
      <Modal open={!!selectedComplaintId} onClose={() => setSelectedComplaintId(null)} width="max-w-4xl">
        {selectedComplaintId && <ComplaintDetailHub complaintId={selectedComplaintId} onClose={() => setSelectedComplaintId(null)} />}
      </Modal>
    </div>
  )
}

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

// Import Repositories (backend-derived)
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

  // Executive registers (inspections, meetings, control rooms) have no
  // documented backend endpoint — the panels surface the honest gap.
  const [inspections] = useState([])
  const [meetings] = useState([])
  const [controlRooms] = useState([])

  // District profile & daily brief — computed live from backend data only.
  const stats = useMemo(() => DistrictStatisticsRepository.getProfile(user?.districtId, complaints), [user?.districtId, complaints])
  const brief = useMemo(() => DistrictBriefRepository.getDailyBrief(complaints, simClockTime), [complaints, simClockTime])

  // Registers without a backend endpoint render as empty (BACKEND GAP).
  const officers = []
  const fieldStaff = []
  const vehicles = []
  const schemes = []
  const budgetUtil = []
  const shelters = []
  const csat = []
  const rankings = []

  // Smart Actions — no backend endpoint exists for these executive registers.
  function handleScheduleInspection() {
    pushToast('Executive inspection scheduling is not available on the backend yet (BACKEND GAP).', 'error')
  }

  function handleScheduleMeeting() {
    pushToast('Meeting scheduling is not available on the backend yet (BACKEND GAP).', 'error')
  }

  function handleDispatchTeam() {
    pushToast('Emergency team dispatch is not available on the backend yet (BACKEND GAP).', 'error')
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
      <Modal open={!!selectedComplaintId} onClose={() => setSelectedComplaintId(null)} width="max-w-4xl" scrollBody={false}>
        {selectedComplaintId && <ComplaintDetailHub complaintId={selectedComplaintId} onClose={() => setSelectedComplaintId(null)} />}
      </Modal>
    </div>
  )
}

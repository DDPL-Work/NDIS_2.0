import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { I18nProvider } from './i18n/i18n'
import { useAuthStore } from './app/store/authStore'
import RequireRole from './app/RequireRole'
import AppShell from './components/layout/AppShell'
import LoginPage from './features/auth/LoginPage'

import { CITIZEN_NAV, ADMIN_NAV, LINEDEPT_NAV } from './config/navigation'
import { ROLES } from './config/constants'

import CitizenHome from './features/citizen/CitizenHome'
import FacilityDetail from './features/citizen/FacilityDetail'
import ReportIssue from './features/citizen/ReportIssue'
import TrackGrievance from './features/citizen/TrackGrievance'
import Schemes from './features/citizen/Schemes'
import CitizenReports from './features/citizen/Reports'

import AdminDashboard from './features/admin/AdminDashboard'
import SituationMatrix from './features/admin/SituationMatrix'
import Approvals from './features/admin/Approvals'
import Tasking from './features/admin/Tasking'
import Recommendations from './features/admin/Recommendations'
import GrievanceOversight from './features/admin/GrievanceOversight'
import AdminReports from './features/admin/AdminReports'
import StateRollup from './features/admin/StateRollup'
import Analytics from './features/admin/Analytics'
import SystemHealth from './features/admin/SystemHealth'
import AuditLogs from './features/admin/AuditLogs'

import LineDeptOverview from './features/linedept/LineDeptOverview'
import DataUpload from './features/linedept/DataUpload'
import Directives from './features/linedept/Directives'
import Proposals from './features/linedept/Proposals'
import FieldOps from './features/linedept/FieldOps'
import SchemaConfig from './features/linedept/SchemaConfig'

// Nav items carry an optional `roles` restriction (see config/navigation.js);
// filter here so e.g. "Cross-District KPIs" only shows for State Admin.
function useFilteredNav(items) {
  const role = useAuthStore((s) => s.user?.role)
  return items.filter((item) => !item.roles || item.roles.includes(role))
}

function CitizenShell() {
  const nav = useFilteredNav(CITIZEN_NAV)
  return <AppShell navItems={nav} portalLabel="Citizen Portal" portalIcon="Map" accentClassName="bg-leaf-600" title="Citizen Portal" subtitle="NDISP — public services" showDistrict showDepartment={false} />
}

function AdminShell() {
  const nav = useFilteredNav(ADMIN_NAV)
  return <AppShell navItems={nav} portalLabel="Admin Portal" portalIcon="Gavel" accentClassName="bg-ink-900" title="Admin Portal" subtitle="District administration" showDistrict showDepartment={false} />
}

function LineDeptShell() {
  const nav = useFilteredNav(LINEDEPT_NAV)
  return <AppShell navItems={nav} portalLabel="Line Department" portalIcon="Building2" accentClassName="bg-saffron-500" title="Line Department Portal" subtitle="Sector operations" showDistrict showDepartment />
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route element={<RequireRole roles={[ROLES.CITIZEN]} />}>
            <Route path="/citizen" element={<CitizenShell />}>
              <Route index element={<CitizenHome />} />
              <Route path="facility/:id" element={<FacilityDetail />} />
              <Route path="report/:facilityId?" element={<ReportIssue />} />
              <Route path="grievance/track" element={<TrackGrievance />} />
              <Route path="schemes" element={<Schemes />} />
              <Route path="reports" element={<CitizenReports />} />
            </Route>
          </Route>

          <Route element={<RequireRole roles={[ROLES.DM, ROLES.ADM, ROLES.STATE_ADMIN]} />}>
            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<AdminDashboard />} />
              <Route path="situation-matrix" element={<SituationMatrix />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="tasking" element={<Tasking />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="grievances" element={<GrievanceOversight />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="system-health" element={<SystemHealth />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="state-rollup" element={<StateRollup />} />
            </Route>
          </Route>

          <Route element={<RequireRole roles={[ROLES.DEPT_OFFICER, ROLES.FIELD_ENGINEER]} />}>
            <Route path="/linedept" element={<LineDeptShell />}>
              <Route index element={<LineDeptOverview />} />
              <Route path="data-upload" element={<DataUpload />} />
              <Route path="directives" element={<Directives />} />
              <Route path="proposals" element={<Proposals />} />
              <Route path="field-ops" element={<FieldOps />} />
              <Route path="schema-config" element={<SchemaConfig />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}

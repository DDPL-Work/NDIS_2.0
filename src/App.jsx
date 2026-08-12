import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { I18nProvider } from './i18n/i18n'
import { useAuthStore } from './app/store/authStore'
import RequireRole from './app/RequireRole'
import AppShell from './components/layout/AppShell'
import LoginPage from './features/auth/LoginPage'
import SimulationControlPanel from './components/ui/SimulationControlPanel'
import AuthBootstrap from './app/AuthBootstrap'

import { CITIZEN_NAV, ADMIN_NAV, ENGINEER_NAV } from './config/navigation'
import { ROLES } from './config/constants'

// Citizen Views
import CitizenDashboard from './features/citizen/CitizenDashboard'
import RegisterComplaintWizard from './features/citizen/RegisterComplaintWizard'
import CitizenHome from './features/citizen/CitizenHome'
import FacilityDetail from './features/citizen/FacilityDetail'
import ReportIssue from './features/citizen/ReportIssue'
import TrackGrievance from './features/citizen/TrackGrievance'
import Schemes from './features/citizen/Schemes'
import CitizenReports from './features/citizen/Reports'

// Admin & Collector Views
import DistrictCommandPlatform from './features/admin/platform/DistrictCommandPlatform'
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

// Line Department Views
import DepartmentOfficerQueue from './features/linedept/DepartmentOfficerQueue'
import DataUpload from './features/linedept/DataUpload'

// Field Engineer Views
import EngineerPortal from './features/engineer/EngineerPortal'

// Program 3 — Enterprise Department Framework
import DepartmentWorkspaceProvider from './features/department/framework/DepartmentWorkspaceProvider'
import DepartmentLayout from './features/department/DepartmentLayout'
import DepartmentDashboardWorkspace from './features/department/workspaces/DepartmentDashboardWorkspace'
import DepartmentGisWorkspace from './features/department/workspaces/DepartmentGisWorkspace'
import DepartmentAssetWorkspace from './features/department/workspaces/DepartmentAssetWorkspace'
import DepartmentWorkflowWorkspace from './features/department/workspaces/DepartmentWorkflowWorkspace'
import DepartmentReportWorkspace from './features/department/workspaces/DepartmentReportWorkspace'
import DepartmentProjectDetail from './features/department/workspaces/DepartmentProjectDetail'
import DepartmentSettingsWorkspace from './features/department/workspaces/DepartmentSettingsWorkspace'
import DepartmentResourceWorkspace from './features/department/workspaces/DepartmentResourceWorkspace'
import DepartmentWorkforceWorkspace from './features/department/workspaces/DepartmentWorkforceWorkspace'
import DepartmentPlanningWorkspace from './features/department/workspaces/DepartmentPlanningWorkspace'
import DepartmentExecutionWorkspace from './features/department/workspaces/DepartmentExecutionWorkspace'
import { useCan } from './features/department/identity/hooks/useAuthorization'

// State Administration Panel
import StateAdminLayout from './features/stateadmin/layout/StateAdminLayout'
import StateDashboardWorkspace from './features/stateadmin/workspaces/StateDashboardWorkspace'
import StateMasterWorkspace from './features/stateadmin/workspaces/StateMasterWorkspace'
import StateBudgetWorkspace from './features/stateadmin/workspaces/StateBudgetWorkspace'
import StateFinanceWorkspace from './features/stateadmin/workspaces/StateFinanceWorkspace'
import StateNotificationsWorkspace from './features/stateadmin/workspaces/StateNotificationsWorkspace'
import StateAuditWorkspace from './features/stateadmin/workspaces/StateAuditWorkspace'
import StateProjectsWorkspace from './features/stateadmin/workspaces/StateProjectsWorkspace'
import StateApprovalsWorkspace from './features/stateadmin/workspaces/StateApprovalsWorkspace'
import StateOrdersWorkspace from './features/stateadmin/workspaces/StateOrdersWorkspace'
import StateAuthorityWorkspace from './features/stateadmin/workspaces/StateAuthorityWorkspace'
import StateAnalyticsWorkspace from './features/stateadmin/workspaces/StateAnalyticsWorkspace'
import StateReportsWorkspace from './features/stateadmin/workspaces/StateReportsWorkspace'
import StateGisWorkspace from './features/stateadmin/workspaces/StateGisWorkspace'
import StateUsersWorkspace from './features/stateadmin/workspaces/StateUsersWorkspace'
import { STATE_PORTAL_ROLES } from './config/stateConstants'

function useFilteredNav(items) {
  const role = useAuthStore((s) => s.user?.role)
  return items.filter((item) => !item.roles || item.roles.includes(role))
}

function CitizenShell() {
  const nav = useFilteredNav(CITIZEN_NAV)
  return <AppShell navItems={nav} portalLabel="Citizen Portal" portalIcon="User" accentClassName="bg-leaf-600" title="Citizen Portal" subtitle="NDISP Public Services & Complaint Tracking" showDistrict showDepartment={false} />
}

function AdminShell() {
  const nav = useFilteredNav(ADMIN_NAV)
  return <AppShell navItems={nav} portalLabel="Executive Admin" portalIcon="Gavel" accentClassName="bg-ink-900" title="Executive Command Center" subtitle="District Administration & GIS Oversight" showDistrict showDepartment={false} />
}

function DepartmentPage({ permission, children }) {
  const allowed = useCan(permission)
  if (allowed) return children
  return <div className="m-6 rounded-xl border border-alert-200 bg-alert-50 p-8 text-center"><h1 className="text-lg font-semibold text-ink-950">403 · Access denied</h1><p className="mt-1 text-sm text-ink-600">Your active role does not grant {permission}.</p></div>
}

function EngineerShell() {
  const nav = useFilteredNav(ENGINEER_NAV)
  return <AppShell navItems={nav} portalLabel="Field Inspector" portalIcon="Wrench" accentClassName="bg-sky-600" title="Inspector Mobile Portal" subtitle="Field Operations & Evidence Capture" showDistrict showDepartment />
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <AuthBootstrap>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          {/* Citizen Routes */}
          <Route element={<RequireRole roles={[ROLES.CITIZEN]} />}>
            <Route path="/citizen" element={<CitizenShell />}>
              <Route index element={<CitizenDashboard />} />
              <Route path="map" element={<CitizenHome />} />
              <Route path="register" element={<RegisterComplaintWizard />} />
              <Route path="complaints" element={<CitizenDashboard />} />
              <Route path="facility/:slug" element={<FacilityDetail />} />
              <Route path="report/:facilityId?" element={<ReportIssue />} />
              <Route path="track" element={<TrackGrievance />} />
              <Route path="schemes" element={<Schemes />} />
              <Route path="facilities" element={<CitizenHome />} />
              <Route path="notifications" element={<CitizenDashboard />} />
              <Route path="profile" element={<CitizenDashboard />} />
              <Route path="reports" element={<CitizenReports />} />
            </Route>
          </Route>

          {/* Admin / Collector Routes */}
          <Route element={<RequireRole roles={[ROLES.DISTRICT_COLLECTOR, ROLES.DM, ROLES.ADM, ROLES.STATE_ADMIN, ROLES.SYSTEM_ADMIN]} />}>
            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<DistrictCommandPlatform />} />
              <Route path="collector-dashboard" element={<DistrictCommandPlatform />} />
              <Route path="situation-matrix" element={<SituationMatrix />} />
              <Route path="gis-map" element={<CitizenHome />} />
              <Route path="complaints-oversight" element={<GrievanceOversight />} />
              <Route path="departments-overview" element={<AdminDashboard />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="tasking" element={<Tasking />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="grievances" element={<GrievanceOversight />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="system-health" element={<SystemHealth />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="notifications" element={<DistrictCommandPlatform />} />
              <Route path="state-rollup" element={<StateRollup />} />
            </Route>
          </Route>

          {/* One authenticated department application; the session selects department. */}
          <Route element={<RequireRole roles={[ROLES.DEPT_HEAD, ROLES.DEPT_OFFICER, ROLES.SUPERVISOR, ROLES.ENGINEER, ROLES.FIELD_INSPECTOR]} />}>
            <Route path="/linedept" element={<DepartmentWorkspaceProvider />}>
              <Route element={<DepartmentLayout />}>
                <Route index element={<DepartmentDashboardWorkspace />} />
                <Route path="dashboard" element={<DepartmentDashboardWorkspace />} />
                <Route path="gis-map" element={<CitizenHome />} />
                <Route path="complaints" element={<DepartmentPage permission="complaints.view"><DepartmentOfficerQueue /></DepartmentPage>} />
                <Route path="complaints-queue" element={<Navigate to="/linedept/complaints" replace />} />
                <Route path="gis" element={<DepartmentPage permission="gis.view"><DepartmentGisWorkspace /></DepartmentPage>} />
                <Route path="assets" element={<DepartmentPage permission="assets.view"><DepartmentAssetWorkspace /></DepartmentPage>} />
                <Route path="workflow" element={<DepartmentPage permission="projects.view"><DepartmentWorkflowWorkspace /></DepartmentPage>} />
                <Route path="planning" element={<DepartmentPage permission="projects.view"><DepartmentPlanningWorkspace /></DepartmentPage>} />
                <Route path="planning/new" element={<DepartmentPage permission="projects.create"><DepartmentPlanningWorkspace view="new" /></DepartmentPage>} />
                <Route path="planning/proposals/:id" element={<DepartmentPage permission="projects.view"><DepartmentPlanningWorkspace view="proposal" /></DepartmentPage>} />
                <Route path="planning/drafts" element={<DepartmentPage permission="projects.view"><DepartmentPlanningWorkspace view="drafts" /></DepartmentPage>} />
                <Route path="planning/submitted" element={<DepartmentPage permission="projects.view"><DepartmentPlanningWorkspace view="submitted" /></DepartmentPage>} />
                <Route path="planning/returned" element={<DepartmentPage permission="projects.view"><DepartmentPlanningWorkspace view="returned" /></DepartmentPage>} />
                <Route path="planning/approved" element={<DepartmentPage permission="projects.view"><DepartmentPlanningWorkspace view="approved" /></DepartmentPage>} />
                <Route path="planning/rejected" element={<DepartmentPage permission="projects.view"><DepartmentPlanningWorkspace view="rejected" /></DepartmentPage>} />
                <Route path="planning/dpr" element={<DepartmentPage permission="projects.view"><DepartmentPlanningWorkspace view="dashboard" /></DepartmentPage>} />
                <Route path="planning/funding" element={<DepartmentPage permission="projects.view"><DepartmentPlanningWorkspace view="dashboard" /></DepartmentPage>} />
                <Route path="planning/analytics" element={<DepartmentPage permission="projects.view"><DepartmentPlanningWorkspace view="dashboard" /></DepartmentPage>} />
                <Route path="data-upload" element={<DepartmentPage permission="projects.create"><DataUpload /></DepartmentPage>} />
                <Route path="projects" element={<DepartmentPage permission="projects.view"><DepartmentExecutionWorkspace /></DepartmentPage>} />
                <Route path="projects/:id" element={<DepartmentPage permission="projects.view"><DepartmentProjectDetail /></DepartmentPage>} />
                <Route path="inventory" element={<DepartmentPage permission="inventory.view"><DepartmentResourceWorkspace mode="inventory" /></DepartmentPage>} />
                <Route path="budget" element={<DepartmentPage permission="budget.view"><DepartmentResourceWorkspace mode="budget" /></DepartmentPage>} />
                <Route path="reports" element={<DepartmentPage permission="reports.view"><DepartmentReportWorkspace /></DepartmentPage>} />
                <Route path="employees" element={<DepartmentPage permission="workforce.view"><DepartmentWorkforceWorkspace mode="employees" /></DepartmentPage>} />
                <Route path="organization" element={<DepartmentPage permission="organization.view"><DepartmentWorkforceWorkspace mode="organization" /></DepartmentPage>} />
                <Route path="roles" element={<DepartmentPage permission="workforce.roles"><DepartmentWorkforceWorkspace mode="roles" /></DepartmentPage>} />
                <Route path="permissions" element={<DepartmentPage permission="workforce.roles"><DepartmentWorkforceWorkspace mode="permissions" /></DepartmentPage>} />
                <Route path="attendance" element={<DepartmentPage permission="workforce.attendance"><DepartmentWorkforceWorkspace mode="attendance" /></DepartmentPage>} />
                <Route path="leave" element={<DepartmentPage permission="workforce.leave"><DepartmentWorkforceWorkspace mode="leave" /></DepartmentPage>} />
                <Route path="performance" element={<DepartmentPage permission="workforce.view"><DepartmentWorkforceWorkspace mode="performance" /></DepartmentPage>} />
                <Route path="audit" element={<DepartmentPage permission="workforce.audit"><DepartmentWorkforceWorkspace mode="audit" /></DepartmentPage>} />
                <Route path="settings" element={<DepartmentPage permission="settings.view"><DepartmentSettingsWorkspace /></DepartmentPage>} />
              </Route>
            </Route>
          </Route>

          {/* Field Engineer Routes */}
          <Route element={<RequireRole roles={[ROLES.ENGINEER, ROLES.FIELD_INSPECTOR]} />}>
            <Route path="/engineer" element={<EngineerShell />}>
              <Route index element={<EngineerPortal />} />
              <Route path="today-tasks" element={<EngineerPortal />} />
              <Route path="navigation" element={<EngineerPortal />} />
              <Route path="gis-map" element={<CitizenHome />} />
              <Route path="inspection" element={<EngineerPortal />} />
              <Route path="evidence" element={<EngineerPortal />} />
              <Route path="offline-sync" element={<EngineerPortal />} />
              <Route path="settings" element={<EngineerPortal />} />
            </Route>
          </Route>

          {/* ═══════════════════════════════════════════════════════════
             Program 3 — Enterprise Department Workspace Framework
             Unified /department/:deptId/* route tree.
             Every department (health, water, education, pwd, etc.)
             reuses DepartmentLayout + DepartmentWorkspaceProvider.
             Navigation, dashboards, and permissions are resolved
             dynamically from DepartmentRegistry configuration.
          ═══════════════════════════════════════════════════════════ */}
          {/* State Administration Panel Routes */}
          <Route element={<RequireRole roles={STATE_PORTAL_ROLES} />}>
            <Route path="/state-admin" element={<StateAdminLayout />}>
              <Route index element={<StateDashboardWorkspace />} />
              <Route path="dashboard" element={<Navigate to="/state-admin" replace />} />
              <Route path="budget/state" element={<StateBudgetWorkspace mode="state" />} />
              <Route path="budget/departments" element={<StateBudgetWorkspace mode="departments" />} />
              <Route path="budget/districts" element={<StateBudgetWorkspace mode="districts" />} />
              <Route path="budget/history" element={<StateBudgetWorkspace mode="history" />} />
              <Route path="budget/scheme-mapping" element={<StateBudgetWorkspace mode="scheme-mapping" />} />
              <Route path="finance/sanctions" element={<StateFinanceWorkspace mode="sanctions" />} />
              <Route path="finance/releases" element={<StateFinanceWorkspace mode="releases" />} />
              <Route path="finance/reappropriation" element={<StateFinanceWorkspace mode="reappropriation" />} />
              <Route path="finance/ledger" element={<StateFinanceWorkspace mode="ledger" />} />
              <Route path="master/departments" element={<StateMasterWorkspace mode="departments" />} />
              <Route path="master/department-hierarchy" element={<StateMasterWorkspace mode="hierarchy" />} />
              <Route path="master/department-users" element={<StateMasterWorkspace mode="department-users" />} />
              <Route path="master/department-heads" element={<StateMasterWorkspace mode="department-heads" />} />
              <Route path="master/districts" element={<StateMasterWorkspace mode="districts" />} />
              <Route path="master/district-officers" element={<StateMasterWorkspace mode="district-officers" />} />
              <Route path="master/schemes" element={<StateMasterWorkspace mode="schemes" />} />
              <Route path="master/scheme-categories" element={<StateMasterWorkspace mode="scheme-categories" />} />
              <Route path="master/scheme-guidelines" element={<StateMasterWorkspace mode="scheme-guidelines" />} />
              <Route path="master/financial-years" element={<StateMasterWorkspace mode="financial-years" />} />
              <Route path="master/budget-heads" element={<StateMasterWorkspace mode="budget-heads" />} />
              <Route path="notifications" element={<StateNotificationsWorkspace />} />
              <Route path="audit" element={<StateAuditWorkspace />} />
              <Route path="projects/registry" element={<StateProjectsWorkspace mode="registry" />} />
              <Route path="projects/templates" element={<StateProjectsWorkspace mode="templates" />} />
              <Route path="projects/monitoring" element={<StateProjectsWorkspace mode="monitoring" />} />
              <Route path="projects/categories" element={<StateProjectsWorkspace mode="categories" />} />
              <Route path="approvals/pending" element={<StateApprovalsWorkspace mode="pending" />} />
              <Route path="approvals/escalated" element={<StateApprovalsWorkspace mode="escalated" />} />
              <Route path="approvals/history" element={<StateApprovalsWorkspace mode="history" />} />
              <Route path="orders/circulars" element={<StateOrdersWorkspace mode="circulars" />} />
              <Route path="orders/notifications" element={<StateOrdersWorkspace mode="notifications" />} />
              <Route path="orders/financial" element={<StateOrdersWorkspace mode="financial" />} />
              <Route path="orders/administrative" element={<StateOrdersWorkspace mode="administrative" />} />
              <Route path="orders/all" element={<StateOrdersWorkspace mode="all" />} />
              <Route path="orders/documents" element={<StateOrdersWorkspace mode="documents" />} />
              <Route path="gis/layers" element={<StateGisWorkspace mode="layers" />} />
              <Route path="gis/assets" element={<StateGisWorkspace mode="assets" />} />
              <Route path="gis/district-assets" element={<StateGisWorkspace mode="district-assets" />} />
              <Route path="gis/department-assets" element={<StateGisWorkspace mode="department-assets" />} />
              <Route path="analytics" element={<StateAnalyticsWorkspace />} />
              <Route path="reports" element={<StateReportsWorkspace />} />
              <Route path="users" element={<StateUsersWorkspace />} />
              <Route path="authority" element={<StateAuthorityWorkspace />} />
            </Route>
          </Route>

          <Route path="/department" element={<Navigate to="/linedept" replace />} />
          <Route path="/department/:departmentId/*" element={<Navigate to="/linedept" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Reactive Simulation Engine Control Panel Overlay */}
        {/* <SimulationControlPanel /> */}
        </AuthBootstrap>
      </BrowserRouter>
    </I18nProvider>
  )
}

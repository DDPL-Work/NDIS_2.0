import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { I18nProvider } from './i18n/i18n'
import { useAuthStore } from './app/store/authStore'
import RequireRole from './app/RequireRole'
import AppShell from './components/layout/AppShell'
import LoginPage from './features/auth/LoginPage'
import AuthBootstrap from './app/AuthBootstrap'
import { PortalProvider } from './context/PortalContext'

const PublicLandingPage = lazy(() => import('./features/landing/PublicLandingPage'))
const PublicExplorePage = lazy(() => import('./features/publicExplore/PublicExplorePage'))

import { CITIZEN_NAV, ADMIN_NAV, ENGINEER_NAV } from './config/navigation'
import { ROLES } from './config/constants'
import CitizenTourHost from './components/tour/CitizenTourHost'

// Citizen Views
import CitizenDashboard from './features/citizen/CitizenDashboard'
import RegisterComplaintWizard from './features/citizen/RegisterComplaintWizard'
import CitizenHome from './features/citizen/CitizenHome'
import FacilityDetail from './features/citizen/FacilityDetail'
import ReportIssue from './features/citizen/ReportIssue'
import TrackGrievance from './features/citizen/TrackGrievance'
import Schemes from './features/citizen/Schemes'
import CitizenReports from './features/citizen/Reports'
import CitizenNotifications from './features/citizen/CitizenNotifications'
import CitizenProfile from './features/citizen/CitizenProfile'
import CitizenMobileNav from './features/citizen/CitizenMobileNav'
import './features/citizen/citizen.css'

// Feedback Views
const CitizenFeedbackPage = lazy(() => import('./features/citizen/CitizenFeedbackPage'))

// Admin & Collector Views — lazy-loaded for code splitting
const DistrictCommandPlatform = lazy(() => import('./features/admin/platform/DistrictCommandPlatform'))
const DecisionDashboard = lazy(() => import('./features/admin/decisionDashboard/DecisionDashboard'))
const SpatialAnalysis = lazy(() => import('./features/spatialanalysis/SpatialAnalysis'))
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'))
const SituationMatrix = lazy(() => import('./features/admin/SituationMatrix'))
const Approvals = lazy(() => import('./features/admin/Approvals'))
const Tasking = lazy(() => import('./features/admin/Tasking'))
const DmSchedulePage = lazy(() => import('./features/admin/dmSchedule/DmSchedulePage'))
const Recommendations = lazy(() => import('./features/admin/Recommendations'))
const GrievanceOversight = lazy(() => import('./features/admin/GrievanceOversight'))
const AdminReports = lazy(() => import('./features/admin/AdminReports'))
const StateRollup = lazy(() => import('./features/admin/StateRollup'))
const Analytics = lazy(() => import('./features/admin/Analytics'))
const SystemHealth = lazy(() => import('./features/admin/SystemHealth'))
const AuditLogs = lazy(() => import('./features/admin/AuditLogs'))
const AdminDepartmentSupport = lazy(() => import('./features/departmentsupport/DepartmentSupportPages').then(m => ({ default: m.AdminDepartmentSupport })))
const LinedeptDepartmentSupport = lazy(() => import('./features/departmentsupport/DepartmentSupportPages').then(m => ({ default: m.LinedeptDepartmentSupport })))

// Gap & Priority Dashboard
const GapPriorityDashboard = lazy(() => import('./features/admin/gapPriority/GapPriorityDashboard'))

// Feedback Admin
const FeedbackAnalyticsDashboard = lazy(() => import('./features/admin/feedback/FeedbackAnalyticsDashboard'))
const FeedbackMap = lazy(() => import('./features/admin/feedback/FeedbackMap'))

// Revenue & Property Intelligence — lazy-loaded
const RevenueDashboardPage = lazy(() => import('./features/revenue/pages/RevenueDashboardPage'))
const PropertyRegistryPage = lazy(() => import('./features/revenue/pages/PropertyRegistryPage'))
const AssessmentPage = lazy(() => import('./features/revenue/pages/AssessmentPage'))
const DemandPage = lazy(() => import('./features/revenue/pages/DemandPage'))
const ArrearsPage = lazy(() => import('./features/revenue/pages/ArrearsPage'))
const RevenueReportsPage = lazy(() => import('./features/revenue/pages/RevenueReportsPage'))

// Line Department Views — lazy-loaded
const DepartmentOfficerQueue = lazy(() => import('./features/linedept/DepartmentOfficerQueue'))
const DataUpload = lazy(() => import('./features/linedept/DataUpload'))

// Field Engineer Views — lazy-loaded
const EngineerPortal = lazy(() => import('./features/engineer/EngineerPortal'))

// Program 3 — Enterprise Department Framework — lazy-loaded
import DepartmentWorkspaceProvider from './features/department/framework/DepartmentWorkspaceProvider'
import DepartmentLayout from './features/department/DepartmentLayout'
import { useCan } from './features/department/identity/hooks/useAuthorization'
const DepartmentDashboardWorkspace = lazy(() => import('./features/department/workspaces/DepartmentDashboardWorkspace'))
const DepartmentGisWorkspace = lazy(() => import('./features/department/workspaces/DepartmentGisWorkspace'))
const DepartmentAssetWorkspace = lazy(() => import('./features/department/workspaces/DepartmentAssetWorkspace'))
const DepartmentWorkflowWorkspace = lazy(() => import('./features/department/workspaces/DepartmentWorkflowWorkspace'))
const DepartmentReportWorkspace = lazy(() => import('./features/department/workspaces/DepartmentReportWorkspace'))
const DepartmentProjectDetail = lazy(() => import('./features/department/workspaces/DepartmentProjectDetail'))
const DepartmentSettingsWorkspace = lazy(() => import('./features/department/workspaces/DepartmentSettingsWorkspace'))
const DepartmentResourceWorkspace = lazy(() => import('./features/department/workspaces/DepartmentResourceWorkspace'))
const DepartmentWorkforceWorkspace = lazy(() => import('./features/department/workspaces/DepartmentWorkforceWorkspace'))
const DepartmentPlanningWorkspace = lazy(() => import('./features/department/workspaces/DepartmentPlanningWorkspace'))
const DepartmentExecutionWorkspace = lazy(() => import('./features/department/workspaces/DepartmentExecutionWorkspace'))

// State Administration Panel — lazy-loaded
import StateAdminLayout from './features/stateadmin/layout/StateAdminLayout'
import { STATE_PORTAL_ROLES } from './config/stateConstants'
const StateDashboardWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateDashboardWorkspace'))
const StateMasterWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateMasterWorkspace'))
const StateBudgetWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateBudgetWorkspace'))
const StateFinanceWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateFinanceWorkspace'))
const StateNotificationsWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateNotificationsWorkspace'))
const StateAuditWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateAuditWorkspace'))
const StateProjectsWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateProjectsWorkspace'))
const StateApprovalsWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateApprovalsWorkspace'))
const StateOrdersWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateOrdersWorkspace'))
const StateAuthorityWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateAuthorityWorkspace'))
const StateAnalyticsWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateAnalyticsWorkspace'))
const StateReportsWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateReportsWorkspace'))
const StateGisWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateGisWorkspace'))
const StateUsersWorkspace = lazy(() => import('./features/stateadmin/workspaces/StateUsersWorkspace'))

function useFilteredNav(items) {
  const role = useAuthStore((s) => s.user?.role)
  return items.filter((item) => !item.roles || item.roles.includes(role))
}

function CitizenShell() {
  const nav = useFilteredNav(CITIZEN_NAV)
  return (
    <>
      <AppShell
        navItems={nav}
        portalLabel="Citizen Portal"
        portalIcon="User"
        accentClassName="bg-leaf-600"
        title="Citizen Portal"
        subtitle="NDISP Public Services & Complaint Tracking"
        showDistrict
        showDepartment={false}
        bottomNav={({ onOpenNav }) => <CitizenMobileNav onOpenNav={onOpenNav} />}
      />
      <CitizenTourHost />
    </>
  )
}

function AdminShell() {
  const nav = useFilteredNav(ADMIN_NAV)
  return <AppShell navItems={nav} portalLabel="Executive Admin" portalIcon="Gavel" accentClassName="bg-ink-900" title="Executive Command Center" subtitle="Location-based district decisions" showDistrict showDepartment={false} />
}

function DepartmentPage({ permission, children }) {
  const allowed = useCan(permission)
  // DEV: Trace route guard decision
  if (import.meta.env.DEV) {
    console.log('[ROUTE GUARD]', { permission, allowed })
  }
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
        <PortalProvider>
        <Routes>
          {/* Public landing page — no authentication required. */}
          <Route path="/" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><PublicLandingPage /></Suspense>} />
          {/* Public Explore Map — no authentication required. */}
          <Route path="/explore" element={<Suspense fallback={<div className="min-h-screen bg-ink-50 flex items-center justify-center"><p className="text-[14px] text-ink-500">Loading public map...</p></div>}><PublicExplorePage /></Suspense>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage initialMode="signup" />} />

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
              <Route path="notifications" element={<CitizenNotifications />} />
              <Route path="profile" element={<CitizenProfile />} />
              <Route path="reports" element={<CitizenReports />} />
              <Route path="feedback" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><CitizenFeedbackPage /></Suspense>} />
            </Route>
          </Route>

          {/* Admin / Collector Routes */}
          <Route element={<RequireRole roles={[ROLES.DISTRICT_COLLECTOR, ROLES.DM, ROLES.ADM, ROLES.STATE_ADMIN, ROLES.SYSTEM_ADMIN]} />}>
            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DecisionDashboard /></Suspense>} />
              <Route path="collector-dashboard" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DecisionDashboard /></Suspense>} />
              <Route path="spatial-analysis" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><SpatialAnalysis /></Suspense>} />
              <Route path="gap-priority" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><GapPriorityDashboard /></Suspense>} />
              <Route path="revenue" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><RevenueDashboardPage /></Suspense>} />
              <Route path="revenue/dashboard" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><RevenueDashboardPage /></Suspense>} />
              <Route path="revenue/properties" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><PropertyRegistryPage /></Suspense>} />
              <Route path="revenue/assessments" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><AssessmentPage /></Suspense>} />
              <Route path="revenue/demands" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DemandPage /></Suspense>} />
              <Route path="revenue/arrears" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><ArrearsPage /></Suspense>} />
              <Route path="revenue/reports" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><RevenueReportsPage /></Suspense>} />
              <Route path="feedback-analytics" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><FeedbackAnalyticsDashboard /></Suspense>} />
              <Route path="feedback-map" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><FeedbackMap /></Suspense>} />
              <Route path="department/:departmentId" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><AdminDepartmentSupport /></Suspense>} />
              <Route path="department" element={<Navigate to="/admin/department/general" replace />} />
              <Route path="command-platform" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DistrictCommandPlatform /></Suspense>} />
              <Route path="situation-matrix" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><SituationMatrix /></Suspense>} />
              <Route path="gis-map" element={<CitizenHome />} />
              <Route path="complaints-oversight" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><GrievanceOversight /></Suspense>} />
              <Route path="departments-overview" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><AdminDashboard /></Suspense>} />
              <Route path="approvals" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><Approvals /></Suspense>} />
              <Route path="tasking" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><Tasking /></Suspense>} />
              <Route path="schedule-tasks" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DmSchedulePage /></Suspense>} />
              <Route path="recommendations" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><Recommendations /></Suspense>} />
              <Route path="grievances" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><GrievanceOversight /></Suspense>} />
              <Route path="analytics" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><Analytics /></Suspense>} />
              <Route path="system-health" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><SystemHealth /></Suspense>} />
              <Route path="audit-logs" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><AuditLogs /></Suspense>} />
              <Route path="reports" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><AdminReports /></Suspense>} />
              <Route path="notifications" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DistrictCommandPlatform /></Suspense>} />
              <Route path="state-rollup" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateRollup /></Suspense>} />
            </Route>
          </Route>

          {/* One authenticated department application; the session selects department. */}
          <Route element={<RequireRole roles={[ROLES.DEPT_HEAD, ROLES.DEPT_OFFICER, ROLES.SUPERVISOR, ROLES.ENGINEER, ROLES.FIELD_INSPECTOR]} />}>
            <Route path="/linedept" element={<DepartmentWorkspaceProvider />}>
              <Route element={<DepartmentLayout />}>
                <Route index element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentDashboardWorkspace /></Suspense>} />
                <Route path="dashboard" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentDashboardWorkspace /></Suspense>} />
                <Route path="gis-map" element={<CitizenHome />} />
                <Route path="complaints" element={<DepartmentPage permission="complaints.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentOfficerQueue /></Suspense></DepartmentPage>} />
                <Route path="complaints-queue" element={<Navigate to="/linedept/complaints" replace />} />
                <Route path="gis" element={<DepartmentPage permission="gis.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentGisWorkspace /></Suspense></DepartmentPage>} />
                <Route path="assets" element={<DepartmentPage permission="assets.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentAssetWorkspace /></Suspense></DepartmentPage>} />
                <Route path="workflow" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentWorkflowWorkspace /></Suspense></DepartmentPage>} />
                <Route path="planning" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace /></Suspense></DepartmentPage>} />
                <Route path="planning/new" element={<DepartmentPage permission="projects.create"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="new" /></Suspense></DepartmentPage>} />
                <Route path="planning/proposals/:id" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="proposal" /></Suspense></DepartmentPage>} />
                <Route path="planning/drafts" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="drafts" /></Suspense></DepartmentPage>} />
                <Route path="planning/submitted" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="submitted" /></Suspense></DepartmentPage>} />
                <Route path="planning/returned" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="returned" /></Suspense></DepartmentPage>} />
                <Route path="planning/approved" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="approved" /></Suspense></DepartmentPage>} />
                <Route path="planning/rejected" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="rejected" /></Suspense></DepartmentPage>} />
                <Route path="planning/sanctioned" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="sanctioned" /></Suspense></DepartmentPage>} />
                <Route path="planning/dpr" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="dashboard" /></Suspense></DepartmentPage>} />
                <Route path="planning/funding" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="dashboard" /></Suspense></DepartmentPage>} />
                <Route path="planning/analytics" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentPlanningWorkspace view="dashboard" /></Suspense></DepartmentPage>} />
                <Route path="data-upload" element={<DepartmentPage permission="projects.create"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DataUpload /></Suspense></DepartmentPage>} />
                <Route path="decision-support" element={<DepartmentPage permission="assets.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><LinedeptDepartmentSupport /></Suspense></DepartmentPage>} />
                <Route path="projects" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentExecutionWorkspace /></Suspense></DepartmentPage>} />
                <Route path="projects/:id" element={<DepartmentPage permission="projects.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentProjectDetail /></Suspense></DepartmentPage>} />
                <Route path="inventory" element={<DepartmentPage permission="inventory.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentResourceWorkspace mode="inventory" /></Suspense></DepartmentPage>} />
                <Route path="budget" element={<DepartmentPage permission="budget.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentResourceWorkspace mode="budget" /></Suspense></DepartmentPage>} />
                <Route path="reports" element={<DepartmentPage permission="reports.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentReportWorkspace /></Suspense></DepartmentPage>} />
                <Route path="employees" element={<DepartmentPage permission="workforce.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentWorkforceWorkspace mode="employees" /></Suspense></DepartmentPage>} />
                <Route path="organization" element={<DepartmentPage permission="organization.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentWorkforceWorkspace mode="organization" /></Suspense></DepartmentPage>} />
                <Route path="roles" element={<DepartmentPage permission="workforce.roles"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentWorkforceWorkspace mode="roles" /></Suspense></DepartmentPage>} />
                <Route path="permissions" element={<DepartmentPage permission="workforce.roles"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentWorkforceWorkspace mode="permissions" /></Suspense></DepartmentPage>} />
                <Route path="attendance" element={<DepartmentPage permission="workforce.attendance"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentWorkforceWorkspace mode="attendance" /></Suspense></DepartmentPage>} />
                <Route path="leave" element={<DepartmentPage permission="workforce.leave"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentWorkforceWorkspace mode="leave" /></Suspense></DepartmentPage>} />
                <Route path="performance" element={<DepartmentPage permission="workforce.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentWorkforceWorkspace mode="performance" /></Suspense></DepartmentPage>} />
                <Route path="audit" element={<DepartmentPage permission="workforce.audit"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentWorkforceWorkspace mode="audit" /></Suspense></DepartmentPage>} />
                <Route path="settings" element={<DepartmentPage permission="settings.view"><Suspense fallback={<div className="min-h-screen bg-ink-50" />}><DepartmentSettingsWorkspace /></Suspense></DepartmentPage>} />
              </Route>
            </Route>
          </Route>

          {/* Field Engineer Routes */}
          <Route element={<RequireRole roles={[ROLES.ENGINEER, ROLES.FIELD_INSPECTOR]} />}>
            <Route path="/engineer" element={<EngineerShell />}>
              <Route index element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><EngineerPortal /></Suspense>} />
              <Route path="today-tasks" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><EngineerPortal /></Suspense>} />
              <Route path="navigation" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><EngineerPortal /></Suspense>} />
              <Route path="gis-map" element={<CitizenHome />} />
              <Route path="inspection" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><EngineerPortal /></Suspense>} />
              <Route path="evidence" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><EngineerPortal /></Suspense>} />
              <Route path="offline-sync" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><EngineerPortal /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><EngineerPortal /></Suspense>} />
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
              <Route index element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateDashboardWorkspace /></Suspense>} />
              <Route path="dashboard" element={<Navigate to="/state-admin" replace />} />
              <Route path="budget/state" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateBudgetWorkspace mode="state" /></Suspense>} />
              <Route path="budget/departments" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateBudgetWorkspace mode="departments" /></Suspense>} />
              <Route path="budget/districts" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateBudgetWorkspace mode="districts" /></Suspense>} />
              <Route path="budget/history" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateBudgetWorkspace mode="history" /></Suspense>} />
              <Route path="budget/scheme-mapping" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateBudgetWorkspace mode="scheme-mapping" /></Suspense>} />
              <Route path="finance/sanctions" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateFinanceWorkspace mode="sanctions" /></Suspense>} />
              <Route path="finance/releases" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateFinanceWorkspace mode="releases" /></Suspense>} />
              <Route path="finance/reappropriation" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateFinanceWorkspace mode="reappropriation" /></Suspense>} />
              <Route path="finance/ledger" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateFinanceWorkspace mode="ledger" /></Suspense>} />
              <Route path="master/departments" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="departments" /></Suspense>} />
              <Route path="master/department-hierarchy" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="hierarchy" /></Suspense>} />
              <Route path="master/department-users" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="department-users" /></Suspense>} />
              <Route path="master/department-heads" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="department-heads" /></Suspense>} />
              <Route path="master/districts" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="districts" /></Suspense>} />
              <Route path="master/district-officers" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="district-officers" /></Suspense>} />
              <Route path="master/schemes" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="schemes" /></Suspense>} />
              <Route path="master/scheme-categories" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="scheme-categories" /></Suspense>} />
              <Route path="master/scheme-guidelines" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="scheme-guidelines" /></Suspense>} />
              <Route path="master/financial-years" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="financial-years" /></Suspense>} />
              <Route path="master/budget-heads" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateMasterWorkspace mode="budget-heads" /></Suspense>} />
              <Route path="notifications" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateNotificationsWorkspace /></Suspense>} />
              <Route path="audit" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateAuditWorkspace /></Suspense>} />
              <Route path="projects/registry" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateProjectsWorkspace mode="registry" /></Suspense>} />
              <Route path="projects/templates" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateProjectsWorkspace mode="templates" /></Suspense>} />
              <Route path="projects/monitoring" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateProjectsWorkspace mode="monitoring" /></Suspense>} />
              <Route path="projects/categories" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateProjectsWorkspace mode="categories" /></Suspense>} />
              <Route path="approvals/pending" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateApprovalsWorkspace mode="pending" /></Suspense>} />
              <Route path="approvals/escalated" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateApprovalsWorkspace mode="escalated" /></Suspense>} />
              <Route path="approvals/history" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateApprovalsWorkspace mode="history" /></Suspense>} />
              <Route path="orders/circulars" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateOrdersWorkspace mode="circulars" /></Suspense>} />
              <Route path="orders/notifications" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateOrdersWorkspace mode="notifications" /></Suspense>} />
              <Route path="orders/financial" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateOrdersWorkspace mode="financial" /></Suspense>} />
              <Route path="orders/administrative" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateOrdersWorkspace mode="administrative" /></Suspense>} />
              <Route path="orders/all" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateOrdersWorkspace mode="all" /></Suspense>} />
              <Route path="orders/documents" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateOrdersWorkspace mode="documents" /></Suspense>} />
              <Route path="gis/layers" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateGisWorkspace mode="layers" /></Suspense>} />
              <Route path="gis/assets" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateGisWorkspace mode="assets" /></Suspense>} />
              <Route path="gis/district-assets" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateGisWorkspace mode="district-assets" /></Suspense>} />
              <Route path="gis/department-assets" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateGisWorkspace mode="department-assets" /></Suspense>} />
              <Route path="analytics" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateAnalyticsWorkspace /></Suspense>} />
              <Route path="reports" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateReportsWorkspace /></Suspense>} />
              <Route path="users" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateUsersWorkspace /></Suspense>} />
              <Route path="authority" element={<Suspense fallback={<div className="min-h-screen bg-ink-50" />}><StateAuthorityWorkspace /></Suspense>} />
            </Route>
          </Route>

          <Route path="/department" element={<Navigate to="/linedept" replace />} />
          <Route path="/department/:departmentId/*" element={<Navigate to="/linedept" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Reactive Simulation Engine Control Panel Overlay */}
        {/* <SimulationControlPanel /> */}
        </PortalProvider>
        </AuthBootstrap>
      </BrowserRouter>
    </I18nProvider>
  )
}

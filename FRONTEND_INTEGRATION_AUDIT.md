# FRONTEND INTEGRATION AUDIT

**Project:** NDIS / Nalanda District Geospatial Decision Support System Frontend  
**Date:** 2026-08-26  
**Phase:** 0 — Current System Audit  
**Backend Contract:** `backend_guide_next2.1.md` (authoritative)

---

## Executive Summary

The frontend is a **production-grade multi-portal application** (Citizen, Admin/Collector, Line Department, Engineer, State Admin) with a real backend at `https://nalanda.drdesigntech.com/api`. The codebase already has:

- ✅ **Single canonical HTTP client** (`src/services/httpClient.js`) with JWT refresh, 401 handling, timeout, FormData support
- ✅ **Well-structured API layer** (`src/api/*`) with mappers normalizing backend DTOs
- ✅ **Role-based routing** with 16 backend roles mapped to 5 portals
- ✅ **Shared facility cache** (~8.3k facilities, 43 MB) with request deduplication
- ✅ **Complaint lifecycle** fully backend-driven (state machine)
- ✅ **DPR/Planning wizard** persisting each step to backend
- ✅ **Project execution ERP** (site diaries, e-MB, bills, risks)
- ✅ **RBAC** derived from backend `/auth/me/` response

**However**, gaps remain between current implementation and the authoritative backend contract:

| Area | Status | Key Issues |
|------|--------|------------|
| Authentication | 🟡 Partial | Missing signup, forgot-password, change-password, logout UI flows; demo personas used in production code paths |
| Dashboards | 🟡 Partial | Some dashboards use `backendDashboardApi` but citizen dashboard computes stats locally from complaints list; department indicators not connected |
| Complaints | 🟢 Good | Complete workflow implemented; some state mapping differences with backend TextChoices |
| GIS/Spatial | 🟡 Partial | Map uses backend catalog/layers; spatial query uses `GET /api/spatial-query/` but `POST /api/spatial-analysis/query/` capability probing exists; heatmap/nearby endpoints connected |
| Facilities | 🟢 Good | Full CRUD + GeoJSON + SCD-2 history; shared cache |
| Indicators | ❌ Missing | Education/Health/Water/PWD/Urban indicator endpoints exist in backend guide but not connected in frontend |
| Feedback Analytics | 🟡 Partial | Uses different endpoint structure than backend guide (`/feedback/analytics/overview` vs `/feedback/analytics/`) |
| Planning/DPR | 🟢 Good | 7-step wizard implemented with backend persistence |
| Projects/Execution | 🟢 Good | Full ERP connected |
| Reports | 🟡 Partial | Report generation/download connected; "publication catalog" was fake (now fixed) |
| Employees | 🟢 Good | Directory + invitation + acceptance connected |
| State Budget | 🟡 Partial | Connected but 403 handling needs verification for unauthorized roles |
| Notifications | 🟡 Partial | List connected; read-state is device-local only |
| User Directory | 🟡 Partial | Connected; department-wise users endpoint exists |

---

## Detailed Route-by-Route Audit

### Citizen Portal (`/citizen/*`)

| Route | Page Component | Current Data Source | Backend Endpoint | Status | Required Work | Priority |
|-------|----------------|---------------------|------------------|--------|---------------|----------|
| `/citizen` | CitizenDashboard | `analyticsApi.getCitizenDashboard()` → `backendDashboardApi.citizen()` | `GET /api/dashboards/citizen/` | 🟡 Partial | Dashboard computes stats locally from complaints list instead of using backend KPIs; verify backend returns proper KPI envelope | High |
| `/citizen/map` | CitizenHome | `cachedFacilities()` + `backendGisApi.catalog()` | `GET /api/facilities/`, `GET /api/gis/catalog/` | 🟢 Connected | Error state fixed in Phase 0 | — |
| `/citizen/register` | RegisterComplaintWizard | `backendMasterApi.complaintCategories()`, `districts()`, `subdivisions()`, `blocks()`, `villageWards()` | `GET /api/complaint-categories/`, `/districts/`, `/subdivisions/`, `/blocks/`, `/village-wards/` | 🟡 Partial | Falls back to hardcoded options on 404; hierarchy endpoints optional on backend | Medium |
| `/citizen/report/:facilityId?` | ReportIssue | Map point selection → local state | `POST /api/complaints/` | 🟡 Partial | **Fake EXIF verification** (hardcoded `geotagged:true`, `distMeters:0`); needs real EXIF parsing from `EngineerPortal` | Critical |
| `/citizen/track` | TrackGrievance | `ComplaintRepository.list({tracking_code})` | `GET /api/complaints/?tracking_code=` | 🟢 Connected | — | — |
| `/citizen/facility/:slug` | FacilityDetail | `backendGisApi.facility(slug)` | `GET /api/facilities/{id}/` | 🟢 Connected | Slug fallback for detail | — |
| `/citizen/feedback` | CitizenFeedbackPage | `backendFeedbackApi.getQuestionSets()`, `createSubmission()` | `GET /api/feedback/question-sets/`, `POST /api/feedback/submissions/` | 🟡 Partial | Endpoint structure differs from backend guide (`/api/feedback/analytics/` for analytics) | Medium |
| `/citizen/complaints` | CitizenDashboard | Same as `/citizen` | Same | 🟢 Connected | — | — |
| `/citizen/notifications` | CitizenNotifications | `backendNotificationApi.list()` | `GET /api/notifications/` | 🟡 Partial | Read-state is device-local (no backend endpoint) | Low |
| `/citizen/profile` | CitizenProfile | `useAuthStore` user | `GET /api/auth/me/` | 🟢 Connected | Read-only (no edit endpoint) | — |
| `/citizen/schemes` | Schemes | **Hardcoded "coming soon"** | — | ❌ Missing | Backend has `/api/schemes/` endpoint | Medium |
| `/citizen/reports` | CitizenReports | **Fake setTimeout toast** | `GET /api/reports/` | ❌ Fake | Report catalog endpoint exists but UI shows fake publication toast | Medium |

### Admin / Collector Portal (`/admin/*`)

| Route | Page Component | Current Data Source | Backend Endpoint | Status | Required Work | Priority |
|-------|----------------|---------------------|------------------|--------|---------------|----------|
| `/admin` | DecisionDashboard | `useDecisionDashboard()` → 6 parallel fetches | `/dashboards/dm/`, `/proposals/`, `/projects/summary/`, `/district-allocations/`, `/facilities/`, `/complaints/heatmap/` | 🟢 Connected | Health telemetry endpoints not deployed (honest empty states shown) | — |
| `/admin/collector-dashboard` | DecisionDashboard | Same as `/admin` | Same | 🟢 Connected | — | — |
| `/admin/spatial-analysis` | SpatialAnalysis | `backendSpatialQueryApi.search()`, `spatialAnalysisApi.executeSpatialAnalysis()` | `GET /api/spatial-query/`, `POST /api/spatial-analysis/query/` | 🟡 Partial | Capability probing for POST endpoint; client-engine fallback | Medium |
| `/admin/gap-priority` | GapPriorityDashboard | `backendGapApi` (district/block/village/facility/rankings) | `/api/gap/district/`, `/gap/block/`, `/gap/village/`, `/gap/facility/`, `/gap/rankings/` | 🟢 Connected | All scoring backend-authoritative | — |
| `/admin/feedback-analytics` | FeedbackAnalyticsDashboard | `backendFeedbackApi` (overview, questions, locations, trends) | `/feedback/analytics/overview`, `/by-question`, `/by-location`, `/trends` | 🟡 Partial | Endpoint paths differ from backend guide (`/api/feedback/analytics/`); verify contract | Medium |
| `/admin/feedback-map` | FeedbackMap | `backendFeedbackApi.getMapData()` | `/feedback/map/` | 🟡 Partial | Verify backend endpoint | Medium |
| `/admin/command-platform` | DistrictCommandPlatform | Legacy cockpit (preserved) | Multiple | 🟡 Legacy | Not in nav; kept for reference | Low |
| `/admin/department/:departmentId` | AdminDepartmentSupport | `departmentSupportApi.loadDepartmentData()` | `/gis/catalog/`, `/facilities/`, `/gis/layers/{name}/` | 🟡 Partial | Telemetry probes for per-dept endpoints; honest empty states | Medium |
| `/admin/situation-matrix` | SituationMatrix | `backendDashboardApi.district()` + facilities | `/dashboards/district/`, `/facilities/` | 🟡 Partial | Verify data freshness | Low |
| `/admin/approvals` | Approvals | `backendProposalApi` (list, approve, reject, sanction, negotiate) | `/api/proposals/`, `/{id}/approve/`, `/reject/`, `/sanction/`, `/negotiation/` | 🟢 Connected | — | — |
| `/admin/tasking` | Tasking | `backendProjectApi` (assign-work, assign-officer, assign-engineer) | `/projects/{id}/assign-work/`, `/assign-officer/`, `/assign-engineer/` | 🟢 Connected | — | — |
| `/admin/recommendations` | Recommendations | **Hardcoded** | — | ❌ Missing | Backend has no AI recommendations endpoint (`unsupported()` in api.js) | Medium |
| `/admin/grievance-oversight` | GrievanceOversight | `backendComplaintApi.list()` + dashboard | `/complaints/`, `/dashboards/district/` | 🟢 Connected | — | — |
| `/admin/departments-overview` | AdminDashboard | **Legacy** | — | 🟡 Legacy | Replaced by DecisionDashboard | Low |
| `/admin/analytics` | Analytics | **Placeholder** | `unsupported('AI recommendations')` | ❌ Missing | Backend endpoint not deployed | Medium |
| `/admin/system-health` | SystemHealth | **Placeholder** | — | ❌ Missing | No backend endpoint | Low |
| `/admin/audit-logs` | AuditLogs | **Demo data** (identity store) | — | ❌ Fake | No backend audit log endpoint | Medium |
| `/admin/reports` | AdminReports | `backendReportApi.list()`, `generate()`, `download()` | `/reports/`, `/reports/generate/`, `/{id}/download/` | 🟢 Connected | — | — |
| `/admin/notifications` | DistrictCommandPlatform | Redirects to command platform | `/notifications/` | 🟡 Partial | Notification list exists but routed incorrectly | Low |
| `/admin/state-rollup` | StateRollup | `backendDashboardApi.state()` | `/dashboards/state/` | 🟢 Connected | — | — |

### Line Department Portal (`/linedept/*`)

| Route | Page Component | Current Data Source | Backend Endpoint | Status | Required Work | Priority |
|-------|----------------|---------------------|------------------|--------|---------------|----------|
| `/linedept` | DepartmentDashboardWorkspace | `backendDashboardApi.department()` | `/dashboards/department/` | 🟡 Partial | Verify KPI mapping; department scope | High |
| `/linedept/dashboard` | DepartmentDashboardWorkspace | Same | Same | 🟢 Connected | — | — |
| `/linedept/complaints` | DepartmentOfficerQueue | `backendComplaintApi.list()` with filters | `/complaints/` | 🟢 Connected | Status filter maps to backend TextChoices | — |
| `/linedept/gis` | DepartmentGisWorkspace | `cachedFacilities()`, `backendGisApi.catalog()` | `/facilities/`, `/gis/catalog/` | 🟢 Connected | — | — |
| `/linedept/assets` | DepartmentAssetWorkspace | `cachedFacilities()` + CRUD | `/facilities/` | 🟢 Connected | — | — |
| `/linedept/workflow` | DepartmentWorkflowWorkspace | `backendProjectApi.list()` | `/projects/` | 🟢 Connected | — | — |
| `/linedept/planning` | DepartmentPlanningWorkspace | `backendPlanningApi.dashboard()`, `backendProposalApi.list()` | `/planning/dashboard/`, `/proposals/` | 🟢 Connected | 7-step wizard fully backend-persisted | — |
| `/linedept/planning/new` | DepartmentPlanningWorkspace (view=new) | `backendProposalApi.create()` | `POST /api/proposals/` | 🟢 Connected | — | — |
| `/linedept/planning/proposals/:id` | DepartmentPlanningWorkspace (view=proposal) | `backendProposalApi.get()` + step endpoints | `/proposals/{id}/`, `/step2-6/`, `/submit/` | 🟢 Connected | All steps persist to backend | — |
| `/linedept/data-upload` | DataUpload | **File upload UI** | — | 🟡 Partial | Verify backend ingestion endpoint | Medium |
| `/linedept/decision-support` | LinedeptDepartmentSupport | `departmentSupportApi.loadDepartmentData()` | `/gis/catalog/`, `/facilities/`, `/gis/layers/` | 🟡 Partial | Telemetry probes for per-dept endpoints | Medium |
| `/linedept/projects` | DepartmentExecutionWorkspace | `backendProjectApi.list()`, `summary()` | `/projects/`, `/projects/summary/` | 🟢 Connected | — | — |
| `/linedept/projects/:id` | DepartmentProjectDetail | `backendProjectApi.get()` + diaries/MB/bills/risks | `/projects/{id}/`, `/site-diaries/`, `/measurement-books/`, `/bills/`, `/execution-risks/` | 🟢 Connected | — | — |
| `/linedept/inventory` | DepartmentResourceWorkspace (mode=inventory) | `cachedFacilities()` | `/facilities/` | 🟢 Connected | — | — |
| `/linedept/budget` | DepartmentResourceWorkspace (mode=budget) | **Placeholder** | `/department-budgets/` | 🟡 Partial | Backend has department budgets but UI minimal | Medium |
| `/linedept/reports` | DepartmentReportWorkspace | `backendReportApi.list()`, `generate()`, `download()` | `/reports/`, `/reports/generate/`, `/{id}/download/` | 🟢 Connected | — | — |
| `/linedept/employees` | DepartmentWorkforceWorkspace (mode=employees) | `backendEmployeeApi.list()` | `/employees/` | 🟢 Connected | Invitation/acceptance flow implemented | — |
| `/linedept/organization` | DepartmentWorkforceWorkspace (mode=organization) | `backendEmployeeApi.list()` + roles | `/employees/`, `/auth/roles/` | 🟡 Partial | Role selection must use backend role codes | Medium |
| `/linedept/roles` | DepartmentWorkforceWorkspace (mode=roles) | **Hardcoded** | `/auth/roles/` | 🟡 Partial | Must load roles from backend | Medium |
| `/linedept/permissions` | DepartmentWorkforceWorkspace (mode=permissions) | **Hardcoded** | — | ❌ Missing | No permissions endpoint in backend guide | Medium |
| `/linedept/attendance` | DepartmentWorkforceWorkspace (mode=attendance) | **Placeholder** | — | ❌ Missing | No attendance endpoint in backend guide | Low |
| `/linedept/leave` | DepartmentWorkforceWorkspace (mode=leave) | **Placeholder** | — | ❌ Missing | No leave endpoint in backend guide | Low |
| `/linedept/performance` | DepartmentWorkforceWorkspace (mode=performance) | **Placeholder** | — | ❌ Missing | No performance endpoint in backend guide | Low |
| `/linedept/audit` | DepartmentWorkforceWorkspace (mode=audit) | **Placeholder** | — | ❌ Missing | No audit endpoint in backend guide | Low |
| `/linedept/settings` | DepartmentSettingsWorkspace | **Local state only** | — | ❌ Missing | No settings endpoint in backend guide | Low |

### Engineer Portal (`/engineer/*`)

| Route | Page Component | Current Data Source | Backend Endpoint | Status | Required Work | Priority |
|-------|----------------|---------------------|------------------|--------|---------------|----------|
| `/engineer` | EngineerPortal | `backendComplaintApi` (assigned complaints) | `/complaints/` | 🟢 Connected | Real EXIF parser implemented | — |
| `/engineer/today-tasks` | EngineerPortal | Same | Same | 🟢 Connected | — | — |
| `/engineer/navigation` | EngineerPortal | OSRM routing | — | 🟢 Connected | Client-side routing | — |
| `/engineer/gis-map` | CitizenHome | `cachedFacilities()` | `/facilities/` | 🟢 Connected | — | — |
| `/engineer/inspection` | EngineerPortal | `backendComplaintApi.startInspection()`, `uploadEvidence()` | `/complaints/{id}/start-inspection/`, `/upload-evidence/` | 🟢 Connected | Real EXIF validation | — |
| `/engineer/evidence` | EngineerPortal | `backendComplaintApi.uploadEvidence()` | `/complaints/{id}/upload-evidence/` | 🟢 Connected | — | — |
| `/engineer/offline-sync` | EngineerPortal | **Placeholder** | — | ❌ Missing | No offline sync endpoint | Low |
| `/engineer/settings` | EngineerPortal | **Local state** | — | ❌ Missing | No settings endpoint | Low |

### State Admin Portal (`/state-admin/*`)

| Route | Page Component | Current Data Source | Backend Endpoint | Status | Required Work | Priority |
|-------|----------------|---------------------|------------------|--------|---------------|----------|
| `/state-admin` | StateDashboardWorkspace | `backendDashboardApi.state()` | `/dashboards/state/` | 🟢 Connected | — | — |
| `/state-admin/budget/state` | StateBudgetWorkspace (mode=state) | `backendBudgetApi.stateBudgetSummary()` | `/state-budget/summary/` | 🟡 Partial | **Strict RBAC**: 403 for non-state-finance roles must surface honestly | High |
| `/state-admin/budget/departments` | StateBudgetWorkspace (mode=departments) | `backendBudgetApi.departmentBudgets.list()` | `/department-budgets/` | 🟡 Partial | Same RBAC concern | High |
| `/state-admin/budget/districts` | StateBudgetWorkspace (mode=districts) | `backendBudgetApi.districtAllocations.list()` | `/district-allocations/` | 🟡 Partial | Same RBAC concern | High |
| `/state-admin/budget/history` | StateBudgetWorkspace (mode=history) | `backendBudgetApi.stateBudgets.list()` | `/state-budgets/` | 🟡 Partial | Same RBAC concern | High |
| `/state-admin/budget/scheme-mapping` | StateBudgetWorkspace (mode=scheme-mapping) | `backendBudgetApi.schemes.list()` | `/schemes/` | 🟡 Partial | Same RBAC concern | High |
| `/state-admin/finance/sanctions` | StateFinanceWorkspace (mode=sanctions) | `backendBudgetApi.stateBudgets` CRUD | `/state-budgets/` | 🟡 Partial | Same RBAC concern | High |
| `/state-admin/finance/releases` | StateFinanceWorkspace (mode=releases) | `backendBudgetApi.financialLedger` CRUD | `/financial-ledger/` | 🟡 Partial | Same RBAC concern | High |
| `/state-admin/finance/reappropriation` | StateFinanceWorkspace (mode=reappropriation) | **Placeholder** | — | ❌ Missing | No reappropriation endpoint | Medium |
| `/state-admin/finance/ledger` | StateFinanceWorkspace (mode=ledger) | `backendBudgetApi.financialLedger` CRUD | `/financial-ledger/` | 🟡 Partial | Same RBAC concern | High |
| `/state-admin/master/*` | StateMasterWorkspace | `backendBudgetApi` (schemes, budget-heads, financial-years, departments, districts) | `/schemes/`, `/budget-heads/`, `/financial-years/`, `/departments/`, `/districts/` | 🟢 Connected | Department/district master data from backend | — |
| `/state-admin/notifications` | StateNotificationsWorkspace | `backendNotificationApi.list()` | `/notifications/` | 🟢 Connected | — | — |
| `/state-admin/audit` | StateAuditWorkspace | **Placeholder** | — | ❌ Missing | No audit endpoint | Low |
| `/state-admin/projects/*` | StateProjectsWorkspace | `backendProjectApi.list()` | `/projects/` | 🟢 Connected | State-wide scope | — |
| `/state-admin/approvals/*` | StateApprovalsWorkspace | `backendProposalApi` (negotiations, approve, reject) | `/proposals/`, `/proposal-negotiations/` | 🟢 Connected | — | — |
| `/state-admin/orders/*` | StateOrdersWorkspace | **Placeholder** | — | ❌ Missing | No orders endpoint in backend guide | Medium |
| `/state-admin/gis/*` | StateGisWorkspace | `backendGisApi.catalog()`, `catalogEntries()`, `facilitiesGeojson()` | `/gis/catalog/`, `/gis/catalog-crud/`, `/facilities/geojson/` | 🟢 Connected | — | — |
| `/state-admin/analytics` | StateAnalyticsWorkspace | **Placeholder** | `unsupported('AI recommendations')` | ❌ Missing | No analytics endpoint | Medium |
| `/state-admin/reports` | StateReportsWorkspace | `backendReportApi.list()`, `generate()`, `download()` | `/reports/`, `/reports/generate/`, `/{id}/download/` | 🟢 Connected | — | — |
| `/state-admin/users` | StateUsersWorkspace | `backendUserApi.list()`, CRUD | `/users/` | 🟢 Connected | Role selection uses backend role codes | — |
| `/state-admin/authority` | StateAuthorityWorkspace | **Configurable placeholders** (documented) | — | 🟡 Partial | Placeholders documented as illustrative | Low |

---

## Component-Level Dummy/Static Data Inventory

| File | Line(s) | Pattern | Description | Resolution |
|------|---------|---------|-------------|------------|
| `src/features/auth/demoPersonas.js` | 1-136 | Demo personas | Offline demo access; clearly labeled "mock-data build — no backend required" | Keep for demo; ensure production SSO flow doesn't use it |
| `src/features/auth/LoginPage.jsx` | 6, 17, 42, 47 | Demo access | Demo sign-in buttons on login page | Keep for demo; label clearly |
| `src/features/stateadmin/workspaces/StateAuthorityWorkspace.jsx` | 68, 76, 94, 102, 105, 112, 172, 174 | Configurable placeholders | Authority matrix records marked `isPlaceholder: true` with notes | Documented as illustrative; keep but don't present as real |
| `src/features/citizen/RegisterComplaintWizard.jsx` | 75, 108, 245 | Hardcoded fallback | Falls back to hardcoded options when master data fetch fails (404) | Hierarchy endpoints optional on backend; acceptable fallback |
| `src/features/citizen/ReportIssue.jsx` | 559 | **Fake EXIF** | Claims "Photo EXIF location validated (200 m tolerance)" but sends `geotagged:true`, `distMeters:0` hardcoded | **Critical**: Replace with real EXIF parser from `EngineerPortal` |
| `src/features/linedept/FieldOps.jsx` | 53-65 | **Simulated EXIF** | Fakes geotag validation with `setTimeout` | **Critical**: Replace with real EXIF parser |
| `src/features/department/workspaces/DepartmentInspectionsWorkspace.jsx` | — | Static "GPS Geotag Verified" | Shows static text over free-text photo URL | **Critical**: Replace with real verification |
| `src/features/admin/Analytics.jsx` | 213 | Placeholder comment | "placeholders that would look like real values" | Remove or connect to real endpoint |
| `src/features/admin/AuditLogs.jsx` | 4, 99 | Demo data | Identity store demo data | Remove or connect to real audit endpoint |
| `src/features/citizen/Schemes.jsx` | 4 | "Coming soon" | Honest empty state instead of fake scheme data | Connect to `/api/schemes/` |
| `src/features/citizen/Reports.jsx` | — | Fake toast | `setTimeout` toast for "publication catalog" | Connect to real report catalog |

---

## API Client & Architecture Issues

| Issue | Location | Impact | Resolution |
|-------|----------|--------|------------|
| **Duplicate API clients** | `src/services/httpClient.js` + `src/api/apiClient.js` + `src/services/api.js` | Confusion; `api.js` is legacy façade | Consolidate: use `src/api/*` modules directly; deprecate `services/api.js` |
| **Auth token in console** | `src/services/httpClient.js:18` | `access` token used in fetch headers (OK, not logged) | Verified: tokens not logged |
| **Hardcoded API base URL** | `src/services/httpClient.js:5` | `https://nalanda.drdesigntech.com/api` with `VITE_API_BASE_URL` override | OK: uses env var |
| **Missing retry on mutations** | All `backend*Api` modules | Failed mutations not retried | Add retry logic for idempotent mutations |
| **No request cancellation on unmount** | Components using `useAsync` | Stale responses can update state | `useAsync` should support AbortController |
| **Inconsistent error handling** | `ApiError` class in `httpClient.js` | Some components catch and show generic errors | Standardize on `ApiError` with status-specific messages |
| **Missing pagination** | Most list endpoints | Fetches all records | Backend supports pagination; add to API modules |

---

## Permission/RBAC Issues

| Issue | Location | Impact | Resolution |
|-------|----------|--------|------------|
| **Role mapping from backend** | `src/services/auth/AuthService.js:24` | Maps backend `role_info.code` to frontend `ROLES` via `ROLE_CODES` | Verify mapping covers all 16 backend roles |
| **Permission store** | `src/app/store/authStore.js:53` | `hasPermission()` checks `user.permissions` array | Backend must return permissions in `/auth/me/` |
| **Route guards** | `src/app/RequireRole.jsx` | Checks `user.role` against allowed roles | Works but shows login page on 403 (should show 403 page) |
| **Department scope** | `src/features/department/identity/hooks/useAuthorization.js` | `useCan()` checks permissions | Verify backend returns department-scoped permissions |
| **State budget RBAC** | `src/api/budgetApi.js:6-9` | Backend enforces 403 for non-state-finance roles | UI must surface 403 honestly (not fake data) |

---

## Loading/Empty/Error State Coverage

| Component | Loading | Empty | Error | Forbidden | Retry |
|-----------|---------|-------|-------|-----------|-------|
| CitizenDashboard | ✅ Skeleton | ✅ EmptyState | ✅ Error + Retry | ❌ Redirects to login | ✅ |
| DecisionDashboard | ✅ Skeleton (lazy sections) | ✅ Per-section | ✅ Per-section + Retry | ❌ Redirects to login | ✅ |
| FeedbackAnalyticsDashboard | ✅ Per-section | ✅ Per-section | ✅ Global + Retry | ❌ Redirects to login | ✅ |
| DepartmentPlanningWorkspace | ✅ | ✅ | ✅ | ✅ (via `RequireRole`) | ✅ |
| SpatialAnalysis | ✅ | ✅ | ✅ | ✅ | ✅ |
| GapPriorityDashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| RegisterComplaintWizard | ✅ | ✅ (fallback) | ✅ | ✅ | ✅ |
| ReportIssue | ✅ | N/A | ❌ Generic | ✅ | ❌ |
| EngineerPortal | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Duplicate/Conflicting Implementations

| Area | Files | Issue |
|------|-------|-------|
| Facility fetching | `src/api/facilityApi.js`, `src/api/gisApi.js`, `src/services/LeafletLayerService.js`, `src/gis/repositories/FacilityRepository.js` | Multiple paths to same data; `facilityApi.list()` delegates to `gisApi.facilities()` which uses `cachedFacilities` — OK but complex |
| Complaint fetching | `src/api/complaintApi.js`, `src/gis/repositories/ComplaintRepository.js`, `src/services/api.js` (workflowApi) | Three paths; `ComplaintRepository` used by citizen portal, `backendComplaintApi` by admin |
| Dashboard fetching | `src/api/dashboardApi.js`, `src/services/api.js` (analyticsApi) | `analyticsApi` delegates to `backendDashboardApi` — OK |
| Map initialization | `src/components/map/MapView.jsx`, `src/features/citizen/CitizenHome.jsx`, `src/features/admin/decisionDashboard/SituationMap.jsx` | Multiple Leaflet map instances; ensure cleanup on unmount |

---

## Phase 0 Verification Checklist

- [x] Inspected `src/` structure
- [x] Identified all pages/routes (72+ routes across 5 portals)
- [x] Identified components with dummy/static data (10+ locations)
- [x] Identified existing API services (23 API modules in `src/api/`)
- [x] Identified existing API calls (all routes use backend endpoints)
- [x] Identified local calculations that should come from backend (citizen dashboard stats, gap scoring)
- [x] Identified permission checks (RequireRole, useCan, hasPermission)
- [x] Identified forms that save only locally (none found — all persist to backend)
- [x] Identified tables/charts with hardcoded data (Analytics, AuditLogs, Schemes, Reports publication catalog)
- [x] Produced this audit report

---

## Phase 1+ Implementation Priority

### Critical (Do First)
1. **Fix fake EXIF verification** in `ReportIssue.jsx` and `FieldOps.jsx` — use real parser from `EngineerPortal`
2. **Connect department indicators** (Education, Health, Water, PWD, Urban) to backend endpoints
3. **Fix citizen dashboard** to use backend KPIs instead of local computation
4. **Verify state budget 403 handling** — ensure unauthorized roles see honest access-denied state

### High
5. **Connect `/api/feedback/analytics/`** endpoint (current implementation uses different paths)
6. **Implement missing auth flows**: signup, forgot-password, change-password, logout
7. **Add pagination** to all list endpoints
8. **Standardize error handling** across all components

### Medium
9. **Connect schemes endpoint** to citizen Schemes page
10. **Fix notification read-state** to use backend if available
11. **Remove demo personas** from production build or gate behind `VITE_ENABLE_DEMO`
12. **Code-split bundle** (2.6 MB main chunk)

### Low
13. **Connect attendance/leave/performance/audit** endpoints if backend adds them
14. **Add offline sync** for engineer portal
15. **Consolidate duplicate API paths** (facility, complaint fetching)

---

## Backend Contract Mismatches (Require Verification)

| Frontend Expectation | Backend Guide | Status |
|---------------------|---------------|--------|
| `GET /api/feedback/analytics/overview` | `GET /api/feedback/analytics/` | **Mismatch** — verify actual backend routes |
| `GET /api/feedback/analytics/by-question` | Same base endpoint with filters | **Mismatch** |
| `GET /api/feedback/analytics/by-location` | Same base endpoint with filters | **Mismatch** |
| `GET /api/feedback/analytics/trends` | Same base endpoint with filters | **Mismatch** |
| `GET /api/feedback/map/` | Not in guide | **Verify** |
| `GET /api/complaint-categories/` | In guide as master data | **Verify** |
| `GET /api/districts/` | In guide as master data | **Verify** |
| `GET /api/subdivisions/`, `/blocks/`, `/village-wards/` | Optional in guide | **Optional** |
| `GET /api/auth/roles/` | In guide | **Verify** |
| `POST /api/auth/signup/` | In guide | **Missing UI** |
| `POST /api/auth/forgot-password/` | In guide | **Missing UI** |
| `POST /api/auth/forgot-password/reset/` | In guide | **Missing UI** |
| `POST /api/auth/change-password/` | In guide | **Missing UI** |
| `POST /api/auth/logout/` | In guide | **Missing UI** |

---

## Next Steps

1. **Review this audit** with stakeholders
2. **Verify backend contract mismatches** against live backend at `https://nalanda.drdesigntech.com/api`
3. **Begin Phase 1** — Establish Production API Foundation (already largely done)
4. **Begin Phase 2** — Authentication + Identity + RBAC (fix missing auth flows)
5. **Begin Phase 3** — Global/Master Data (connect schemes, verify master data endpoints)
6. **Begin Phase 4** — Dashboards (fix citizen dashboard, connect indicators)
7. **Begin Phase 5** — Complaints (fix EXIF verification)

---

*This audit is the Phase 0 deliverable. No implementation changes should be made until this report is reviewed and accepted.*
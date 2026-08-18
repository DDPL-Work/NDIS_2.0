# PHASE NEXT — BACKEND API INTEGRATION REPORT

Engagement: NDISP frontend — complete backend API integration (Phases 1–39).
Source of truth: `backend_next_guide.md` (supplemented by `backend_guide2.1.md` / `backend_guide2.0.md` where referenced).
Rule followed everywhere: **BACKEND → API → MAPPER → UI**, no mock fallback, no fabricated values, backend status vocabulary only.

---

## 1. What was delivered

| # | Phase | Status |
|---|---|---|
| 1 | API layer audit + auth fix (`.env.development.local`, `AuthRepository.listRoles`) | ✅ |
| 2–8 | All dashboards backend-driven (collector, field inspector, DM/ADM, department, admin command platform) | ✅ |
| 9 | Notifications (`GET /api/notifications/`) | ✅ |
| 10 | Employees (`GET/POST/PATCH /api/employees/`) + workforce workspace | ✅ |
| 11 | Approval negotiation + fund release + proposal lifecycle (`/api/proposals/`) | ✅ |
| 12 | State finance + master data + users workspaces | ✅ |
| 13 | Bulk GIS sync (`POST /api/facilities/bulk-sync-gis/`) + BulkSyncCard UI | ✅ |
| 14–33 | Master data, state admin, district platform workspaces — all backend wiring | ✅ |
| 34 | A-class mock removal (seeds, mock services, dead mock modules) | ✅ |
| 35 | `npm run lint` ✅ and `npm run build` ✅ (production) | ✅ |
| 36 | Post-implementation mock audit — zero mock imports remain (one config file kept) | ✅ |
| 38–39 | QA matrix + this report | ✅ |

---

## 2. API layer inventory (`src/api/`)

| Module | Endpoints covered | Used by |
|---|---|---|
| `complaintApi.js` | `GET/POST /api/complaints/`, `GET /api/complaints/{id}/`, status actions, categories, timeline/comments | Citizen, department, admin complaint flows |
| `proposalApi.js` | `GET/POST /api/proposals/`, `/{id}/`, `submit`, `approve`, `reject`, `sanction`, `negotiate`, `negotiation-response`, `release` | DepartmentPlanningWorkspace, DepartmentProposalsWorkspace, state approvals |
| `projectApi.js` | `GET/POST /api/projects/`, `/{id}/` PATCH | State project registry, department sanctioned view |
| `planningApi.js` | `GET /api/planning/dashboard/` | Department planning KPIs |
| `dashboardApi.js` | `GET /api/dashboard/` (+ `/{dept}`, `/field-inspector`, `/collector`, `/dm`, `/adm`) | All dashboards |
| `notificationApi.js` | `GET /api/notifications/`, `PATCH read` | State + department notification feeds |
| `employeeApi.js` | `GET/POST /api/employees/`, `/{id}/` PATCH | Workforce workspace, department officers, state users |
| `budgetApi.js` | `/api/budget/schemes/`, `/api/budget/department-budgets/`, `/api/budget/district-allocations/`, ledger | StateBudget/Finance workspaces, admin MonitoringTab |
| `userApi.js` | `GET/POST/PATCH/DELETE /api/users/` | State users workspace |
| `facilityApi.js` | `GET/POST /api/facilities/`, `/{id}/` PATCH, `POST /api/facilities/bulk-sync-gis/` | State GIS workspace, department asset context |
| `masterApi.js` | `/api/masterdata/` (departments, districts, schemes, budget-heads, financial-years) | State master data workspace |
| `spatialQueryApi.js` | `GET /api/spatial-query/` | GIS layer search |
| `gisApi.js` | `GET /api/geodata/{type}/` | GIS layer source |
| `reportApi.js`, `billApi.js`, `measurementBookApi.js`, `siteDiaryApi.js`, `executionRiskApi.js`, `departmentApi.js` | `/api/reports/`, `/api/bills/`, `/api/measurement-books/`, `/api/site-diaries/`, `/api/execution-risks/`, `/api/department/{id}/users|complain/` | Execution + admin modules |
| `apiClient.js` | Auth header, 401 refresh, error normalization, `BackendCapabilityError`, `unsupported()` | Everything |
| `mappers/` (17 files) | DTO normalization; backend statuses stored verbatim (`status`, `status_display`); amounts crore→₹ where documented | Every API consumer |

---

## 3. Screen × data-source QA matrix

| Screen | Data source | Mock-free |
|---|---|---|
| CollectorExecutiveDashboard | `GET /api/dashboard/collector/` + complaints | ✅ |
| EngineerPortal (field inspector) | `GET /api/dashboard/field-inspector/` + complaint queue | ✅ |
| DepartmentOfficerQueue | `GET /api/complaints/` + engine transitions | ✅ |
| DepartmentDashboardBuilder | `GET /api/dashboard/{department}/` + complaint summary | ✅ |
| DistrictCommandPlatform (OverviewTab) | `DistrictStatisticsRepository` / `DistrictBriefRepository` — complaint-derived | ✅ |
| MonitoringTab | `GET /api/budget/schemes/`, `/api/budget/department-budgets/` | ✅ |
| DisasterTab | complaint data + fixed public helplines (112/1077/1070); registers = gap states | ✅ |
| SystemHealth / AuditLogs | no fabricated telemetry; audit = real complaint timeline + identity events | ✅ |
| StateUsersWorkspace | `GET/POST/PATCH /api/users/` + `AuthRepository.listRoles` | ✅ |
| StateNotificationsWorkspace | `GET /api/notifications/` (+ finance events) | ✅ |
| StateProjectsWorkspace / Proposals | `GET/POST /api/projects|proposals/`, approve/reject/sanction | ✅ |
| StateGisWorkspace | `GET /api/facilities/`, create/update, BulkSyncCard | ✅ |
| StateFinance/Budget/Approvals | budget endpoints live; sanctions/releases/commitments = `BackendCapabilityError` | ✅ |
| StateGovernance (Orders/Documents) | backend gap → empty collections + capability errors | ✅ |
| StateMasterWorkspace | `GET /api/masterdata/` | ✅ |
| DepartmentPlanningWorkspace | `GET /api/planning/dashboard/` + `/api/proposals/` wizard (steps 1–6, submit) | ✅ |
| DepartmentProposalsWorkspace | `/api/proposals/` list/create/submit; duplicate = capability error | ✅ |
| DepartmentWorkforceWorkspace | `GET /api/employees/` | ✅ |
| Citizen flows (ReportIssue, TrackGrievance, RegisterComplaintWizard) | `POST/GET /api/complaints/` | ✅ |

---

## 4. A-class mocks removed (Phase 34 + 36)

- `projectEngine.js` — `INITIAL_PROPOSALS/PROJECTS/WORK_ORDERS/INSPECTIONS/OFFICERS` seed arrays removed; store now starts empty; persistence key bumped to `ndisp-project-engine-v3` so stale seeded localStorage cannot rehydrate. `advanceSimulationTime` retained (SimulationControlPanel) but only ticks local projections.
- `identityStore.js` — `INITIAL_EMPLOYEES` removed (empty start, persistence key `v2`).
- `SystemHealth.jsx` — fabricated uptime/latency/throughput telemetry removed; honest backend-gap panel.
- `AuditLogs.jsx` — fabricated signed events removed; now merges real complaint-timeline events + workforce identity events.
- `complaintIntelligence.js` — mock-facility `nearestAsset` removed (backend gap → `null`).
- Deleted dead mock modules (proven import-free): `src/services/mock/{analytics,boundaries,facilities,grievances,ingestion,notifications,schemes,users,workflows,systemHealth,auditLogs}.js`.
- **Kept by design (Category B — configuration/documentation):** `facilitySchemas.js` (form schema config), `stateConstants` authority placeholders (explicitly labeled "configurable placeholder — not an actual rule", surfaced as such in StateAuthorityWorkspace), demo personas, GIS math config, `SEED_GIS_LAYERS`/`ASSET_CATEGORIES`.

---

## 5. Backend-gap register (surfaced honestly, never fabricated)

| Capability | Handling |
|---|---|
| Sanctions, fund releases, commitments, expenditures, re-appropriation | collections empty; mutations throw `BackendCapabilityError` |
| Government orders / document register | empty; `publishOrder` etc. throw `BackendCapabilityError` |
| Proposal verbs: recommend/return/clarify/escalate/delegate/forward | `BackendCapabilityError` |
| District executive registers (officers/field staff/vehicles/shelters/CSAT/rankings) | empty collections + gap labels |
| Inspections/meetings/control-room dispatch (command platform) | gap toast on action |
| Platform telemetry / audit signing | gap panels; audit rebuilt from real events only |
| Work orders / inspections / maintenance (execution modules) | local projection only; starts empty |
| Nearest-asset AI suggestion | `null` (backend gap) |

---

## 6. Verification

- `npm run lint` — **0 errors, 0 warnings**.
- `npm run build` (vite 5.4.21) — **success**, 2578 modules, only pre-existing chunk-size advisory.
- Greps: zero `services/mock` imports outside the kept config file; zero non-empty `INITIAL_*` data arrays; zero `sampleAssets`/telemetry-widget references.

---

## 7. Known remaining items (out of scope for this engagement)

1. Execution modules (work orders, inspections, maintenance, site diaries, bills, measurement books, execution risks) remain **local projection / backend-gap** — they will light up when their endpoints are published; API modules and mappers are already in place.
2. Field-inspector / collector dashboards use the documented role endpoints; any future endpoint additions should be mirrored in `dashboardApi.js`.
3. `dist/` chunk-size advisory (existing; code-splitting not requested).
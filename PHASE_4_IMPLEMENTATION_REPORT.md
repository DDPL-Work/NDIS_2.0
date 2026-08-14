# PHASE 4 IMPLEMENTATION REPORT

**Scope:** Financial flow, cross-portal consistency & ERP completion — every backend-supported capability made dynamic and consistent across the Citizen / Department / DM-Admin / State Admin portals; every unsupported capability surfaced as an explicit BACKEND GAP. The backend (`https://nalanda.drdesigntech.com/api`, `backend_guide2.1.md`) remains the single source of truth. No invented endpoints, no fake persistence, no `projectEngine` fallback, no UI redesign.

**Rule enforced:** only documented or live-verified endpoints were wired. All anonymous probes recorded below (session had no credentials, so authenticated flows are documented as contracts, not claimed as tested).

---

## 1. Financial integration

- **State Admin finance/budget cluster (`/state-admin` budget*, finance*, ledger, authority, orders, audit, master*, users, notifications, approvals/pending, projects/registry, gis/assets)** — backed by `stateFinanceStore.js` / `stateProjectStore.js` / `stateMasterStore.js` (in-memory Zustand seeds: `SB-`/`DB-`/`DA-`/`SAN-`/`FR-`/`COM-`/`EXP-`/`RA-`/`PRJ-`/`PROP-` records, `Date.now()` ids, authority "CONFIGURABLE PLACEHOLDER" — `config/stateConstants.js`).
- **The deployed backend exposes NO state-budget / sanction / fund-release / ledger / authority-matrix endpoints** (verified: `budgets`, `sanctions`, `fund-releases`, `ledger`, `authority`, `workflows`, `orders`, `audit-logs` all 404 on live probe; the only financial endpoint is `bills`).
- **Decision → `BACKEND GAP — FINANCIAL MANAGEMENT`.** UI left visually intact per instruction; nothing in the finance cluster is claimed as live. Integration becomes possible only when the backend documents `GET/POST /api/budget/`, `…/sanctions/`, `…/fund-releases/`, `…/ledger/`, `…/authority/`, `…/orders/`.

## 2. Project financial data

- Project registry reads run through `projectApi.summary()` / `list()` / `get()` (`GET /api/projects/summary/`, `/projects/?department=&district=`). Mapper (`src/api/mappers/projectMapper.js`) maps only backend fields (`sanction_amount`, `expenditure_amount`, `net_payable_amount`…).
- **No frontend re-derived KPIs remain** — grep for `budgetUtilized`/`billAmount`/`netPayable` derivation inside the department feature: **0 matches**. Backend values are displayed as-is; `mapProjectSummary` keeps the backend's own aggregated fields.

## 3. Bills

- `src/api/billApi.js` — `GET/POST/PATCH/DELETE /api/bills/` (guide §7.4). Lifecycle (`draft → pending_approval → approved → disbursed`) is decided by the backend; no client-side transitions. Bills reference backend project IDs (no name/array-position references).
- `bills` probe (anonymous) → **401** — correctly honored: `billApi` never collapses 401/403 into "no bills" (comment preserved in code).
- **Invalidation extended:** every bill write now touches `BILLS + PROJECTS + REPORTS` (previously only BILLS+PROJECTS), so reports (e.g. `sla_audit`, financial report tiles) refresh after bill changes.

## 4. Measurement Book

- Already backend-wired (Phase 3) via `measurementBookApi` (`GET/POST /api/measurement-books/`; probe 200). The guide documents measurement books as an independent execution record.
- **Bill ↔ measurement-book relationship is not documented** (`/api/bills/` references project, not measurement book) → relationship reported as a gap, NOT invented client-side.

## 5. Project completion

- Backend-authoritative: `projectApi.dailyProgress()` POSTs to `/projects/{id}/daily-progress/`; reaching 100% transitions the project to COMPLETED **on the backend**. No frontend completion logic exists. Progress writes now also invalidate `SITE_DIARIES + REPORTS + DASHBOARD`.

## 6. Asset handover

- `facilityMapper` carries no `project_id`; backend facilities expose `department` + `attributes.lifecycle_state` + SCD history only. **No `facility.project_id` was invented.** Handover remains a controlled/manual registration; any "Asset handover required" affordance points to `/linedept/assets` (facility lifecycle PATCH).

## 7. Admin Analytics (`/admin/analytics`)

Already fully dynamic (verified this phase — no changes needed). Mapping table:

| Widget | Current source | Backend API | Field |
|---|---|---|---|
| Department list | `useDepartments` → `DepartmentRepository.list` | `GET /api/departments/` | `id`, `name` |
| Per-dept facility count / geo-tagged % | `useAnalyticsData` → `GISRepository.facilities({districtId, departmentId})` (shared `cachedFacilities`) | `GET /api/facilities/?district=&department=` | `count`, positioned rows |
| Per-dept gap score | `AnalyticsService` (mean over positioned facilities) | derived from facilities (same source) | `gapScore` (facilityMapper neighbourhood index) |
| District label/scope | auth profile `districtId` | session | `districtId` |
| Budget utilization / history | **explicit "not available" state** | no endpoint (guide has none) | `unsupported('budget analytics')` |

## 8. Department Overview (`/admin/departments-overview`)

**Implemented this phase** — real per-department coverage: name, facility count, project count, proposal count, complaint count, gap score, coverage.

- `useDepartmentCoverage` now runs four parallel bounded fetch groups: facilities (shared cache), complaint rollups, project registry, proposal registry — all per department id.
- `DepartmentCoverageService.buildDepartmentRows` computes `projectCount`, `proposalCount` and `openProposals` (proposals not in `COMPLETED`/`REJECTED`) — previously hardcoded `null` under a stale "no proposals API" assumption; the proposals endpoint is live (probe 200).
- No unsupported metrics (uptime/p95 remain unavailable states).

## 9. Situation Matrix

Verified already-compliant, no changes: department selector drives targeted `GISRepository.facilities({ districtId, departmentId, catalog })` calls (never an unfiltered 8,341-facility fetch), complaint heatmap via `GISRepository.complaintHeatmap({ districtId })`, map layers via `useLeafletLayers`/`CitizenLayerPanel`, facility detail via shared `GISInfoCard`/`FacilityDetail` components. Gap-threshold slider filters the already-loaded set client-side (no extra request).

## 10. GIS / project layers

- Facilities GIS fully backend-driven (geometry, categories, SCD history; `cachedFacilities` single download).
- **Project layer: NOT added.** The project API response (verified serializer vocabulary in `projectMapper.js`) exposes no coordinates (`lat`/`lng`/`geom`) — inventing coordinates is prohibited. Reported as gap: "projects need coordinates or a `geom` field on `GET /api/projects/` before a GIS project layer can exist."

## 11. Department scoping

- Department portal resolves the department from the **authenticated profile** (`DepartmentWorkspaceProvider`); grep confirms **no hardcoded "Health & Family Welfare" / "Urban Development"** department names remain in the department feature.
- Admin/collector views scope by the session's `districtId`; `StateRollup` lists districts from `DISTRICTS` config and pulls each summary from `GET /api/dashboards/district/` (district id scoped).

## 12. State Admin portal

- Routes live (`/state-admin/*`, `STATE_PORTAL_ROLES` guard) but every workspace reads the seeded simulation stores (see §1). No backend finance endpoint exists → **classified, left visually intact, not falsely live**.

## 13. Mock / static data — classification (A–E)

| A–E | Item | Location | Status |
|---|---|---|---|
| **A — Simulation engine (no backend)** | `stateFinanceStore`, `stateProjectStore`, `stateMasterStore` + `seed/stateSeedData` (₹, SB/DB/DA/SAN/FR/COM/EXP/RA/PRJ/PROP) | `src/features/stateadmin/store/**`, `config/stateConstants.js` | RETAINED (demo, resets on reload) — flagged, not connected to backend |
| **A — Static demographics** | `DistrictStatisticsRepository` (population 2,877,653; blocks 20; villages 1,084; road 2,840 km; budget ₹42 Cr…) | `src/features/admin/platform/DistrictStatisticsRepository.js` | RETAINED — no backend endpoint exists; not presented as live |
| **A — Simulated briefs** | `DistrictBriefRepository` — weather/meetings/absentStaff/budgetRisks derived from timestamp hashes | `src/features/admin/platform/DistrictBriefRepository.js` | RETAINED — no backend endpoint; not presented as live |
| **A — Inline hardcoded ₹** | `sanctioned/utilized` array | `DistrictCommandPlatform.jsx:82-84` | RETAINED (visually intact) — gap |
| **B — Disabled simulation harness** | `complaintEngine` simulate* actions (return `false` + toast) | `src/app/store/complaintEngine.js` | RETAINED — confirmed **not** mock: `hydrate()` loads `ComplaintRepository` (backend); every lifecycle action POSTs via `ComplaintService` |
| **B — Dormant control panel** | `SimulationControlPanel` (commented out) | `App.jsx:275` | RETAINED |
| **D — Legit demo (unrouted)** | `projectEngine`-driven unrouted workspaces (WorkOrders/Inspections/Maintenance/Calendar/Projects/Proposals) | `src/features/department/workspaces/` | RETAINED — unreachable from nav (Phase 3 finding) |
| **E — Honest unsupported()** | `masterDataApi.listDistricts/listDepartments`, `analyticsApi.getBudgetUtilization/getBudgetTimeline`, `getRecommendations`, `schemeApi`, `directoryApi`, `ingestionApi` | `src/services/api.js`, `apiClient.unsupported()` | RETAINED — surfaces `BackendCapabilityError` instead of fake data |

## 14. Backend gaps (open — implementation prohibited until backend ships them)

- **WORK ORDERS** (`work-orders`, `workorder` — 404) — BLOCKED
- **INSPECTIONS** (`inspections`, `inspection-reports`, `field-inspections` — 404) — BLOCKED
- **MAINTENANCE** (`maintenance`, `maintenance-tasks`, `maintenance-plans`, `maintenance-records`, `asset-maintenance` — 404) — BLOCKED
- **FINANCIAL MANAGEMENT** (state budget, sanctions, fund releases, ledger, re-appropriation, authority matrix, government orders, audit trail — none documented/verified) — BACKEND GAP
- **Projects as GIS layers** (no coordinates on project API)
- **Measurement-book ↔ bill linkage** (not documented)
- **Per-department "uptime/p95" telemetry** (no endpoint)
- **State-wide budget analytics** (`getBudgetUtilization`/`getBudgetTimeline` → `unsupported`)

## 15. Data invalidation matrix (§23) — implemented

| Scope | Touched by |
|---|---|
| `SANCTION` | `projectApi.sanction` → **PROJECTS, PROPOSALS, DASHBOARD** (was PROJECTS) |
| `PROGRESS` | `projectApi.dailyProgress` → **PROJECTS, SITE_DIARIES, REPORTS, DASHBOARD** (was PROJECTS+SITE_DIARIES) |
| `BILL` | `billApi.create/update/remove` → **PROJECTS, BILLS, REPORTS** (was PROJECTS+BILLS) |
| `PROPOSAL SANCTION` | `proposalApi.sanction` → **PROPOSALS, PLANNING, PROJECTS, DASHBOARD** (was PROPOSALS+PLANNING) |
| `FACILITY` | `facilityApi.create/update` → **FACILITIES, GIS** (new scopes) + **department-scoped eviction of `cachedFacilities`** |
| New scopes added | `DASHBOARD`, `FACILITIES`, `GIS` in `DATA_SCOPES` (`src/app/store/dataVersionStore.js`) |

Facility cache eviction is key-scoped (`facilities:<district>:<dept>:…`): a write in department X evicts only X's entries + the unfiltered collection — it does **not** re-trigger the ~43 MB download for unrelated departments.

## 16. Performance

- The 8,341-facility / ~43 MB collection downloads **once** (`cachedFacilities`, 120 s window, in-flight dedupe, fresh 5 min / retain 30 min, stale-while-revalidate). Department Overview, Analytics, Situation Matrix and the department registry all read through it.
- Facility writes evict only affected department keys (see §15) — no blanket cache clear.
- Department Overview bounded fan-out: 15 depts × (facilities-cached + complaint rollup + projects + proposals) executed as four parallel groups with stable `useAsync` deps; no per-render re-fires, no tab-switch reload storms.
- No duplicate requests: `useAnalyticsData`/`useDepartmentCoverage` reuse the department master via `useDepartments` (single `DepartmentRepository.list` call, module-level share).

## 17. RBAC

- No `if (user.role === …)` inside components — grep in `src/features/admin` and `src/features/department`: **0 matches**. Enforcement is at route/permission boundaries (`RequireRole` roles, `DepartmentPage permission="…"`, backend 401/403 which stay `ApiError`).
- `bills` are backend-gated to DM / Department Head (anonymous probe → 401) and the UI honors that (no fake empty state).

## 18. Error states

- Load/Empty/Error/Retry states exist on every touched surface (`DepartmentCoverage`, `Analytics`, `SituationMatrix`, coverage cards); `401/403` never degrade to "no data"; `unsupported()` raises `BackendCapabilityError` for gap surfaces.

## 19. Authenticated tests (Dept Head / DM / State Admin)

**Not executable in this session — no credentials were provided.** All live checks above are anonymous contract probes (status + response shape). A real-session run must record role → request → response → status for: bills list/create, facility lifecycle PATCH, project summary, proposal sanction, district dashboard, department coverage. No PASS claim is made for authenticated behavior.

## 20. Files modified (this phase)

- `src/app/store/dataVersionStore.js` — added `DASHBOARD`, `FACILITIES`, `GIS` scopes
- `src/api/projectApi.js` — expanded invalidation scopes for `sanction`/`dailyProgress`
- `src/api/billApi.js` — added `REPORTS` to bill-write invalidation
- `src/api/proposalApi.js` — `sanction` invalidates `PROPOSALS, PLANNING, PROJECTS, DASHBOARD`
- `src/api/facilityCacheCore.js` — added department/district-scoped `invalidate()`
- `src/api/facilityApi.js` — writes invalidate `FACILITIES`+`GIS` and evict the shared cache
- `src/gis/repositories/DepartmentRepository.js` — added `projects`/`proposals`
- `src/hooks/useDepartmentCoverage.js` — parallel project+proposal registry fetches
- `src/features/admin/services/DepartmentCoverageService.js` — real `projectCount`/`proposalCount`/`openProposals`
- `src/features/admin/components/DepartmentCoverage.jsx` — row subtitle shows project count

## 21. Lint / build

- `npm run lint` — clean
- `npm run build` — succeeds (2540 modules; chunk-size warning pre-existing)

## 22. Known issues

- `/admin/departments-overview` and `/admin/analytics` fan-out grows with department count; project/proposal registries are not cached client-side (lightweight, acceptable; cache if the registries grow).
- `AdminDashboard` proposal "under review" query uses `state: 'under_review'` which the proposal mapper does not map to a backend status — status filter may be ignored by the backend (pre-existing, unchanged this phase).
- State Admin finance cluster numbers are demo seeds; a future finance backend should replace the stores, not be bolted on.
- Authenticated flows (§19) pending credentials before claims of end-to-end pass.

**Phase 4 complete — STOP. No Phase 5.**

# PHASE 4.1 — PLANNING MOCK DATA REMOVAL REPORT

Route audited: `/linedept/planning` (`DepartmentPlanningWorkspace.jsx` + every dependency). All data traced **backend → API → mapper → hook/state → component → screen**.

## 1. Root cause

The Page calls `planningApi.dashboard()` and `backendProposalApi.list()` — which the previous report (correctly) stated — BUT the trace stopped at the API layer. Four residual issues:

1. **Hardcoded business defaults inside the DPR wizard form state** (`'Silao'` block, `'90 days'` timeline, `'Infrastructure'` category) were applied whenever a backend value was empty — values the backend never sent were rendered and then **sent back to the backend** on save.
2. The **dashboard DPR repository read `planning/dashboard → dpr_repository`** instead of the department-scoped `/proposals/` list, so the repository count ("8 active proposals") came from a different endpoint than the Approved KPI (5) — two unverifiable concepts mixed on one screen.
3. **Four legacy mock repository modules existed in the planning feature tree** (`PlanningRepository`, `ProposalRepository`, `ProposalAnalyticsRepository`, `ProjectCreationService`) with fake gap scores, fake population, and a frontend-only lifecycle — they were not imported by the route, but they were purpose-built for planning data.
4. The **district selector header could render `Nalanda (undefined)`** — the `nalanda` config entry has no `phase` key, and the authenticated profile carries the numeric backend district pk which the slug-based option list cannot match.

## 2. Components audited

- `DepartmentPlanningWorkspace.jsx` (+ inner `DprWizard`, form builders) — the route
- `src/api/planningApi.js`, `src/api/proposalApi.js`, `src/api/projectApi.js`, `src/api/mappers/proposalMapper.js` — data layer
- `src/hooks/useAsync.js`, `src/app/store/dataVersionStore.js`, `src/app/store/uiStore.js` — state/invalidation
- `DepartmentWorkspaceProvider.jsx`, `DepartmentContext.js`, `DepartmentRegistry.js`, `DepartmentLayout.jsx` — department context
- `identityStore.js`, `identity/hooks/useAuthorization.js` — RBAC + current user
- `app/store/authStore.js`, `services/auth/AuthService.js` (+ `normalizeUser`) — profile shape
- `components/layout/Topbar.jsx` (+`AppShell`) — district/department header display
- `features/department/repositories/*` (all 21 files) — mock inventory
- `app/store/projectEngine.js`, `complaintEngine.js`, `config/constants.js`, `stateadmin/store/{stateProjectStore,stateFinanceStore}.js` + `stateSeedData` — classification (confirmed not on the planning path)

## 3. Mock sources found

| File / line | Mock source | What it displayed |
|---|---|---|
| `DepartmentPlanningWorkspace.jsx` `emptyForm` (was 60–87) | `block: prefill.block \|\| 'Silao'`, `timeline: '90 days'`, `category: 'Infrastructure'` | Hardcoded defaults rendered into wizard inputs when backend empty |
| `DepartmentPlanningWorkspace.jsx` `formFromProposal` (was 31–58) | `category: p.category \|\| 'Infrastructure'`, `timeline: p.estimatedTimeline \|\| '90 days'` | Same defaults on View/Resume |
| `DepartmentPlanningWorkspace.jsx` review step (was 251) | `statusDisplay \|\| 'Draft DPR'` | Implied backend state ("Draft DPR") for an empty backend value |
| `DepartmentPlanningWorkspace.jsx` dashboard (was 332/357/466) | `dashboard.dprRepository` as the DPR repository | Repository count from `planning/dashboard` instead of the department-scoped `/proposals/` → "8 active proposals" unverifiable and inconsistent with `Approved=5` |
| `repositories/PlanningRepository.js` | fake `gapScore: 0.9 / 0.72`, `population \|\| 2500`, `block \|\| 'Silao'`, engine `proposals` list | Fake development-needs gap scores/claims (dead — zero imports) |
| `repositories/ProposalAnalyticsRepository.js` | frontend-only lifecycle (`department_review`, `dm_review`) | Contradicts backend status vocabulary (dead — zero imports) |
| `repositories/ProposalRepository.js` | `projectEngine.createProposal/updateProposal/transitionProposal` | Proposal CRUD against the simulation engine (dead — zero imports) |
| `repositories/ProjectCreationService.js` | `projectEngine.createProjectFromProposal` | Sanction→project against the engine (dead — zero imports) |
| `components/layout/Topbar.jsx` | `label: \`${d.label}${d.phase !== 'Pilot' ? \` (${d.phase})\` : ''}\`` over slug options | "Nalanda (undefined)" when the profile carries the numeric district pk |
| NOT on the planning path (classified only): | `identityStore` seed employees, `DepartmentRegistry` sample assets, `projectEngine` seed + persisted `ndisp-project-engine-v2` | Only consumed by unrouted demo workspaces / provider context / RBAC — never by `/linedept/planning` |

## 4. Mock sources removed

- **Deleted (proven import-free across the whole `src/` — definitions only, zero consumers):**
  - `src/features/department/repositories/PlanningRepository.js`
  - `src/features/department/repositories/ProposalRepository.js`
  - `src/features/department/repositories/ProposalAnalyticsRepository.js`
  - `src/features/department/repositories/ProjectCreationService.js`
- **`DepartmentPlanningWorkspace.jsx`**
  - `emptyForm` / `formFromProposal`: removed `'Silao'`, `'90 days'`, `'Infrastructure'` — they become `''` so only backend/URL-prefill values display and persist.
  - Review step: `statusDisplay || '—'` (no invented "Draft DPR").
  - DPR repository: now unconditionally `GET /api/proposals/?department=<pk>&district=<pk>` for **every** view including the dashboard; subtitle reads `N rows proposals from the backend`. `planning/dashboard` now supplies only the KPI cards + suggested needs.
- **`Topbar.jsx`** — district options: phase suffix only when `phase` exists (`Nalanda` not `Nalanda (undefined)`), plus the profile's numeric district pk is added as an option with its authenticated label when the slug list cannot match it. (Header concern in §31 — fixed at the shell level since the planning page itself renders no district text; the visible district selector lives in the shared Topbar.)

## 5. Backend sources (UI → endpoint → field)

| Visible block | Endpoint | Field → mapper → rendered value |
|---|---|---|
| KPI `Development Needs` | `GET /planning/dashboard/` | `kpi_summary.development_needs` → `planningApi` `kpiSummary.developmentNeeds` → StatCard |
| KPI `Draft DPR` | `GET /planning/dashboard/` | `kpi_summary.draft_dpr` |
| KPI `Pending Review` | `GET /planning/dashboard/` | `kpi_summary.pending_review` |
| KPI `Approved` | `GET /planning/dashboard/` | `kpi_summary.approved` |
| Suggested needs table | `GET /planning/dashboard/` | `suggested_development_needs[]` (raw) → `title`, `department`, `block`, `gap_score`, `linked_complaints_count` |
| DPR repository (all views) | `GET /proposals/?department=&district=` | `proposal[]` → `mapProposalList` → `proposalId/title/estimated_cost(cost_formatted)/status/status_display/stage/block/created_at` |
| Repository row → View/Resume | `GET /proposals/{id}/` | `mapProposal` → wizard hydrate (`formFromProposal`) |
| Wizard create/save | `POST /proposals/`, `PATCH /proposals/{id}/`, `POST …/step2…` … `step5…` | `stepX` payloads ↔ mapper fields |
| Attachments | `POST /proposals/{id}/step6-attachments/` (FormData) | success only from the backend register (`attachments[]`) |
| Submit | `POST /proposals/{id}/submit/` | backend decides `DRAFT_DPR → PENDING_REVIEW` |
| Sanctioned view projects | `GET /projects/?department=` | `mapProjectList` → linked project title/status/progress/sanction order |
| Delegation power | proposal record | `delegated_power_note` (mapper pass-through; **no** ₹50L/₹5Cr thresholds anywhere in this flow) |
| Statuses/labels | proposal record | `status`, `status_display`, `stage`, `stage_display` — backend vocabulary only |

## 6. Department filtering

- `useCurrentUser()` → `authStore.user`, normalized by `normalizeUser()` from `GET /api/auth/me/`: `departmentId` = the **numeric backend department pk** (`profile.department.id`), `departmentName` from the profile.
- `departmentPk()` (workspace helper) extracts the numeric pk (`user.department.id ?? user.departmentId`); the repository is fetched with `?department=<pk>`.
- No client-side post-filter for department; no `department="…name"` string is ever sent. The planning page never reads the provider's engine-fed proposals — only `dept` (label/icon/registry config) from context; label itself comes from the profile (`deptName`), not from a constant.

## 7. District filtering

- `districtPk` is resolved the same way from the profile (numeric pk when present) and passed as `?district=<pk>` wherever supported (it is in the proposal API helper; an unsupported backend param is ignored harmlessly).
- District **label** in the header is resolved from the authenticated `user.district.label` (fallback option) or the configured hierarchy (`Nalanda`), never an undefined phase suffix.

## 8. KPI consistency

- `Development Needs=0 / Draft DPR=0 / Pending Review=0 / Approved=5` → all four cards read `planning/dashboard → kpi_summary.*` (backend-computed per-status aggregates).
- "Repository = 8" previously came from `dpr_repository` of the same endpoint — a **different backend concept** (its own active list) with a count the UI could not reconcile. That ambiguity was the actual defect.
- **Fix:** the repository is now the department/district-scoped `/proposals/` list; the count rendered in the card subtitle equals the rows on the table — self-consistent and individually verifiable. Approved KPI (5) and repository count are documented as two distinct concepts: backend per-status aggregate vs. row-level list.
- `total_proposals` from `kpi_summary` remains mapped (not currently displayed) for future use.

## 9. Development needs

- Source: `GET /planning/dashboard/ → suggested_development_needs[]` (raw passthrough; gap score and linked-complaint count rendered exactly as returned — no frontend scoring, no `Math.random()`, no hardcoded clusters).
- **Convert to DPR:** the backend has **no** `need → proposal` conversion endpoint and no `development_need_id` in the proposal contract — so no fake reference is invented. The button opens the real `/linedept/planning/new` wizard and prefills only backend-supported step-1 fields (`title`, `village`, `block`, `gap_score`). The missing need-linkage between needs and proposals is reported as a backend gap.

## 10. DPR repository

- `GET /api/proposals/?department=<pk>&district=<pk>` for all views; `view` statuses map to the **backend** vocabulary (`drafts→DRAFT_DPR`, `submitted→PENDING_REVIEW`, `approved→APPROVED`, `rejected→REJECTED`) via `proposalApi.STATUS_TO_BACKEND`.
- `sanctioned` = client-side filter over backend statuses `SANCTIONED | IN_EXECUTION | COMPLETED` (backend has no list filter for multiple statuses — documented); `returned` = proposals with backend `review_notes` (no RETURNED status exists in the contract — documented gap).
- No hardcoded PRP IDs anywhere — `proposalId` is always the backend `proposal_id`.

## 11. DPR wizard (7 steps)

- Step 1 create → `POST /proposals/`; subsequent saves → `PATCH` (step 1) and `step2-survey-inspection / step3-technical-dpr / step4-financial-estimation / step5-clearances / step6-attachments` per step; submit → `/submit/`.
- Every save re-fetches `GET /proposals/{id}/` and re-hydrates the form from the backend record (`formFromProposal`), so backend is the source of truth after save/reload. Step-completion indicator derives from backend fields, not local state.
- Attachments only report success from the backend register after upload; no fake "uploaded" state.
- No `window.location.reload()` anywhere; mutations invalidate `DATA_SCOPES.PROPOSALS + PLANNING (+ PROJECTS/DASHBOARD on sanction)` via `dataVersionStore`, and the page re-fetches on the version counters.

## 12. Local storage

- The planning route reads **zero** localStorage keys. Repo-wide persist entries:
  - `ndisp-auth-profile` — the session profile (legitimate authenticated context).
  - `identityStore` persist — RBAC role/employee seed (not planning data).
  - `ndisp-project-engine-v2` — projectEngine sample store; **not read or written by the planning path**; consumers are only the unrouted demo workspaces and the (label-only-for-planning) provider context.

## 13. projectEngine

- `DepartmentPlanningWorkspace.jsx` imports: `useDepartment`, `useCurrentUser`, `useCan`, API modules, data-version store, UI store — **zero** `useProjectEngine`/`projectEngine` references (grep-verified). Its only context read is `dept` (profile-derived label + registry visuals).
- The provider still subscribes engine slices for the unrouted demo workspaces; that is outside the planning production path and was left intact.

## 14. Error handling

- Dashboard fetch failure → `errorBox(dashboardError.message, retry)`; proposal fetch failure → its own error box with Retry; the wizard shows `actionError` inline. No branch falls back to seeded/demo/derived data after a failure. Loading renders skeleton/text without any mock rows; empty responses render the designed empty states.

## 15. Network verification

Real-session browser capture could not be executed (no credentials in this session). The verified request contract the page now issues on load of `/linedept/planning`:
- `GET /planning/dashboard/`
- `GET /proposals/?department=<pk>&district=<pk>`
plus (non-dashboard views): `GET /proposals/?status=<STATE>&department=<pk>&district=<pk>`; sanctioned view adds `GET /projects/?department=<pk>`; wizard add/`View/Resume` adds `GET/POST/PATCH /proposals/…`. No engine, simulation or mock endpoints can be reached from this route (import graph contains none).

## 16. Tests

| Scenario | Result |
|---|---|
| A. Dept Head → planning | Code-verified: dept pk from profile, list + dashboard fetch scoped by it. Needs live session for capture |
| B. Refresh | Re-fetch by design (no client persistence of planning data; auth session restored) |
| C. Navigate away → back | `useAsync` re-fetches; version counters trigger refetch after mutations |
| D. Change department context | Topbar department switch is DM/collector-only; for dept heads the department is the profile's (fixed by account) |
| E. Create proposal | `POST /proposals/` verified in code path (needs live session to execute) |
| F. Save DPR step | Step endpoints per §11 (same) |
| G. Submit | `/submit/` (same) |
| H. View / Resume | `GET /proposals/{id}/` hydrates wizard (same) |
| I. Approve/reject/sanction via DM flow | DM flow routes elsewhere; proseal sanction creates backend project (Phase 3). Live session required |
| J. Empty proposals | `[]` → `emptyLabel="No proposals in this view yet"` — no sample rows injected |
| K. API error | Error box + Retry (no fallback) |
| L. Logout/login another dept | Profile-driven pk changes filter dynamically (code-verified; live session required for capture) |

## 17. npm run lint

`eslint src` — **clean** (no output, exit 0).

## 18. npm run build

`vite build` — **success**, 2540 modules, dist generated (chunk-size warning pre-existing, unrelated).

## 19. Remaining backend gaps (planning scope only)

- **Development-need → proposal linkage**: no conversion endpoint and no `development_need_id` field — "Convert to DPR" prefills fields only; the need reference is lost cross-domain.
- **RETURNED status**: not in the backend status vocabulary; the "Returned" view is a `review_notes`-based derivation.
- **Multi-status list filtering**: `GET /proposals/` accepts one status; "Sanctioned & In Execution" needs a client-side union over `SANCTIONED/IN_EXECUTION/COMPLETED`.
- District filter on `/proposals/` is pass-through (supported in the API helper; backend support should be confirmed in a live session).
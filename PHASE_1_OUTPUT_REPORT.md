# PHASE 1 OUTPUT REPORT — DM/Collector Decision Dashboard

**Date:** 2026-08-20
**Scope:** Transform the DM/Collector landing experience into a decision-support-first dashboard answering *"What requires my attention in the district?"* — explicitly not a generic KPI dashboard.
**HEAD:** db540ff (Phase 0 changes + Phase 1 changes uncommitted)

---

## 1. Objective recap

The landing experience for District Magistrate / District Collector (and ADM / State Admin) was the old tabbed `DistrictCommandPlatform` cockpit, most of whose tabs only showed "backend gap" toasts. It has been replaced with a decision dashboard built on the existing backend data layer and GIS stack. Every section answers a decision question, every number is clickable, and every number discloses its source, its exact calculation, and its last-updated time.

## 2. What changed

### New files (`src/features/admin/decisionDashboard/`)

| File | Purpose |
|---|---|
| `DecisionDashboard.jsx` | Page orchestrator: loads data via the hook, renders sections in config order, wires drill-down/map/proposal/complaint flows, lazy-mounts expensive sections, shows the live-data provenance header. |
| `useDecisionDashboard.js` | Data hook. Bounded parallel fetch (`Promise.allSettled`): dashboard envelope (role-aware), proposals, project summary, district allocations, facilities, heatmap. Reuses the app-wide complaint registry. Per-source status/error/loadedAt. No polling — refresh is explicit. |
| `decisionDashboardConfig.js` | Role-aware registry: role → title, data scope, section set. DM/Collector/ADM → district-wide full set; State Admin → state scope; System Admin → minimal set. Department roles resolve their own dashboards via the department registry (documented contract, not duplicated here). |
| `priorityScoring.js` | Pure, testable derivation: priority areas, score components, gap tiers, pipeline buckets, citizen signals, action queue, KPIs, health snapshot. No data fabrication — empty collections yield empty states. |
| `SituationMap.jsx` | District situation map (section B) reusing `MapView`, `GapScoreLegend`, department chips, grievance hotspot heat overlay, district-boundary layer, gap-threshold slider. Clicking a marker or priority area opens the decision detail panel in the sidebar. |
| `PriorityDetailPanel.jsx` | The "why" panel: score ring, score components (each with its own note), affected population, department, recommended action, evidence (open complaints with status), existing intervention (linked proposals/projects). |
| `KpiRow.jsx` | Section A — the critical signal row (critical gaps, high-priority locations, facilities at risk, projects pending action). Each card is a drill-down entry point with source + definition + updated time. |
| `PriorityAreas.jsx` | Section C — ranked priority area cards (rank, priority level, score, reason components, affected population, department, recommended action, evidence counts). Clicking selects the area on the map. |
| `HealthSnapshot.jsx` | Section D — health metrics rendered ONLY when backend telemetry exists. With the health module config-only, every metric reports an honest "Data not available" state; infrastructure readiness is derived from health-facility attributes when present. |
| `CitizenSignals.jsx` | Section E — recurring citizen reports grouped by village+category, visually separated from administrative workflow facts (SLA breaches, escalations) so perception is never confused with fact. |
| `PlanningPipeline.jsx` | Section F — Priority → Intervention → DPR → Budget → Sanction → Execution → Monitoring funnel from proposal statuses; each stage opens a drawer of its proposals. |
| `BudgetCard.jsx` | Section G — sanctioned / allocated / utilized / balance from district allocations with utilization bar; honest empty/error states. |
| `ActionQueue.jsx` | Section H — DM attention items ranked by urgency (escalations, SLA breaches, proposals awaiting sanction/review, due inspections), each opening the relevant detail. |
| `SectionCard.jsx` / `Provenance.jsx` | Shared section chrome: loading skeleton, error+retry, and the auditability footer (source / definition / updated-at) used by every section. |

### Modified files

| File | Change |
|---|---|
| `src/App.jsx` | `/admin` index and `/admin/collector-dashboard` now render `DecisionDashboard`; the old cockpit is preserved at `/admin/command-platform` (not in nav). |
| `src/config/navigation.js` | Admin nav first item relabeled "Decision Dashboard". |

## 3. Routes

- `GET /admin` and `/admin/collector-dashboard` → **DecisionDashboard** (the DM/Collector landing).
- `GET /admin/command-platform` → preserved legacy cockpit (unchanged behaviour).

## 4. API contracts used (all pre-existing backend endpoints)

| Endpoint | Used for |
|---|---|
| `GET /dashboards/dm/`, `GET /dashboards/district-collector/`, `GET /dashboards/adm/`, `GET /dashboards/state/` | Role-aware dashboard envelope (kpis, status/priority/department breakdowns, recent activity, generated_at) |
| `GET /api/complaints/` (shared registry) | Complaint-driven signals, SLA/escalation facts, hotspot evidence |
| `GET /api/facilities/` (cached, scored client-side) | Facility gap scoring, at-risk flags, department/village context |
| `GET /api/complaints/heatmap/` | Grievance hotspot overlay |
| `GET /api/gis/layers/District_boundary/` | District boundary layer toggle |
| `GET /api/proposals/` | Planning pipeline buckets, planning-pressure priority areas |
| `GET /api/projects/summary/` | Inspections-due count (state-wide scope caveat, disclosed in the KPI definition) |
| `GET /api/district-allocations/` | District budget section |

All fetches run in parallel (6 requests max), reusing the shared facility cache and complaint registry — no per-card polling.

## 5. Decision model (transparency contract)

Every derived number discloses how it was computed:

- **Facility gapScore** = 50% (1 − same-category coverage) + 50% isolation, a client-side spatial heuristic over the real positions returned by `GET /api/facilities/` — labelled as a heuristic in every panel, never presented as a backend fact.
- **Complaint pressure** = weighted count of open complaints by location using backend fields (priority, escalation state, SLA breach).
- **Planning pressure** = proposal priority + population impact (backend fields).
- **KPIs** carry `source` (endpoint) + `definition` (exact formula) + `updatedAt` (load time) in the UI and in the report below.

## 6. Screens implemented (sections A–H)

1. **A · Critical signal row** — 4 clickable cards; drill into map / priority list / pipeline.
2. **B · District situation map** — configurable overlays (facilities by dept/gap, hotspots, district boundary, department layers, gap threshold). Clicking a marker/area opens the decision panel.
3. **C · Priority areas** — ranked cards with score ring, components, population, department, recommended action; click → map select + detail panel.
4. **D · Health snapshot** — honest data-availability states (telemetry not deployed) with infrastructure-readiness derived from health facility attributes where present.
5. **E · Citizen signals** — recurring citizen reports vs. administrative workflow facts, visually separated.
6. **F · Planning pipeline** — 7-stage funnel from proposal statuses; each stage opens its proposals.
7. **G · Budget** — sanctioned/allocated/utilized/balance with utilization bar.
8. **H · Action queue** — urgency-ranked DM attention items, each opening the relevant detail.

## 7. RBAC / role-awareness

- DM / District Collector / ADM land on the decision dashboard with a district-wide data scope and the full section set.
- State Admin / System Admin land on the same shell with a state-scope header and a reduced section set.
- Department roles (department_head, department_officer, supervisor, engineer, field_inspector) are explicitly excluded from the admin decision config and continue to resolve their own dashboards through the department registry (`DepartmentRegistry` + `DepartmentLayout`). `decisionDashboardConfig.DEPARTMENT_ROLES` documents the contract for extending the registry with department-specific dashboards.

## 8. Performance

- Single bounded parallel load (≤6 requests) with shared caches; sections below the fold lazy-mount via `IntersectionObserver` (Leaflet map and heavy lists initialise only when scrolled near).
- No frontend polling; refresh is explicit; the complaint registry re-derives after mutations via its `dataVersion` invalidation.

## 9. Acceptance criteria — status

| Criterion | Status |
|---|---|
| DM login immediately shows district situation + priority + gaps + action queue | ✅ Implemented (index route) |
| Priority question reachable within 2–3 interactions (KPI → priority area → detail) | ✅ Implemented (verified by design + tests) |
| Every KPI has source + calculation definition + last-updated | ✅ Implemented (Provenance footer + KPI definitions) |
| No decorative cards — every card is a decision entry point | ✅ Implemented |
| Health snapshot only when backend data exists | ✅ Implemented (honest empty states) |
| Citizen perception separated from administrative facts | ✅ Implemented |

## 10. Test results

- `node scripts/decision-dashboard.test.mjs` — **11/11 assertions pass** (gap tiers, priority-area derivation, pipeline buckets, citizen-signal separation, action-queue ordering, KPI provenance, health snapshot honesty, role-aware config).
- `npm run lint` — **0 errors, 0 warnings**.
- `npm run build` — **succeeds** (index chunk 2,495 kB — pre-existing advisory only, unchanged from baseline).
- `node scripts/citizen-qa.mjs` — **25/25 PASS** (citizen portal regression unaffected).

## 11. Backend dependencies / caveats (⚪ runtime-verify)

| Capability | Dependency | Status |
|---|---|---|
| Health telemetry (HR, medicine, vaccination, risk) | No endpoints deployed | ⚪ UI shows "Data not available" — backend must deploy telemetry endpoints to light up Section D |
| Population/accessibility overlays | No population endpoint in scope | ⚪ Affected population only where facilities/proposals carry the field; otherwise "Not available" |
| District-boundary layer | `GET /api/gis/layers/District_boundary/` | ⚪ toggles only when the catalog serves the layer |
| Projects pending action | `GET /api/projects/summary/` is state-wide | ⚪ scope caveat disclosed in the KPI definition |
| District allocations budget | `GET /api/district-allocations/` requires district-scoped access | ⚪ 403 surfaces as an honest empty state |

## 12. Files changed (working tree)

```
 M scripts/citizen-qa.mjs            (Phase 0)
 M src/App.jsx                      (Phase 1 routes)
 M src/config/navigation.js         (Phase 1 nav label)
 M src/components/map/MapLegend.jsx (Phase 0)
 M src/components/ui/Modal.jsx      (Phase 0)
 M src/features/admin/CollectorExecutiveDashboard.jsx (Phase 0)
 M src/features/admin/platform/DistrictCommandPlatform.jsx (Phase 0)
 M src/features/citizen/CitizenFacilitySheet.jsx (Phase 0)
 M src/features/citizen/CitizenHome.jsx (Phase 0)
 M src/features/citizen/FacilityDetail.jsx (Phase 0)
 M src/features/department/framework/DepartmentDashboardBuilder.jsx (Phase 0)
 M src/features/department/workspaces/DepartmentWorkflowWorkspace.jsx (Phase 0)
 M src/features/linedept/DepartmentOfficerQueue.jsx (Phase 0)
 M src/features/shared/ComplaintDetailHub.jsx (Phase 0)
?? PHASE_0_OUTPUT_REPORT.md            (Phase 0 deliverable)
?? PHASE_1_OUTPUT_REPORT.md            (this report)
?? scripts/decision-dashboard.test.mjs  (Phase 1 tests)
?? src/features/admin/decisionDashboard/ (Phase 1 dashboard, 15 files)
```
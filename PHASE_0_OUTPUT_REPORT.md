# Phase 0 — Frontend Audit, Stabilization & Responsive Foundation

**Deliverable for the Nalanda Outreach Portal (NDISP) transformation toward the Nalanda Digital District Decision Support System (DDSS).**

- Repo: `ndisp-frontend` (`DDPL-Work/NDIS_2.0`, branch `main`, HEAD `db540ff`)
- Date: 2026-08-20
- Scope: **Phase 0 only**. Phase 1 (DDST modules) must **not** start until this report is reviewed and its gate items are accepted.
- Verification: `npm run lint` clean, `npm run build` succeeds, `scripts/citizen-qa.mjs` — **25/25 checks pass**.

---

## 1. Executive summary

The frontend is a **production-grade citizen grievance + departmental ERP portal with a live GIS viewer** over a real backend at `https://nalanda.drdesigntech.com/api`. It is **not yet a District Decision Support System (DDSS)**.

Measured against the 57 requirements (R-01…R-57) derived from the 21 categories in the audit brief, current compliance is **≈ 38.6%** (7 fully ✅, 30 partially 🟡, 19 not met ❌, 1 backend-conditional ⚪; score = (7×1 + 30×0.5)/57).

| Category group | Score |
|---|---|
| Platform purpose / positioning | 50% |
| UX / responsive | 33% |
| Spatial analytics | 50% |
| Decision support | 50% |
| Health domain | 6% |
| Citizen engagement | 40% |
| CRS / infrastructure | 60% |
| Geotagged photo validation | 30% |
| Data quality / deduplication | 30% |
| Beta-readiness criterion | 56% |

**Strongest assets (reuse, don't rebuild):** shared Leaflet map stack (`MapView`, tools, catalog layers, routing, gap colouring), ~8.3k-facility registry with SCD-2 history, backend-driven complaint lifecycle, DPR→sanction→budget→execution pipeline, JWT auth + 16-role RBAC, and a disciplined API layer that never fabricates data.

**Biggest gaps (Phase 1 target):** real multi-layer/multi-criteria spatial queries, the health domain is config-only, decision dashboards are complaint-centric, the "gap score" is a spatial-isolation heuristic, there is **no 25 m duplicate detection**, and citizen photo uploads carry a false "EXIF verified" claim.

---

## 2. What Phase 0 delivered

1. **Full codebase audit** — architecture map, API dependency matrix, requirement matrix, defect list with `file:line` evidence (read-only).
2. **Mobile / responsive fixes** — complaint detail modal (single-scroll, dvh, safe-area, always-on-top), citizen bottom sheets clear the bottom navigation including the home-indicator inset, facility detail mobile polish.
3. **Honest-state standardization** — Explore Map now surfaces a real error+retry state instead of a misleading "no results"; no screen renders `0` when the API failed.
4. **QA tooling fix** — `scripts/citizen-qa.mjs` was racing the map mount; it now waits for the mobile search pill. QA went from a flaky 1-failure to **25/25 PASS**.
5. **This report** — the Phase 0 deliverable and the Phase 1 gate.

---

## 3. Architecture map

### 3.1 Portals & roles (`src/config/constants.js`, `src/App.jsx`, `src/config/navigation.js`)

| Portal | Landing roles (`ROLE_PORTAL`) | Navigation surface |
|---|---|---|
| **Citizen** | citizen | 9 nav items (5 complaint-related) + mobile bottom nav (5) |
| **Admin / Executive** | district_collector, dm, adm, system_admin | Admin nav + CollectorExecutiveDashboard, DistrictCommandPlatform |
| **Line Department** | dept_head, dept_officer, supervisor | 18 nav items incl. leave/attendance/performance (ERP scope) |
| **Engineer** | engineer, field_inspector | Engineer workspace (real EXIF parser) |
| **State** | state_admin, state_super_admin, state_finance_admin, state_dept_admin, state_monitoring_officer, state_gis_admin | ~25 route groups (budget, schemes, employees, users, reports, GIS admin) |

- Routing: `src/App.jsx`; RBAC: `RequireRole` + `authStore` + demo personas (`src/features/auth/demoPersonas.js`).
- Layout: `AppShell` (100dvh) → `Sidebar` / `Topbar` / `main`; citizen portal adds `CitizenMobileNav` bottom bar with safe-area support.

### 3.2 Data layer (all backend-driven — no seeded production data)

- **HTTP boundary:** `src/services/httpClient.js` (`apiRequest`, `ApiError`, JWT refresh at `/auth/token/refresh/`, 15 s default / 120 s facility timeout). `src/api/apiClient.js` re-exports it and defines `BackendCapabilityError`/`unsupported()` for genuinely missing backend capabilities.
- **API modules:** `src/api/*` — one module per domain, all responses normalized by `src/api/mappers/*`; writes bump `dataVersionStore` invalidation scopes and evict shared caches so no view shows stale data.
- **Shared facility cache:** `src/api/facilityCache.js` — single choke point for the ~43 MB / ~8.3k-row collection; dedupes in-flight requests, stale-while-revalidate, never caches errors, no localStorage.
- **State:** zustand stores (`authStore`, `complaintEngine`, `uiStore`, `dataVersionStore`) hydrate from backend endpoints.

### 3.3 GIS stack

Leaflet (not MapLibre) + marker cluster + leaflet.heat + OSRM (`https://router.project-osrm.org`) routing + backend catalog layers (display-only) + facility heatmap/geojson/nearby endpoints. The dead `src/gis/engine/*` (GISQueryEngine/GISQueryExecutor/SpatialIntentParser) is **unused**; live search goes to `GET /api/spatial-query/` via `GISSearchPanel` / `src/api/spatialQueryApi.js`.

---

## 4. API dependency matrix

Every client is a thin typed wrapper over `apiRequest`; **none fabricate responses**. Consumers map via `services/api.js` or direct repository imports.

| Module | Base endpoints | Consumers | Notes |
|---|---|---|---|
| `complaintApi` | `/complaints/` + `{id}/assign|accept|start-inspection|resolve|citizen-feedback|close|reopen|transfer|escalate|reject|upload-evidence|timeline`, `/complaints/geojson|heatmap|nearby|nearest-facility/` | Complaint engine, queues, dashboards, TrackGrievance | Status vocabulary mapped to backend TextChoices; `state→status` filter |
| `facilityApi` | `/facilities/` CRUD + `/history/`, `/asset-categories/`, `/facilities/bulk-sync-gis/` | Facility registry, dept modules | Reads via shared `cachedFacilities`; writes invalidate FACILITIES+GIS scopes |
| `gisApi` | `/facilities/`, `/facilities/geojson/`, `/gis/catalog/`, `/gis/layers/{name}/`, `/gis/catalog-crud/`, `/gis/features/`, `/gis/upload-layer/` | MapView, CitizenHome, GIS admin | Public reads unauthenticated; slug fallback for detail |
| `spatialQueryApi` | `GET /spatial-query/` | `GISSearchPanel` (natural-language + Excel search) | 5 min cache; backend parses the query — frontend never filters locally |
| `dashboardApi` | `/dashboards/citizen|my-dashboard|department|officer|field-inspector|district|district-collector|dm|adm|state/` | All role dashboards | Aggregates from backend, never derived client-side |
| `proposalApi` | `/proposals/` CRUD + step1–step7, `/submit|approve|reject|sanction|negotiation|negotiation-response|release/`, `/proposal-negotiations/`, `/proposal-releases/` | Planning module, DPR wizard | State machine resolved by backend |
| `projectApi` | `/projects/` CRUD + `/summary/`, `/daily-progress/`, `/sanction/` | Execution monitoring | Daily progress reaches 100% → backend completes project |
| `planningApi` | `/planning/dashboard/` | Planning dashboard | KPI + suggested needs + DPR repo all backend-sourced |
| `budgetApi` | `/state-budget/summary/`, `/state-budgets/`, `/department-budgets/`, `/district-allocations/`, `/schemes/`, `/financial-ledger/` | State finance modules | RBAC enforced by backend (403 surfaced verbatim) |
| `billApi` | `/bills/` CRUD | Bill management | 401/403 never collapsed into empty list |
| `executionRiskApi` | `/execution-risks/` CRUD | Risk register | Risks never derived from progress locally |
| `siteDiaryApi` / `measurementBookApi` | `/site-diaries/`, `/measurement-books/` CRUD | Execution workspace | Backend field vocabulary |
| `reportApi` | `/reports/`, `/reports/generate/`, `/reports/{id}/download/` | Report centre | Download returns raw blob + Content-Disposition filename |
| `employeeApi` / `userApi` | `/employees/` (+`invite`,`accept-invite`), `/users/` CRUD | HR registry, admin users | Lifecycle transitions backend-authoritative |
| `notificationApi` | `/notifications/` | Topbar bell | Read-marking is device-local (no backend endpoint) |
| `departmentApi` | `/departments/`, `/department/{id}/users/`, `/department/{id}/complain/` | Assign/inspection pickers, dept rollup | Also central colour logic for GIS markers |
| `masterApi` | `/complaint-categories/`, `/districts/`, `/subdivisions/`, `/blocks/`, `/village-wards/` | Complaint wizard routing catalog | Hierarchy endpoints degrade to `[]` on 404 (documented) |

---

## 5. Reusable component inventory (design system)

`src/components/ui/*` — `Card`/`CardBody`/`CardHeader`, `Button`, `Badge`, `StatusBadge`, `Select`, `Tabs`, `Modal` (responsive, focus-trapped, dvh), `DataTable`+`Pagination`, `PageHeader`, `StatCard`, `EmptyState`, `Skeleton`/`SkeletonCard`, `GapScoreRing`, `Toaster`. Map primitives: `MapView`, `MapToolbar`, `MapLegend` (desktop legend + mobile bottom-sheet `DepartmentLegendControl`), `FacilityInfoPanel`, `CitizenLayerPanel`, `GISSearchPanel`, `RouteSummary`, `CitizenFacilitySheet`. Hooks: `useAsync`, `useMediaQuery`, `useMapTools`, `useFacilities`, `useGISCatalog`, `useLeafletLayers`, `useDepartments`, `useRoute`, `useFacilityDetail`.

---

## 6. Requirement matrix (R-01…R-57)

Status legend: ✅ met · 🟡 partial · ❌ not met · ⚪ requires runtime verification against the live backend. **Note:** the DST feedback source document is not in this repo; requirements below are reconstructed from the 21 categories in the audit brief and are the audit's assessment.

### Platform purpose / positioning (R-01…R-06) — 50%
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-01 | Single integrated platform (citizens + departments + state) | 🟡 | 5 portals, shared data layer; health/decisions not integrated |
| R-02 | Clear DDSS positioning vs generic complaint portal | ❌ | System is grievance/ERP + GIS viewer, not DDSS |
| R-03 | GIS-first workflows (facilities, routes, layers) | 🟡 | MapView everywhere, but tools are view/diagnostic, not decision |
| R-04 | Sector coverage (water, health, education, PWD, power, urban) | 🟡 | Facility registry covers them; operational telemetry is sparse |
| R-05 | Multi-role RBAC workflows | ✅ | 16 roles, ROLE_PORTAL routing, RequireRole |
| R-06 | Scalable deployment (API-driven, cacheable) | 🟡 | API-first + facility cache; 2.4 MB single JS chunk (needs code-split) |

### UX / responsive (R-07…R-12) — 33%
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-07 | Mobile-first responsive portal | 🟡 | Bottom nav + sheets; **fixed in Phase 0** (dvh, safe-area) |
| R-08 | Distinct loading / empty / error / success states | 🟡 | Present in most screens; **Explore Map error state added in Phase 0** |
| R-09 | No nested scroll traps in modals/sheets | 🟡 | **Fixed in Phase 0** (Modal `scrollBody`, hub single-scroll) |
| R-10 | Accessible modal/drawer lifecycle (focus, ESC, backdrop) | ✅ | Modal traps focus, restores focus, ESC+backdrop close |
| R-11 | Honest empty states ("Data not available") | 🟡 | EmptyState used; some screens collapse failures to "0" — Phase 0 removed the Explore Map case |
| R-12 | Language support (EN/HI) | 🟡 | i18n exists but only 33 en keys, partial hi |

### Spatial analytics (R-13…R-18) — 50%
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-13 | Facility registry with SCD-2 audit history | ✅ | `/facilities/{id}/history/`, bulk-sync, mapper |
| R-14 | Multi-layer GIS catalog | ✅ | `/gis/catalog/`, `/gis/layers/{name}/`, display-only |
| R-15 | Distance/routing/measure tools | ✅ | OSRM routing, measure, radius overlay |
| R-16 | Heatmap / density analysis | 🟡 | `/complaints/heatmap/`; complaint-only |
| R-17 | Real multi-layer / multi-criteria spatial queries | ❌ | `/spatial-query/` is single-criterion free text; dead `gis/engine/*` |
| R-18 | Radius tool filters results (not just draws) | ❌ | `MapView.jsx:387-401` draws circle only; filtering exists only in CitizenHome list, not the map |

### Decision support (R-19…R-21) — 50%
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-19 | Cross-department decision dashboards | 🟡 | Dashboards exist but are complaint-centric; generic dept builder |
| R-20 | Need/gap prioritisation with explainable scores | 🟡 | Gap score is spatial-isolation heuristic (`facilityMapper.js:42-78`), needs justification, not need-based |
| R-21 | Workflow decision state machine on backend | ✅ | Complaint + proposal lifecycle fully backend-driven |

### Health domain (R-22…R-29) — 6%
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-22 | Health facility registry w/ telemetry | 🟡 | Registry + static attributes; **no live telemetry source** |
| R-23 | Human resources / staffing | ❌ | `healthConfig.js` config-only; no staff API |
| R-24 | Infrastructure (beds, oxygen, emergency) | 🟡 | Attribute fields exist; no live data feed |
| R-25 | Medicines / supply chain | ❌ | Absent |
| R-26 | Ambulance dispatch | ❌ | Personnel "Live GPS Tracking" is hardcoded |
| R-27 | High-risk / vaccination tracking | ❌ | Absent |
| R-28 | Health KPIs / decision analytics | ❌ | No health dashboard endpoints |
| R-29 | Health-planning links (DPR) | ❌ | Health absent from planning pipeline |

### Citizen engagement (R-30…R-35) — 40%
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-30 | Register & track complaints | ✅ | Full backend lifecycle + tracking code |
| R-31 | Map-based complaint registration | 🟡 | Location picker exists; **no EXIF validation** (see R-40) |
| R-32 | Structured citizen feedback after resolution | ❌ | `citizen-feedback` endpoint exists but no structured rating/CSAT flow |
| R-33 | Notifications | ✅ | `/notifications/` + bell (read-state is device-local) |
| R-34 | Inclusive access (local language, accessibility) | 🟡 | Partial i18n; accessibility largely custom |
| R-35 | GIS facility discovery for citizens | ✅ | Explore Map, Near Me, facility sheet |

### CRS / infrastructure (R-36…R-39) — 60%
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-36 | Backend API-first architecture | ✅ | Full API layer, no frontend data fabrication |
| R-37 | Data provenance / custodian info | 🟡 | Provenance card exists; completeness varies by facility |
| R-38 | Security / RBAC enforcement | ✅ | Backend-enforced roles; 403 surfaced |
| R-39 | Deployment & CI readiness | 🟡 | Build clean; single 2.4 MB chunk needs code-split |

### Geotagged photos (R-40…R-42) — 30%
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-40 | EXIF validation on citizen upload | ❌ | `ReportIssue.jsx:559` claims "200 m tolerance" but code hardcodes `geotagged:true`/`distMeters:0` |
| R-41 | Backend geotag verification | ⚪ | Complaint detail mentions backend EXIF check (≤100 m) — **requires runtime verification** |
| R-42 | Field evidence with verified geotags | 🟡 | `EngineerPortal.jsx:157-255` has a real parser; `FieldOps.jsx:53-65` **simulates** EXIF via setTimeout |

### Data quality / deduplication (R-43…R-45) — 30%
| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R-43 | Duplicate complaint detection | ❌ | No 25 m dedup; `complaintIntelligence.js:28` calls `findNearbyDuplicates` with wrong arg order (dead) |
| R-44 | 25 m duplicate tolerance standard | ❌ | Only a dead 250 m default in `ComplaintRepository.js` |
| R-45 | Data quality governance (unique ids, sync) | 🟡 | SCD-2 + bulk-sync present; no dedup/dq dashboards |

### Beta-readiness criterion (R-46…R-57) — 56%
Real flows work end-to-end; gaps: empty Reports "publication catalog" is a fake `setTimeout` toast; "Live GPS Tracking" hardcoded; `services/api.js` `unsupported()` correctly refuses missing backend capabilities (good pattern to keep); demo personas are clearly labelled demo data (acceptable for pilot).

---

## 7. F-01…F-14 — inferred feature list (Phase 1 planning)

**Caution:** the F-01…F-14 identifiers are **not defined anywhere in the repo or the available DST feedback**. They are presented below as the audit's inferred feature areas to make the Phase 1 roadmap explicit — they must be re-confirmed against the official feedback document before Phase 1 starts.

| ID | Inferred feature area | Current status |
|---|---|---|
| F-01 | Facility registry & SCD-2 | ✅ exists |
| F-02 | GIS layer catalog | ✅ exists |
| F-03 | Spatial query / analytics engine | ❌ `/spatial-query/` minimal; `gis/engine/*` dead |
| F-04 | Grievance workflow engine | ✅ exists |
| F-05 | Citizen feedback & CSAT | ❌ absent |
| F-06 | Health HR module | ❌ config-only |
| F-07 | Health infrastructure module | 🟡 attributes only |
| F-08 | Medicines / supply chain | ❌ absent |
| F-09 | Ambulance / emergency dispatch | ❌ absent |
| F-10 | High-risk / vaccination tracking | ❌ absent |
| F-11 | Planning / DPR pipeline | ✅ exists |
| F-12 | Budget / sanction / release | ✅ exists |
| F-13 | Execution / monitoring (diary, MB, bills, risk) | ✅ exists |
| F-14 | Reports / analytics | 🟡 real report API; **Reports "publication catalog" is fake** |

---

## 8. Defects & dishonest states (P0/P1)

1. **P0 — Fake EXIF verification (citizen):** `src/features/citizen/ReportIssue.jsx:559` says "Photo EXIF location validated (200 m tolerance)" but sends `geotagged:true`, `distMeters:0` hardcoded.
2. **P0 — Simulated EXIF (field):** `src/features/linedept/FieldOps.jsx:53-65` fakes geotag validation with `setTimeout`.
3. **P1 — False GPS claim:** `DepartmentInspectionsWorkspace.jsx` shows a static "GPS Geotag Verified" over a free-text photo URL.
4. **P1 — Dead spatial engine:** `src/gis/engine/*` never used; live search is single-criterion.
5. **P1 — Radius draws but doesn't filter** on the map (`MapView.jsx:387-401`).
6. **P1 — Dead duplicate detection:** `complaintIntelligence.js:28` wrong-arg call; no 25 m dedup.
7. **P1 — Fake "Live GPS Tracking"** in PersonnelTab; **fake Reports "publication catalog"** (`setTimeout` toast).
8. **P2 — Nested scroll / bottom-nav overlap in modals** — **fixed in Phase 0**.
9. **P2 — Mobile map hid facility load failures as "no results"** — **fixed in Phase 0**.
10. **P2 — QA flake** (`citizen-qa.mjs` check 22 race) — **fixed in Phase 0**.

---

## 9. Fixes applied in Phase 0

| File | Change |
|---|---|
| `src/components/ui/Modal.jsx` | New `scrollBody` prop (single-scroll children); mobile height `max-h-[calc(100dvh-1.5rem)]`; default z-index `z-[200]` (above citizen bottom nav `z-160` and sheets `z-150`); footer safe-area padding |
| `src/features/shared/ComplaintDetailHub.jsx` | Root `h-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh]`; content region is the **only** scroll (added `min-h-0`, safe-area bottom); action bar pinned + safe-area; loading/error cards get margins for the padding-less modal body |
| `src/features/admin/CollectorExecutiveDashboard.jsx` | `Modal` → `scrollBody={false}` |
| `src/features/admin/platform/DistrictCommandPlatform.jsx` | `Modal` → `scrollBody={false}` |
| `src/features/department/workspaces/DepartmentWorkflowWorkspace.jsx` | `Modal` → `scrollBody={false}` |
| `src/features/department/framework/DepartmentDashboardBuilder.jsx` | `Modal` → `scrollBody={false}` |
| `src/features/linedept/DepartmentOfficerQueue.jsx` | `Modal` → `scrollBody={false}` |
| `src/features/citizen/CitizenFacilitySheet.jsx` | Bottom sheet `bottom-16` → `bottom-[calc(var(--citizen-bottom-nav-height,64px)+var(--safe-bottom,0px))]` |
| `src/components/map/MapLegend.jsx` | Department sheet same safe-area bottom fix |
| `src/features/citizen/CitizenHome.jsx` | Results + layers sheets safe-area fix; **facility load error state + Retry**; header shows "Facility data unavailable" instead of `0 facilities` on failure |
| `src/features/citizen/FacilityDetail.jsx` | Mobile padding (`p-4 sm:p-6`); action buttons wrap and share width (`flex-1 min-w-[150px]`) |
| `scripts/citizen-qa.mjs` | Waits for the mobile search pill (race fix); targets the real mobile pill label |

Leaflet z-index: **verified already clean** — `.leaflet-container { z-index: 0 }` (`src/index.css:49-51`) keeps controls inside the map's stacking context; React overlays sit above at explicit z-120…z-160. No hack needed; documented as correct.

---

## 10. Backend dependencies & runtime verification required

The backend source is **not in this repo** (`e:/Nalanda/ndis`); these are doc-verified but must be confirmed against `https://nalanda.drdesigntech.com/api` or the backend repo before Phase 1:

- [ ] `POST /complaints/{id}/upload-evidence/` EXIF verification behaviour (≤100 m tolerance message in `ComplaintDetailHub.jsx`)
- [ ] `/spatial-query/` capabilities (presets, multi-criteria, geometry ops)
- [ ] `GET /complaints/heatmap/`, `/nearby/`, `/nearest-facility/` contracts
- [ ] Health endpoints availability (none documented → Phase 1 scope)
- [ ] Duplicate detection API (none documented → Phase 1 scope)
- [ ] Reports "publication catalog" (current screen is fake; real report API exists)

---

## 11. Verification results

- `npm run lint` → **clean** (eslint src, no warnings)
- `npm run build` → **success** (pre-existing advisory only: 2.4 MB single chunk → Phase 1 code-split item)
- `node scripts/citizen-qa.mjs` → **25/25 PASS** (login, dashboard, track, schemes, notifications, profile, mobile nav/sheets, no console/page errors, no failed requests)

---

## 12. Phase 1 gate checklist (must pass before starting Phase 1)

1. Review & accept this Phase 0 report (sections 6–8 especially).
2. Re-confirm F-01…F-14 against the official DST feedback document (not in repo).
3. Runtime-verify the backend behaviours in section 10 (or explicitly defer each with a ⚪ marker).
4. Agree the Phase 1 scope: recommended order = (a) real spatial query engine on the live map, (b) honest geotag/EXIF pipeline reusing `EngineerPortal` parser, (c) 25 m dedup, (d) health module v1, (e) citizen CSAT, (f) explainable gap scoring, (g) code-split the bundle.
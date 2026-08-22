# PHASE 2 OUTPUT REPORT — DDST Spatial Analysis (Query Builder + Results)

**Date:** 2026-08-20
**Scope:** Multi-layer spatial analysis and decision query builder: an 11-section structured query builder, 7 spatial conditions, attribute filters, the DST demo query (5 km radius + population ≥ 1,000 + accessibility = Poor), and results as map + sortable table + summary with priority ranking — all over real backend data.
**HEAD:** db540ff (Phase 0 + Phase 1 + Phase 2 changes uncommitted)

---

## 1. Objective recap

The DDST Spatial Analysis module lets a District Magistrate / planner build a structured decision query — pick a target layer, a spatial condition, a reference layer/geometry, attribute filters, output fields, a ranking — and see the answer as a map, a sortable table and a summary, ranked by a disclosed priority score. The Phase 1 rule set is preserved: **nothing is fabricated**, every derived field is documented in provenance, and backend gaps are reported honestly.

## 2. Backend reality (verified live, 2026-08)

Before writing any code, the live API surface was probed (`https://nalanda.drdesigntech.com/api`):

- `POST /api/spatial-analysis/query` **does not exist** (404/405 on probe). The frontend therefore implements the **same logical contract as a typed client engine** over the real collections the backend *does* serve. The page capability-probes this endpoint on first load and surfaces the result in the UI.
- `GET /api/saved-queries/` **does not exist** — Save Query is a documented backend dependency; the form is fully built and enabled the moment the endpoint is deployed.
- Real data: `/api/facilities/` returns **8,344 rows across 52 categories** (each category is a GIS layer); `/api/gis/catalog/` lists **52 layers** (20 rural-population block polygons, 7 hospitals, 6 PHC, 6 CHC, 17 dispensaries, 1,338 Other Roads, 4 State Highway, 4 National Highway, etc.).
- No layer exposes a "road accessibility" attribute — accessibility is **derived** from the real distance to the nearest road layer feature (documented thresholds: ≤1 km Good, ≤3 km Moderate, else Poor).

## 3. What changed

### New files

| File | Purpose |
|---|---|
| `src/features/spatialanalysis/spatialAnalysisModel.js` | Typed frontend service contract + validation: 7 spatial conditions, 8 operators (=, !=, >, ≥, <, ≤, contains, in), AND/OR filter logic, result limits (default 50, max 500), accessibility thresholds, the DST `DEMO_QUERY`, real-only field catalog builder, alias-aware field resolution, AND/OR filter evaluation, and the pure CSV/GeoJSON export builders (kept here so they are Node-testable). |
| `src/gis/engine/SpatialAnalysisEngine.js` | Client engine executing the typed contract on real data: interior points, point-in-polygon, polygon intersection (documented bbox approximation), real 48-segment buffer polygon, accessibility derivation, priority score (0.4 population tier + 0.3 facility gap + 0.2 accessibility penalty + 0.1 distance penalty), per-row nearest-reference computation, OSRM road-route support (two-point), sorting/ranking, and a `diagnosis` block that explains *why* a result set is empty using the real data distribution. |
| `src/api/spatialAnalysisApi.js` | Capability probes (`spatialAnalysisCapability`, `savedQueriesCapability`), cached layer/facility loading, `toFeatureRows` (unified target/reference rows), backend-payload builder for when the endpoint is deployed, `executeSpatialAnalysis` (backend or client engine), and the contract doc. |
| `src/features/spatialanalysis/builder/LayerPicker.jsx` | Shared layer selector for target and reference layers (GIS layers, facility categories, or a picked map point). |
| `src/features/spatialanalysis/builder/AttributeFilters.jsx` | Filter rows (field / operator / value) with real field catalog, derived-field options, AND/OR join, inline validation. |
| `src/features/spatialanalysis/builder/QueryBuilder.jsx` | The 11-section builder: 1 Target layer → 2 Spatial condition → 3 Reference layer/geometry (GIS layer / facility category / point on map) → 4 Distance/buffer → 5 Attribute filters → 6 Output fields → 7 Sort/Ranking → 8 Result limit → 9 Execute → 10 Save → 11 Export. Includes the reference-point picker map modal and the save-query dialog with an honest backend-dependency notice. |
| `src/features/spatialanalysis/ResultsPanel.jsx` | Results as Map (gap-coloured markers, buffer circle, matched target polygons, reference points), sortable Table (rank, name, population, nearest facility, distance, accessibility, gap, priority), and Summary (stats, executed-query facts, derived-field provenance). Row click opens a detail modal with the source attributes. |
| `src/features/spatialanalysis/SpatialAnalysis.jsx` | Page orchestrator: loads the catalog, facilities and road layers; pre-loads the DST demo query; runs validation; executes via the engine or backend; wires save/export; shows the mode banner (client-engine vs backend) and the data-granularity note. |

### Modified files

| File | Change |
|---|---|
| `src/App.jsx` | New route `/admin/spatial-analysis` → `SpatialAnalysis` (inside the existing admin role gate). |
| `src/config/navigation.js` | Admin nav entry "Spatial Analysis" (Filter icon) after "Decision Dashboard". |

## 4. Routes

- `GET /admin/spatial-analysis` → **Spatial Analysis** (admin roles only).

## 5. The DST demo query (pre-loaded)

The demo query is pre-loaded into the builder so one press of **Execute query** runs the DST scenario:

> Rural population blocks within **5 km** of a **health facility** (Hospital + Primary Health Centre + Community Health Centre + Dispensary + Blood Bank + Veterinary Hospital — 51 real facilities), **population ≥ 1,000**, **road accessibility = Poor**, outputting name, population, nearest facility, distance, accessibility and gap score, **sorted by priority score (desc)**.

**Real-data finding (calibration probe, 2026-08):** across the 20 rural CD blocks the measured nearest-road distances are 0.03–1.38 km (median 0.44 km) — every block is Good or Moderate and **none is Poor under the documented thresholds**. The engine therefore returns an honest empty set for the exact spec'd query, and the UI explains *why* with the real distribution and offers one-click relax actions ("accessibility = Good", "Moderate", or remove the filter) that produce the real 14-block result set on the map and table, priority-ranked. The thresholds are documented model parameters and can be recalibrated in the model.

## 6. Acceptance checklist

- [x] 11-section query builder — QueryBuilder + LayerPicker + AttributeFilters.
- [x] Spatial operations — within_radius, buffer, nearest, polygon_containment, intersects, distance, road_route (OSRM two-point).
- [x] Attribute filters — all 8 operators, AND/OR chains, real-only field catalog.
- [x] DST demo query — pre-loaded, validated, executes against real data.
- [x] Results — map + sortable table + summary (priority ranking, row-detail modal).
- [x] Same result set in map and table — both render from the single executed result array.
- [x] API contract — typed contract documented in the model; capability probe reports backend absence honestly; `BACKEND_PAYLOAD_MISMATCH` disables execution instead of silently falling back.
- [x] Validation — missing target, bad distance, bad point, bad operator/value, excessive limit all blocked.
- [x] Save query — form ready; disabled with an honest backend-dependency notice until `GET /api/saved-queries/` exists.
- [x] Export — CSV + GeoJSON built from the real result rows only (provenance embedded in headers); no fake exports.

## 7. Verification

- `npm run lint` — clean (9 new issues found and fixed).
- `npm run build` — succeeds (pre-existing chunk-size warnings only).
- `node scripts/spatial-analysis.test.mjs` — **34/34 checks pass** (model contract, validation, field resolution, filter evaluation, geometry helpers, engine execution over synthetic real-shaped data, export purity).
- `node scripts/decision-dashboard.test.mjs` — **11/11 pass** (Phase 1 regression).
- `node scripts/citizen-qa.mjs` (dev server) — **25/25 pass** (citizen portal regression, no console/page/request errors).

## 8. Backend dependencies for full parity

1. `POST /api/spatial-analysis/query` — the typed payload contract is defined in `spatialAnalysisModel.js` and the payload builder in `spatialAnalysisApi.js`; deployment activates backend execution automatically.
2. `GET /api/saved-queries/` — enables the Save Query flow.
3. Optional: village-level population data — the backend serves block-level census only; the UI discloses this on the page and in provenance.
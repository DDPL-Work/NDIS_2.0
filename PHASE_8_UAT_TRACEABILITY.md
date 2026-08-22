# Phase 8 - DST beta hardening and UAT traceability

Date: 2026-08-21. This is an evidence log, not a readiness declaration. `Verified` means static inspection and/or the listed automated check passed. `Conditional` means the frontend surface exists but a live backend dataset or endpoint is required. `Blocked` means the beta demonstration must not claim the capability.

## Automated evidence

| Check | Result | Evidence |
|---|---|---|
| Lint | Verified | `npm run lint` completed successfully. |
| Production build | Verified | `npm run build` completed successfully. Vite retained its pre-existing large-chunk warning. |
| Spatial analysis | Verified | `node scripts/spatial-analysis.test.mjs`: 34 checks passed. |
| DM dashboard | Verified | `node scripts/decision-dashboard.test.mjs`: 11 checks passed. |
| Department decision support | Verified | `node scripts/department-support.test.mjs`: 35 checks passed, including RBAC and optional live catalog check. |

## Demo scenario evidence

| Scenario | Route / component | API / data | Result |
|---|---|---|---|
| 1. Underserved villages | `/admin/spatial-analysis`, `SpatialAnalysis`, `ResultsPanel` | GIS catalog, facilities, road layers; bounded client engine | Verified: 5 km, population, poor accessibility, rank, map and CSV/GeoJSON export. `MAX_RESULT_LIMIT=500`. |
| 2. Hospital readiness | `/admin/department/health`, department support workspace | Facilities and configured telemetry attributes | Conditional: HR/infrastructure are traceable when attributes exist; medicine/workload say `Data not available` with required endpoint. |
| 3. Ambulance access | `/admin/spatial-analysis` | Facility/layer categories and distance/road-route calculation | Conditional: spatial access works; no authoritative ambulance-dispatch dataset is available. |
| 4. Medicine shortage | Health workspace / gap detail | Required medicine endpoint | Blocked: no medicine inventory/warehouse API is integrated; UI must remain unavailable, not zero. |
| 5. Citizen perception | `/citizen/feedback`, admin feedback analytics/map | Feedback API | Conditional: structured feedback and aggregation surfaces exist; requires populated backend feedback. |
| 6. Geotagged evidence | Citizen issue upload and inspection evidence | Backend upload verification contract | Blocked for demo acceptance: client no longer claims local EXIF verification; backend EXIF, boundary, distance and duplicate result are required. |
| 7. Evidence to action | priority dashboard, DPR, approvals, projects | gap, proposal, negotiation, project APIs | Conditional: UI/data handoff implemented; end-to-end proof requires a backend record with final accepted amount and project creation. |

## Requirement matrix R-01 to R-57

| ID | DST requirement | Frontend route/component | API / backend dependency | UAT status |
|---|---|---|---|---|
| R-01 | Integrated platform | Role shells in `App.jsx` | Auth + domain APIs | Verified |
| R-02 | DDST positioning | `/admin` decision dashboard | Dashboard collections | Verified |
| R-03 | GIS-first workflow | `/admin/spatial-analysis` | GIS catalog/layers | Verified |
| R-04 | Multi-sector coverage | Department support configs | Facilities + GIS catalog | Verified |
| R-05 | Multi-role RBAC | `RequireRole`, department access | Auth claims | Verified |
| R-06 | API/scalability | API modules + caches | Backend cache headers | Conditional |
| R-07 | Responsive portal | shared CSS, mobile navigation | Browser UAT viewports | Manual UAT required |
| R-08 | Loading/empty/error distinction | `SectionCard`, `useAsync` workspaces | Endpoint error semantics | Conditional |
| R-09 | Modal scroll safety | `Modal` | Browser UAT | Manual UAT required |
| R-10 | Accessible modal lifecycle | `Modal` | Browser UAT | Manual UAT required |
| R-11 | Honest unavailable data | department model, health snapshot | Missing-source contract | Verified |
| R-12 | EN/HI language support | `i18n` | Translation completeness | Conditional |
| R-13 | Facility registry/history | facility API | `/facilities/` history | Conditional |
| R-14 | GIS catalog | Spatial Analysis | `/gis/catalog/`, layers | Verified |
| R-15 | Distance/routing/measure | Spatial Analysis engine | GIS + optional OSRM | Verified |
| R-16 | Density analysis | Situation map / feedback map | heatmap/feedback APIs | Conditional |
| R-17 | Multi-criteria spatial query | `SpatialAnalysis` | client engine over real collections | Verified |
| R-18 | Radius filters results | query engine | facilities/layers | Verified |
| R-19 | Decision dashboards | `/admin`, department support | dashboard/facilities/proposals | Verified |
| R-20 | Explainable gap/priority | Gap detail, priority cards | gap API or disclosed derivation | Verified |
| R-21 | Backend workflow state | DPR/approval flows | proposal state machine | Conditional |
| R-22 | Health registry/telemetry | health workspace | facilities/telemetry | Conditional |
| R-23 | Health HR | health indicators | HR endpoint/attributes | Conditional |
| R-24 | Health infrastructure | health indicators | facility attributes | Conditional |
| R-25 | Medicines/supply chain | unavailable state | medicine/warehouse endpoint | Blocked |
| R-26 | Ambulance dispatch | spatial capability only | ambulance endpoint | Blocked |
| R-27 | Risk/vaccination | unavailable state | health risk endpoint | Blocked |
| R-28 | Health KPIs | health snapshot | health telemetry APIs | Conditional |
| R-29 | Health DPR linkage | planning workspace | proposal API | Conditional |
| R-30 | Complaint register/track | citizen complaint flows | complaints API | Conditional |
| R-31 | Map complaint registration | `ReportIssue` | complaint API | Conditional |
| R-32 | Structured feedback | citizen feedback wizard | feedback API | Conditional |
| R-33 | Notifications | portal notification views | notifications API | Conditional |
| R-34 | Inclusive access | responsive/i18n components | Browser + translation UAT | Manual UAT required |
| R-35 | Citizen facility discovery | `/citizen/map` | facilities/GIS | Conditional |
| R-36 | API-first architecture | `src/api` mappers | Backend | Verified |
| R-37 | Data provenance | `Provenance`, exports | source/as-of/version fields | Conditional |
| R-38 | Security/RBAC | route guards + department permissions | Backend authorization | Conditional |
| R-39 | Deployment readiness | Vite build | Hosting/CI | Conditional |
| R-40 | EXIF validation | upload components | EXIF verifier | Blocked |
| R-41 | Backend geotag verification | evidence contract | verifier endpoint | Blocked |
| R-42 | Verified field evidence | inspection evidence | verifier result | Blocked |
| R-43 | Duplicate detection | complaint/evidence workflow | duplicate endpoint | Blocked |
| R-44 | 25 m duplicate tolerance | complaint/evidence workflow | duplicate endpoint | Blocked |
| R-45 | Data-quality governance | mappers/history | backend DQ service | Conditional |
| R-46 | Beta demo integrity | this checklist | live UAT evidence | Conditional |
| R-47 | Decision-first DM dashboard | `/admin` | dashboard APIs | Verified |
| R-48 | Spatial query demonstration | `/admin/spatial-analysis` | GIS/facilities | Verified |
| R-49 | Gap explanation demonstration | `/admin/gap-priority` | gap API | Conditional |
| R-50 | Priority ranking demonstration | priority dashboard | gap/proposal data | Conditional |
| R-51 | Feedback visualization | feedback analytics/map | feedback API | Conditional |
| R-52 | Evidence-to-action workflow | priority -> DPR -> sanction | proposal/project APIs | Conditional |
| R-53 | Negotiated final amount | approvals | negotiation API | Verified UI rule |
| R-54 | Sanction-to-execution | approvals/projects | sanction/project APIs | Conditional |
| R-55 | Monitoring | planning pipeline/projects | monitoring endpoint/data | Conditional |
| R-56 | Provenance visibility | `Provenance`, CSV export | source/as-of/version | Conditional |
| R-57 | No fake production data | audited client surfaces | backend verifier/data | Blocked until all legacy mock surfaces are isolated or removed |

## Inferred feature matrix F-01 to F-14

The F identifiers are inferred in Phase 0, not an official supplied mapping.

| ID | Feature | Evidence / status |
|---|---|---|
| F-01 | Facility registry | Conditional - backend data required |
| F-02 | GIS catalog | Verified |
| F-03 | Spatial analytics | Verified (34 automated checks) |
| F-04 | Grievance workflow | Conditional - backend workflow required |
| F-05 | Citizen feedback | Conditional - backend dataset required |
| F-06 | Health HR | Conditional - source data required |
| F-07 | Health infrastructure | Conditional - source data required |
| F-08 | Medicines/warehouse | Blocked - endpoint absent |
| F-09 | Ambulance/emergency | Blocked - endpoint absent |
| F-10 | High-risk/vaccination | Blocked - endpoint absent |
| F-11 | DPR pipeline | Conditional - backend proposal record required |
| F-12 | Budget/sanction/release | Verified UI rule; backend flow conditional |
| F-13 | Execution/monitoring | Conditional - backend project/monitoring data required |
| F-14 | Reports/analytics | Conditional - audit legacy state-admin fixtures before demo |

## Fake-data disposition and release gates

| Finding | Classification | Disposition |
|---|---|---|
| `utils/random.js`, simulation control, demo personas | Development/demo fixture | Must not be enabled in production role paths. |
| `stateConstants.js` authority limits and state-admin stores | Explicit placeholder/in-memory fixture | Exclude state-admin finance screens from DST production demo until API-backed. |
| Citizen issue attachment | Production-facing false EXIF claim | Hardened: client no longer marks a selected file as geotagged or zero-distance. |
| Inspection detail badge | Production-facing false GPS claim | Hardened: now states geotag status unavailable. |
| Line-department FieldOps local EXIF simulation | Production-facing fake behavior | Remaining release gate: replace with backend verifier before showing EXIF scenario. |

## Manual UAT still required

- Exercise listed mobile sizes: 320x568, 360x800, 375x812, 390x844, 412x915, 430x932, 540x1170.
- Exercise desktop sizes: 1366x768, 1440x900, 1920x1080.
- Run a live account through priority -> DPR -> negotiation -> accepted amount -> sanction -> project -> monitoring.
- Verify a live backend response contains source/as-of/model version for each showcased KPI.
- Do not claim geotag, duplicate, ambulance, medicine, or warehouse demonstrations until their authoritative endpoints return data.

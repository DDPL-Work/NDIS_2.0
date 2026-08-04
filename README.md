# NDISP Frontend — National District Infrastructure & Services Portal

A production-structured React frontend for NDISP, covering all three portals from
the LLD (Volumes 1–5): **Citizen**, **Admin (DM/ADM/State Admin)**, and
**Line Department**. This build runs entirely on **mock data** — no backend is
required — but the code is organized so wiring it up to the real API Gateway
later is a matter of editing one file (`src/services/api.js`), not rewriting
the app.

## Quick start

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`). You'll land
on a role picker — pick any persona (Citizen, DM, ADM, Department Officer,
Field Engineer, State Admin) to enter the matching portal. No password is
required; this is a mocked-auth demo build.

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

> **Note on this environment:** this project was authored in a sandbox with no
> network access, so dependencies could not be `npm install`-ed or the dev
> server test-run here. Every source file was syntax-checked with esbuild and
> manually reviewed, but please run `npm install && npm run dev` locally as
> your first step and file an issue if anything doesn't compile.

## What's real vs. mocked

| Layer | Status |
|---|---|
| UI, layout, routing, RBAC route guards | Real, fully wired |
| GIS map (MapLibre GL + public vector basemap) | Real rendering, mock facility geometry |
| Charts (recharts) | Real rendering, mock series |
| Forms (report issue, submit proposal, CSV upload) | Real client-side validation & state transitions |
| Data (facilities, proposals, grievances, KPIs, recommendations) | Deterministically seeded mock data (`src/services/mock/`) |
| Auth | Persona switcher — stands in for government SSO/OIDC |
| PDF/Excel/GIS export | CSV export is real (client-side); PDF/Excel/GIS trigger a toast simulating an async report-queue job |

## Folder structure

```
src/
  app/
    store/            zustand stores — authStore (session/role), uiStore (toasts, sidebar)
    RequireRole.jsx    route guard
  config/
    constants.js       roles, departments, districts, workflow states — single source of truth
    navigation.js       per-portal sidebar nav config
  i18n/
    en.json / hi.json   dictionaries (framework supports adding more locales)
    i18n.jsx             context provider + useI18n() hook
  services/
    mock/               deterministic mock data generators (facilities, workflows,
                         grievances, schemes, analytics, users, notifications, ingestion)
    api.js              the ONLY integration seam — gisApi, workflowApi, analyticsApi,
                         schemeApi, notificationApi, ingestionApi, authApi, masterDataApi.
                         Swap mock data for real HTTP calls here; nothing else needs to change.
  components/
    ui/                 design system primitives (Button, Badge, Card, Modal, DataTable,
                         GapScoreRing, StatCard, Tabs, Select, Toaster, …)
    map/                MapView.jsx (MapLibre GL) + legends
    charts/             TrendChart, BudgetBarChart, CoverageDonut (recharts)
    layout/              AppShell, Sidebar, Topbar (shared chrome across portals)
  features/
    auth/                LoginPage (role picker)
    citizen/             CitizenHome (map explorer), FacilityDetail, ReportIssue,
                         TrackGrievance, Schemes, Reports
    admin/               AdminDashboard, SituationMatrix, Approvals, Tasking,
                         Recommendations, GrievanceOversight, AdminReports, StateRollup
    linedept/            LineDeptOverview, DataUpload, Directives, Proposals, FieldOps
    shared/              FacilityCard, ProposalTimeline, GrievanceTimeline
  App.jsx                router + role-guarded shells for all 3 portals
  main.jsx               entry point
```

## Design system

- **Palette:** deep navy (`ink`), saffron accent, leaf green, alert red — a
  government-portal register without leaning on cliché tricolor kitsch.
- **Type:** Space Grotesk (display), Inter (body), IBM Plex Mono (coordinates,
  IDs, tracking codes, batch numbers — anything that reads as "system data").
- **Signature element:** the `GapScoreRing` — every facility, department and
  AI recommendation carries a 0–1 deficit/gap score from the LLD's Deficit
  Detection Engine (Vol 3 §17.1). Rather than a generic progress bar, this ring
  is used consistently everywhere that number appears, so it always reads the
  same way: green/low = well-served, red/high = underserved.

## Extending this

- **Add a department:** edit `src/config/constants.js` (`DEPARTMENTS`) and
  `src/services/mock/facilitySchemas.js`. Nothing else needs to change — nav,
  filters, map legends and mock generators all read from that config.
- **Add a locale:** drop a new `src/i18n/<code>.json` and register it in
  `src/i18n/i18n.jsx`'s `DICTIONARIES` map.
- **Wire up the real backend:** replace the function bodies in
  `src/services/api.js` with `fetch()`/`axios` calls to the API Gateway. Every
  function already returns a `Promise` with the same shape the mock returns,
  so no calling code should need to change.
- **Add a new role or portal:** add the role to `ROLES`/`ROLE_LABELS`/
  `ROLE_PORTAL` in `constants.js`, add a nav array in `navigation.js`, and add
  a guarded `<Route>` block in `App.jsx` following the existing pattern.

## Known gaps (intentionally out of scope for this pass)

- No real authentication/SSO, no persistence (state resets on reload except
  for the signed-in persona, which is kept in `localStorage` via zustand's
  `persist` middleware).
- PDF/Excel/GIS exports are simulated, not generated.
- Only Nalanda/Rajgir carry a full mock dataset; other districts show a
  lighter dataset consistent with their "Phase 2" rollout status.
- Hindi translations cover the app chrome, not every department-specific
  string — matching the LLD's stated approach of building the i18n
  *framework* now and populating full content at rollout.

# Phase 2 integration report

## Implemented production API layer

| Module | Repository/API boundary | Consumed backend endpoints |
| --- | --- | --- |
| Authentication | `services/auth/AuthRepository.js` | `/auth/login/`, `/auth/signup/`, `/auth/token/refresh/`, `/auth/me/` |
| Complaints | `api/complaintApi.js` | CRUD, timeline, assignment, acceptance, inspection, evidence upload, resolve, citizen feedback, workflow actions, GeoJSON, heatmap, nearby, nearest-facility |
| Citizen / department / officer / district / state dashboards | `api/dashboardApi.js` | `/dashboards/citizen/`, `/department/`, `/officer/`, `/district/`, `/state/` |
| Facilities | `api/gisApi.js` | facilities list/CRUD, GeoJSON and history |
| GIS | `api/gisApi.js`, `gis/repositories/GISRepository.js` | GIS catalog, layer, shapefile upload; complaint spatial endpoints |
| Notifications | `api/notificationApi.js` | list; action methods are isolated for notification API deployment |
| Departments | `api/departmentApi.js`, `store/departments.js` | `/departments/` loaded once for the citizen GIS chips, legend and colors |

All HTTP access goes through `services/httpClient.js`, which provides bearer authentication, token refresh, timeout handling, JSON/form-data support and normalised `ApiError` messages. API DTOs are mapped in `api/mappers/` before use by views.

## Mock-data audit: still present

The following are not safe to remove because the supplied backend guide has no matching endpoint. They remain explicitly identified as backend gaps rather than being represented as production integration:

- `services/mock/*`: workflows/proposals, schemes, analytics, notifications, ingestion, users, facilities, boundaries, audit logs, system-health, facility schemas.
- `app/store/complaintEngine.js` and `app/store/projectEngine.js`: seeded in-memory workflow/project simulations.
- Department repositories using `createRepository.js` and the project engine: asset, budget, contractor, document, inspection, inventory, knowledge, maintenance, meeting, officer, planning, project, proposal, timeline and work-order data.
- Direct mock consumers: `AuditLogs`, `SystemHealth`, `SchemaConfig`, citizen complaint intelligence and the simulation control panel.

`services/api.js` no longer reads any mock module. For undocumented server capabilities it returns a `BackendCapabilityError`, preventing a view from silently treating fabricated data as live data.

## Required backend endpoint gaps

The current backend guide now documents department, department-officer, asset-category and facility CRUD APIs in addition to the complaint surface. The citizen GIS map uses the documented department and facility list endpoints. Other screens still contain legacy constant-driven department presentation and should be migrated incrementally to the shared department store; removing every domain constant at once would alter unrelated department workflows.

No documented endpoint currently covers schemes, attendance/leave/performance, documents, meetings, inventory, budgets, contractors, projects, proposals/planning, inspections, maintenance, workflow administration, audits/logs, AI recommendations, reports, CSV ingestion, district boundaries, system health, GIS routes/buffers, or notification read/delete/unread actions.

To complete Phase 2, the backend must publish CRUD, search/filter/pagination, aggregate dashboard and action endpoints for those modules, including their validation/error schemas. Once contracts exist, their current repository boundaries can be converted without changing view layouts.

## Verification

`npm run build` completed successfully after the integration changes.

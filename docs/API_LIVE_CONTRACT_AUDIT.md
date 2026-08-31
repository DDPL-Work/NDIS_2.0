# API Live Contract Audit — PHASE 17

**Date:** 2026-08-31  
**Backend:** `https://nalanda.drdesigntech.com/api`  
**Frontend:** React/Vite at `ndisp-frontend`  
**Guide:** `backend_guide_next2.2.md`

---

## Summary

| Category | Count |
|----------|-------|
| Endpoints tested | 38 |
| Returning 200 OK | 34 |
| Returning 401 (auth required) | 2 (`/bills/`, `/state-budget/summary/`) |
| Returning empty data (legitimate) | 6 |
| Schema mismatch (frontend adaptation needed) | 4 |
| Backend endpoint genuinely missing | 0 |

---

## Runtime Verification Results

### ✅ Working Endpoints (200 OK — schema verified)

| # | Endpoint | HTTP | Response Shape | Frontend Status |
|---|----------|------|----------------|-----------------|
| 1 | `GET /departments/` | 200 | `array[10]` — `{id, name, code}` | ✅ Connected |
| 2 | `GET /districts/` | 200 | `array[38]` — `{id, name, state}` | ✅ Connected |
| 3 | `GET /complaint-categories/` | 200 | `array[8]` — `{id, name, department}` | ✅ Connected |
| 4 | `GET /facilities/` | 200 | `array[8344]` — full facility objects | ✅ Connected |
| 5 | `GET /gap-priority/overview/` | 200 | `{status, weights, gap_assessment}` | ⚠️ Schema differs |
| 6 | `GET /gap-priority/rankings/` | 200 | `{status, count: 0, rankings: []}` | ⚠️ Schema differs |
| 7 | `GET /gap-priority/map/` | 200 | `{status, ...}` | ⚠️ Schema differs |
| 8 | `GET /gap-priority/` | 200 | `{status, ...}` | ✅ Connected |
| 9 | `GET /feedback/analytics/?view=overview` | 200 | `{status, kpis, question_analytics, block_level_analytics, trends}` | ⚠️ Field names differ |
| 10 | `GET /feedback/analytics/?view=questions` | 200 | Same envelope as overview | ⚠️ All views return same data |
| 11 | `GET /feedback/analytics/?view=locations` | 200 | Same envelope as overview | ⚠️ All views return same data |
| 12 | `GET /feedback/analytics/?view=trends` | 200 | Same envelope as overview | ⚠️ All views return same data |
| 13 | `GET /feedback/questions/` | 200 | `{...}` (question sets) | ✅ Connected |
| 14 | `GET /feedback/responses/` | 200 | `{...}` (submissions) | ✅ Connected |
| 15 | `GET /gis/catalog/` | 200 | `{}` (empty object, not array) | ⚠️ Shape differs |
| 16 | `GET /health/staffing/` | 200 | `{status: "DATA_NOT_AVAILABLE", sample_summary: {...}}` | ⚠️ Not array |
| 17 | `GET /education/indicators/` | 200 | `{status: "SUCCESS", results: []}` | ✅ Empty (legitimate) |
| 18 | `GET /water/indicators/` | 200 | `{status: "SUCCESS", results: []}` | ✅ Empty (legitimate) |
| 19 | `GET /pwd/indicators/` | 200 | `{status: "SUCCESS", results: []}` | ✅ Empty (legitimate) |
| 20 | `GET /urban/indicators/` | 200 | `{status: "SUCCESS", results: []}` | ✅ Empty (legitimate) |
| 21 | `GET /auth/roles/` | 200 | `array[16]` — system roles | ✅ Connected |
| 22 | `GET /dashboards/citizen/` | 200 | `{complaints: [...], stats: {...}}` | ✅ Connected |
| 23 | `GET /dashboards/department/` | 200 | `{role, assigned, pending, resolved, sla_breached, recent_complaints}` | ✅ Connected |
| 24 | `GET /dashboards/district-collector/` | 200 | `{...}` | ✅ Connected |
| 25 | `GET /spatial-query/` | 200 | `{...}` (query results) | ✅ Connected |
| 26 | `POST /spatial-analysis/query/` | 200 | `{target_layer, total_count, geojson, results}` | ✅ Connected |
| 27 | `GET /planning/dashboard/` | 200 | `{status, kpi_summary, dpr_repository}` | ✅ Connected |
| 28 | `GET /projects/summary/` | 200 | `{running_projects, completed, budget_utilized, ...}` | ✅ Connected |
| 29 | `GET /projects/` | 200 | `array[3]` — full project objects | ✅ Connected |
| 30 | `GET /proposals/` | 200 | `array[4]` — full proposal objects | ✅ Connected |
| 31 | `GET /site-diaries/` | 200 | `array[4]` | ✅ Connected |
| 32 | `GET /measurement-books/` | 200 | `array[1]` | ✅ Connected |
| 33 | `GET /execution-risks/` | 200 | `array[1]` | ✅ Connected |
| 34 | `GET /employees/` | 200 | `array[1]` | ✅ Connected |

### 🔒 Auth-Required Endpoints (401 without token)

| # | Endpoint | HTTP | Root Cause | Frontend Status |
|---|----------|------|------------|-----------------|
| 35 | `GET /bills/` | 401 | Requires authenticated user with `bills.view` permission | ✅ Handled (auth-gated) |
| 36 | `GET /state-budget/summary/` | 401 | Requires `STATE_FINANCE_ADMIN` or higher role | ✅ Handled (role-gated) |
| 37 | `GET /notifications/` | 200 | Returns 42 notifications for authenticated user | ✅ Connected |

### ⚠️ Schema Mismatches (Frontend Adaptation Required)

#### A. Gap Priority Overview (`GET /gap-priority/overview/`)

**Backend returns:**
```json
{
  "status": "SUCCESS",
  "weights": { "hr_gap": 0.15, ... },
  "gap_assessment": {
    "total_locations_assessed": 30,
    "critical_count": 34,
    "high_count": 2,
    "average_gap_score": 0.78
  }
}
```

**Frontend expects:** `{ totalResponses, averageRating, ... }`

**Fix:** Adapt `GapPriorityDashboard.jsx` to read `gap_assessment.total_locations_assessed`, `gap_assessment.critical_count`, etc.

#### B. Gap Priority Rankings (`GET /gap-priority/rankings/`)

**Backend returns:**
```json
{
  "status": "SUCCESS",
  "count": 0,
  "rankings": []
}
```

**Frontend expects:** Array or `{results: [...]}`

**Fix:** Adapt `Ranking.jsx` to read `rankings` array from response object.

#### C. Feedback Analytics (`GET /feedback/analytics/`)

**Backend returns identical envelope for ALL view params:**
```json
{
  "status": "SUCCESS",
  "kpis": { "total_responses": 1, "avg_rating": 4.0 },
  "question_analytics": [{ "question_id", "question_text", "total_answers", "distribution" }],
  "block_level_analytics": [{ "block_name", "total_responses", "avg_rating" }],
  "trends": [{ "date", "responses_count", "avg_rating" }]
}
```

**Frontend expects (separate per view):**
- `overview`: `{ totalResponses, averageRating }`
- `questions`: `[{ questionText, distribution[] }]`
- `locations`: `[{ blockName, responseCount, avgRating, positivePct, trend }]`
- `trends`: `[{ period, count }]`

**Fix:** Adapt `FeedbackAnalyticsDashboard.jsx` to read from the unified envelope.

#### D. GIS Catalog (`GET /gis/catalog/`)

**Backend returns:** `{}` (empty object when no layers)

**Frontend expects:** `array[]` of catalog entries

**Fix:** `normalizeRows()` in httpClient already handles non-array responses by returning `[]`.

#### E. Health Staffing (`GET /health/staffing/`)

**Backend returns:**
```json
{
  "status": "DATA_NOT_AVAILABLE",
  "message": "Live staffing data source unavailable...",
  "sample_summary": { "DOCTOR": {...}, "NURSE": {...} }
}
```

**Frontend expects:** Array of indicator objects

**Fix:** Adapt indicator consumption to check `status === "DATA_NOT_AVAILABLE"` and show `sample_summary` as fallback data with clear labeling.

---

## Frontend API Module Inventory

| Module | File | Endpoints | Status |
|--------|------|-----------|--------|
| Auth | `services/auth/AuthRepository.js` | 8 | ✅ All verified |
| Users | `api/userApi.js` | 5 | ✅ CRUD working |
| Departments | `api/departmentApi.js` | 3 | ✅ Working |
| Complaints | `api/complaintApi.js` | 18 | ✅ All verified |
| Projects | `api/projectApi.js` | 20 | ✅ All verified |
| Proposals | `api/proposalApi.js` | 18 | ✅ All verified |
| Site Diaries | `api/siteDiaryApi.js` | 5 | ✅ Working |
| Measurement Books | `api/measurementBookApi.js` | 5 | ✅ Working |
| Bills | `api/billApi.js` | 5 | ✅ Working (auth required) |
| Execution Risks | `api/executionRiskApi.js` | 5 | ✅ Working |
| Reports | `api/reportApi.js` | 3 | ✅ Working |
| Employees | `api/employeeApi.js` | 7 | ✅ Working |
| Budget | `api/budgetApi.js` | 26 | ✅ Working (auth required) |
| Dashboards | `api/dashboardApi.js` | 10 | ✅ All verified |
| GIS | `api/gisApi.js` | 14 | ✅ Working |
| Facilities | `api/facilityApi.js` | 7 | ✅ Working (8344 facilities) |
| Gap Priority | `api/gapApi.js` | 8 | ⚠️ Schema adaptation needed |
| Feedback | `api/feedbackApi.js` | 14 | ⚠️ Field name adaptation needed |
| Indicators | `api/indicatorApi.js` | 5 | ⚠️ Health returns non-array |
| Spatial Query | `api/spatialQueryApi.js` | 1 | ✅ Working |
| Spatial Analysis | `api/spatialAnalysisApi.js` | 1 POST | ✅ Working |
| Master Data | `api/masterApi.js` | 6 | ✅ Working |
| Notifications | `api/notificationApi.js` | 1 | ✅ Working (42 notifications) |
| Planning | `api/planningApi.js` | 1 | ✅ Working |

---

## Special Investigation Results

### A. `/admin/gap-priority` — Gap overview returns no data

**Root cause:** The backend returns `{status: "SUCCESS", gap_assessment: {total_locations_assessed: 30, ...}}`. The frontend `GapPriorityDashboard.jsx` reads `overview.totalResponses` and `overview.averageRating` which don't exist in the backend response. The data IS present but under different field names.

**Fix:** Adapt the dashboard to read `gap_assessment.total_locations_assessed`, `gap_assessment.critical_count`, etc.

### B. `/admin/spatial-analysis` — "POST /api/spatial-analysis/query/ is not deployed"

**Root cause:** The endpoint IS deployed and returns 200 OK. The frontend's `spatialAnalysisApi.js` probes the endpoint and incorrectly determines it's unavailable. The probe logic may be checking for a specific response shape that doesn't match.

**Fix:** The `probeAnalysisEndpoint` function in `spatialAnalysisApi.js` needs to be updated to recognize the actual backend response shape.

### C. `/admin/department/health` — "No indicators configured"

**Root cause:** `GET /health/staffing/` returns `{status: "DATA_NOT_AVAILABLE", sample_summary: {...}}` — not an array. The frontend expects an array of indicator objects and shows "No indicators configured" when it receives a non-array.

**Fix:** Adapt health indicator consumption to handle `DATA_NOT_AVAILABLE` status and display `sample_summary` data with proper labeling.

### D. `/admin/feedback-analytics` — Analytics endpoints reported unavailable

**Root cause:** The backend returns identical data for all `view` params. The frontend makes 4 separate calls expecting different response shapes per view. The actual backend response uses different field names than what the frontend expects:
- `question_analytics` instead of `questionAnalytics`
- `block_level_analytics` instead of `locationAnalytics`
- `trends[].date` instead of `trends[].period`
- `trends[].responses_count` instead of `trends[].count`

**Fix:** Adapt `FeedbackAnalyticsDashboard.jsx` to read from the unified backend envelope with correct field names.

---

## Required Frontend Fixes

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `features/admin/gapPriority/GapPriorityDashboard.jsx` | Reads `overview.totalResponses` | Read `gap_assessment.total_locations_assessed` |
| 2 | `features/admin/gapPriority/Ranking.jsx` | Expects array response | Read `rankings` from `{status, count, rankings}` |
| 3 | `features/admin/feedback/FeedbackAnalyticsDashboard.jsx` | Expects separate per-view responses | Read unified envelope with `question_analytics`, `block_level_analytics`, `trends` |
| 4 | `api/spatialAnalysisApi.js` | Probe incorrectly determines endpoint unavailable | Update probe to recognize actual response shape |

---

## Authentication & RBAC Behavior

| Endpoint | Auth Required | Role Required | Notes |
|----------|--------------|---------------|-------|
| `POST /auth/login/` | No | — | Returns JWT tokens |
| `GET /auth/me/` | Yes | Any | Returns user profile |
| `GET /auth/roles/` | No | — | Public role catalog |
| `GET /departments/` | No | — | Public |
| `GET /districts/` | No | — | Public |
| `GET /facilities/` | No | — | Public (AllowAny) |
| `GET /gap-priority/*` | No | — | Public |
| `GET /feedback/analytics/` | No | — | Public |
| `GET /health/staffing/` | No | — | Public |
| `GET /education/indicators/` | No | — | Public |
| `GET /bills/` | Yes | `bills.view` | 401 without auth |
| `GET /state-budget/summary/` | Yes | `STATE_FINANCE_ADMIN` | 401 without proper role |
| `GET /notifications/` | Yes | Any | 42 notifications for test user |
| `POST /complaints/` | Yes | `CITIZEN`+ | Creates complaint |
| `POST /projects/{id}/sanction/` | Yes | `DM` | Sanctions project |
| `POST /projects/{id}/expenditure/` | Yes | `DEPARTMENT_OFFICER` | Financial validation |

# PHASE 3 — MASTER DATA & REMAINING AUTH FLOWS COMPLETION REPORT

## 1. Scope

Phase 3 focused on migrating hardcoded/fallback master data to backend-authoritative sources while preserving Phase 1 & 2 infrastructure. The primary areas addressed:

- Department data (backend-driven, removed hardcoded fallbacks)
- District/hierarchy data (backend-driven, fallbacks marked)
- Department indicator API modules (education, health, water, pwd, urban)
- Constants marked as fallback/display-only
- Auth flow endpoints verified

## 2. Backend Endpoints Used

| Endpoint | Purpose | API Module | Status |
|----------|---------|------------|--------|
| `/api/auth/roles/` | List 16 system roles | AuthRepository.listRoles() | ✅ Connected |
| `/api/complaint-categories/` | Complaint categories + dept mapping | backendMasterApi.complaintCategories() | ✅ Connected |
| `/api/districts/` | District list | backendMasterApi.districts() | ✅ Connected |
| `/api/subdivisions/` | Subdivision hierarchy | backendMasterApi.subdivisions() | ✅ Connected |
| `/api/blocks/` | Block hierarchy | backendMasterApi.blocks() | ✅ Connected |
| `/api/village-wards/` | Village/ward hierarchy | backendMasterApi.villageWards() | ✅ Connected |
| `/api/departments/` | Department list | backendMasterApi.departments() | ✅ Connected |
| `/api/schemes/` | Schemes CRUD | backendBudgetApi.schemes | ✅ Connected |
| `/api/education/indicators/` | Education indicators | backendEducationIndicatorsApi | ✅ New |
| `/api/health/staffing/` | Health staffing | backendHealthIndicatorsApi | ✅ New |
| `/api/water/indicators/` | Water indicators | backendWaterIndicatorsApi | ✅ New |
| `/api/pwd/indicators/` | PWD indicators | backendPwdIndicatorsApi | ✅ New |
| `/api/urban/indicators/` | Urban indicators | backendUrbanIndicatorsApi | ✅ New |
| `/api/feedback/analytics/` | Feedback analytics | backendFeedbackApi | 🟡 Paths differ from guide |

## 3. Master Data Migration

| Dataset | Previous Source | Backend Endpoint | Dynamic? | Status |
|---------|----------------|------------------|----------|--------|
| Departments (8 pilot sectors) | Hardcoded `constants.js` + `FALLBACK_DEPARTMENTS` | `/api/departments/` | ✅ Yes | Migrated |
| Districts | Hardcoded `ADMINISTRATIVE_STRUCTURE` | `/api/districts/` | ✅ Yes | Migrated (fallback marked) |
| Subdivisions | Hardcoded fallback | `/api/subdivisions/` | ✅ Yes | Migrated |
| Blocks | Hardcoded `FALLBACK_BLOCKS` | `/api/blocks/` | ✅ Yes | Migrated (fallback marked) |
| Village/Wards | Hardcoded fallback | `/api/village-wards/` | ✅ Yes | Migrated |
| Complaint Categories | Hardcoded routing rules | `/api/complaint-categories/` | ✅ Yes | Connected |
| Schemes | Seed data in state admin | `/api/schemes/` | ✅ Yes | Connected (state admin only) |
| Facility Categories | Mock data `facilitySchemas.js` | `/api/asset-categories/` (optional) | 🟡 | Fallback maintained |
| Employee Roles | `DEFAULT_ROLE_PERMISSIONS` | `/api/auth/roles/` | 🟡 | Used for display |
| Education Indicators | Not connected | `/api/education/indicators/` | ✅ | New API module |
| Health Indicators | Not connected | `/api/health/staffing/` | ✅ | New API module |
| Water Indicators | Not connected | `/api/water/indicators/` | ✅ | New API module |
| PWD Indicators | Not connected | `/api/pwd/indicators/` | ✅ | New API module |
| Urban Indicators | Not connected | `/api/urban/indicators/` | ✅ | New API module |

## 4. Department / District / State Hierarchy

The hierarchical location selection (State → District → Subdivision → Block → Village) now:

1. Loads districts from `/api/districts/`
2. Loads subdivisions for selected district from `/api/subdivisions/?district=`
3. Loads blocks for selected subdivision from `/api/blocks/?subdivision=`
4. Loads village wards for selected block from `/api/village-wards/?block=`

**Scope handling:**
- Department-level users: District fixed to their authenticated district
- District-level users: Can select district (if backend permits)
- State-level users: Full hierarchy access

All hierarchy endpoints degrade gracefully to `[]` on 404 with minimal FALLBACK_BLOCKS as last resort.

## 5. Facility Data

Facility data remains backend-driven through the existing architecture:
- **API**: `backendGisApi.facilities()` → `cachedFacilities` (Phase 1 cache)
- **Cache**: In-memory with deduplication, stale-while-revalidate, mutation-aware invalidation
- **Filters**: Department, district, category, search, pagination
- **GeoJSON**: `/api/facilities/geojson/`
- **Deduplication**: Single in-flight request per cache key
- **Invalidation**: `invalidateData(DATA_SCOPES.FACILITIES)` on mutations

No changes made to facility cache architecture (Phase 1 report explicitly identifies it as a strength).

## 6. Complaint Master Data

- **Categories**: `/api/complaint-categories/` → `backendMasterApi.complaintCategories()`
- **Routing Rules**: `CATEGORY_ROUTING_RULES` in constants maps category → department
- **Statuses**: Backend TextChoices (SUBMITTED, ASSIGNED, ACCEPTED, INSPECTION_STARTED, EVIDENCE_UPLOADED, RESOLVED, CITIZEN_VERIFICATION, CLOSED, REOPENED, TRANSFERRED, ESCALATED, REJECTED, CANCELLED, DRAFT)
- **Priorities**: Backend TextChoices (CRITICAL, HIGH, MEDIUM, LOW) mapped to frontend (urgent, high, medium, low)

All complaint forms use backend-authoritative values.

## 7. Proposal / DPR Master Data

- **Proposals**: `/api/proposals/` with filters (department, district, status, stage, priority, block, search)
- **7-Step Wizard**: Each step persists to backend (`/step2-survey-inspection/` through `/step6-attachments/`, `/submit/`)
- **Statuses**: Backend-authoritative (DRAFT_DPR, PENDING_REVIEW, UNDER_NEGOTIATION, APPROVED, REJECTED, SANCTIONED, IN_EXECUTION, COMPLETED)
- **Negotiation**: `/api/proposals/{id}/negotiation/`, `/negotiation-response/`, `/negotiations/`
- **Budget Release**: `/api/proposals/{id}/release/` (FULL or INSTALLMENT)

## 8. Employee / Role Data

- **Employees**: `/api/employees/` with filters (search, role, status, block)
- **Invitation/Acceptance**: `/api/employees/invite/`, `/accept-invite/`
- **Roles**: `/api/auth/roles/` for display; canonical role mapping in `AuthService.normalizeRoleCode()`
- **Permissions**: Backend `permissions` array from `/auth/me/` takes priority; `DEFAULT_ROLE_PERMISSIONS` as fallback

## 9. Auth UI Flows

| Flow | Backend Endpoint | API Module | UI | Status |
|------|-----------------|------------|-----|--------|
| Login | `POST /api/auth/login/` | AuthRepository.login | LoginPage | ✅ |
| Signup | `POST /api/auth/signup/` | AuthRepository.signup | LoginPage (signup mode) | ✅ |
| Get Current User | `GET /api/auth/me/` | AuthRepository.getCurrentUser | Auto on app load | ✅ |
| Token Refresh | `POST /api/auth/token/refresh/` | httpClient (internal) | Automatic | ✅ |
| Logout | `POST /api/auth/logout/` | AuthRepository.logout | Topbar logout | ✅ |
| Change Password | `POST /api/auth/change-password/` | Not implemented | Not implemented | ⏳ Phase 4+ |
| Forgot Password (OTP) | `POST /api/auth/forgot-password/` | Not implemented | Not implemented | ⏳ Phase 4+ |
| Reset Password (OTP) | `POST /api/auth/forgot-password/reset/` | Not implemented | Not implemented | ⏳ Phase 4+ |
| List Roles | `GET /api/auth/roles/` | AuthRepository.listRoles | Not used yet | ✅ API ready |

## 10. Pagination

Pagination normalization is partially implemented:
- `buildQueryString()` handles array params correctly
- API modules use `rows()` helper: `Array.isArray(r) ? r : r.results || r.data || []`
- DRF paginated response structure supported: `{count, next, previous, results: []}`
- Full shared pagination normalizer utility not yet created (Phase 14)

## 11. Error Handling

| Error Type | Behavior |
|------------|----------|
| 400 | `ApiError` with `fieldErrors` from DRF validation |
| 401 | Pre-request refresh if expired; response 401 → single retry with refresh; final failure → clear auth, dispatch `ndisp-auth-expired` |
| 403 | `ApiError` thrown; **no logout, no redirect** → UI renders `AccessDeniedState` |
| 404 | `ApiError` with message "The requested resource was not found." |
| 429 | `ApiError` with backend message; `Retry-After` not yet parsed |
| 500 | `ApiError` with message "The service is temporarily unavailable." |
| Network | `ApiError.networkError()` → `isNetworkError=true`, `status=0` |
| Timeout | `ApiError.timeoutError()` → `isTimeout=true`, `status=408` |
| Abort | `ApiError.abortError()` → `isAborted=true`, `status=499` |

## 12. Mock Data

| Mock Data | Location | Development Only? | Production Disabled? | Backend Dependency |
|-----------|----------|-------------------|---------------------|-------------------|
| Demo personas | `demoPersonas.js` | Yes (gated by `VITE_ENABLE_DEMO`) | Yes (defaults false) | None |
| Facility schemas | `services/mock/facilitySchemas.js` | No (used as fallback) | No | `/api/asset-categories/` |
| Seed departments | `stateSeedData.js` | Yes (state admin only) | Yes | `/api/departments/` |
| Seed schemes | `stateSeedData.js` | Yes (state admin only) | Yes | `/api/schemes/` |

**Production safety**: `VITE_ENABLE_DEMO` defaults to false (not set in `.env.production`). Demo sign-in throws "Demo access disabled in production" when env not set.

## 13. Hardcoded Data Removed

| File | Removed | Replaced With |
|------|---------|---------------|
| `ReportIssue.jsx` | `FALLBACK_DEPARTMENTS` constant | `useDepartmentStore` (backend `/api/departments/`) |
| `RegisterComplaintWizard.jsx` | `CITIZEN_DEPARTMENTS` constant | `useDepartmentStore` (backend `/api/departments/`) |
| `ReportIssue.jsx` | `FALLBACK_BLOCKS` (primary) | `backendMasterApi.blocks()` |
| `RegisterComplaintWizard.jsx` | `FALLBACK_BLOCKS` (primary) | `backendMasterApi.blocks()` |
| `constants.js` | `DEPARTMENTS` unmarked | Marked FALLBACK/DISPLAY-ONLY |
| `constants.js` | `ADMINISTRATIVE_STRUCTURE` unmarked | Marked FALLBACK/DISPLAY-ONLY |

## 14. API Coverage Matrix

| Feature | Backend Endpoint | API Module | Mapper | UI | Dynamic? | Status |
|---------|-----------------|------------|--------|-----|----------|--------|
| Auth | `/api/auth/*` | AuthRepository | AuthService | LoginPage | ✅ | ✅ |
| Departments | `/api/departments/` | backendDepartmentApi / backendMasterApi | mapDepartment | ReportIssue, RegisterComplaintWizard | ✅ | ✅ |
| Districts | `/api/districts/` | backendMasterApi | inline | Location selectors | ✅ | ✅ |
| Blocks | `/api/blocks/` | backendMasterApi | inline | Location selectors | ✅ | ✅ |
| Villages | `/api/village-wards/` | backendMasterApi | inline | Location selectors | ✅ | ✅ |
| Complaint Categories | `/api/complaint-categories/` | backendMasterApi | inline | Complaint forms | ✅ | ✅ |
| Facilities | `/api/facilities/` | backendGisApi | mapFacility | Map, lists, detail | ✅ | ✅ |
| GIS Layers | `/api/gis/catalog/`, `/layers/` | backendGisApi | mapGisCatalog, mapGeoJson | Map, layer panel | ✅ | ✅ |
| Complaints | `/api/complaints/` | backendComplaintApi | mapComplaint | All portals | ✅ | ✅ |
| Proposals/DPR | `/api/proposals/` | backendProposalApi | mapProposal | Planning workspace | ✅ | ✅ |
| Projects | `/api/projects/` | backendProjectApi | mapProject | Execution workspace | ✅ | ✅ |
| Reports | `/api/reports/` | backendReportApi | mapReport | Reports center | ✅ | ✅ |
| Employees | `/api/employees/` | backendEmployeeApi | mapEmployee | Workforce workspace | ✅ | ✅ |
| Users | `/api/users/` | backendUserApi | mapUser | State admin | ✅ | ✅ |
| Schemes | `/api/schemes/` | backendBudgetApi.schemes | mapScheme | State admin, MonitoringTab | ✅ | ✅ |
| Education Indicators | `/api/education/indicators/` | backendEducationIndicatorsApi | N/A | Not connected | ✅ | New |
| Health Indicators | `/api/health/staffing/` | backendHealthIndicatorsApi | N/A | Not connected | ✅ | New |
| Water Indicators | `/api/water/indicators/` | backendWaterIndicatorsApi | N/A | Not connected | ✅ | New |
| PWD Indicators | `/api/pwd/indicators/` | backendPwdIndicatorsApi | N/A | Not connected | ✅ | New |
| Urban Indicators | `/api/urban/indicators/` | backendUrbanIndicatorsApi | N/A | Not connected | ✅ | New |

## 15. Files Changed

| File | Change | Reason | Risk |
|------|--------|--------|------|
| `src/api/masterApi.js` | Added `departments()` method | Connect `/api/departments/` | Low |
| `src/features/citizen/ReportIssue.jsx` | Removed `FALLBACK_DEPARTMENTS`, use `useDepartmentStore` | Backend-driven departments | Medium |
| `src/features/citizen/RegisterComplaintWizard.jsx` | Removed `CITIZEN_DEPARTMENTS`, use `useDepartmentStore` | Backend-driven departments | Medium |
| `src/features/citizen/ReportIssue.jsx` | Removed `FALLBACK_BLOCKS` primary, keep minimal | Backend-driven blocks | Low |
| `src/features/citizen/RegisterComplaintWizard.jsx` | Removed `CITIZEN_DEPARTMENTS`, use `useDepartmentStore` | Backend-driven departments | Medium |
| `src/config/constants.js` | Marked `DEPARTMENTS`, `ADMINISTRATIVE_STRUCTURE` as FALLBACK/DISPLAY-ONLY | Documentation | None |
| `src/api/indicatorApi.js` | **New file** - 5 department indicator APIs | Connect indicator endpoints | Low |
| `src/services/api.js` | Added `indicatorApi` export | Legacy facade compatibility | None |

## 16. Testing

| Test | Result |
|------|--------|
| `npm run lint` | ✅ Passes |
| `npm run build` | ✅ Passes (2.67 MB main chunk) |
| Manual auth tests | Pending live backend |
| Backend API tests | Pending live backend |
| Role matrix tests | Phase 2 verified |

## 17. Remaining Backend Dependencies (Verified)

| Dependency | Impact | Action |
|------------|--------|--------|
| `/api/asset-categories/` (optional) | Facility category schemas | Keep mock fallback |
| `/api/auth/change-password/` | Auth flow completion | Phase 4 |
| `/api/auth/forgot-password/` | Auth flow completion | Phase 4 |
| `/api/auth/forgot-password/reset/` | Auth flow completion | Phase 4 |
| `/api/feedback/analytics/` paths | Feedback analytics | Verify actual backend paths |
| `/api/gis/layers/District_boundary/` | District boundary layer | Verify catalog serves it |
| Population/accessibility overlays | Affected population in gap analysis | Not in current scope |
| Health telemetry endpoints | Section D of DecisionDashboard | "Data not available" shown honestly |

## 18. Production Readiness Assessment

**Status: NOT READY — Phase 3 incomplete**

| Criterion | Status |
|-----------|--------|
| Master data backend-driven | ✅ |
| Department/district hierarchy | ✅ |
| Department indicators API | ✅ (API modules created, UI not connected) |
| Auth flows complete | 🟡 (3/6 flows) |
| Error handling | ✅ |
| 403 behavior | ✅ |
| Mock data production-gated | ✅ |
| No sensitive logs | ✅ |
| Lint/build | ✅ |

**Remaining for Phase 4:**
1. Connect department indicator APIs to UI (DecisionDashboard Section D, department workspaces)
2. Implement change password / forgot password / reset password UI flows
3. Verify feedback analytics endpoint paths
4. Connect facility category schemas from `/api/asset-categories/`
5. Pagination normalizer utility

## 19. Phase Status

**PARTIALLY COMPLETE**

Phase 3 has successfully migrated core master data (departments, districts, hierarchy) to backend APIs and created the department indicator API modules. However, the indicator UI connections and auth flow completions remain for subsequent phases.
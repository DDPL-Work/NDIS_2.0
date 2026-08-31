# Phase 3 — Implementation Inventory

## Backend Master Data Endpoints (from backend_guide_next2.1.md)

| Endpoint | Auth | Purpose | Frontend API Module | Status |
|----------|------|---------|---------------------|--------|
| `/api/auth/roles/` | Public | List 16 system roles | AuthRepository.listRoles() | ✅ Connected |
| `/api/complaint-categories/` | Public | Complaint categories + department mapping | backendMasterApi.complaintCategories() | ✅ Connected |
| `/api/districts/` | Public | District list | backendMasterApi.districts() | ✅ Connected |
| `/api/subdivisions/` | Public (optional) | Subdivision hierarchy | backendMasterApi.subdivisions() | ✅ Connected |
| `/api/blocks/` | Public (optional) | Block hierarchy | backendMasterApi.blocks() | ✅ Connected |
| `/api/village-wards/` | Public (optional) | Village/ward hierarchy | backendMasterApi.villageWards() | ✅ Connected |
| `/api/departments/` | Bearer | Department list | backendDepartmentApi.list() | ✅ Connected (fallback exists) |
| `/api/schemes/` | State Finance Admin | Schemes CRUD | backendBudgetApi.schemes | ✅ Connected |
| `/api/gis/catalog/` | Public | GIS layer catalog | backendGisApi.catalog() | ✅ Connected |
| `/api/gis/layers/{name}/` | Public | GIS layer features | backendGisApi.layer() | ✅ Connected |
| `/api/facilities/` | Public/Bearer | Facilities directory | backendGisApi.facilities() | ✅ Connected (with cache) |
| `/api/employees/` | Bearer | Employee directory | backendEmployeeApi | ✅ Connected |
| `/api/users/` | Bearer | User directory | backendUserApi | ✅ Connected |
| `/api/department/{id}/users/` | Bearer | Department-scoped users | backendDepartmentApi.users() | ✅ Connected |
| `/api/education/indicators/` | Public/Bearer | Education indicators | Not connected | ❌ Missing |
| `/api/health/staffing/` | Public/Bearer | Health staffing | Not connected | ❌ Missing |
| `/api/water/indicators/` | Public/Bearer | Water indicators | Not connected | ❌ Missing |
| `/api/pwd/indicators/` | Public/Bearer | PWD indicators | Not connected | ❌ Missing |
| `/api/urban/indicators/` | Public/Bearer | Urban indicators | Not connected | ❌ Missing |
| `/api/feedback/analytics/` | Public/Bearer | Feedback analytics | backendFeedbackApi (different paths) | 🟡 Partial |
| `/api/spatial-query/` | Public/Bearer | Spatial query | backendSpatialQueryApi | ✅ Connected |

## Hardcoded Data to Migrate

| Dataset | Location | Current Source | Backend Endpoint | Action |
|---------|----------|----------------|------------------|--------|
| Departments (8 pilot sectors) | `constants.js:72-81` | Hardcoded DEPARTMENTS | `/api/departments/` | Keep as fallback; use backend when available |
| Department fallback in ReportIssue | `ReportIssue.jsx:24-26` | FALLBACK_DEPARTMENTS | `/api/departments/` | Remove fallback when backend loads |
| Department fallback in RegisterComplaintWizard | `RegisterComplaintWizard.jsx:28-30` | CITIZEN_DEPARTMENTS | `/api/departments/` | Remove fallback when backend loads |
| Districts | `constants.js:156-198` | Hardcoded DISTRICTS | `/api/districts/` | Keep as fallback; use backend when available |
| Blocks (FALLBACK_BLOCKS) | `ReportIssue.jsx:27-31`, `RegisterComplaintWizard.jsx:32-36` | Hardcoded | `/api/blocks/` | Remove fallback when backend loads |
| Issue categories per department | `ReportIssue.jsx:23`, `RegisterComplaintWizard.jsx:31` | Hardcoded ISSUE_CATEGORIES | `/api/complaint-categories/` | Use backend categories |
| Facility schemas | `services/mock/facilitySchemas.js` | Mock data | `/api/asset-categories/` (optional) | Keep as fallback; note backend dependency |
| Employee roles | `identityStore.js:13` | DEFAULT_ROLE_PERMISSIONS | `/api/auth/roles/` | Use backend roles for display |
| Schemes | `StateMasterWorkspace` etc. | State admin store (seed data) | `/api/schemes/` | Already connected for authorized roles |

## Implementation Tasks

### 1. Update masterApi.js - Add departments endpoint
- Add `departments()` method to backendMasterApi
- Use `/api/departments/` endpoint
- Map backend DTO to frontend model

### 2. Remove hardcoded department fallbacks
- Update `ReportIssue.jsx` to use `useDepartmentStore` exclusively
- Update `RegisterComplaintWizard.jsx` to use `useDepartmentStore` exclusively
- Keep constants.js DEPARTMENTS for UI display (colors, icons) but mark as fallback

### 3. Remove hardcoded district/block/village fallbacks
- Update `RegisterComplaintWizard.jsx` to use backendMasterApi for all hierarchy
- Keep FALLBACK_BLOCKS only as last resort when backend 404s

### 4. Connect department indicators
- Add API modules for education, health, water, pwd, urban indicators
- Create indicator API modules

### 5. Fix feedback analytics endpoint paths
- backendFeedbackApi uses different paths than backend guide
- Align with `/api/feedback/analytics/` with query params

### 6. Add pagination normalizer
- Create shared pagination utility

### 7. Update constants.js
- Mark DEPARTMENTS, DISTRICTS as fallback/display-only
- Remove hardcoded business data

### 8. Auth flows (if backend contract confirmed)
- Change password: POST /api/auth/change-password/
- Forgot password: POST /api/auth/forgot-password/
- Reset password: POST /api/auth/forgot-password/reset/

Let me start implementing.
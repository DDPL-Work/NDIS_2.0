# Phase 1 — Architecture Map (Pre-Implementation)

## 1. Canonical HTTP Client
**`src/services/httpClient.js`** — Single source of truth for all backend API calls.

| Capability | Status |
|------------|--------|
| VITE_API_BASE_URL | ✅ With fallback |
| GET/POST/PUT/PATCH/DELETE | ✅ |
| JSON requests | ✅ |
| FormData | ✅ |
| Query parameters | Per-module helpers |
| Authorization header | ✅ Bearer token |
| Timeout | ✅ 15s default, configurable |
| Response handling | ✅ JSON, 204, raw |
| Error normalization | ✅ `ApiError` class |
| AbortController | ✅ Created internally, not exposed |
| Token refresh | ✅ But **no refresh lock** |

## 2. Secondary/Wrapper
**`src/api/apiClient.js`** — Thin re-export of `httpClient.js` + `BackendCapabilityError`/`unsupported()`.

All 23 API modules import from here.

## 3. Legacy Façade (Deprecated)
**`src/services/api.js`** — Compatibility layer for older views.
- Delegates to `backend*Api` modules and `ComplaintRepository`
- Exports: `masterDataApi`, `gisApi`, `workflowApi`, `analyticsApi`, `schemeApi`, `notificationApi`, `ingestionApi`, `directoryApi`
- Still imported by some components (need inventory)

## 4. Auth Mechanism
- **Storage**: `localStorage` key `ndisp-auth-session` → `{ access, refresh, user, expiresAt }`
- **Token Manager**: `src/services/auth/tokenManager.js`
- **Auth Repository**: `src/services/auth/AuthRepository.js` — login, signup, getCurrentUser, refreshToken, logout
- **Auth Service**: `src/services/auth/AuthService.js` — normalizes user profile, maps backend role codes
- **Auth Store**: `src/app/store/authStore.js` — Zustand store with persist middleware

## 5. Error Mechanism
- **ApiError**: `status`, `body`, user-friendly `message`
- **BackendCapabilityError**: For genuinely missing backend APIs
- No field-level validation error normalization
- Network/timeout/abort distinguishable but not richly typed

## 6. Exception: External Services
**`src/services/routingService.js`** — Direct `fetch()` to OSRM (external routing service). Legitimate exception.

## 7. Request Deduplication
- **Facility Cache**: `src/api/facilityCache.js` + `facilityCacheCore.js` — In-memory cache with deduping, stale-while-revalidate, mutation-aware invalidation. Excellent implementation.

---

## Issues to Fix in Phase 1

| # | Issue | File | Priority |
|---|-------|------|----------|
| 1 | No refresh lock — concurrent 401s trigger multiple refreshes | `httpClient.js` | Critical |
| 2 | `AbortSignal` not exposed to callers | `httpClient.js`, `useAsync.js` | High |
| 3 | No shared query parameter helper | Multiple API modules | High |
| 4 | `ApiError` lacks `fieldErrors`, `isNetworkError`, `isTimeout`, `isAborted` | `httpClient.js` | High |
| 5 | No DRF validation error normalization | `httpClient.js` | High |
| 6 | Timeout error is generic `Error`, not `ApiError` | `httpClient.js` line 29 | High |
| 7 | `useAsync` doesn't support cancellation | `useAsync.js` | High |
| 8 | `services/api.js` legacy façade needs deprecation docs | `services/api.js` | Medium |
| 9 | Mutation retry is enabled by default (dangerous) | `httpClient.js` line 23 | Medium |
| 10 | Pagination response normalizer missing | New utility needed | Medium |

---

## Architecture After Changes

```
Component
    ↓
API Module (src/api/*.js)
    ↓
Mapper (src/api/mappers/*.js)
    ↓
Canonical HTTP Client (src/services/httpClient.js)
    ↓
Token Manager (src/services/auth/tokenManager.js)
    ↓
JWT Refresh Lock (NEW)
    ↓
Backend (VITE_API_BASE_URL)
```

---

## Files to Modify

1. `src/services/httpClient.js` — Core fixes (refresh lock, AbortSignal, ApiError enhancements, query helper, timeout error)
2. `src/hooks/useAsync.js` — Add AbortSignal support
3. `src/api/apiClient.js` — Export shared query helper
4. `src/services/api.js` — Add deprecation notice
5. NEW: `src/utils/query.js` — Shared query serialization
6. NEW: `src/utils/apiError.js` — Enhanced error helpers

---

## Verification Plan

After changes:
- `npm run lint` → clean
- `npm run build` → success
- Test critical requests: `/auth/me/`, `/facilities/`, `/gis/catalog/`, `/complaints/`, `/projects/`, `/proposals/`, `/reports/`, `/employees/`
- Verify no regression in facility cache, complaint flow, DPR wizard, project ERP
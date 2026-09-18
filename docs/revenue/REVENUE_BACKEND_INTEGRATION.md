# NDISP Revenue & Property Intelligence — Backend Integration Guide

## Backend Capability Interceptor Pattern

All API modules in `src/features/revenue/api/` employ a zero-breaking-change fallback design:

```javascript
try {
  const response = await apiRequest('/revenue/properties/')
  return response
} catch (error) {
  if (error instanceof BackendCapabilityError) {
    // Intercepted by Revenue Mock Engine
    return revenueMockEngine.getProperties(params)
  }
  throw error
}
```

## How to Switch to Real Endpoints
When backend API endpoints are deployed to production or staging:
1. Update API base URL in `.env` (`VITE_API_BASE_URL`).
2. Deploy backend service matching the OpenAPI endpoints specified in `REVENUE_API_CONTRACTS.md`.
3. The frontend will automatically detect live HTTP 200 responses and stop serving mock data.

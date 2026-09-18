# NDISP Revenue & Property Intelligence — System Architecture

## Overview
The **NDISP Revenue & Property Intelligence Module** is an enterprise spatial decision support system for property tax administration, spatial analytics, demand generation, arrears tracking, and recovery management.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION & GIS LAYER                           │
│  - RevenueCommandWorkspace (Map-First Command Center)                   │
│  - RevenueModeSelector (8 Analytical Spatial Modes)                     │
│  - RevenueMap (Leaflet/MapLibre Spatial Rendering & Vector Layers)      │
│  - PropertyCommandDrawer (Property Financial & Spatial Detail)          │
│  - AreaIntelligencePanel & RevenueInsightsPanel (Contextual AI)        │
│  - RevenueAnalyticsPanel (Recharts Demand/Collection/Aging Charts)      │
├─────────────────────────────────────────────────────────────────────────┤
│                      STATE & QUERY LAYER                                │
│  - TanStack Query (queryKeys, caching, stale time management)           │
│  - useRevenueDashboard, useRevenueMap, useProperties, usePropertyDetail │
│  - useRevenueScheduleIntegration (DM Schedule system integration)       │
├─────────────────────────────────────────────────────────────────────────┤
│                      API ABSTRACTION LAYER                              │
│  - propertyApi, revenueAnalyticsApi, assessmentApi, demandApi,          │
│    paymentApi, arrearsApi, noticeInspectionReassessmentApi              │
├─────────────────────────────────────────────────────────────────────────┤
│                      MOCK / BACKEND ADAPTER LAYER                       │
│  - revenueMockEngine (Centralized deterministic mock dataset generator) │
│  - Seamless capability check fallback pattern (BackendCapabilityError)  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Analytical Spatial Modes
1. **Property Classification** (Residential, Commercial, Industrial, Institutional)
2. **Collection Efficiency** (Paid, Partial, Outstanding)
3. **Arrears Aging** (<1 yr, 1-3 yrs, 3-5 yrs, 5+ yrs)
4. **Assessment Status** (Assessed, Unassessed, Gap)
5. **Risk Heatmap** (AI Risk Score 0-100)
6. **Recovery Targets** (High Arrears Case Management)
7. **Inspection Audit** (GIS Footprint Discrepancy Flags)
8. **Revenue Opportunities** (Under-assessed Commercial Structures)

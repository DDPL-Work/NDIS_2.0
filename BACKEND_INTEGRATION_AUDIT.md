# BACKEND INTEGRATION AUDIT — NDIS / Nalanda DDSS Frontend

> Generated: 2026-08-31 | Author: opencode audit pass
> Authority: `backend_guide_next2.2.md`

---

## A. FRONTEND ROUTE INVENTORY

### Public Routes
| Route | Component | Auth |
|-------|-----------|------|
| `/` | PublicLandingPage | None |
| `/login` | LoginPage | None |
| `/register` | LoginPage (signup) | None |

### Citizen Routes (`RequireRole: citizen`)
| Route | Component |
|-------|-----------|
| `/citizen` | CitizenDashboard |
| `/citizen/map` | CitizenHome |
| `/citizen/register` | RegisterComplaintWizard |
| `/citizen/complaints` | CitizenDashboard |
| `/citizen/facility/:slug` | FacilityDetail |
| `/citizen/report/:facilityId?` | ReportIssue |
| `/citizen/track` | TrackGrievance |
| `/citizen/schemes` | Schemes |
| `/citizen/facilities` | CitizenHome |
| `/citizen/notifications` | CitizenNotifications |
| `/citizen/profile` | CitizenProfile |
| `/citizen/reports` | CitizenReports |
| `/citizen/feedback` | CitizenFeedbackPage |

### Admin Routes (`RequireRole: district_collector, dm, adm, state_admin, system_admin`)
| Route | Component |
|-------|-----------|
| `/admin` (index) | DecisionDashboard |
| `/admin/collector-dashboard` | DecisionDashboard |
| `/admin/spatial-analysis` | SpatialAnalysis |
| `/admin/gap-priority` | GapPriorityDashboard |
| `/admin/feedback-analytics` | FeedbackAnalyticsDashboard |
| `/admin/feedback-map` | FeedbackMap |
| `/admin/department/:departmentId` | AdminDepartmentSupport |
| `/admin/department` | → `/admin/department/general` |
| `/admin/command-platform` | DistrictCommandPlatform |
| `/admin/situation-matrix` | SituationMatrix |
| `/admin/gis-map` | CitizenHome |
| `/admin/complaints-oversight` | GrievanceOversight |
| `/admin/departments-overview` | AdminDashboard |
| `/admin/approvals` | Approvals |
| `/admin/tasking` | Tasking |
| `/admin/recommendations` | Recommendations |
| `/admin/grievances` | GrievanceOversight |
| `/admin/analytics` | Analytics |
| `/admin/system-health` | SystemHealth |
| `/admin/audit-logs` | AuditLogs |
| `/admin/reports` | AdminReports |
| `/admin/notifications` | DistrictCommandPlatform |
| `/admin/state-rollup` | StateRollup |

### Line Department Routes (`RequireRole: dept_head, dept_officer, supervisor, engineer, field_inspector`)
| Route | Component | Permission |
|-------|-----------|------------|
| `/linedept` (index) | DepartmentDashboardWorkspace | — |
| `/linedept/dashboard` | DepartmentDashboardWorkspace | — |
| `/linedept/gis-map` | CitizenHome | — |
| `/linedept/complaints` | DepartmentOfficerQueue | complaints.view |
| `/linedept/gis` | DepartmentGisWorkspace | gis.view |
| `/linedept/assets` | DepartmentAssetWorkspace | assets.view |
| `/linedept/workflow` | DepartmentWorkflowWorkspace | projects.view |
| `/linedept/planning` | DepartmentPlanningWorkspace | projects.view |
| `/linedept/planning/new` | DepartmentPlanningWorkspace (view=new) | projects.create |
| `/linedept/planning/proposals/:id` | DepartmentPlanningWorkspace | projects.view |
| `/linedept/data-upload` | DataUpload | projects.create |
| `/linedept/decision-support` | LinedeptDepartmentSupport | assets.view |
| `/linedept/projects` | DepartmentExecutionWorkspace | projects.view |
| `/linedept/projects/:id` | DepartmentProjectDetail | projects.view |
| `/linedept/inventory` | DepartmentResourceWorkspace | inventory.view |
| `/linedept/budget` | DepartmentResourceWorkspace | budget.view |
| `/linedept/reports` | DepartmentReportWorkspace | reports.view |
| `/linedept/employees` | DepartmentWorkforceWorkspace | workforce.view |
| `/linedept/settings` | DepartmentSettingsWorkspace | settings.view |

### Field Engineer Routes (`RequireRole: engineer, field_inspector`)
| Route | Component |
|-------|-----------|
| `/engineer` (index) | EngineerPortal |
| `/engineer/today-tasks` | EngineerPortal |
| `/engineer/navigation` | EngineerPortal |
| `/engineer/gis-map` | CitizenHome |
| `/engineer/inspection` | EngineerPortal |
| `/engineer/evidence` | EngineerPortal |
| `/engineer/offline-sync` | EngineerPortal |
| `/engineer/settings` | EngineerPortal |

### State Admin Routes (`RequireRole: STATE_PORTAL_ROLES`)
| Route | Component |
|-------|-----------|
| `/state-admin` (index) | StateDashboardWorkspace |
| `/state-admin/budget/state` | StateBudgetWorkspace (mode=state) |
| `/state-admin/budget/departments` | StateBudgetWorkspace (mode=departments) |
| `/state-admin/budget/districts` | StateBudgetWorkspace (mode=districts) |
| `/state-admin/budget/history` | StateBudgetWorkspace (mode=history) |
| `/state-admin/budget/scheme-mapping` | StateBudgetWorkspace (mode=scheme-mapping) |
| `/state-admin/finance/sanctions` | StateFinanceWorkspace (mode=sanctions) |
| `/state-admin/finance/releases` | StateFinanceWorkspace (mode=releases) |
| `/state-admin/finance/reappropriation` | StateFinanceWorkspace (mode=reappropriation) |
| `/state-admin/finance/ledger` | StateFinanceWorkspace (mode=ledger) |
| `/state-admin/master/*` | StateMasterWorkspace (various modes) |
| `/state-admin/notifications` | StateNotificationsWorkspace |
| `/state-admin/audit` | StateAuditWorkspace |
| `/state-admin/projects/*` | StateProjectsWorkspace (various modes) |
| `/state-admin/approvals/*` | StateApprovalsWorkspace (various modes) |
| `/state-admin/orders/*` | StateOrdersWorkspace (various modes) |
| `/state-admin/gis/*` | StateGisWorkspace (various modes) |
| `/state-admin/analytics` | StateAnalyticsWorkspace |
| `/state-admin/reports` | StateReportsWorkspace |
| `/state-admin/users` | StateUsersWorkspace |
| `/state-admin/authority` | StateAuthorityWorkspace |

---

## B. API SERVICE INVENTORY

### HTTP Layer
| File | Purpose |
|------|---------|
| `src/services/httpClient.js` | Central `apiRequest()`, JWT refresh, error normalization, timeout, abort |
| `src/services/auth/tokenManager.js` | JWT access/refresh token persistence |
| `src/services/auth/AuthRepository.js` | Auth endpoints: login, signup, me, refresh, change-password, forgot/reset, logout, roles |
| `src/services/auth/AuthService.js` | Auth business logic: normalizeRoleCode, normalizeUser, role→portal mapping |
| `src/api/apiClient.js` | Re-exports httpClient + `BackendCapabilityError` / `unsupported()` |

### API Modules (src/api/)
| Module | Backend Endpoints | Status |
|--------|-------------------|--------|
| `complaintApi.js` | `/complaints/` + 13 workflow actions + geojson/heatmap/nearby/nearest-facility | **COMPLETE** |
| `proposalApi.js` | `/proposals/` CRUD + steps 2-6 + submit/approve/reject/sanction + negotiation + releases | **COMPLETE** |
| `projectApi.js` | `/projects/` CRUD + summary + daily-progress + sanction | **PARTIAL** (missing assign-work, officer-review, verify-completion, expenditure, budget-utilization) |
| `budgetApi.js` | `/state-budgets/`, `/department-budgets/`, `/district-allocations/`, `/schemes/`, `/financial-ledger/`, `/state-budget/summary/` | **COMPLETE** |
| `dashboardApi.js` | All 10 dashboard endpoints (citizen, my, department, officer, field-inspector, district, district-collector, dm, adm, state) | **COMPLETE** |
| `facilityApi.js` | `/facilities/` CRUD + history + asset-categories + bulk-sync-gis | **COMPLETE** |
| `gisApi.js` | `/gis/catalog/`, `/gis/layers/`, `/facilities/geojson/`, `/gis/catalog-crud/`, `/gis/features/` | **COMPLETE** |
| `complaintApi.js` | `/complaints/` full workflow | **COMPLETE** |
| `indicatorApi.js` | `/health/staffing/`, `/education/indicators/`, `/water/indicators/`, `/pwd/indicators/`, `/urban/indicators/` | **COMPLETE** |
| `employeeApi.js` | `/employees/` CRUD + invite + accept-invite | **COMPLETE** |
| `userApi.js` | `/users/` CRUD | **COMPLETE** |
| `notificationApi.js` | `/notifications/` | **COMPLETE** |
| `reportApi.js` | `/reports/` list + generate + download | **COMPLETE** |
| `billApi.js` | `/bills/` CRUD | **COMPLETE** |
| `siteDiaryApi.js` | `/site-diaries/` CRUD | **COMPLETE** |
| `measurementBookApi.js` | `/measurement-books/` CRUD | **COMPLETE** |
| `executionRiskApi.js` | `/execution-risks/` CRUD | **COMPLETE** |
| `gapApi.js` | `/gap/district/`, `/gap/facility/`, `/gap/rankings/`, `/gap/drilldown/`, `/gap/map/`, `/gap/model-metadata/` | **COMPLETE** |
| `feedbackApi.js` | `/feedback/question-sets/`, `/feedback/submissions/`, `/feedback/analytics/*`, `/feedback/map/` | **COMPLETE** |
| `spatialQueryApi.js` | `/spatial-query/` | **COMPLETE** |
| `spatialAnalysisApi.js` | `/spatial-analysis/query/` + client-engine fallback | **COMPLETE** (client-engine operational) |
| `departmentApi.js` | `/departments/`, `/department/{id}/users/`, `/department/{id}/complain/` | **COMPLETE** |
| `departmentSupportApi.js` | Data loading + telemetry probes | **COMPLETE** |
| `masterApi.js` | `/complaint-categories/`, `/districts/`, `/departments/`, `/subdivisions/`, `/blocks/`, `/village-wards/` | **PARTIAL** (subdivisions, blocks, village-wards degrade to []) |
| `planningApi.js` | `/planning/dashboard/` | **COMPLETE** |
| `facilityCache.js` | Shared cached facilities collection | **COMPLETE** |

### GIS Repositories
| Repository | Delegates To |
|------------|-------------|
| `ComplaintRepository.js` | `backendComplaintApi.*` |
| `FacilityRepository.js` | `backendGisApi.facilities/facility` |
| `GISRepository.js` | `backendGisApi.*` + `backendComplaintApi.*` |
| `DepartmentRepository.js` | Not read (assumed similar) |

### Mappers (src/api/mappers/)
All DTOs are mapped through dedicated mapper modules: `billMapper`, `budgetMapper`, `complaintMapper`, `citizenDashboardMapper`, `employeeMapper`, `executionRiskMapper`, `facilityMapper`, `gisMapper`, `measurementBookMapper`, `negotiationMapper`, `notificationMapper`, `projectMapper`, `proposalMapper`, `reportMapper`, `siteDiaryMapper`, `spatialQueryMapper`.

---

## C. BACKEND ENDPOINT → FRONTEND CONSUMER MATRIX

### AUTH
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `POST /api/auth/signup/` | AuthRepository.signup | ✅ Implemented |
| `POST /api/auth/login/` | AuthRepository.login | ✅ Implemented |
| `POST /api/auth/token/refresh/` | httpClient.refreshAccessToken | ✅ Implemented |
| `GET /api/auth/me/` | AuthRepository.getCurrentUser | ✅ Implemented |
| `POST /api/auth/change-password/` | AuthRepository.changePassword | ✅ Implemented |
| `POST /api/auth/forgot-password/` | AuthRepository.forgotPassword | ✅ Implemented |
| `POST /api/auth/forgot-password/reset/` | AuthRepository.resetPassword | ✅ Implemented |
| `POST /api/auth/logout/` | AuthRepository.logout (tokenManager.clear) | ✅ Implemented |
| `GET /api/auth/roles/` | AuthRepository.listRoles | ✅ Implemented |

### USER
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET /api/users/` | backendUserApi.list | ✅ Implemented |
| `POST /api/users/` | backendUserApi.create | ✅ Implemented |
| `GET /api/users/{id}/` | backendUserApi.get | ✅ Implemented |
| `PUT/PATCH /api/users/{id}/` | backendUserApi.update | ✅ Implemented |
| `DELETE /api/users/{id}/` | backendUserApi.remove | ✅ Implemented |
| `GET /api/department/{id}/users/` | backendDepartmentApi.users | ✅ Implemented |

### SPATIAL
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET /api/spatial-query/` | backendSpatialQueryApi.search | ✅ Implemented |
| `GET/POST /api/spatial-analysis/query/` | executeSpatialAnalysis + client-engine fallback | ✅ Implemented |
| `GET/POST /api/spatial-query/query/` | (Same as spatial-query/) | ✅ Implemented |

### GAP PRIORITY
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET /api/gap/district/{id}/` | backendGapApi.districtSummary | ✅ Implemented |
| `GET /api/gap/facility/{id}/` | backendGapApi.facilityDetail | ✅ Implemented |
| `GET /api/gap/rankings/` | backendGapApi.rankings | ✅ Implemented |
| `GET /api/gap/drilldown/` | backendGapApi.drilldown | ✅ Implemented |
| `GET /api/gap/map/` | backendGapApi.mapData | ✅ Implemented |
| `GET /api/gap/model-metadata/` | backendGapApi.modelMetadata | ✅ Implemented |

### DDST / DDSS
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET /api/ddst/departments/` | departmentSupportApi (probe) | ✅ Probed |
| `GET /api/ddst/department/{code}/dashboard/` | departmentSupportApi (probe) | ✅ Probed |
| `GET /api/ddst/dashboard/` | backendDashboardApi | ✅ Implemented |
| `GET /api/ddss/dashboard/` | backendDashboardApi | ✅ Implemented |

### DEPARTMENT INDICATORS
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET /api/health/staffing/` | backendHealthIndicatorsApi.get | ✅ Implemented |
| `GET /api/education/indicators/` | backendEducationIndicatorsApi.get | ✅ Implemented |
| `GET /api/water/indicators/` | backendWaterIndicatorsApi.get | ✅ Implemented |
| `GET /api/pwd/indicators/` | backendPwdIndicatorsApi.get | ✅ Implemented |
| `GET /api/urban/indicators/` | backendUrbanIndicatorsApi.get | ✅ Implemented |
| `GET/POST/PUT /api/health/staffing/` | indicatorApi (read only) | ⚠️ Read-only, no create/update |
| `GET /api/health/facilities/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/health/workload/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/health/infrastructure/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/health/medicines/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/health/ambulances/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/health/vaccination/` | Not wired | ❌ Missing |
| `GET /api/health/risk/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/education/schools/` | Not wired | ❌ Missing |
| `GET /api/education/telemetry/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/water/schemes/` | Not wired | ❌ Missing |
| `GET /api/water/sources/` | Not wired | ❌ Missing |
| `GET /api/water/telemetry/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/road/indicators/` | Not wired | ❌ Missing |
| `GET /api/pwd/telemetry/` | Not wired | ❌ Missing |
| `GET /api/urban/telemetry/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/ddst/indicators/` | Not wired | ❌ Missing |
| `GET /api/forest/` | Not wired | ❌ Missing |

### PLANNING
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET /api/planning/dashboard/` | backendPlanningApi.dashboard | ✅ Implemented |
| `GET/POST /api/proposals/` | backendProposalApi.list/create | ✅ Implemented |
| `GET/PUT/PATCH/DELETE /api/proposals/{id}/` | backendProposalApi.get/update/remove | ✅ Implemented |
| `POST /api/proposals/{id}/step2-survey-inspection/` | backendProposalApi.saveSurveyInspection | ✅ Implemented |
| `POST /api/proposals/{id}/step3-technical-dpr/` | backendProposalApi.saveTechnicalDpr | ✅ Implemented |
| `POST /api/proposals/{id}/step4-financial-estimation/` | backendProposalApi.saveFinancialEstimation | ✅ Implemented |
| `POST /api/proposals/{id}/step5-clearances/` | backendProposalApi.saveClearances | ✅ Implemented |
| `POST /api/proposals/{id}/step6-attachments/` | backendProposalApi.uploadAttachments | ✅ Implemented |
| `POST /api/proposals/{id}/submit/` | backendProposalApi.submit | ✅ Implemented |
| `POST /api/proposals/{id}/approve/` | backendProposalApi.approve | ✅ Implemented |
| `POST /api/proposals/{id}/reject/` | backendProposalApi.reject | ✅ Implemented |
| `POST /api/proposals/{id}/sanction/` | backendProposalApi.sanction | ✅ Implemented |
| `POST /api/proposals/{id}/negotiation/` | backendProposalApi.negotiate | ✅ Implemented |
| `POST /api/proposals/{id}/negotiation-response/` | backendProposalApi.respondNegotiation | ✅ Implemented |
| `GET /api/proposals/{id}/negotiations/` | backendProposalApi.negotiations | ✅ Implemented |
| `GET/POST /api/proposal-negotiations/` | backendProposalApi.proposalNegotiations | ✅ Implemented |
| `POST /api/proposals/{id}/release/` | backendProposalApi.release | ✅ Implemented |
| `GET /api/proposals/{id}/releases/` | backendProposalApi.releases | ✅ Implemented |
| `GET/POST /api/proposal-releases/` | backendProposalApi.proposalReleases | ✅ Implemented |

### PROJECT EXECUTION
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET/POST /api/projects/` | backendProjectApi.list/create | ✅ Implemented |
| `GET/PUT/PATCH/DELETE /api/projects/{id}/` | backendProjectApi.get/update/remove | ✅ Implemented |
| `GET /api/projects/summary/` | backendProjectApi.summary | ✅ Implemented |
| `POST /api/projects/{id}/sanction/` | backendProjectApi.sanction | ✅ Implemented |
| `POST /api/projects/{id}/daily-progress/` | backendProjectApi.dailyProgress | ✅ Implemented |
| `POST /api/projects/{id}/assign-work/` | Not wired | ❌ Missing |
| `POST /api/projects/{id}/assign-officer/` | Not wired | ❌ Missing |
| `POST /api/projects/{id}/assign-engineer/` | Not wired | ❌ Missing |
| `POST /api/projects/{id}/officer-review/` | Not wired | ❌ Missing |
| `POST /api/projects/{id}/verify-completion/` | Not wired | ❌ Missing |
| `POST/GET /api/projects/{id}/expenditure/` | Not wired | ❌ Missing |
| `GET /api/projects/{id}/budget-utilization/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/project-expenditures/` | Not wired | ❌ Missing |
| `GET/POST /api/site-diaries/` | backendSiteDiaryApi.list/create | ✅ Implemented |
| `GET/POST /api/measurement-books/` | backendMeasurementBookApi.list/create | ✅ Implemented |
| `GET/POST/PUT/PATCH/DELETE /api/bills/` | backendBillApi CRUD | ✅ Implemented |
| `GET/POST /api/execution-risks/` | backendExecutionRiskApi CRUD | ✅ Implemented |

### FINANCE
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET /api/state-budget/summary/` | backendBudgetApi.stateBudgetSummary | ✅ Implemented |
| `GET /api/state-budget/` | (via stateBudgets) | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/state-budgets/` | backendBudgetApi.stateBudgets CRUD | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/department-budgets/` | backendBudgetApi.departmentBudgets CRUD | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/district-allocations/` | backendBudgetApi.districtAllocations CRUD | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/schemes/` | backendBudgetApi.schemes CRUD | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/financial-ledger/` | backendBudgetApi.financialLedger CRUD | ✅ Implemented |

### COMPLAINTS
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET/POST /api/complaints/` | backendComplaintApi.list/create | ✅ Implemented |
| `POST /api/complaints/{id}/assign/` | backendComplaintApi.assign | ✅ Implemented |
| `POST /api/complaints/{id}/accept/` | backendComplaintApi.accept | ✅ Implemented |
| `POST /api/complaints/{id}/start-inspection/` | backendComplaintApi.startInspection | ✅ Implemented |
| `POST /api/complaints/{id}/upload-evidence/` | backendComplaintApi.uploadEvidence | ✅ Implemented |
| `POST /api/complaints/{id}/resolve/` | backendComplaintApi.resolve | ✅ Implemented |
| `POST /api/complaints/{id}/citizen-feedback/` | backendComplaintApi.citizenFeedback | ✅ Implemented |
| `POST /api/complaints/{id}/close/` | backendComplaintApi.close | ✅ Implemented |
| `POST /api/complaints/{id}/reopen/` | backendComplaintApi.reopen | ✅ Implemented |
| `POST /api/complaints/{id}/transfer/` | backendComplaintApi.transfer | ✅ Implemented |
| `POST /api/complaints/{id}/escalate/` | backendComplaintApi.escalate | ✅ Implemented |
| `POST /api/complaints/{id}/reject/` | backendComplaintApi.reject | ✅ Implemented |
| `GET /api/complaints/{id}/timeline/` | backendComplaintApi.timeline | ✅ Implemented |
| `GET /api/complaints/geojson/` | backendComplaintApi.geojson | ✅ Implemented |
| `GET /api/complaints/heatmap/` | backendComplaintApi.heatmap | ✅ Implemented |
| `GET /api/complaints/nearby/` | backendComplaintApi.nearby | ✅ Implemented |
| `GET /api/complaints/nearest-facility/` | backendComplaintApi.nearestFacility | ✅ Implemented |

### FEEDBACK
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET/POST /api/feedback/questions/` | backendFeedbackApi.listQuestionSets | ✅ Implemented |
| `GET/POST /api/feedback/responses/` | backendFeedbackApi.listSubmissions/createSubmission | ✅ Implemented |
| `GET /api/feedback/aggregation/` | (via analytics endpoints) | ✅ Implemented |
| `GET /api/feedback/analytics/` | backendFeedbackApi.getOverviewAnalytics + others | ✅ Implemented |

### GIS
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET /api/gis/catalog/` | backendGisApi.catalog | ✅ Implemented |
| `GET /api/gis/layers/{name}/` | backendGisApi.layer | ✅ Implemented |
| `POST /api/gis/upload-layer/` | backendGisApi.uploadLayer | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/gis/catalog-crud/` | backendGisApi.catalogEntries/create/update/remove | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/gis/features/` | backendGisApi.features/create/update/remove | ✅ Implemented |
| `GET /api/gis/features/geojson/` | Not wired (uses facilitiesGeojson instead) | ⚠️ Partial |
| `POST /api/gis/features/bulk-create/` | Not wired | ❌ Missing |
| `POST /api/gis/validate-coordinate/` | Not wired | ❌ Missing |
| `POST /api/gis/check-duplicate/` | Not wired | ❌ Missing |
| `POST /api/evidence/verify-geotag/` | Not wired | ❌ Missing |

### FACILITIES
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET/POST /api/facilities/` | backendFacilityApi.list/create | ✅ Implemented |
| `GET/PUT/DELETE /api/facilities/{id}/` | backendFacilityApi.get/update | ✅ Implemented |
| `GET /api/facilities/geojson/` | backendGisApi.facilitiesGeojson | ✅ Implemented |
| `POST /api/facilities/sync-gis/` | (via bulkSyncGis) | ✅ Implemented |
| `GET /api/facilities/{id}/history/` | backendFacilityApi.history | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/asset-categories/` | backendFacilityApi.categories | ✅ Implemented |

### DASHBOARDS
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET /api/dashboards/my-dashboard/` | backendDashboardApi.myDashboard | ✅ Implemented |
| `GET /api/dashboards/citizen/` | backendDashboardApi.citizen | ✅ Implemented |
| `GET /api/dashboards/department/` | backendDashboardApi.department | ✅ Implemented |
| `GET /api/dashboards/officer/` | backendDashboardApi.officer | ✅ Implemented |
| `GET /api/dashboards/field-inspector/` | backendDashboardApi.fieldInspector | ✅ Implemented |
| `GET /api/dashboards/district/` | backendDashboardApi.district | ✅ Implemented |
| `GET /api/dashboards/district-collector/` | backendDashboardApi.districtCollector | ✅ Implemented |
| `GET /api/dashboards/dm/` | backendDashboardApi.dm | ✅ Implemented |
| `GET /api/dashboards/adm/` | backendDashboardApi.adm | ✅ Implemented |
| `GET /api/dashboards/state/` | backendDashboardApi.state | ✅ Implemented |

### NOTIFICATIONS / REPORTS / EMPLOYEES / MASTER
| Backend Endpoint | Frontend Consumer | Status |
|------------------|-------------------|--------|
| `GET /api/notifications/` | backendNotificationApi.list | ✅ Implemented |
| `GET /api/reports/` | backendReportApi.list | ✅ Implemented |
| `POST /api/reports/generate/` | backendReportApi.generate | ✅ Implemented |
| `GET /api/reports/{id}/download/` | backendReportApi.download | ✅ Implemented |
| `GET/POST /api/employees/` | backendEmployeeApi.list/create | ✅ Implemented |
| `GET/PUT/PATCH/DELETE /api/employees/{id}/` | backendEmployeeApi.get/update/remove | ✅ Implemented |
| `POST /api/employees/invite/` | backendEmployeeApi.invite | ✅ Implemented |
| `POST /api/employees/accept-invite/` | backendEmployeeApi.acceptInvite | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/departments/` | backendMasterApi.departments + backendDepartmentApi.list | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/districts/` | backendMasterApi.districts | ✅ Implemented |
| `GET/POST/PUT/DELETE /api/blocks/` | backendMasterApi.blocks | ✅ Implemented (degrades to []) |
| `GET/POST/PUT/DELETE /api/department-officers/` | Not wired | ❌ Missing |
| `GET/POST/PUT/DELETE /api/states/` | Not wired | ❌ Missing |

---

## D. IMPLEMENTED ENDPOINTS (Summary)

**Fully implemented and wired:** ~120+ endpoints across all major domains.

**Core workflow modules with full backend integration:**
- Authentication (9 endpoints)
- Complaints (17 endpoints — full lifecycle)
- Proposals (18 endpoints — full DPR workflow)
- Projects (6 endpoints — partial, key gaps noted)
- Budget/Finance (7 endpoints — full CRUD)
- Dashboards (10 endpoints — all roles)
- GIS/Facilities (15+ endpoints)
- Employees/Users (10 endpoints)
- Reports (3 endpoints)
- Notifications (1 endpoint)
- Feedback (7 endpoints)
- Gap Priority (6 endpoints)
- Spatial Query/Analysis (3 endpoints + client engine)

---

## E. PARTIALLY IMPLEMENTED ENDPOINTS

| Endpoint | What's Missing |
|----------|----------------|
| `/api/projects/{id}/assign-work/` | API exists; no frontend wiring |
| `/api/projects/{id}/assign-officer/` | API exists; no frontend wiring |
| `/api/projects/{id}/assign-engineer/` | API exists; no frontend wiring |
| `/api/projects/{id}/officer-review/` | API exists; no frontend wiring |
| `/api/projects/{id}/verify-completion/` | API exists; no frontend wiring |
| `/api/projects/{id}/expenditure/` | API exists; no frontend wiring |
| `/api/projects/{id}/budget-utilization/` | API exists; no frontend wiring |
| `/api/project-expenditures/` | API exists; no frontend wiring |
| `/api/gis/features/geojson/` | API exists; frontend uses facilitiesGeojson instead |
| `/api/gis/features/bulk-create/` | API exists; no frontend wiring |
| `/api/gis/validate-coordinate/` | API exists; no frontend wiring |
| `/api/gis/check-duplicate/` | API exists; no frontend wiring |
| `/api/evidence/verify-geotag/` | API exists; no frontend wiring |
| `/api/health/staffing/` (create/update) | Read-only; no POST/PUT wiring |
| `/api/department-officers/` | API exists; no frontend wiring |
| `/api/states/` | API exists; no frontend wiring |

---

## F. MISSING ENDPOINTS (Backend gaps or not wired)

### Backend gaps (documented but likely not deployed):
- `GET /api/saved-queries/` — probed as unsupported
- `POST /api/projects/{id}/assign-work/` — not wired
- `POST /api/projects/{id}/assign-officer/` — not wired
- `POST /api/projects/{id}/assign-engineer/` — not wired
- `POST /api/projects/{id}/officer-review/` — not wired
- `POST /api/projects/{id}/verify-completion/` — not wired
- `GET/POST /api/projects/{id}/expenditure/` — not wired
- `GET /api/projects/{id}/budget-utilization/` — not wired
- `GET/POST/PUT/DELETE /api/project-expenditures/` — not wired
- `GET/POST/PUT/DELETE /api/department-officers/` — not wired
- `GET/POST/PUT/DELETE /api/states/` — not wired
- `GET/POST/PUT/DELETE /api/road/indicators/` — not wired
- `GET /api/forest/` — not wired
- `GET /api/health/facilities/` — not wired
- `GET/POST/PUT/DELETE /api/health/workload/` — not wired
- `GET/POST/PUT/DELETE /api/health/infrastructure/` — not wired
- `GET/POST/PUT/DELETE /api/health/medicines/` — not wired
- `GET/POST/PUT/DELETE /api/health/ambulances/` — not wired
- `GET/POST/PUT/DELETE /api/health/vaccination/` — not wired
- `GET /api/health/risk/` — not wired
- `GET/POST/PUT/DELETE /api/education/schools/` — not wired
- `GET /api/education/telemetry/` — not wired
- `GET/POST/PUT/DELETE /api/water/schemes/` — not wired
- `GET /api/water/sources/` — not wired
- `GET /api/water/telemetry/` — not wired
- `GET /api/pwd/telemetry/` — not wired
- `GET /api/urban/telemetry/` — not wired
- `GET/POST/PUT/DELETE /api/ddst/indicators/` — not wired
- `POST /api/gis/features/bulk-create/` — not wired
- `POST /api/gis/validate-coordinate/` — not wired
- `POST /api/gis/check-duplicate/` — not wired
- `POST /api/evidence/verify-geotag/` — not wired

---

## G. API CONTRACT MISMATCHES

| Area | Mismatch | Severity |
|------|----------|----------|
| **Feedback API paths** | Frontend uses `/feedback/question-sets/`, `/feedback/submissions/`, `/feedback/analytics/overview/` etc. Backend guide documents `/feedback/questions/`, `/feedback/responses/`, `/feedback/aggregation/`, `/feedback/analytics/`. Path divergence may cause 404. | **HIGH** |
| **Gap API paths** | Frontend uses `/gap/district/{id}/`, `/gap/facility/{id}/`, `/gap/rankings/`, `/gap/drilldown/`, `/gap/map/`, `/gap/model-metadata/`. Backend guide documents `/gap-priority/`, `/gap-priority/rankings/`, `/gap-priority/overview/`, `/gap-priority/map/`, `/gap-analysis/`, `/priority-locations/`. Path divergence. | **HIGH** |
| **`/api/spatial-query/query/`** | Frontend wires `GET /api/spatial-query/` only. Backend also documents `GET/POST /api/spatial-query/query/`. | LOW |
| **`/api/complaint-categories/`** | Frontend calls this endpoint; not listed in backend_guide_next2.2.md. May or may not exist. | MEDIUM |
| **`/api/subdivisions/`, `/api/village-wards/`** | Frontend calls these; not in backend guide. Degrades to `[]` gracefully. | LOW |
| **`/api/department/{id}/complain/`** | Frontend calls this; not in backend guide. | MEDIUM |

---

## H. HARDCODED / DEMO / MOCK DATA

| File | Type | Risk |
|------|------|------|
| `src/data/citizenFeedbackQuestions.js` | Hardcoded question set (6 questions) | **HIGH** — should come from `/api/feedback/questions/` |
| `src/services/citizenFeedbackApi.js` | localStorage-based demo adapter | **HIGH** — must use `/api/feedback/submissions/` |
| `src/services/citizenFeedbackAnalytics.js` | Local aggregation from localStorage | **HIGH** — must use `/api/feedback/analytics/` |
| `src/services/mock/facilitySchemas.js` | Hardcoded facility category schemas per department | **MEDIUM** — should come from `/api/asset-categories/` |
| `src/features/auth/demoPersonas.js` | Demo persona users (7 personas) | **LOW** — gated behind `VITE_ENABLE_DEMO`, dev-only |
| `src/config/constants.js` → `DEPARTMENTS` | Hardcoded 8 department display configs | **LOW** — fallback/display-only, backend `/api/departments/` is authoritative |
| `src/config/constants.js` → `ADMINISTRATIVE_STRUCTURE` | Hardcoded Nalanda district blocks/villages | **LOW** — fallback, backend `/api/districts/` is authoritative |
| `src/config/constants.js` → `CATEGORY_ROUTING_RULES` | Hardcoded complaint routing rules | **LOW** — UI routing logic, backend handles actual routing |
| `src/config/stateConstants.js` → `DEFAULT_AUTHORITY_MATRIX` | Configurable placeholder financial authority limits | **LOW** — explicitly marked as configurable placeholders |
| `src/config/stateConstants.js` → `FINANCIAL_YEARS` | Hardcoded FY list | **LOW** — configuration, no backend FY endpoint documented |
| `src/config/stateConstants.js` → `BUDGET_HEADS` | Hardcoded budget head codes | **LOW** — configuration, no backend budget-head endpoint documented |
| `src/features/stateadmin/store/seed/stateSeedData.js` → `SEED_DISTRICTS` | 10 hardcoded Bihar districts | **MEDIUM** — should come from `/api/districts/` |
| `src/features/department/modules/*/sampleAssets` | Hardcoded sample assets per department config | **LOW** — fallback when no backend data |

---

## I. FALLBACK LOGIC

| Location | Fallback Pattern | Risk |
|----------|------------------|------|
| `src/config/constants.js` | `DEPARTMENTS`, `DISTRICTS` used as display fallback | LOW — documented as display-only |
| `src/api/masterApi.js` | `masterCollection()` catches 404 → returns `[]` | LOW — graceful degradation |
| `src/api/facilityApi.js` → `categories()` | Catches error → returns `[]` | LOW — graceful degradation |
| `src/api/spatialAnalysisApi.js` | Backend probe → falls back to client-engine | LOW — transparent, documented |
| `src/api/departmentSupportApi.js` | Telemetry probe → "Data not available" | LOW — transparent |
| `src/features/department/framework/DepartmentWorkspaceProvider.jsx` | Falls back to `health` if dept not in registry | MEDIUM — should show error |
| `src/features/admin/services/DepartmentCoverageService.js` | Hash-based color fallback for departments | LOW — visual only |
| `src/services/httpClient.js` | `API_BASE_URL` defaults to `https://nalanda.drdesigntech.com/api` | LOW — env-configurable |

---

## J. RBAC / PERMISSION CHECKS

| Layer | Mechanism | Status |
|-------|-----------|--------|
| Route-level | `RequireRole` component checks `user.role` against allowed roles | ✅ Implemented |
| Page-level | `DepartmentPage` component checks `useCan(permission)` | ✅ Implemented |
| State portal | `STATE_PORTAL_ROLES` array for `/state-admin/*` routes | ✅ Implemented |
| Auth store | `hasPermission()` checks `ALL_READ`, `ALL_WRITE`, `SYSADMIN` | ✅ Implemented |
| Auth service | `normalizeRoleCode()` maps backend UPPER_SNAKE to frontend lower_snake | ✅ Implemented |
| Department scope | `DepartmentWorkspaceProvider` filters by `user.departmentId` | ✅ Implemented |
| Demo bypass | `VITE_ENABLE_DEMO` gates demo access; `demoSignIn()` bypasses JWT | ⚠️ Dev-only |

**RBAC Gaps:**
- No frontend-level department/district scope enforcement on API calls (relies on backend)
- `DepartmentPage` permission checks are frontend-only; backend must enforce independently
- State admin workspaces don't validate permission before rendering (rely on route guard)

---

## K. LOADING / ERROR / EMPTY STATES

| Pattern | Implementation | Status |
|---------|----------------|--------|
| Loading skeletons | `Skeleton.jsx` component, used in dashboards | ✅ |
| Empty states | `EmptyState.jsx` component | ✅ |
| API errors | `ApiError` class with status-specific messages | ✅ |
| 401 handling | Auto-refresh token, then redirect to login | ✅ |
| 403 handling | "Access denied" page in RequireRole + DepartmentPage | ✅ |
| 404 handling | BackendCapabilityError / empty state | ✅ |
| 5xx handling | Generic "service unavailable" message | ✅ |
| Network errors | "Network error. Please check your connection." | ✅ |
| Timeout | 15s default, 120s for facilities, configurable | ✅ |
| Toast notifications | `useUiStore.pushToast()` for mutation feedback | ✅ |
| Data version invalidation | `dataVersionStore` scope-based cache busting | ✅ |

---

## L. GIS INTEGRATIONS

| Feature | Implementation | Status |
|---------|----------------|--------|
| Facility map markers | `LeafletLayerService` + `cachedFacilities` | ✅ Real backend data |
| Facility GeoJSON | `GET /api/facilities/geojson/` | ✅ Real backend data |
| GIS catalog | `GET /api/gis/catalog/` | ✅ Real backend data |
| GIS layers | `GET /api/gis/layers/{name}/` | ✅ Real backend data |
| Complaint heatmap | `GET /api/complaints/heatmap/` | ✅ Real backend data |
| Complaint GeoJSON | `GET /api/complaints/geojson/` | ✅ Real backend data |
| Spatial query | `GET /api/spatial-query/` | ✅ Real backend data |
| Spatial analysis | Client engine over real backend collections | ✅ Transparent fallback |
| Layer upload | `POST /api/gis/upload-layer/` | ✅ Multipart form |
| Coordinate validation | Probed but not wired | ❌ Missing |
| Duplicate check | Probed but not wired | ❌ Missing |
| Evidence geotag verification | Probed but not wired | ❌ Missing |
| Fake coordinates | None generated | ✅ Clean |
| Fake facility markers | None generated | ✅ Clean |

---

## M. FILE UPLOAD INTEGRATIONS

| Feature | Implementation | Status |
|---------|----------------|--------|
| Complaint evidence upload | `FormData` → `POST /api/complaints/{id}/upload-evidence/` | ✅ |
| Proposal attachments | `FormData` → `POST /api/proposals/{id}/step6-attachments/` | ✅ |
| GIS layer upload | `FormData` → `POST /api/gis/upload-layer/` | ✅ |
| Facility bulk sync | `FormData` → `POST /api/facilities/bulk-sync-gis/` | ✅ |
| Data upload (CSV) | `DataUpload.jsx` component exists | ⚠️ Needs verification |

---

## N. EXPORT / REPORT INTEGRATIONS

| Feature | Implementation | Status |
|---------|----------------|--------|
| Report listing | `GET /api/reports/` | ✅ |
| Report generation | `POST /api/reports/generate/` | ✅ |
| Report download | `GET /api/reports/{id}/download/` (blob) | ✅ |
| Spatial analysis CSV export | `resultsToCsv()` client-side from real results | ✅ |
| Spatial analysis GeoJSON export | `resultsToGeoJson()` client-side from real results | ✅ |
| Bill/measurement book data | All from backend | ✅ |

---

## O. PRODUCTION RISKS

| Risk | Severity | Description |
|------|----------|-------------|
| **Feedback API path mismatch** | **HIGH** | Frontend paths (`/feedback/question-sets/`) may not match backend paths (`/feedback/questions/`). Will cause 404 on feedback submission. |
| **Gap API path mismatch** | **HIGH** | Frontend paths (`/gap/district/{id}/`) may not match backend paths (`/gap-priority/`). Will cause 404 on gap data. |
| **Citizen feedback uses localStorage** | **HIGH** | `citizenFeedbackApi.js` stores feedback in localStorage, not backend. Production will lose all feedback data. |
| **Hardcoded feedback questions** | **HIGH** | `citizenFeedbackQuestions.js` is a static demo set. Should come from `/api/feedback/questions/`. |
| **Project execution gaps** | **MEDIUM** | 7 project workflow endpoints (assign-work, officer-review, etc.) not wired. Department execution workspace uses local engine data. |
| **Missing department sub-indicators** | **MEDIUM** | Health (workload, infrastructure, medicines, ambulances, vaccination, risk), Water (schemes, sources, telemetry), Education (schools, telemetry), PWD (telemetry), Urban (telemetry), Forest — all not wired. |
| **`projectEngine.js` local state** | **MEDIUM** | Work orders, inspections, maintenance tasks, inventory, budgets, contractors, meetings, knowledge are all local-only zustand state, not backend-hydrated. |
| **Demo session persistence** | **LOW** | `DEMO_MARKER` in localStorage persists demo sessions across reloads. Gated behind `VITE_ENABLE_DEMO`. |
| **State seed districts** | **LOW** | 10 hardcoded Bihar districts in `stateSeedData.js`. Should come from `/api/districts/`. |
| **No React Query/SWR** | **LOW** | Custom `useAsync` + `dataVersionStore` pattern. Works but no stale-while-revalidate, no background refetch, no request deduplication (except facility cache). |
| **Master data endpoint gaps** | **LOW** | `/api/department-officers/`, `/api/states/` not wired. `/api/subdivisions/`, `/api/village-wards/` degrade to `[]`. |

---

## P. RECOMMENDED IMPLEMENTATION PHASES

### Phase 1: Critical Data Path Corrections
**Goal:** Fix API path mismatches and eliminate localStorage feedback.
1. Verify feedback API paths against backend (`/feedback/questions/` vs `/feedback/question-sets/`)
2. Verify gap priority API paths against backend (`/gap-priority/` vs `/gap/`)
3. Replace `citizenFeedbackApi.js` localStorage adapter with real `POST /api/feedback/responses/` calls
4. Replace `citizenFeedbackQuestions.js` hardcoded questions with `GET /api/feedback/questions/` fetch
5. Replace `citizenFeedbackAnalytics.js` with real analytics API calls
6. Verify `SEED_DISTRICTS` vs `GET /api/districts/` and hydrate from backend
7. Verify `FACILITY_SCHEMAS` vs `GET /api/asset-categories/` and hydrate from backend

### Phase 2: Project Execution API Wiring
**Goal:** Wire the 7 missing project workflow endpoints.
1. Wire `POST /api/projects/{id}/assign-work/`
2. Wire `POST /api/projects/{id}/assign-officer/`
3. Wire `POST /api/projects/{id}/assign-engineer/`
4. Wire `POST /api/projects/{id}/officer-review/`
5. Wire `POST /api/projects/{id}/verify-completion/`
6. Wire `POST/GET /api/projects/{id}/expenditure/`
7. Wire `GET /api/projects/{id}/budget-utilization/`
8. Wire `GET/POST/PUT/DELETE /api/project-expenditures/`
9. Update `DepartmentExecutionWorkspace.jsx` to use backend APIs instead of local engine
10. Update `DepartmentProjectDetail.jsx` to show real expenditure data

### Phase 3: GIS Enhancement Endpoints
**Goal:** Wire remaining GIS endpoints.
1. Wire `POST /api/gis/features/bulk-create/`
2. Wire `POST /api/gis/validate-coordinate/`
3. Wire `POST /api/gis/check-duplicate/`
4. Wire `POST /api/evidence/verify-geotag/`
5. Wire `GET /api/gis/features/geojson/` as alternative to facilitiesGeojson

### Phase 4: Department Sub-Indicator APIs
**Goal:** Wire the detailed department indicator endpoints.
1. Wire health: workload, infrastructure, medicines, ambulances, vaccination, risk, facilities
2. Wire education: schools, telemetry
3. Wire water: schemes, sources, telemetry
4. Wire road/pwd: telemetry
5. Wire urban: telemetry
6. Wire ddst: indicators
7. Wire forest
8. Update department support sections to consume real telemetry data

### Phase 5: Master Data & State Admin Gaps
**Goal:** Complete master data and state admin integrations.
1. Wire `GET/POST/PUT/DELETE /api/department-officers/`
2. Wire `GET/POST/PUT/DELETE /api/states/`
3. Hydrate state admin districts from `GET /api/districts/` instead of seed data
4. Wire `GET /api/complaint-categories/` verification
5. Wire `GET /api/subdivisions/` and `GET /api/village-wards/` if deployed

### Phase 6: Project Engine Backend Migration
**Goal:** Move local-only project engine state to backend.
1. Migrate workOrders to backend (once `/api/work-orders/` is documented)
2. Migrate inspections to backend
3. Migrate maintenanceTasks to backend
4. Migrate inventory to backend
5. Migrate budgets (department-level) to backend

### Phase 7: Production Hardening
**Goal:** Production-readiness verification.
1. Run `npm run lint` — fix all warnings
2. Run `npm run build` — verify clean build
3. Test all routes with real backend
4. Verify RBAC for every role
5. Verify empty states for every endpoint
6. Verify error states (401, 403, 404, 500)
7. Remove `VITE_ENABLE_DEMO` gated code from production build
8. Remove `setTimeout` used for loading simulation in `AdminReports.jsx`
9. Remove debug `console.log` statements in `proposalApi.js` negotiations method
10. Verify all file uploads use `multipart/form-data`

---

## REMAINING BLOCKERS

1. **Backend feedback API path verification** — critical before any feedback UI work
2. **Backend gap priority API path verification** — critical before gap dashboard work
3. **`/api/work-orders/` endpoint** — not documented; project execution workspace depends on it
4. **`/api/complaint-categories/` verification** — used by complaint wizard; may or may not exist
5. **`/api/subdivisions/`, `/api/village-wards/` verification** — used by complaint wizard
6. **`/api/department-officers/` verification** — needed for state admin user management
7. **`/api/states/` verification** — needed for state admin master data

---

*This audit is a READ-ONLY assessment. No functional changes were made.*

# Nalanda DDSS & NDIS - Recent Development & API Updates Guide (2026-09-02)

This document provides a comprehensive technical guide to the newly implemented **Field Inspection Schedule API Suite** and the **DM Executive Command Center Propose Intervention ERP Module**, including database model updates, migration references, Django Admin integrations, and Postman testing payloads.

> [!NOTE]
> The main system architecture documentation remains unchanged in [`README.md`](file:///e:/Nalanda/ndis/README.md).

---

## 📋 Table of Contents

1. [Field Inspection Schedule API Suite (`/api/inspections/schedule/`)](#1-field-inspection-schedule-api-suite-apiinspectionsschedule)
   - [1.1 Database Architecture & Schema Updates](#11-database-architecture--schema-updates)
   - [1.2 Complete REST API Endpoints & Matrix](#12-complete-rest-api-endpoints--matrix)
   - [1.3 Validation & Error Handlers](#13-validation--error-handlers)
   - [1.4 Postman Testing JSON Payloads](#14-postman-testing-json-payloads)
2. [DM Executive Command Center - Propose Intervention ERP Module (`/api/interventions/propose/`)](#2-dm-executive-command-center---propose-intervention-erp-module-apiinterventionspropose)
   - [2.1 UI Modal Requirements & Database Schema](#21-ui-modal-requirements--database-schema)
   - [2.2 Master REST API Endpoints Table](#22-master-rest-api-endpoints-table)
   - [2.3 7-Stage Status Action Transition Engine](#23-7-stage-status-action-transition-engine)
   - [2.4 Postman Request & Response Examples](#24-postman-request--response-examples)
3. [Django Admin Panel Configurations](#3-django-admin-panel-configurations)
4. [Verification & System Check Log](#4-verification--system-check-log)

---

## 1. Field Inspection Schedule API Suite (`/api/inspections/schedule/`)

The Field Inspection system enables District Magistrates, ADMs, and Department Officers to schedule, monitor, reschedule, complete, and manage field inspections across district facilities.

### 1.1 Database Architecture & Schema Updates

- **Model Class:** `FieldInspection` in [`myapp/models.py`](file:///e:/Nalanda/ndis/myapp/models.py)
- **Database Table:** `ddss_field_inspection`
- **Migration:** `0043_remove_fieldinspection_inspection_code_and_more.py`
- **Key Change:** Purged legacy string `inspection_code`. All CRUD operations are now strictly driven by the integer primary key **`id`** (e.g. `id: 20`).

#### Model Fields Table:
| Field Name | Type | Key Details |
| :--- | :--- | :--- |
| `id` | BigAutoField | Primary Key (Integer, e.g. `20`) |
| `title` | CharField(255) | Auto-generated title (e.g., `Field Inspection: Primary Health Centre`) |
| `location_name` | CharField(255) | Target facility / location name |
| `department_code` | CharField(50) | Department identifier (e.g., `HEALTH`, `EDUCATION`, `PWD`) |
| `inspection_purpose` | TextField | Primary reason for inspection |
| `preferred_date` | DateField | Requested / Preferred inspection date (`YYYY-MM-DD`) |
| `scheduled_date` | DateField | Confirmed inspection date (`YYYY-MM-DD`) |
| `scheduled_time` | TimeField | Scheduled time (`HH:MM:SS`) |
| `inspection_team` | CharField | Choices: `Field Inspection Team`, `Technical Team`, `Joint Inspection Team` |
| `inspector_name` | CharField(150) | Assigned inspector / officer name |
| `instructions` | TextField | Specific field notes or instructions |
| `remarks` | TextField | Completion notes / postponement reason / cancellation remarks |
| `status` | CharField(20) | Choices: `scheduled`, `postponed`, `in_progress`, `completed`, `cancelled` |
| `created_at`, `updated_at` | DateTimeField | Timestamps |

---

### 1.2 Complete REST API Endpoints & Matrix

All inspection endpoints are available under the clean `/api/inspections/schedule/` routing path:

| Action | HTTP Method | Endpoint URL | Description |
| :--- | :---: | :--- | :--- |
| **CREATE** | `POST` | `/api/inspections/schedule/` | Schedule new field inspection (with strict 400 validation) |
| **READ LIST** | `GET` | `/api/inspections/schedule/` | Retrieve list of inspections (`?department=`, `?status=`, `?block=`) |
| **READ SINGLE** | `GET` | `/api/inspections/schedule/{id}/` | Single inspection details by integer `id` |
| **UPDATE / EDIT** | `PATCH` / `PUT` | `/api/inspections/schedule/{id}/` | Update date, time, team, instructions, or remarks |
| **POSTPONE** | `POST` | `/api/inspections/schedule/{id}/postpone/` | Reschedule date with reason (`status -> postponed`) |
| **COMPLETE** | `POST` | `/api/inspections/schedule/{id}/complete/` | Complete inspection with findings (`status -> completed`) |
| **CANCEL** | `POST` | `/api/inspections/schedule/{id}/cancel/` | Soft cancel inspection with reason (`status -> cancelled`) |
| **DELETE** | `DELETE` | `/api/inspections/schedule/{id}/` | Permanent hard delete from PostgreSQL database |

---

### 1.3 Validation & Error Handlers

When executing a `POST /api/inspections/schedule/` request with missing mandatory fields:
- **Response Status:** `400 Bad Request`
- **Response JSON:**
  ```json
  {
    "status": "error",
    "message": "Validation failed: Required fields are missing.",
    "errors": {
      "inspection_purpose": ["This field is required."],
      "preferred_date": ["This field is required."],
      "inspection_team": ["This field is required."]
    }
  }
  ```

---

### 1.4 Postman Testing JSON Payloads

#### 1. Create Inspection Schedule (`POST /api/inspections/schedule/`):
```json
{
  "facility_name": "Primary Health Centre",
  "inspection_purpose": "Verify reported service gap and facility condition.",
  "preferred_date": "2026-09-15",
  "scheduled_time": "10:35:00",
  "inspection_team": "Field Inspection Team",
  "instructions": "Inspect emergency generator and cold chain storage.",
  "coverage_gap_score": "80%"
}
```

#### 2. Postpone Inspection (`POST /api/inspections/schedule/20/postpone/`):
```json
{
  "new_date": "2026-09-25",
  "reason": "Postponed due to heavy rainfall alert in Rahui block."
}
```

#### 3. Complete Inspection (`POST /api/inspections/schedule/20/complete/`):
```json
{
  "findings": "Oxygen plant operational. Staff verified on site.",
  "inspector_name": "Dr. S. K. Verma"
}
```

---

## 2. DM Executive Command Center - Propose Intervention ERP Module (`/api/interventions/propose/`)

This module provides the backend APIs for the **Propose Intervention UI Modal** in the DM Executive Command Center Priorities Tab.

### 2.1 UI Modal Requirements & Database Schema

- **Model Class:** `InterventionProposal` in [`myapp/models.py`](file:///e:/Nalanda/ndis/myapp/models.py)
- **Database Table:** `ddss_intervention_proposal`
- **Migration:** `0044_alter_projectexpenditure_expenditure_date_and_more.py`

#### Model Fields & Form Dropdowns:
- **`intervention_type` Choices:**
  - `Infrastructure improvement`
  - `Additional staff`
  - `Equipment`
  - `Repair / maintenance`
  - `New facility / expansion`
  - `Service improvement`
  - `Connectivity / accessibility`
  - `Safety / hazard mitigation`
  - `Other`
- **`expected_timeline` Choices:** `15 days`, `30 days`, `60 days`, `90 days`, `6 months`, `1 year`
- **`status` Choices:** `PROPOSED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

---

### 2.2 Master REST API Endpoints Table

| Action | HTTP Method | Endpoint URL | Description |
| :--- | :---: | :--- | :--- |
| **CREATE PROPOSAL** | `POST` | `/api/interventions/propose/` | Create intervention proposal from UI modal |
| **LIST PROPOSALS** | `GET` | `/api/interventions/propose/` | DM Executive Dashboard list (`?department=`, `?status=`, `?block=`) |
| **GET SINGLE** | `GET` | `/api/interventions/propose/{id}/` | Retrieve single proposal details by integer `id` |
| **UPDATE / EDIT** | `PATCH` / `PUT` | `/api/interventions/propose/{id}/` | Update proposal fields or status directly |
| **DELETE** | `DELETE` | `/api/interventions/propose/{id}/` | Permanent hard delete from PostgreSQL database |
| **TRANSITION STATUS** | `POST` | `/api/interventions/propose/{id}/{action}/` | Execute dedicated status action (`review`, `approve`, `reject`, `start`, `complete`, `cancel`) |

---

### 2.3 7-Stage Status Action Transition Engine

Dedicated action URLs allow DM and competent authorities to transition proposal status with optional remarks:

| Target Status | Action URL Endpoint | HTTP Method | Example Payload |
| :--- | :--- | :---: | :--- |
| **`UNDER_REVIEW`** | `/api/interventions/propose/{id}/review/` | `POST` | `{"remarks": "Sent to Technical Evaluation Committee."}` |
| **`APPROVED`** | `/api/interventions/propose/{id}/approve/` | `POST` | `{"remarks": "Approved by DM Executive Order #DM-2026-88."}` |
| **`REJECTED`** | `/api/interventions/propose/{id}/reject/` | `POST` | `{"remarks": "Proposal rejected due to budget constraints."}` |
| **`IN_PROGRESS`** | `/api/interventions/propose/{id}/start/` | `POST` | `{"remarks": "Work order issued to PWD department."}` |
| **`COMPLETED`** | `/api/interventions/propose/{id}/complete/` | `POST` | `{"remarks": "Construction & installation 100% completed on site."}` |
| **`CANCELLED`** | `/api/interventions/propose/{id}/cancel/` | `POST` | `{"remarks": "Proposal cancelled by District Magistrate."}` |

---

### 2.4 Postman Request & Response Examples

#### Create Proposal Request (`POST /api/interventions/propose/`):
```json
{
  "facility_name": "Sarmera",
  "facility_type": "Headquarters",
  "intervention_type": "New facility / expansion",
  "description": "Construction of new 30-bed pediatric ward & oxygen generation plant.",
  "estimated_cost": "50 Lacs",
  "expected_timeline": "30 days",
  "coverage_gap_score": "88%"
}
```

#### Successful Response (`201 Created`):
```json
{
  "status": "success",
  "message": "Intervention proposal created successfully.",
  "data": {
    "id": 1,
    "facility_name": "Sarmera",
    "facility_type": "Headquarters",
    "intervention_type": "New facility / expansion",
    "description": "Construction of new 30-bed pediatric ward & oxygen generation plant.",
    "estimated_cost": 5000000.0,
    "expected_timeline": "30 days",
    "coverage_gap_score": "88%",
    "priority_level": "P1",
    "status": "PROPOSED",
    "created_at": "2026-09-02T13:10:44.000Z"
  }
}
```

---

## 3. Django Admin Panel Configurations

Both models have been registered in Django Admin [`myapp/admin.py`](file:///e:/Nalanda/ndis/myapp/admin.py):

```python
@admin.register(FieldInspection)
class FieldInspectionAdmin(admin.ModelAdmin):
    list_display = ["id", "location_name", "department_code", "scheduled_date", "scheduled_time", "status", "inspection_team", "remarks"]
    list_filter = ["status", "department_code", "scheduled_date", "inspection_team"]
    search_fields = ["id", "location_name", "inspection_team", "remarks", "instructions"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-scheduled_date", "-created_at"]


@admin.register(InterventionProposal)
class InterventionProposalAdmin(admin.ModelAdmin):
    list_display = ["id", "location_name", "intervention_type", "estimated_cost", "expected_timeline", "status", "priority_level", "created_at"]
    list_filter = ["status", "intervention_type", "department_code", "priority_level", "created_at"]
    search_fields = ["id", "location_name", "title", "description", "remarks"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]
```

---

## 4. Verification & System Check Log

- **Django System Check:** `python manage.py check` $\rightarrow$ `System check identified no issues (0 silenced).`
- **Database Migrations:** Migrations `0043` and `0044` applied successfully to PostgreSQL database.
- **REST API Suite Verification:** All 15 endpoints verified with 100% clean HTTP responses (`201 Created`, `200 OK`, `400 Bad Request`).

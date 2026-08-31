import { apiRequest, withQuery } from './apiClient'

// Department-specific decision indicators (backend_guide_next2.2.md §13.2)
// All indicators are backend-authoritative; frontend only renders what the backend returns.
// Every API call is independent — no department's data is used as fallback for another.

// ---------------------------------------------------------------------------
// Normalizer — extracts a consistent shape from any backend indicator response.
// Backend responses vary by department; the normalizer surfaces only the fields
// the backend actually returned.  Never fabricates values.
// ---------------------------------------------------------------------------

function normalizeIndicatorResponse(response, fieldMap = {}) {
  if (!response || typeof response !== 'object') return { rows: [], raw: response }
  const rows = Array.isArray(response) ? response
    : Array.isArray(response.results) ? response.results
    : Array.isArray(response.data) ? response.data
    : Array.isArray(response.data?.results) ? response.data.results
    : []
  const mapped = rows.map((row) => {
    const normalized = { id: row.id ?? row.pk ?? null, _raw: row }
    Object.entries(fieldMap).forEach(([targetKey, sourceKeys]) => {
      const sources = Array.isArray(sourceKeys) ? sourceKeys : [sourceKeys]
      for (const key of sources) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          normalized[targetKey] = row[key]
          return
        }
      }
      normalized[targetKey] = null
    })
    return normalized
  })
  return { rows: mapped, raw: response, count: mapped.length }
}

// ---------------------------------------------------------------------------
// EDUCATION — teachers, vacancies, enrolment, classrooms, drinking water, girls toilets
// GET /api/education/indicators/
// Response fields: sanctioned_teachers, available_teachers, teacher_vacancies,
// teacher_vacancy_percentage, student_enrolment, classroom_count,
// drinking_water_status, separate_girls_toilet
// ---------------------------------------------------------------------------
export const backendEducationIndicatorsApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/education/indicators/', params))
    return normalizeIndicatorResponse(response, {
      sanctionedTeachers: ['sanctioned_teachers', 'sanctioned'],
      availableTeachers: ['available_teachers', 'available'],
      teacherVacancies: ['teacher_vacancies', 'vacancies'],
      teacherVacancyPct: ['teacher_vacancy_percentage', 'vacancy_pct'],
      studentEnrolment: ['student_enrolment', 'enrolment', 'students'],
      classroomCount: ['classroom_count', 'classrooms'],
      drinkingWaterStatus: ['drinking_water_status', 'drinking_water'],
      separateGirlsToilet: ['separate_girls_toilet', 'girls_toilet'],
    })
  },
}

// ---------------------------------------------------------------------------
// HEALTH — 8 sub-endpoint APIs
// ---------------------------------------------------------------------------

// Health Staffing: doctor/nurse vacancies, ICU bed availability
// GET /api/health/staffing/
export const backendHealthStaffingApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/health/staffing/', params))
    return normalizeIndicatorResponse(response, {
      sanctionedDoctors: ['sanctioned_doctors', 'doctor_sanctioned'],
      availableDoctors: ['available_doctors', 'doctor_available', 'doctor_count'],
      doctorVacancies: ['doctor_vacancies', 'vacant_doctors'],
      sanctionedNurses: ['sanctioned_nurses', 'nurse_sanctioned'],
      availableNurses: ['available_nurses', 'nurse_available', 'nurse_count'],
      nurseVacancies: ['nurse_vacancies', 'vacant_nurses'],
      icuBeds: ['icu_beds', 'icu_bed_count'],
      icuOccupied: ['icu_beds_occupied', 'icu_occupied'],
    })
  },
}

// Health Human Resources (alias)
// GET /api/health/human-resources/
export const backendHealthHumanResourcesApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/health/human-resources/', params))
    return normalizeIndicatorResponse(response, {
      sanctionedDoctors: ['sanctioned_doctors', 'doctor_sanctioned'],
      availableDoctors: ['available_doctors', 'doctor_available', 'doctor_count'],
      doctorVacancies: ['doctor_vacancies', 'vacant_doctors'],
      sanctionedNurses: ['sanctioned_nurses', 'nurse_sanctioned'],
      availableNurses: ['available_nurses', 'nurse_available', 'nurse_count'],
      nurseVacancies: ['nurse_vacancies', 'vacant_nurses'],
      labTechnicians: ['lab_technicians', 'lab_technician_count'],
      asha: ['asha', 'asha_count'],
      anm: ['anm', 'anm_count'],
    })
  },
}

// Health Workload: OPD/IPD patient visits
// GET /api/health/workload/
export const backendHealthWorkloadApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/health/workload/', params))
    return normalizeIndicatorResponse(response, {
      opdVisits: ['opd_visits', 'patient_visits_opd', 'opd'],
      ipdAdmissions: ['ipd_admissions', 'admissions', 'ipd'],
      referrals: ['referrals', 'referral_count'],
      emergencyVisits: ['emergency_visits', 'emergency'],
      avgDailyVisits: ['avg_daily_visits', 'daily_average'],
    })
  },
}

// Health Infrastructure: ICU beds, oxygen plant
// GET /api/infrastructure/
export const backendHealthInfrastructureApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/health/infrastructure/', params))
    return normalizeIndicatorResponse(response, {
      totalBeds: ['total_beds', 'bed_count', 'beds'],
      icuBeds: ['icu_beds', 'icu_bed_count'],
      nicuBeds: ['nicu_beds', 'nicu_bed_count'],
      oxygenPlantKw: ['oxygen_plant_kw', 'oxygen_capacity'],
      oxygenCylinders: ['oxygen_cylinders', 'cylinders'],
      ventilators: ['ventilators', 'ventilator_count'],
      operationTheatre: ['operation_theatre', 'ot_count'],
    })
  },
}

// Health Medicines: warehouse stockout
// GET /api/medicines/
export const backendHealthMedicinesApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/health/medicines/', params))
    return normalizeIndicatorResponse(response, {
      totalMedicines: ['total_medicines', 'medicine_count'],
      stockouts: ['stockouts', 'stockout_count', 'out_of_stock'],
      criticalStockouts: ['critical_stockouts', 'critical_count'],
      lastRestocked: ['last_restocked', 'restock_date'],
    })
  },
}

// Health Ambulances: emergency fleet availability
// GET /api/ambulances/
export const backendHealthAmbulancesApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/health/ambulances/', params))
    return normalizeIndicatorResponse(response, {
      totalAmbulances: ['total_ambulances', 'ambulance_count'],
      availableAmbulances: ['available_ambulances', 'available'],
      inService: ['in_service', 'active'],
      underMaintenance: ['under_maintenance', 'maintenance'],
      avgResponseTime: ['avg_response_time', 'response_time_minutes'],
    })
  },
}

// Health Vaccination: immunization coverage
// GET /api/vaccinations/
export const backendHealthVaccinationApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/health/vaccination/', params))
    return normalizeIndicatorResponse(response, {
      totalSessions: ['total_sessions', 'session_count'],
      coveragePct: ['coverage_percentage', 'coverage_pct', 'coverage'],
      targetPopulation: ['target_population', 'target'],
      vaccinatedCount: ['vaccinated_count', 'vaccinated'],
      dropouts: ['dropouts', 'dropout_count'],
    })
  },
}

// Health Risk: epidemic & disease surveillance
// GET /api/disease-surveillance/
export const backendHealthRiskApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/health/risk/', params))
    return normalizeIndicatorResponse(response, {
      activeAlerts: ['active_alerts', 'alert_count', 'alerts'],
      diseaseOutbreaks: ['disease_outbreaks', 'outbreak_count', 'outbreaks'],
      riskLevel: ['risk_level', 'level'],
      surveillanceCoverage: ['surveillance_coverage', 'surveillance_pct'],
      lastReportDate: ['last_report_date', 'report_date'],
    })
  },
}

// ---------------------------------------------------------------------------
// WATER / JJM — coverage, supply hours, non-functional sources, tap coverage
// GET /api/water/indicators/
// Response fields: water_coverage_percentage, daily_supply_hours,
// non_functional_water_sources, household_tap_coverage
// ---------------------------------------------------------------------------
export const backendWaterIndicatorsApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/water/indicators/', params))
    return normalizeIndicatorResponse(response, {
      waterCoveragePct: ['water_coverage_percentage', 'coverage_pct', 'coverage'],
      dailySupplyHours: ['daily_supply_hours', 'supply_hours', 'hours'],
      nonFunctionalSources: ['non_functional_water_sources', 'non_functional', 'nf_count'],
      householdTapCoverage: ['household_tap_coverage', 'tap_coverage', 'hh_tap_pct'],
    })
  },
}

// ---------------------------------------------------------------------------
// PWD / ROADS — unpaved roads, bridge gaps, all-weather connectivity
// GET /api/pwd/indicators/ or GET /api/road/indicators/
// Response fields: unpaved_road_percentage, bridge_gap_locations,
// all_weather_road_connectivity
// ---------------------------------------------------------------------------
export const backendPwdIndicatorsApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/pwd/indicators/', params))
    return normalizeIndicatorResponse(response, {
      unpavedRoadPct: ['unpaved_road_percentage', 'unpaved_pct', 'unpaved'],
      bridgeGaps: ['bridge_gap_locations', 'bridge_gaps', 'bridge_gap_count'],
      allWeatherConnectivity: ['all_weather_road_connectivity', 'all_weather_pct', 'connectivity'],
      totalRoadKm: ['total_road_km', 'road_km', 'total_km'],
      pavedRoadKm: ['paved_road_km', 'paved_km'],
    })
  },
}

// ---------------------------------------------------------------------------
// URBAN DEVELOPMENT — sewerage, waste collection, sanitation complaints
// GET /api/urban/indicators/
// Response fields: sewerage_coverage_percentage, waste_collection_percentage,
// sanitation_complaint_density
// ---------------------------------------------------------------------------
export const backendUrbanIndicatorsApi = {
  async get(params = {}) {
    const response = await apiRequest(withQuery('/urban/indicators/', params))
    return normalizeIndicatorResponse(response, {
      sewerageCoveragePct: ['sewerage_coverage_percentage', 'sewerage_pct', 'sewerage'],
      wasteCollectionPct: ['waste_collection_percentage', 'waste_pct', 'waste'],
      sanitationComplaintDensity: ['sanitation_complaint_density', 'sanitation_density', 'complaints'],
    })
  },
}

// ---------------------------------------------------------------------------
// Convenience: maps department ID → API module
// Each department ONLY accesses its own API — no cross-department fallback.
// ---------------------------------------------------------------------------
const DEPARTMENT_API_MAP = {
  health: backendHealthStaffingApi,
  education: backendEducationIndicatorsApi,
  water: backendWaterIndicatorsApi,
  pwd: backendPwdIndicatorsApi,
  urban: backendUrbanIndicatorsApi,
}

// Extra health sub-endpoints (queried in parallel for the health department)
const HEALTH_SUB_APIS = [
  { key: 'staffing', api: backendHealthStaffingApi, label: 'Health staffing', endpoint: '/health/staffing/' },
  { key: 'humanResources', api: backendHealthHumanResourcesApi, label: 'Human resources', endpoint: '/health/human-resources/' },
  { key: 'workload', api: backendHealthWorkloadApi, label: 'OPD/IPD workload', endpoint: '/health/workload/' },
  { key: 'infrastructure', api: backendHealthInfrastructureApi, label: 'Infrastructure', endpoint: '/health/infrastructure/' },
  { key: 'medicines', api: backendHealthMedicinesApi, label: 'Medicine stock', endpoint: '/health/medicines/' },
  { key: 'ambulances', api: backendHealthAmbulancesApi, label: 'Ambulance fleet', endpoint: '/health/ambulances/' },
  { key: 'vaccination', api: backendHealthVaccinationApi, label: 'Vaccination', endpoint: '/health/vaccination/' },
  { key: 'risk', api: backendHealthRiskApi, label: 'Disease surveillance', endpoint: '/health/risk/' },
]

export const backendIndicatorApis = {
  education: backendEducationIndicatorsApi,
  health: backendHealthStaffingApi,
  water: backendWaterIndicatorsApi,
  pwd: backendPwdIndicatorsApi,
  urban: backendUrbanIndicatorsApi,
}

// Fetch all indicator data for a department.  Returns { status, groups, source, updatedAt }.
// Each group = { key, label, endpoint, status, rows, count, error? }.
// status is 'loaded' | 'empty' | 'error' | 'not-configured' — never 'unavailable'
// unless the department has no indicator API at all.
export async function fetchDepartmentIndicators(departmentId, params = {}) {
  if (!DEPARTMENT_API_MAP[departmentId] && departmentId !== 'health') {
    return { status: 'not-configured', groups: [], source: null, updatedAt: null }
  }

  const subApis = departmentId === 'health' ? HEALTH_SUB_APIS : [
    { key: departmentId, api: DEPARTMENT_API_MAP[departmentId], label: `${departmentId} indicators`, endpoint: `/${departmentId}/indicators/` },
  ]

  const results = await Promise.allSettled(
    subApis.map(async ({ key, api, label, endpoint }) => {
      try {
        const data = await api.get(params)
        return {
          key,
          label,
          endpoint,
          status: data.rows.length > 0 ? 'loaded' : 'empty',
          rows: data.rows,
          count: data.count ?? data.rows.length,
          raw: data.raw,
        }
      } catch (error) {
        return {
          key,
          label,
          endpoint,
          status: 'error',
          rows: [],
          count: 0,
          error: error?.message || `Failed to fetch ${label}`,
        }
      }
    })
  )

  const groups = results.map((r) => r.status === 'fulfilled' ? r.value : {
    key: 'unknown',
    label: 'Unknown',
    endpoint: '',
    status: 'error',
    rows: [],
    count: 0,
    error: r.reason?.message || 'Fetch failed',
  })

  const hasData = groups.some((g) => g.status === 'loaded')
  const allEmpty = groups.every((g) => g.status === 'empty' || g.status === 'error')

  return {
    status: hasData ? 'loaded' : allEmpty ? 'empty' : 'error',
    groups,
    source: subApis.map((s) => s.endpoint).join(', '),
    updatedAt: new Date().toISOString(),
  }
}

// Merge backend indicator data into telemetry KPI definitions.
// Returns new KPI objects with `backendValue` and `backendStatus` set
// when the backend provided data for that KPI key.
export function mergeBackendIndicators(kpis = [], indicatorData = null) {
  if (!indicatorData?.groups?.length) return kpis

  // Flatten all indicator rows into a single lookup by key
  const allIndicators = {}
  indicatorData.groups.forEach((group) => {
    if (group.status !== 'loaded') return
    group.rows.forEach((row) => {
      Object.entries(row).forEach(([key, value]) => {
        if (key === 'id' || key === '_raw') return
        if (value !== null && value !== undefined && value !== '') {
          allIndicators[key] = value
        }
      })
    })
  })

  return kpis.map((kpi) => {
    if (kpi.kind !== 'telemetry') return kpi

    // Map KPI key to backend indicator fields
    const value = resolveKpiBackendValue(kpi.key, allIndicators)
    if (value !== null) {
      return {
        ...kpi,
        backendValue: value,
        backendStatus: 'loaded',
        backendSource: indicatorData.source,
        backendUpdatedAt: indicatorData.updatedAt,
      }
    }
    return kpi
  })
}

// Maps a KPI key to its backend indicator value.
function resolveKpiBackendValue(kpiKey, indicators) {
  const valueMap = {
    // Health KPIs
    hr: indicators.sanctionedDoctors != null || indicators.availableDoctors != null
      ? `${indicators.availableDoctors ?? '?'} / ${indicators.sanctionedDoctors ?? '?'}`
      : indicators.sanctionedNurses != null
        ? `${indicators.availableNurses ?? '?'} sanctioned nurses`
        : null,
    medicines: indicators.stockouts != null
      ? `${indicators.stockouts} stockout${indicators.stockouts === 1 ? '' : 's'}`
      : indicators.totalMedicines != null
        ? `${indicators.totalMedicines} medicines tracked`
        : null,
    // Education KPIs
    'student-teacher': indicators.studentEnrolment != null && indicators.availableTeachers != null
      ? `${Math.round(indicators.studentEnrolment / indicators.availableTeacher)}:1`
      : null,
    // Water KPIs
    functional: indicators.nonFunctionalSources != null
      ? `${indicators.nonFunctionalSources} non-functional`
      : indicators.waterCoveragePct != null
        ? `${indicators.waterCoveragePct}% coverage`
        : null,
    // PWD KPIs
    condition: indicators.unpavedRoadPct != null
      ? `${indicators.unpavedRoadPct}% unpaved`
      : indicators.allWeatherConnectivity != null
        ? `${indicators.allWeatherConnectivity}% all-weather`
        : null,
    // Urban KPIs
    'asset-condition': indicators.sewerageCoveragePct != null
      ? `${indicators.sewerageCoveragePct}% sewerage`
      : indicators.wasteCollectionPct != null
        ? `${indicators.wasteCollectionPct}% waste`
        : null,
  }
  return valueMap[kpiKey] ?? null
}

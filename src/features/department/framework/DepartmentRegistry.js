import { HEALTH_CONFIG } from '../modules/health/healthConfig'
import { WATER_CONFIG } from '../modules/water/waterConfig'
import { EDUCATION_CONFIG } from '../modules/education/educationConfig'
import { SOLAR_CONFIG } from '../modules/solar/solarConfig'
import { TOURISM_CONFIG } from '../modules/tourism/tourismConfig'
import { DEPARTMENTS } from '../../../config/constants'

// Central Department Registry System (Part 1 & Part 13 Requirements)
class DepartmentRegistrySystem {
  constructor() {
    this.registry = new Map()

    // Register Reference Health Department
    this.register(HEALTH_CONFIG)
    this.register(WATER_CONFIG)
    this.register(EDUCATION_CONFIG)
    this.register(SOLAR_CONFIG)
    this.register(TOURISM_CONFIG)

    // Register Default Fallback Templates for other departments
    DEPARTMENTS.forEach((dept) => {
      if (!this.registry.has(dept.id)) {
        this.register({
          id: dept.id,
          code: dept.id.toUpperCase().slice(0, 4),
          label: dept.label,
          tagline: `${dept.label} Sector Operations & Asset Telemetry`,
          color: dept.color || '#1d7ab5',
          accent: dept.accent || 'sky',
          icon: dept.icon || 'Building2',
          custodian: `District ${dept.label} Division Office, Nalanda`,
          assetTypes: [
            { id: `${dept.id}_primary`, label: `Primary ${dept.label} Facility`, radiusKm: 3, icon: 'Building2' },
            { id: `${dept.id}_substation`, label: `Substation / Asset Point`, radiusKm: 2, icon: 'MapPin' },
          ],
          complaintCategories: [
            { id: `${dept.id}_defect`, name: `General ${dept.label} Equipment Defect`, defaultPriority: 'high', slaHours: 24 },
          ],
          dashboardWidgets: [
            { id: 'kpi_strip', type: 'kpis', title: `${dept.label} Sector KPIs`, span: 12 },
            { id: 'complaint_queue', type: 'complaint_queue', title: 'Active Complaints Queue', span: 8 },
            { id: 'gis_mini_map', type: 'gis_mini_map', title: 'Department Asset Map', span: 4 },
          ],
          documentCategories: ['Inspection Reports', 'Sanction Directives', 'Maintenance Logs'],
        })
      }
    })
  }

  register(config) {
    if (!config.id) throw new Error('Department configuration must have a unique id.')
    this.registry.set(config.id, config)
  }

  get(id) {
    return this.registry.get(id) || this.registry.get('health')
  }

  getAll() {
    return Array.from(this.registry.values())
  }
}

export const DepartmentRegistry = new DepartmentRegistrySystem()

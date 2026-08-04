import { createRepository } from './createRepository'
export const MaintenanceRepository = createRepository((state) => state.maintenanceTasks)

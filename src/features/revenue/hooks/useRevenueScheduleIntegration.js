import { useCallback } from 'react';
import { mapInspectionToTask } from '../../admin/dmSchedule/dmScheduleMapper';


export function useRevenueScheduleIntegration() {
  const scheduleInspectionTask = useCallback(async (property, options = {}) => {
    try {
      const taskDto = mapInspectionToTask({
        id: `REV-INSP-${property.id}`,
        propertyId: property.propertyId || property.id,
        inspectionType: options.inspectionType || 'FIELD_AUDIT',
        scheduledDate: options.scheduledDate || new Date().toISOString().split('T')[0],
        assignedToName: options.inspectorName || 'Field Inspector',
        priority: options.priority || 'HIGH',
        purpose: options.purpose || `GIS Discrepancy inspection for ${property.holdingNumber || property.id}`
      });

      // Simulated integration with DM schedule store
      console.log('[DM Schedule Integration] Task created for revenue workflow:', taskDto);
      return { success: true, taskId: taskDto.id };
    } catch (error) {
      console.error('[DM Schedule Integration Error]', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    scheduleInspectionTask
  };
}


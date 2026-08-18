import { apiRequest } from './apiClient'
import { mapNotificationList } from './mappers/notificationMapper'

const query = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params)
    .filter(([, item]) => item !== undefined && item !== null && item !== '')
    .map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}

export const backendNotificationApi = {
  // GET /api/notifications/ — optional filters: read, channel, department.
  async list(params = {}) { return mapNotificationList(await apiRequest(`/notifications/${query(params)}`)) },
}
import { apiRequest, withQuery } from './apiClient'
import { mapNotificationList } from './mappers/notificationMapper'

export const backendNotificationApi = {
  // GET /api/notifications/ — optional filters: read, channel, department.
  async list(params = {}) { return mapNotificationList(await apiRequest(withQuery('/notifications/', params))) },
}
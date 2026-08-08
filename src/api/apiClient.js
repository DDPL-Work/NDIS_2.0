// The one HTTP boundary for application repositories.  Backend DTOs are mapped
// by the API module that owns them; views must never import this client.
export { apiRequest, ApiError } from '../services/httpClient'

export class BackendCapabilityError extends Error {
  constructor(capability) {
    super(`The backend does not provide an API for ${capability} yet.`)
    this.name = 'BackendCapabilityError'
    this.capability = capability
  }
}

export function unsupported(capability) {
  return Promise.reject(new BackendCapabilityError(capability))
}

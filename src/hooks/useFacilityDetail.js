import { useAsync } from './useAsync'
import { FacilityRepository } from '../gis/repositories/FacilityRepository'

export function useFacilityDetail(slug) {
  return useAsync(() => FacilityRepository.findBySlug(slug), [slug])
}

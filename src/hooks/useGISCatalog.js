import { useAsync } from './useAsync'
import { GISRepository } from '../gis/repositories/GISRepository'

// Equivalent to REF.html's loadGisCatalog(), expressed as React state.
export function useGISCatalog() {
  return useAsync(() => GISRepository.catalog(), [])
}

// Revenue & Property Intelligence — Property Selection Hook
// Handles map-list synchronization and property selection state

import { useMemo, useCallback } from 'react'

export function usePropertySelection(propertiesData, selectedPropertyId, onSelect) {
  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId || !propertiesData?.data) return null
    return propertiesData.data.find(p => p.id === selectedPropertyId)
  }, [propertiesData, selectedPropertyId])

  const handleMapSelect = useCallback((propertyId) => {
    onSelect?.(propertyId)
  }, [onSelect])

  const handleListSelect = useCallback((propertyId) => {
    onSelect?.(propertyId)
  }, [onSelect])

  const clearSelection = useCallback(() => {
    onSelect?.(null)
  }, [onSelect])

  return {
    selectedProperty,
    handleMapSelect,
    handleListSelect,
    clearSelection,
  }
}

export default usePropertySelection
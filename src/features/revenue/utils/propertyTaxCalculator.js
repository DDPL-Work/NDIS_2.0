import { area as geoJsonArea } from '@turf/turf'

const RATE_PER_SQFT = 50
const CESS_RATE = 0.05
const SQM_TO_SQFT = 10.7639

function round2(value) {
  return Math.round(value * 100) / 100
}

function calculateAreaSqft(feature) {
  const props = feature?.properties || {}

  if (typeof props.area_sqft === 'number' && props.area_sqft > 0) {
    return round2(props.area_sqft)
  }

  if (typeof props.estimated_area_sqft === 'number' && props.estimated_area_sqft > 0) {
    return round2(props.estimated_area_sqft)
  }

  if (feature?.geometry) {
    try {
      const areaSqm = geoJsonArea(feature)
      if (areaSqm > 0) {
        return round2(areaSqm * SQM_TO_SQFT)
      }
    } catch {
      // fall through to perimeter fallback
    }
  }

  if (typeof props.shape_leng === 'number' && props.shape_leng > 0) {
    const approxSqft = Math.pow(props.shape_leng / 4, 2) * SQM_TO_SQFT
    return round2(approxSqft)
  }

  return null
}

export function calculatePropertyTax(feature) {
  const areaSqft = calculateAreaSqft(feature)
  const props = feature?.properties || {}

  const backendBaseTax = typeof props.base_tax === 'number' ? props.base_tax : null
  const backendCess = typeof props.cess === 'number' ? props.cess : null
  const backendTotalAmount = typeof props.total_amount === 'number' ? props.total_amount : null
  const backendCess5Percent = typeof props.cess_5_percent === 'number' ? props.cess_5_percent : null
  const backendRate = typeof props.rate_per_sqft === 'number' ? props.rate_per_sqft : RATE_PER_SQFT

  let baseTax
  let cess
  let totalAmount
  let rateUsed = backendRate

  if (backendBaseTax !== null && backendCess !== null && backendTotalAmount !== null) {
    baseTax = round2(backendBaseTax)
    cess = round2(backendCess)
    totalAmount = round2(backendTotalAmount)
  } else if (backendBaseTax !== null && backendCess5Percent !== null) {
    baseTax = round2(backendBaseTax)
    cess = round2(backendCess5Percent)
    totalAmount = round2(baseTax + cess)
  } else if (backendTotalAmount !== null && backendBaseTax !== null) {
    baseTax = round2(backendBaseTax)
    totalAmount = round2(backendTotalAmount)
    cess = round2(totalAmount - baseTax)
  } else if (areaSqft !== null) {
    baseTax = round2(areaSqft * rateUsed)
    cess = round2(baseTax * CESS_RATE)
    totalAmount = round2(baseTax + cess)
  } else {
    return {
      areaSqm: null,
      areaSqft: null,
      ratePerSqft: rateUsed,
      baseTax: null,
      cess: null,
      cessRate: CESS_RATE,
      totalAmount: null,
      calculationUnavailable: true
    }
  }

  const areaSqm = areaSqft ? round2(areaSqft / SQM_TO_SQFT) : null

  return {
    areaSqm,
    areaSqft,
    ratePerSqft: rateUsed,
    baseTax,
    cess,
    cessRate: CESS_RATE,
    totalAmount,
    calculationUnavailable: false
  }
}

export function getTaxBreakdown(feature) {
  const calc = calculatePropertyTax(feature)
  if (calc.calculationUnavailable) {
    return {
      available: false,
      message: 'Tax calculation unavailable'
    }
  }
  return {
    available: true,
    areaSqft: calc.areaSqft,
    ratePerSqft: calc.ratePerSqft,
    baseTax: calc.baseTax,
    cessRate: calc.cessRate,
    cess: calc.cess,
    totalAmount: calc.totalAmount
  }
}
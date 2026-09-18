import assert from 'node:assert'
import { test, describe } from 'node:test'
import {
  normalizePropertyList,
  normalizePropertyDetail,
  normalizeAssessmentList,
  normalizeDemandList,
  normalizeArrearsList
} from '../utils/revenueNormalizer.js'

describe('Revenue Normalizer Utilities', () => {
  test('normalizePropertyList handles direct array response', () => {
    const mockInput = [
      { id: 'PROP-1', property_code: 'P-001', owner_name: 'Rajesh Kumar' },
      { id: 'PROP-2', property_code: 'P-002', owner_name: 'Priya Singh' }
    ]
    const result = normalizePropertyList(mockInput)
    assert.strictEqual(result.data.length, 2)
    assert.strictEqual(result.data[0].id, 'PROP-1')
    assert.strictEqual(result.data[0].ownerName, 'Rajesh Kumar')
  })

  test('normalizePropertyList handles paginated DRF response envelope', () => {
    const mockInput = {
      count: 100,
      next: 'http://api.ndisp.gov.in/properties?page=2',
      previous: null,
      results: [
        { id: 'PROP-10', property_code: 'P-010', owner_name: 'Amit Sharma' }
      ]
    }
    const result = normalizePropertyList(mockInput)
    assert.strictEqual(result.pagination.count, 100)
    assert.strictEqual(result.data.length, 1)
    assert.strictEqual(result.data[0].id, 'PROP-10')
  })

  test('normalizePropertyDetail maps nested relations safely', () => {
    const propertyDto = { id: 'PROP-50', property_code: 'P-050', owner_name: 'Vikram Mehta' }
    const relatedData = {
      assessments: [{ id: 'ASS-1', annual_value: 50000 }],
      demands: [{ id: 'DEM-1', amount: 6000 }],
      arrears: [{ id: 'ARR-1', total_arrears: 12000 }]
    }
    const normalized = normalizePropertyDetail(propertyDto, relatedData)
    assert.strictEqual(normalized.id, 'PROP-50')
    assert.strictEqual(normalized.assessments.length, 1)
    assert.strictEqual(normalized.assessments[0].annualValue, 50000)
    assert.strictEqual(normalized.demands.length, 1)
    assert.strictEqual(normalized.arrears.length, 1)
  })

  test('normalizeAssessmentList returns empty list fallback on null input', () => {
    const result = normalizeAssessmentList(null)
    assert.deepStrictEqual(result.data, [])
    assert.strictEqual(result.pagination.count, 0)
  })
})

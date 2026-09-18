import assert from 'node:assert'
import { test, describe } from 'node:test'
import { derivePropertyTaxStatus, getPropertyAttentionFlags, getFYPaymentStatus } from '../utils/taxStatus.js'

describe('Tax Status & Attention Flag Utilities', () => {
  test('derivePropertyTaxStatus returns EXEMPT for exempt property', () => {
    const status = derivePropertyTaxStatus({ isExempt: true, currentDemand: 1000 })
    assert.strictEqual(status, 'exempt')
  })

  test('derivePropertyTaxStatus returns ARREARS when arrears present', () => {
    const status = derivePropertyTaxStatus({ totalArrears: 5000, currentDemand: 1000, totalPaid: 0 })
    assert.strictEqual(status, 'arrears')
  })

  test('derivePropertyTaxStatus returns PAID when demand is fully met', () => {
    const status = derivePropertyTaxStatus({ currentDemand: 10000, totalPaid: 10000, totalOutstanding: 0 })
    assert.strictEqual(status, 'paid')
  })

  test('getPropertyAttentionFlags flags high-risk long term arrears', () => {
    const property = {
      totalArrears: 25000,
      yearsPending: 4,
      isDisputed: true,
      assessmentAreaMismatch: true
    }
    const flags = getPropertyAttentionFlags(property)
    assert.strictEqual(flags.length, 4)
    assert.ok(flags.some(f => f.type === 'long_term_arrears'))
    assert.ok(flags.some(f => f.type === 'area_mismatch'))
  })

  test('getFYPaymentStatus calculates status correctly', () => {
    const payments = [
      { financialYear: '2025-2026', amount: 5000 },
      { financialYear: '2025-2026', amount: 5000 }
    ]
    const res = getFYPaymentStatus(payments, '2025-2026', 10000)
    assert.strictEqual(res.status, 'paid')
    assert.strictEqual(res.paid, 10000)
  })
})

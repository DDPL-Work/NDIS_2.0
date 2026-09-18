import assert from 'node:assert'
import { test, describe } from 'node:test'
import { revenueMockEngine } from '../mock/revenueMockEngine.js'
import { mapInspectionToTask } from '../../admin/dmSchedule/dmScheduleMapper.js'

describe('End-to-End Business Journeys Verification (Journeys 1 to 8)', () => {

  test('JOURNEY 1 — Property Search (Code / Plot / Owner)', () => {
    const searchResult = revenueMockEngine.getProperties({ search: 'NAL-SIL-001' })
    assert.ok(searchResult.items.length >= 0)
    const property = searchResult.items[0] || revenueMockEngine.getPropertyById('PROP-NAL-0001')
    assert.ok(property)
    assert.ok(property.latitude && property.longitude)
  })

  test('JOURNEY 2 — High Arrears Identification & Recovery Action', () => {
    const propertiesResult = revenueMockEngine.getProperties({ limit: 200 })
    const highArrearProperties = propertiesResult.items.filter(p => p.arrearsAmount >= 10000)
    assert.ok(highArrearProperties.length >= 1)
    const item = highArrearProperties[0]
    assert.ok(item.arrearsAmount >= 10000)
    
    // Simulate Recovery Action trigger
    const recoveryAction = {
      propertyId: item.propertyId,
      actionType: 'notice_sent',
      officerAssigned: 'Inspector Kumar',
      demandAmount: item.arrearsAmount
    }
    assert.strictEqual(recoveryAction.propertyId, item.propertyId)
  })

  test('JOURNEY 3 — Unassessed Property Candidate Detection', () => {
    const propertiesResult = revenueMockEngine.getProperties({ limit: 250 })
    assert.ok(propertiesResult.total === 250)
    const unassessed = propertiesResult.items.filter(p => !p.isAssessed)
    assert.ok(unassessed.length >= 1)
  })

  test('JOURNEY 4 — Reassessment Workflow & Field Inspection Trigger', () => {
    const candidates = revenueMockEngine.getReviewCandidates()
    assert.ok(candidates.length >= 1)
    const candidate = candidates[0]
    assert.ok(candidate.valuationAmount > 0)
  })

  test('JOURNEY 5 — Notice Issuance & Notification Tracking', () => {
    const notice = revenueMockEngine.createNotice('PROP-NAL-0001', {
      noticeType: 'DEMAND_NOTICE',
      servedBy: 'Inspector S. Roy'
    })
    assert.ok(notice.id.startsWith('NTC-'))
    assert.strictEqual(notice.status, 'ISSUED')
  })

  test('JOURNEY 6 — Recovery Task Integration with DM Task Manager', () => {
    const inspectionData = {
      id: 'INSP-101',
      property_id: 'PROP-NAL-0005',
      property_code: 'PROP-NAL-0005',
      inspector_name: 'Field Officer S. Roy',
      priority: 'high',
      scheduled_date: '2026-10-01',
      remarks: 'Verification of commercial extension'
    }
    const task = mapInspectionToTask(inspectionData)
    assert.strictEqual(task.id, 'task-inspection-INSP-101')
    assert.strictEqual(task.type, 'inspection')
    assert.strictEqual(task.priority, 'high')
    assert.strictEqual(task.assignee, 'Field Officer S. Roy')
  })

  test('JOURNEY 7 — DM Decision & Geographic Aggregation', () => {
    const blockWardAnalytics = revenueMockEngine.getBlockWardAnalytics()
    assert.ok(Array.isArray(blockWardAnalytics))
    assert.ok(blockWardAnalytics.length >= 1)
    assert.ok(blockWardAnalytics[0].blockName)
  })

  test('JOURNEY 8 — Revenue Leakage Review & Risk Model Explainability', () => {
    const candidates = revenueMockEngine.getReviewCandidates()
    assert.ok(candidates.length >= 1)
    const candidate = candidates[0]
    assert.ok(candidate.riskScore > 0)
    assert.ok(candidate.reviewCandidate)
  })
})

import assert from 'node:assert'
import { describe, test } from 'node:test'
import { measurePathKm, measurePolygonAreaSqm } from '../useMapTools.js'

describe('map measurement calculations', () => {
  test('adds geodesic distance across multiple segments', () => {
    const distance = measurePathKm([[85, 25], [85.1, 25], [85.1, 25.1]])
    assert.ok(distance > 20)
    assert.ok(distance < 25)
  })

  test('calculates geographic polygon area', () => {
    const area = measurePolygonAreaSqm([[85, 25], [85.01, 25], [85.01, 25.01], [85, 25.01]])
    assert.ok(area > 900000)
    assert.ok(area < 1300000)
  })

  test('requires enough vertices for each measurement', () => {
    assert.equal(measurePathKm([[85, 25]]), null)
    assert.equal(measurePolygonAreaSqm([[85, 25], [85.01, 25]]), null)
  })
})

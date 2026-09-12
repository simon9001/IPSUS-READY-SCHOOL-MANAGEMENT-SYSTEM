import { describe, it, expect } from 'vitest'
import { feeCollectionChart } from './dashboard.charts.js'
import { buildBuckets } from './dashboard.series.js'

const buckets = buildBuckets('2026-09-12', 3, 'month')

describe('feeCollectionChart', () => {
  it('puts billed and collected on the same monthly axis', () => {
    const widget = feeCollectionChart({
      buckets,
      invoiceRows: [{ bucket: '2026-08-01', billed: '1000' }],
      paymentRows: [{ bucket: '2026-08-01', collected: '600' }],
    })

    expect(widget.kind).toBe('series')
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.form).toBe('line')
    expect(widget.valueFormat).toBe('currency')
    expect(widget.series.map((s) => s.key)).toEqual(['billed', 'collected'])
    expect(widget.points).toEqual([
      { label: 'Jul', values: { billed: 0, collected: 0 } },
      { label: 'Aug', values: { billed: 1000, collected: 600 } },
      { label: 'Sep', values: { billed: 0, collected: 0 } },
    ])
  })

  it('still returns a point per month when there is no data at all', () => {
    const widget = feeCollectionChart({ buckets, invoiceRows: [], paymentRows: [] })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points).toHaveLength(3)
    expect(widget.emptyText).toBeTruthy()
  })

  it('has a stable id so the client can key on it', () => {
    expect(feeCollectionChart({ buckets, invoiceRows: [], paymentRows: [] }).id).toBe('fee-collection-trend')
  })
})

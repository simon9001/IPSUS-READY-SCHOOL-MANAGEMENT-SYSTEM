import { describe, it, expect } from 'vitest'
import { feeCollectionChart, incomeVsExpenditureChart } from './dashboard.charts.js'
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

describe('incomeVsExpenditureChart', () => {
  it('splits revenue and expense account rows into two series', () => {
    const widget = incomeVsExpenditureChart({
      buckets,
      rows: [
        { bucket: '2026-07-01', type: 'revenue', total: '5000' },
        { bucket: '2026-07-01', type: 'expense', total: '3000' },
        { bucket: '2026-09-01', type: 'expense', total: '1200' },
      ],
    })

    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.series.map((s) => s.key)).toEqual(['income', 'expenditure'])
    expect(widget.points).toEqual([
      { label: 'Jul', values: { income: 5000, expenditure: 3000 } },
      { label: 'Aug', values: { income: 0, expenditure: 0 } },
      { label: 'Sep', values: { income: 0, expenditure: 1200 } },
    ])
  })

  it('ignores account types that are neither revenue nor expense', () => {
    const widget = incomeVsExpenditureChart({
      buckets,
      rows: [{ bucket: '2026-08-01', type: 'asset', total: '9999' }],
    })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points[1].values).toEqual({ income: 0, expenditure: 0 })
  })
})

import { describe, it, expect } from 'vitest'
import {
  feeCollectionChart,
  incomeVsExpenditureChart,
  spendByFundChart,
  attendanceRateChart,
  enrolmentByClassChart,
  gradeDistributionChart,
} from './dashboard.charts.js'
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
        { bucket: '2026-07-01', type: 'revenue', debit: '0', credit: '5000' },
        { bucket: '2026-07-01', type: 'expense', debit: '3000', credit: '0' },
        { bucket: '2026-09-01', type: 'expense', debit: '1200', credit: '0' },
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

  // Revenue accounts have a credit normal balance, so a debit against Fee Income
  // is a credit note and REDUCES income. Summing debit + credit would raise it.
  it('nets a credit note debited to a revenue account out of income', () => {
    const widget = incomeVsExpenditureChart({
      buckets,
      rows: [{ bucket: '2026-08-01', type: 'revenue', debit: '2000', credit: '5000' }],
    })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points[1].values.income).toBe(3000)
  })

  // Mirror case: an expense refund is credited back, and must reduce spend.
  it('nets a refund credited to an expense account out of expenditure', () => {
    const widget = incomeVsExpenditureChart({
      buckets,
      rows: [{ bucket: '2026-08-01', type: 'expense', debit: '4000', credit: '1500' }],
    })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points[1].values.expenditure).toBe(2500)
  })

  it('matches the trial balance convention when a month is net-negative', () => {
    const widget = incomeVsExpenditureChart({
      buckets,
      rows: [
        { bucket: '2026-08-01', type: 'revenue', debit: '900', credit: '400' },
        { bucket: '2026-08-01', type: 'expense', debit: '100', credit: '700' },
      ],
    })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points[1].values).toEqual({ income: -500, expenditure: -600 })
  })

  it('ignores account types that are neither revenue nor expense', () => {
    const widget = incomeVsExpenditureChart({
      buckets,
      rows: [{ bucket: '2026-08-01', type: 'asset', debit: '9999', credit: '9999' }],
    })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points[1].values).toEqual({ income: 0, expenditure: 0 })
  })
})

describe('spendByFundChart', () => {
  it('orders funds by spend, largest first', () => {
    const widget = spendByFundChart({
      rows: [
        { fundName: 'Tuition', total: '300' },
        { fundName: 'Operations', total: '900' },
      ],
    })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.form).toBe('hbar')
    expect(widget.points.map((p) => p.label)).toEqual(['Operations', 'Tuition'])
    expect(widget.points[0].values.spend).toBe(900)
  })

  it('keeps only the top 8 funds so the axis stays readable', () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ fundName: `Fund ${i}`, total: String(i + 1) }))
    const widget = spendByFundChart({ rows })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points).toHaveLength(8)
    expect(widget.points[0].label).toBe('Fund 11')
  })

  it('names the period in the title when one is given', () => {
    expect(spendByFundChart({ rows: [], periodName: '2026 Term 3' }).title).toContain('2026 Term 3')
  })

  it('returns an empty point list rather than throwing when there is no spend', () => {
    const widget = spendByFundChart({ rows: [] })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points).toEqual([])
    expect(widget.emptyText).toBeTruthy()
  })
})

describe('attendanceRateChart', () => {
  const days = buildBuckets('2026-09-12', 2, 'day')

  it('reports present and late as a percentage of records taken that day', () => {
    const widget = attendanceRateChart({
      buckets: days,
      rows: [
        { bucket: '2026-09-12', status: 'present', count: '80' },
        { bucket: '2026-09-12', status: 'late', count: '10' },
        { bucket: '2026-09-12', status: 'absent', count: '10' },
      ],
    })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.valueFormat).toBe('percent')
    expect(widget.points[1].values.rate).toBe(90)
  })

  it('reports a day with no register taken as zero rather than dividing by zero', () => {
    const widget = attendanceRateChart({ buckets: days, rows: [] })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points.map((p) => p.values.rate)).toEqual([0, 0])
  })

  it('rounds to one decimal place', () => {
    const widget = attendanceRateChart({
      buckets: days,
      rows: [
        { bucket: '2026-09-12', status: 'present', count: '1' },
        { bucket: '2026-09-12', status: 'absent', count: '2' },
      ],
    })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points[1].values.rate).toBe(33.3)
  })
})

describe('enrolmentByClassChart', () => {
  it('keeps classes in the order the query returned them', () => {
    const widget = enrolmentByClassChart({
      rows: [
        { className: 'Form 1', count: '120' },
        { className: 'Form 2', count: '98' },
      ],
    })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.form).toBe('bar')
    expect(widget.valueFormat).toBe('count')
    expect(widget.points).toEqual([
      { label: 'Form 1', values: { students: 120 } },
      { label: 'Form 2', values: { students: 98 } },
    ])
  })

  it('has an empty text for a school with no active students', () => {
    expect(enrolmentByClassChart({ rows: [] }).kind).toBe('series')
    const widget = enrolmentByClassChart({ rows: [] })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points).toEqual([])
    expect(widget.emptyText).toBeTruthy()
  })
})

describe('gradeDistributionChart', () => {
  it('counts students per grade and names the exam', () => {
    const widget = gradeDistributionChart({
      rows: [
        { grade: 'A', count: '12' },
        { grade: 'B', count: '30' },
      ],
      examName: 'Term 3 Endterm',
    })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.title).toContain('Term 3 Endterm')
    expect(widget.points.map((p) => p.label)).toEqual(['A', 'B'])
    expect(widget.points[1].values.students).toBe(30)
  })

  it('labels ungraded results rather than dropping them', () => {
    const widget = gradeDistributionChart({ rows: [{ grade: null, count: '4' }] })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points[0].label).toBe('Ungraded')
  })

  it('is empty when no exam has been published', () => {
    const widget = gradeDistributionChart({ rows: [] })
    if (widget.kind !== 'series') throw new Error('expected a series widget')
    expect(widget.points).toEqual([])
    expect(widget.emptyText).toBeTruthy()
  })
})

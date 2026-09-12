import { describe, it, expect } from 'vitest'
import {
  buildBuckets,
  bucketKey,
  toNumber,
  zeroFill,
  activeFiscalPeriod,
  MAX_MONTH_BUCKETS,
  MAX_DAY_BUCKETS,
} from './dashboard.series.js'

describe('buildBuckets', () => {
  it('returns the requested number of months, oldest first, ending at asOfDate', () => {
    const buckets = buildBuckets('2026-09-12', 3, 'month')
    expect(buckets.map((b) => b.key)).toEqual(['2026-07', '2026-08', '2026-09'])
    expect(buckets.map((b) => b.label)).toEqual(['Jul', 'Aug', 'Sep'])
  })

  it('gives each month a full inclusive date range', () => {
    const [feb] = buildBuckets('2026-02-15', 1, 'month')
    expect(feb.start).toBe('2026-02-01')
    expect(feb.end).toBe('2026-02-28')
  })

  it('crosses a year boundary correctly', () => {
    const buckets = buildBuckets('2026-01-10', 3, 'month')
    expect(buckets.map((b) => b.key)).toEqual(['2025-11', '2025-12', '2026-01'])
  })

  it('returns days with a single-day range', () => {
    const buckets = buildBuckets('2026-09-12', 3, 'day')
    expect(buckets.map((b) => b.key)).toEqual(['2026-09-10', '2026-09-11', '2026-09-12'])
    expect(buckets[0].start).toBe('2026-09-10')
    expect(buckets[0].end).toBe('2026-09-10')
  })

  it('clamps to the cap rather than returning an unbounded series', () => {
    expect(buildBuckets('2026-09-12', 99, 'month')).toHaveLength(MAX_MONTH_BUCKETS)
    expect(buildBuckets('2026-09-12', 99, 'day')).toHaveLength(MAX_DAY_BUCKETS)
  })

  it('returns nothing for a non-positive count', () => {
    expect(buildBuckets('2026-09-12', 0, 'month')).toEqual([])
  })
})

describe('bucketKey', () => {
  it('truncates to the month', () => {
    expect(bucketKey('2026-04-17', 'month')).toBe('2026-04')
  })

  it('keeps the day', () => {
    expect(bucketKey('2026-04-17', 'day')).toBe('2026-04-17')
  })

  it('tolerates a timestamp, which is what date_trunc returns', () => {
    expect(bucketKey('2026-04-01T00:00:00.000Z', 'month')).toBe('2026-04')
  })
})

describe('toNumber', () => {
  it('parses the strings the postgres driver returns for numeric columns', () => {
    expect(toNumber('1234.56')).toBe(1234.56)
  })

  it('treats null, undefined and unparseable input as zero', () => {
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined)).toBe(0)
    expect(toNumber('not a number')).toBe(0)
  })

  it('passes numbers through', () => {
    expect(toNumber(42)).toBe(42)
  })
})

describe('zeroFill', () => {
  const buckets = buildBuckets('2026-09-12', 3, 'month')

  it('fills a month with no rows with zero rather than skipping it', () => {
    const rows = [
      { bucket: '2026-07-01', collected: '500' },
      { bucket: '2026-09-01', collected: '900' },
    ]
    const points = zeroFill(buckets, rows, ['collected'], 'month')
    expect(points).toEqual([
      { label: 'Jul', values: { collected: 500 } },
      { label: 'Aug', values: { collected: 0 } },
      { label: 'Sep', values: { collected: 900 } },
    ])
  })

  it('carries every requested series key on every point', () => {
    const rows = [{ bucket: '2026-08-01', billed: '10' }]
    const points = zeroFill(buckets, rows, ['billed', 'collected'], 'month')
    expect(points[1].values).toEqual({ billed: 10, collected: 0 })
    expect(points[0].values).toEqual({ billed: 0, collected: 0 })
  })

  it('sums multiple rows landing in the same bucket', () => {
    const rows = [
      { bucket: '2026-08-03', collected: '10' },
      { bucket: '2026-08-20', collected: '5' },
    ]
    const points = zeroFill(buckets, rows, ['collected'], 'month')
    expect(points[1].values.collected).toBe(15)
  })

  it('ignores rows outside the buckets', () => {
    const rows = [{ bucket: '2020-01-01', collected: '999' }]
    const points = zeroFill(buckets, rows, ['collected'], 'month')
    expect(points.every((p) => p.values.collected === 0)).toBe(true)
  })

  it('returns a point per bucket even with no rows at all', () => {
    expect(zeroFill(buckets, [], ['collected'], 'month')).toHaveLength(3)
  })
})

describe('activeFiscalPeriod', () => {
  const periods = [
    { id: 1, startDate: '2026-01-01', endDate: '2026-04-30' },
    { id: 2, startDate: '2026-05-01', endDate: '2026-08-31' },
    { id: 3, startDate: '2026-09-01', endDate: '2026-12-31' },
  ]

  it('picks the period containing the date', () => {
    expect(activeFiscalPeriod(periods, '2026-09-12')?.id).toBe(3)
  })

  it('includes the boundary days', () => {
    expect(activeFiscalPeriod(periods, '2026-05-01')?.id).toBe(2)
    expect(activeFiscalPeriod(periods, '2026-04-30')?.id).toBe(1)
  })

  it('falls back to the most recent period ending before the date when the calendar has a gap', () => {
    const gapped = [
      { id: 1, startDate: '2026-01-01', endDate: '2026-04-30' },
      { id: 2, startDate: '2026-10-01', endDate: '2026-12-31' },
    ]
    expect(activeFiscalPeriod(gapped, '2026-06-15')?.id).toBe(1)
  })

  it('returns undefined when there are no periods at all', () => {
    expect(activeFiscalPeriod([], '2026-09-12')).toBeUndefined()
  })
})

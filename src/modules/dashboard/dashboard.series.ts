import type { SeriesPoint } from './dashboard.types.js'

export const MAX_MONTH_BUCKETS = 12
export const MAX_DAY_BUCKETS = 31

export type Granularity = 'month' | 'day'

export interface Bucket {
  /** 'YYYY-MM' for months, 'YYYY-MM-DD' for days. Matched against bucketKey(). */
  key: string
  /** Axis tick text. */
  label: string
  /** Inclusive date range, 'YYYY-MM-DD'. */
  start: string
  end: string
}

export interface BucketRow {
  /** The grouped date from SQL — a date or timestamp string. */
  bucket: string
  [column: string]: unknown
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
/** Day 0 of the next month is the last day of this one. */
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate()

/**
 * Buckets ending at asOfDate, oldest first, derived from the calendar rather
 * than from any result set — a period with no rows still gets a bucket, so a
 * chart cannot silently skip it. Count is clamped to the cap so no chart can
 * bloat the dashboard payload.
 */
export function buildBuckets(asOfDate: string, count: number, granularity: Granularity): Bucket[] {
  const cap = granularity === 'month' ? MAX_MONTH_BUCKETS : MAX_DAY_BUCKETS
  const n = Math.min(Math.max(count, 0), cap)
  if (n === 0) return []

  const anchor = new Date(`${asOfDate.slice(0, 10)}T00:00:00.000Z`)
  const buckets: Bucket[] = []

  for (let i = n - 1; i >= 0; i--) {
    if (granularity === 'month') {
      const d = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - i, 1))
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      buckets.push({
        key: `${y}-${pad(m)}`,
        label: MONTH_LABELS[m - 1],
        start: iso(y, m, 1),
        end: iso(y, m, daysInMonth(y, m)),
      })
    } else {
      const d = new Date(anchor.getTime() - i * 86_400_000)
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      const day = d.getUTCDate()
      const date = iso(y, m, day)
      buckets.push({ key: date, label: `${day} ${MONTH_LABELS[m - 1]}`, start: date, end: date })
    }
  }

  return buckets
}

/** Normalises a SQL-grouped date to the same shape as Bucket.key. */
export function bucketKey(dateLike: string, granularity: Granularity): string {
  const date = dateLike.slice(0, 10)
  return granularity === 'month' ? date.slice(0, 7) : date
}

/** `numeric` columns arrive as strings; null means "no rows", which is zero. */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

/** One point per bucket, every requested key present, missing data as zero. */
export function zeroFill(
  buckets: Bucket[],
  rows: BucketRow[],
  seriesKeys: string[],
  granularity: Granularity,
): SeriesPoint[] {
  const totals = new Map<string, Record<string, number>>()

  for (const row of rows) {
    const key = bucketKey(String(row.bucket), granularity)
    const acc = totals.get(key) ?? {}
    for (const seriesKey of seriesKeys) {
      acc[seriesKey] = (acc[seriesKey] ?? 0) + toNumber(row[seriesKey])
    }
    totals.set(key, acc)
  }

  return buckets.map((bucket) => {
    const found = totals.get(bucket.key)
    const values: Record<string, number> = {}
    for (const seriesKey of seriesKeys) values[seriesKey] = found?.[seriesKey] ?? 0
    return { label: bucket.label, values }
  })
}

export interface PeriodLike {
  startDate: string
  endDate: string
}

/**
 * The fiscal period covering asOfDate. Charts windowed on "the term" share this
 * one resolver so they cannot disagree about which term that is. When the
 * calendar has a gap, the most recent period that has already ended is the
 * honest answer — showing nothing would hide real spend.
 */
export function activeFiscalPeriod<T extends PeriodLike>(periods: T[], asOfDate: string): T | undefined {
  const containing = periods.find((p) => p.startDate <= asOfDate && p.endDate >= asOfDate)
  if (containing) return containing

  return periods
    .filter((p) => p.endDate < asOfDate)
    .sort((a, b) => (a.endDate < b.endDate ? 1 : -1))[0]
}

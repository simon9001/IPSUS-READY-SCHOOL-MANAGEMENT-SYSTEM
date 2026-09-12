import type { DashboardWidget } from './dashboard.types.js'
import { zeroFill, type Bucket, type BucketRow } from './dashboard.series.js'

/**
 * Pure shapers: repository rows in, chart widget out. Kept separate from
 * dashboard.widgets.ts so every chart's shaping is unit-testable without a
 * database, and so widget definitions stay declarative wiring.
 */
export function feeCollectionChart(args: {
  buckets: Bucket[]
  invoiceRows: BucketRow[]
  paymentRows: BucketRow[]
}): DashboardWidget {
  const billed = zeroFill(args.buckets, args.invoiceRows, ['billed'], 'month')
  const collected = zeroFill(args.buckets, args.paymentRows, ['collected'], 'month')

  return {
    id: 'fee-collection-trend',
    title: 'Fee Collection Trend',
    kind: 'series',
    form: 'line',
    valueFormat: 'currency',
    series: [
      { key: 'billed', label: 'Billed' },
      { key: 'collected', label: 'Collected' },
    ],
    points: args.buckets.map((bucket, i) => ({
      label: bucket.label,
      values: { billed: billed[i].values.billed, collected: collected[i].values.collected },
    })),
    emptyText: 'No invoices or payments in this period.',
  }
}

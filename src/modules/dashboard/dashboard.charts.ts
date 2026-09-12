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

/**
 * The ledger returns one row per (month, account type). Revenue and expense are
 * the only two types that describe money in and money out; asset, liability and
 * net_assets rows are balance-sheet movements and would double-count here.
 */
export function incomeVsExpenditureChart(args: {
  buckets: Bucket[]
  rows: Array<BucketRow & { type: string }>
}): DashboardWidget {
  const mapped = args.rows.map((row) => ({
    bucket: row.bucket,
    income: row.type === 'revenue' ? row.total : 0,
    expenditure: row.type === 'expense' ? row.total : 0,
  }))

  return {
    id: 'income-vs-expenditure',
    title: 'Income vs Expenditure',
    kind: 'series',
    form: 'line',
    valueFormat: 'currency',
    series: [
      { key: 'income', label: 'Income' },
      { key: 'expenditure', label: 'Expenditure' },
    ],
    points: zeroFill(args.buckets, mapped, ['income', 'expenditure'], 'month'),
    emptyText: 'No posted journal entries in this period.',
  }
}

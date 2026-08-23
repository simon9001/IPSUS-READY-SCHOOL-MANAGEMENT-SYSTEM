# IPSAS Compliance

The financial module was designed around specific International Public Sector Accounting Standards from the start, since Kenya's Public Sector Accounting Standards Board (PSASB) mandates IPSAS for public entities, including public schools.

| Standard | Where it's implemented |
|---|---|
| **IPSAS 1** — Presentation of Financial Statements | The Trial Balance (`GET /api/reports/trial-balance`) is the foundation the four statements would be built from; Chart of Accounts is classified by `type` (asset/liability/net_assets/revenue/expense) matching IPSAS 1's structure |
| **IPSAS 2** — Cash Flow Statements | Bank account and cash-account postings are fully traceable through the ledger; a cash flow statement can be derived from `journal_lines` filtered to cash/bank accounts |
| **IPSAS 9 / IPSAS 47** — Revenue | Fee income (exchange revenue — a service is rendered) is invoiced and recognized via `fees.createInvoice`; capitation/donations (non-exchange revenue) go through `grants`, recognized only when `conditionsMet` |
| **IPSAS 12** — Inventories | `inventory` module — stores ledger for food, stationery, textbooks, with receipt/issue movements posting to the ledger |
| **IPSAS 17** — Property, Plant & Equipment | `assets` module — acquisition, straight-line depreciation, disposal with gain/loss recognition |
| **IPSAS 19** — Provisions & Contingent Liabilities | Not yet implemented as a dedicated module; the Chart of Accounts includes liability accounts that could carry provisions, but there's no provisions-specific workflow |
| **IPSAS 23** — Revenue from Non-Exchange Transactions | Every `journal_lines` row carries a `fundId`, and funds are flagged `restricted`/`unrestricted` — this is what makes fund-scoped reporting (e.g. "show me only the Capitation Fund's Trial Balance") possible. Grant disbursements specifically gate revenue recognition on `conditionsMet` |
| **IPSAS 24** — Presentation of Budget Information | `budgets` module — Budget vs Actual computed live from posted journal lines within each budget line's period/fiscal-year range |
| **IPSAS 47** — Revenue (post-2023 consolidated standard) | Superseded IPSAS 9/23 for revenue; the `grants` and `fees` modules' recognition logic follows its principles even though the code comments still reference the legacy standard numbers in places |

## The mechanism, not just the mapping

The standards above aren't just conceptually mapped — they're enforced by how the code is structured:

- **Fund restriction is structural, not a report filter bolted on afterward.** Because `journal_lines.fundId` is `NOT NULL`, it's impossible to post a transaction without declaring which fund it belongs to. The fees module's multi-fund invoice splitting (see [03-module-financial.md](03-module-financial.md#fees)) exists specifically so a single invoice touching two funds still produces a per-fund-correct trial balance, not a blended one.
- **Non-exchange revenue recognition is a real gate, not a convention.** `grants.recordDisbursement` literally does not call `journalService.postSystemEntry` unless `conditionsMet: true` — the disbursement is still recorded (the cash receipt always is), but no revenue is recognized in the ledger until the condition is genuinely met.
- **The Trial Balance always reconciles because nothing bypasses the ledger.** Every financial module posts through one function (`journalService.postSystemEntry` or `createManualEntry`), which validates the entry is balanced (debits = credits) before it's ever written. This was verified directly in testing multiple times — most thoroughly with a two-fund fee invoice and split payments that reconciled to a balanced trial balance throughout.
- **Manual entries have maker-checker control**, matching the segregation-of-duties expectation implicit in public-sector financial governance — a Bursar can draft a manual journal entry, but only a Principal or BOM Treasurer can approve and post it.

## What isn't covered

- No IPSAS 19 provisions/contingent-liabilities module
- No consolidated financial statement generation (Statement of Financial Position, Statement of Financial Performance, Statement of Changes in Net Assets as formatted outputs) — the Trial Balance and Budget vs Actual reports exist as the data foundation these would be built from, but the formatted statements themselves aren't generated yet
- No first-time-adoption (IPSAS 33) transition workflow — this system assumes accrual-basis accounting from day one, not a migration from cash-basis records

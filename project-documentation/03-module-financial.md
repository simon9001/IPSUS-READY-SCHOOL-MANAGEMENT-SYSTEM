# Financial Module

The original scope of this project — an IPSAS-compliant accounting system. 12 sub-modules, all posting through the shared ledger (see [01-architecture.md](01-architecture.md#the-double-entry-ledger-is-the-financial-spine)).

## Ledger core

### `accounts` — Chart of Accounts
`GET/POST /api/accounts`, `GET/PATCH /api/accounts/:id`, `POST /api/accounts/:id/deactivate`
Standard CRUD. `code` must be unique; deactivation is soft (`isActive: false`), never a delete.

### `funds` — Voteheads
`GET/POST /api/funds`, `GET/PATCH /api/funds/:id`, `POST /api/funds/:id/deactivate`
Same CRUD shape as accounts. `restrictionType` (`unrestricted`/`restricted`) drives IPSAS 23 disclosure.

### `periods` — Fiscal periods
`GET/POST /api/periods`, `GET/PATCH /api/periods/:id`, `POST /api/periods/:id/close`
Once `status = 'closed'`, the journal service refuses new postings into that period (`assertPeriodOpen`).

### `journal` — Journal entries + Trial Balance
`GET/POST /api/journal-entries`, `GET /api/journal-entries/:id`, `POST /api/journal-entries/system`, `POST /api/journal-entries/:id/approve|reject`, `GET /api/reports/trial-balance`

Two posting paths:
- **`POST /journal-entries`** (manual) — starts `pending_approval`, requires a separate `/approve` call from a different actor (maker-checker)
- **`POST /journal-entries/system`** (used internally by other modules' services) — posts immediately, since the calling module's own workflow already carries an approval step

`GET /reports/trial-balance?asOfDate=...&fundId=...` — cumulative debit/credit per account as of a date, optionally scoped to one fund, with an `isBalanced` flag. Verified in testing to always reconcile because nothing bypasses `journalService`.

## Budgets

### `budgets`
`GET/POST /api/budgets`, `GET /api/budgets/:id`, `POST /api/budgets/:id/lines`, `POST /api/budgets/:id/approve`, `GET /api/budgets/:id/budget-vs-actual`

Budget vs Actual is computed by summing `journal_lines` within each line's period date range (or the whole fiscal year if the line isn't period-scoped) — not a stored comparison.

## Fees

### `fees`
`GET/POST /api/fees/structures`, `GET/POST /api/fees/invoices`, `GET /api/fees/students/:studentId/invoices|payments`, `POST /api/fees/payments`

**The most complex logic in the financial module.** An invoice's items can span multiple funds (e.g. Tuition Fund + Trading Fund), so the invoicing service groups items by fund and posts **one Fee-Debtors debit line per fund**, not one blended line — otherwise the fund-scoped trial balance would be wrong. Payments allocate FIFO across a student's outstanding invoice items, and if a single payment happens to clear items from more than one fund, the payment's journal entry likewise splits into one debit(cash)/credit(debtors) pair per fund. Verified end-to-end: a KES 18,000 invoice split 15,000/3,000 across two funds, paid in two installments (10,000 then 8,000, the second crossing both funds), reconciled to a balanced trial balance throughout.

## Grants / Capitation

### `grants`
`GET/POST /api/grants/types`, `GET/POST /api/grants/disbursements`, `GET /api/grants/disbursements/:id`

Recording a disbursement always creates the `grant_disbursements` row (the cash receipt is always tracked), but **only posts a journal entry if `conditionsMet: true`** — this is the concrete implementation of IPSAS 23/47's rule that non-exchange revenue is recognized when conditions are satisfied, not simply on cash receipt.

## Procurement

### `procurement`
`GET/POST /api/procurement/suppliers|requisitions|purchase-orders`, `POST /api/procurement/requisitions/:id/approve|reject`, `POST /api/procurement/goods-received-notes`, `GET/POST /api/procurement/invoices`, `POST /api/procurement/payments`

Full chain: requisition → approval → LPO (optionally linked to the requisition, which then flips to `converted_to_lpo`) → GRN (marks the LPO `received` or `partially_received` depending on whether every ordered item was covered) → supplier invoice (posts Dr Expense/Asset, Cr Creditors) → payment (Dr Creditors, Cr Cash; marks the invoice `paid` once the cumulative payment covers the invoiced amount).

## Payroll

### `payroll`
`GET/POST /api/payroll/employees`, `GET/POST /api/payroll/employees/:employeeId/components`, `GET/POST /api/payroll/runs`, `POST /api/payroll/runs/:id/process`

Processing a run computes gross pay from each active employee's salary components (percentage-of-basic components resolved against their basic), applies simplified PAYE/NSSF/SHIF calculations, generates a payslip per employee, and posts **one summary journal entry** for the whole run (Dr Salaries Expense; Cr PAYE/NSSF/SHIF payable, Cr any non-statutory deductions payable if present, Cr Net Pay Payable).

> **The statutory deduction rates in `payroll.service.ts` are illustrative placeholders**, clearly commented as such in the code. Kenya's PAYE bands, NSSF tier limits, and SHIF rate change periodically — verify against current KRA/NSSF/SHIF guidance before relying on this for real payroll.

## Fixed Assets

### `assets`
`GET/POST /api/assets/categories`, `GET/POST /api/assets`, `GET /api/assets/:id`, `POST /api/assets/depreciation-runs`, `POST /api/assets/:id/dispose`

Acquisition posts Dr Asset / Cr (cash or creditors, caller's choice). Depreciation runs are **straight-line only**, computed per asset as `cost / usefulLifeYears`, capped so accumulated depreciation never exceeds cost. Disposal computes net book value (cost − accumulated depreciation), posts the clearing entries, and books any gain/loss to a caller-supplied account.

## Inventory

### `inventory`
`GET/POST /api/inventory/items`, `GET /api/inventory/items/:itemId/movements`, `POST /api/inventory/movements/receive|issue`

Receipts post Dr Inventory / Cr (cash or creditors); issues post Dr Expense / Cr Inventory. IPSAS 12 stores accounting for food, stationery, textbooks.

## Banking

### `banking`
`GET/POST /api/banking/accounts`, `GET/POST /api/banking/accounts/:bankAccountId/reconciliations`, `POST /api/banking/reconciliations/:id/reconcile`, `GET/POST /api/banking/imprest`, `POST /api/banking/imprest/:id/retire`

Imprest issuance posts Dr Imprest Control / Cr Cash. Retirement validates that expensed amount + balance returned doesn't exceed the amount issued, then posts Dr Expense accounts (+ Dr Cash if returning a balance) / Cr Imprest Control, clearing the control account.

## Design notes worth remembering

- **Every module above calls `journalService.postSystemEntry(...)`**, never writes to `journal_lines` directly. If you add a new financial module, do the same — that's what keeps the Trial Balance reconcilable.
- **Money in request bodies accepts `string | number`**; services normalize to string before insert to avoid floating-point rounding on repeated arithmetic.
- **`prepare: false` is set on the Postgres connection** (`src/db/client.ts`) — required for Supabase's Transaction Pooler (port 6543), which doesn't support server-side prepared statements. Don't remove it when deploying.

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { AppError } from './common/errors.js'
import { accountsRoutes } from './modules/accounts/accounts.routes.js'
import { fundsRoutes } from './modules/funds/funds.routes.js'
import { periodsRoutes } from './modules/periods/periods.routes.js'
import { journalRoutes, reportsRoutes } from './modules/journal/journal.routes.js'
import { budgetsRoutes } from './modules/budgets/budgets.routes.js'
import { studentsRoutes } from './modules/students/students.routes.js'
import { feesRoutes } from './modules/fees/fees.routes.js'
import { grantsRoutes } from './modules/grants/grants.routes.js'
import { procurementRoutes } from './modules/procurement/procurement.routes.js'
import { payrollRoutes } from './modules/payroll/payroll.routes.js'
import { assetsRoutes } from './modules/assets/assets.routes.js'
import { inventoryRoutes } from './modules/inventory/inventory.routes.js'
import { bankingRoutes } from './modules/banking/banking.routes.js'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Kenyan High School Accounting System API')
})

app.route('/api/accounts', accountsRoutes)
app.route('/api/funds', fundsRoutes)
app.route('/api/periods', periodsRoutes)
app.route('/api/journal-entries', journalRoutes)
app.route('/api/reports', reportsRoutes)
app.route('/api/budgets', budgetsRoutes)
app.route('/api/students', studentsRoutes)
app.route('/api/fees', feesRoutes)
app.route('/api/grants', grantsRoutes)
app.route('/api/procurement', procurementRoutes)
app.route('/api/payroll', payrollRoutes)
app.route('/api/assets', assetsRoutes)
app.route('/api/inventory', inventoryRoutes)
app.route('/api/banking', bankingRoutes)

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ success: false, error: err.message }, err.statusCode as ContentfulStatusCode)
  }
  console.error(err)
  return c.json({ success: false, error: 'Internal server error' }, 500)
})

const port = Number(process.env.PORT ?? 3000)

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

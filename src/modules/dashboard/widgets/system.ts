import { systemService } from '../../system/system.service.js'
import { periodsService } from '../../periods/periods.service.js'
import type { WidgetDef } from './shared.js'

export const SYSTEM_WIDGETS: WidgetDef[] = [
  {
    id: 'user-accounts',
    section: 'system',
    requiredPermission: 'users.manage',
    async build() {
      const stats = await systemService.userStats()
      return {
        id: 'user-accounts',
        title: 'User Accounts',
        kind: 'stats',
        stats: [
          { label: 'Total', value: String(stats.total) },
          { label: 'Active', value: String(stats.active), tone: 'success' },
          { label: 'Suspended', value: String(stats.suspended), tone: stats.suspended > 0 ? 'warning' : 'default' },
          { label: 'Locked Out Now', value: String(stats.lockedOut), tone: stats.lockedOut > 0 ? 'danger' : 'default' },
          { label: 'Never Signed In', value: String(stats.neverLoggedIn), tone: stats.neverLoggedIn > 0 ? 'warning' : 'default' },
          { label: 'Pending Password Change', value: String(stats.mustChangePassword) },
        ],
      }
    },
  },
  {
    id: 'role-coverage',
    section: 'system',
    requiredPermission: 'roles.manage',
    async build() {
      const usage = await systemService.roleUsage()
      const unused = usage.filter((r) => r.userCount === 0)
      const largest = [...usage].sort((a, b) => b.userCount - a.userCount)[0]
      return {
        id: 'role-coverage',
        title: 'Role Coverage',
        kind: 'stats',
        stats: [
          { label: 'Roles Defined', value: String(usage.length) },
          { label: 'Roles With No Users', value: String(unused.length), tone: unused.length > 0 ? 'warning' : 'default' },
          { label: 'Largest Role', value: largest ? `${largest.name} (${largest.userCount})` : 'None' },
        ],
      }
    },
  },
  {
    id: 'fiscal-periods',
    section: 'system',
    requiredPermission: 'ledger.periods.manage',
    async build({ asOfDate }) {
      const periods = await periodsService.list()
      const current = periods.find((p) => p.startDate <= asOfDate && p.endDate >= asOfDate)
      return {
        id: 'fiscal-periods',
        title: 'Fiscal Periods',
        kind: 'stats',
        stats: [
          { label: 'Current Period', value: current ? current.name : 'None covers today', tone: current ? 'default' : 'warning' },
          { label: 'Open', value: String(periods.filter((p) => p.status === 'open').length) },
          { label: 'Closed', value: String(periods.filter((p) => p.status === 'closed').length) },
        ],
      }
    },
  },
  {
    id: 'system-runtime',
    section: 'system',
    requiredPermission: 'users.manage',
    async build() {
      const runtime = await systemService.runtime()
      const hours = Math.floor(runtime.uptimeSeconds / 3600)
      const minutes = Math.floor((runtime.uptimeSeconds % 3600) / 60)
      return {
        id: 'system-runtime',
        title: 'Server',
        kind: 'stats',
        stats: [
          {
            label: 'Database',
            value: runtime.databaseReachable ? `Connected (${runtime.databaseLatencyMs}ms)` : 'Unreachable',
            tone: runtime.databaseReachable ? 'success' : 'danger',
          },
          { label: 'Uptime', value: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m` },
          { label: 'Node', value: runtime.nodeVersion },
          { label: 'Heap Used', value: `${runtime.heapUsedMb} MB` },
        ],
      }
    },
  },
]

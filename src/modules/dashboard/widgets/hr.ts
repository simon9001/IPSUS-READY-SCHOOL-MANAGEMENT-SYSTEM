import { staffService } from '../../staff/staff.service.js'
import { leaveService } from '../../leave/leave.service.js'
import { contractsService } from '../../contracts/contracts.service.js'
import { staffDisciplineService } from '../../staffDiscipline/staffDiscipline.service.js'
import { daysUntil } from './shared.js'
import type { WidgetDef } from './shared.js'

export const HR_WIDGETS: WidgetDef[] = [
  {
    id: 'hr-overview',
    section: 'hr',
    requiredPermission: 'staff.view',
    async build() {
      const staff = await staffService.list()
      return {
        id: 'hr-overview',
        title: 'Staff',
        kind: 'stats',
        stats: [
          { label: 'Total Staff', value: String(staff.length) },
          { label: 'Active', value: String(staff.filter((s) => s.status === 'active').length) },
        ],
      }
    },
  },
  {
    id: 'leave-overview',
    section: 'hr',
    requiredPermission: 'leave.view',
    async build() {
      const requests = await leaveService.list()
      const byStatus = new Map<string, number>()
      for (const r of requests) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1)
      return {
        id: 'leave-overview',
        title: 'Leave',
        kind: 'stats',
        stats: [...byStatus.entries()].map(([status, count]) => ({
          label: `${status[0].toUpperCase()}${status.slice(1)}`,
          value: String(count),
        })),
      }
    },
  },
  {
    id: 'contracts-expiring',
    section: 'hr',
    requiredPermission: 'contracts.view',
    async build({ asOfDate }) {
      const [contracts, staff] = await Promise.all([contractsService.list(), staffService.list()])
      const staffName = new Map(staff.map((s) => [s.id, s.fullName]))
      const expiring = contracts.filter(
        (c) => c.status === 'active' && c.endDate && daysUntil(asOfDate, c.endDate) >= 0 && daysUntil(asOfDate, c.endDate) <= 60,
      )
      return {
        id: 'contracts-expiring',
        title: 'Contracts Expiring Soon',
        kind: 'list',
        emptyText: 'No contracts expiring in the next 60 days.',
        rows: expiring.map((c) => ({
          label: staffName.get(c.staffId) ?? `Staff #${c.staffId}`,
          sublabel: `${c.contractType.replace(/_/g, ' ')} — ends ${c.endDate}`,
          tone: 'warning',
        })),
      }
    },
  },
  {
    id: 'staff-discipline-overview',
    section: 'hr',
    requiredPermission: 'staff_discipline.view',
    async build() {
      const recent = await staffDisciplineService.listRecent(10)
      return {
        id: 'staff-discipline-overview',
        title: 'Staff Disciplinary Records',
        kind: 'stats',
        stats: [{ label: 'Recent Records', value: String(recent.length) }],
      }
    },
  },
]

import { boardingService } from '../../boarding/boarding.service.js'
import { healthService } from '../../health/health.service.js'
import { transportService } from '../../transport/transport.service.js'
import { counselingService } from '../../counseling/counseling.service.js'
import type { WidgetDef } from './shared.js'

export const WELFARE_WIDGETS: WidgetDef[] = [
  {
    id: 'boarding-overview',
    section: 'welfare',
    requiredPermission: 'boarding.view',
    async build() {
      const [dorms, occupied] = await Promise.all([boardingService.listDormitories(), boardingService.countActiveAllocations()])
      const capacity = dorms.reduce((sum, d) => sum + d.capacity, 0)
      return {
        id: 'boarding-overview',
        title: 'Boarding',
        kind: 'stats',
        stats: [
          { label: 'Dormitories', value: String(dorms.length) },
          { label: 'Beds Occupied', value: `${occupied} / ${capacity}` },
        ],
      }
    },
  },
  {
    id: 'health-overview',
    section: 'welfare',
    requiredPermission: 'health.access',
    async build() {
      const recent = await healthService.listRecentVisits(20)
      return {
        id: 'health-overview',
        title: 'School Health',
        kind: 'stats',
        stats: [
          { label: 'Recent Clinic Visits', value: String(recent.length) },
          { label: 'Referred to Hospital (recent)', value: String(recent.filter((v) => v.referredToHospital).length), tone: 'warning' },
        ],
      }
    },
  },
  {
    id: 'transport-overview',
    section: 'welfare',
    requiredPermission: 'transport.view',
    async build() {
      const [routes, allocated] = await Promise.all([transportService.listRoutes(), transportService.countActiveAllocations()])
      return {
        id: 'transport-overview',
        title: 'Transport',
        kind: 'stats',
        stats: [
          { label: 'Bus Routes', value: String(routes.length) },
          { label: 'Students Allocated', value: String(allocated) },
        ],
      }
    },
  },
  {
    id: 'counseling-overview',
    section: 'welfare',
    requiredPermission: 'counseling.access',
    async build({ asOfDate }) {
      const sessions = await counselingService.list()
      const thisYear = sessions.filter((s) => s.sessionDate.slice(0, 4) === asOfDate.slice(0, 4))
      return {
        id: 'counseling-overview',
        title: 'Guidance & Counseling',
        kind: 'stats',
        stats: [{ label: 'Sessions This Year', value: String(thisYear.length) }],
      }
    },
  },
]

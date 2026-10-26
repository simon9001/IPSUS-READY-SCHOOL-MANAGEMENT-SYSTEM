import { SECTION_ORDER, SECTION_TITLES, WIDGETS, hasGate } from './dashboard.widgets.js'
import type { DashboardSummary } from './dashboard.types.js'
import { logger } from '../../common/logger.js'

export const dashboardService = {
  async summary(permissions: string[], asOfDate: string): Promise<DashboardSummary> {
    const applicable = WIDGETS.filter((w) => hasGate(permissions, w.requiredPermission))

    const settled = await Promise.allSettled(applicable.map((w) => w.build({ asOfDate, permissions })))
    const widgets = settled.flatMap((result, i) => {
      if (result.status === 'fulfilled') return [{ section: applicable[i].section, widget: result.value }]
      logger.error({ widget: applicable[i].id, err: result.reason }, 'dashboard widget failed')
      return []
    })

    const sections = SECTION_ORDER.map((sectionId) => ({
      id: sectionId,
      title: SECTION_TITLES[sectionId],
      widgets: widgets.filter((w) => w.section === sectionId).map((w) => w.widget),
    })).filter((s) => s.widgets.length > 0)

    return { asOfDate, sections }
  },
}

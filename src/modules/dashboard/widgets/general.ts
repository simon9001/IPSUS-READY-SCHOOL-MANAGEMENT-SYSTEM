import { noticesService } from '../../notices/notices.service.js'
import { identityService } from '../../identity/identity.service.js'
import type { WidgetDef } from './shared.js'

export const GENERAL_WIDGETS: WidgetDef[] = [
  {
    id: 'notices-feed',
    section: 'general',
    requiredPermission: 'dashboard.view',
    async build() {
      const notices = await noticesService.listForStaff()
      const recent = [...notices].sort((a, b) => b.id - a.id).slice(0, 5)
      return {
        id: 'notices-feed',
        title: 'Notices',
        kind: 'list',
        emptyText: 'No notices right now.',
        rows: recent.map((n) => ({ label: n.title, sublabel: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : undefined })),
      }
    },
  },
  {
    id: 'audit-recent',
    section: 'general',
    requiredPermission: 'audit.view',
    async build() {
      const entries = await identityService.listAuditLog(8)
      return {
        id: 'audit-recent',
        title: 'Recent Audit Activity',
        kind: 'list',
        emptyText: 'No audit activity yet.',
        rows: entries.map((e) => ({
          label: `${e.entry.action} ${e.entry.entityType}#${e.entry.entityId}`,
          sublabel: e.actorName ?? e.actorEmail ?? 'System',
          value: new Date(e.entry.createdAt).toLocaleString(),
        })),
      }
    },
  },
]

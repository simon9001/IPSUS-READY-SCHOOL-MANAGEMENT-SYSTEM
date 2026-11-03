import { complianceService } from '../../compliance/compliance.service.js'
import { documentsService } from '../../documents/documents.service.js'
import type { WidgetDef } from './shared.js'

export const COMPLIANCE_WIDGETS: WidgetDef[] = [
  {
    id: 'compliance-overview',
    section: 'compliance',
    requiredPermission: 'compliance.view',
    async build() {
      const reports = await complianceService.list()
      return {
        id: 'compliance-overview',
        title: 'Regulatory Reports',
        kind: 'stats',
        stats: [
          { label: 'Total Reports', value: String(reports.length) },
          { label: 'Draft', value: String(reports.filter((r) => r.status === 'draft').length), tone: 'warning' },
          { label: 'Submitted', value: String(reports.filter((r) => r.status === 'submitted').length), tone: 'success' },
        ],
      }
    },
  },
  {
    id: 'documents-overview',
    section: 'compliance',
    requiredPermission: 'documents.view',
    async build() {
      const docs = await documentsService.listAll()
      return {
        id: 'documents-overview',
        title: 'Documents Issued',
        kind: 'stats',
        stats: [{ label: 'Total Issued', value: String(docs.length) }],
      }
    },
  },
]

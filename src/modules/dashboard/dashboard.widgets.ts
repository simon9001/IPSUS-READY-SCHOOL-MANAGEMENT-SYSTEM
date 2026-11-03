import { FINANCIAL_WIDGETS } from './widgets/financial.js'
import { ATTENTION_WIDGETS } from './widgets/attention.js'
import { SYSTEM_WIDGETS } from './widgets/system.js'
import { STUDENTS_WIDGETS } from './widgets/students.js'
import { HR_WIDGETS } from './widgets/hr.js'
import { WELFARE_WIDGETS } from './widgets/welfare.js'
import { COMPLIANCE_WIDGETS } from './widgets/compliance.js'
import { GENERAL_WIDGETS } from './widgets/general.js'
import { hasGate, type WidgetDef } from './widgets/shared.js'
import type { DashboardSectionId } from './dashboard.types.js'

export const WIDGETS: WidgetDef[] = [
  ...FINANCIAL_WIDGETS,
  ...ATTENTION_WIDGETS,
  ...SYSTEM_WIDGETS,
  ...STUDENTS_WIDGETS,
  ...HR_WIDGETS,
  ...WELFARE_WIDGETS,
  ...COMPLIANCE_WIDGETS,
  ...GENERAL_WIDGETS,
]

export const SECTION_TITLES: Record<DashboardSectionId, string> = {
  attention: 'Needs Your Attention',
  system: 'System',
  financial: 'Financial',
  students: 'Students & Academics',
  hr: 'HR & Staff',
  welfare: 'Welfare & Facilities',
  compliance: 'Compliance',
  general: 'General',
}

export const SECTION_ORDER: DashboardSectionId[] = [
  'attention',
  'system',
  'financial',
  'students',
  'hr',
  'welfare',
  'compliance',
  'general',
]

export { hasGate }

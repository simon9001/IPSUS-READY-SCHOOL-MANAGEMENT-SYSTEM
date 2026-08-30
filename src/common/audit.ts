import { db } from '../db/client.js'
import { auditLog } from '../db/schema/index.js'

// The audit_log table has existed since the original schema but nothing
// wrote to it — this is the one place that does. Called from any module
// mutating something OAG/BOM would care about being able to trace back to a
// specific admin and moment; the identity module (user/role management) is
// the first caller, since that's exactly the kind of change an audit trail
// exists for.
export async function recordAudit(params: {
  userId: number
  action: string
  entityType: string
  entityId: string | number
  beforeData?: unknown
  afterData?: unknown
}) {
  await db.insert(auditLog).values({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: String(params.entityId),
    beforeData: params.beforeData ?? null,
    afterData: params.afterData ?? null,
  })
}

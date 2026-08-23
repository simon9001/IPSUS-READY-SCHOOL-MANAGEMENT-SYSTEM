import { and, eq, gte, isNotNull, isNull, or } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { notices } from '../../db/schema/index.js'
import type { NewNotice } from './notices.types.js'

export const noticesRepository = {
  findAll: () => db.select().from(notices),
  findById: (id: number) =>
    db.select().from(notices).where(eq(notices.id, id)).then((rows) => rows[0]),
  create: (data: NewNotice) => db.insert(notices).values(data).returning().then((rows) => rows[0]),

  findPublishedForAudience(audience: 'parents' | 'staff', today: string, classId?: number) {
    const audienceMatch = classId
      ? or(eq(notices.audience, 'all'), eq(notices.audience, audience), and(eq(notices.audience, 'class'), eq(notices.classId, classId)))
      : or(eq(notices.audience, 'all'), eq(notices.audience, audience))

    return db
      .select()
      .from(notices)
      .where(and(isNotNull(notices.publishedAt), audienceMatch, or(isNull(notices.expiresAt), gte(notices.expiresAt, today))))
  },
}

import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { counselingSessions } from '../../db/schema/index.js'
import type { NewCounselingSession } from './counseling.types.js'

export const counselingRepository = {
  findAll: () => db.select().from(counselingSessions),
  findByStudent: (studentId: number) => db.select().from(counselingSessions).where(eq(counselingSessions.studentId, studentId)),
  findById: (id: number) =>
    db.select().from(counselingSessions).where(eq(counselingSessions.id, id)).then((rows) => rows[0]),
  create: (data: NewCounselingSession) =>
    db.insert(counselingSessions).values(data).returning().then((rows) => rows[0]),
}

import { and, eq, gte, isNotNull, isNull, or } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { notices } from '../../db/schema/index.js';
export const noticesRepository = {
    findAll: () => db.select().from(notices),
    findById: (id) => db.select().from(notices).where(eq(notices.id, id)).then((rows) => rows[0]),
    create: (data) => db.insert(notices).values(data).returning().then((rows) => rows[0]),
    findPublishedForAudience(audience, today, classId) {
        const audienceMatch = classId
            ? or(eq(notices.audience, 'all'), eq(notices.audience, audience), and(eq(notices.audience, 'class'), eq(notices.classId, classId)))
            : or(eq(notices.audience, 'all'), eq(notices.audience, audience));
        return db
            .select()
            .from(notices)
            .where(and(isNotNull(notices.publishedAt), audienceMatch, or(isNull(notices.expiresAt), gte(notices.expiresAt, today))));
    },
};

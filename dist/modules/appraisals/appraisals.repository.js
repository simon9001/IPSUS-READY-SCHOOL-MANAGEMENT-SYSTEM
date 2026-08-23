import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { staffAppraisals } from '../../db/schema/index.js';
export const appraisalsRepository = {
    findByStaff: (staffId) => db.select().from(staffAppraisals).where(eq(staffAppraisals.staffId, staffId)),
    findById: (id) => db.select().from(staffAppraisals).where(eq(staffAppraisals.id, id)).then((rows) => rows[0]),
    create: (data) => db.insert(staffAppraisals).values(data).returning().then((rows) => rows[0]),
    update: (id, data) => db.update(staffAppraisals).set(data).where(eq(staffAppraisals.id, id)).returning().then((rows) => rows[0]),
};

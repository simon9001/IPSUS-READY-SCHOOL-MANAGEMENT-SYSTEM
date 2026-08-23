import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { staffDisciplinaryRecords } from '../../db/schema/index.js';
export const staffDisciplineRepository = {
    findByStaff: (staffId) => db.select().from(staffDisciplinaryRecords).where(eq(staffDisciplinaryRecords.staffId, staffId)),
    findById: (id) => db.select().from(staffDisciplinaryRecords).where(eq(staffDisciplinaryRecords.id, id)).then((rows) => rows[0]),
    create: (data) => db.insert(staffDisciplinaryRecords).values(data).returning().then((rows) => rows[0]),
};

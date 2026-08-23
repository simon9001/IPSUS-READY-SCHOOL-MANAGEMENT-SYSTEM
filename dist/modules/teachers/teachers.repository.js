import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { teachers } from '../../db/schema/index.js';
export const teachersRepository = {
    findAll: () => db.select().from(teachers),
    findById: (id) => db.select().from(teachers).where(eq(teachers.id, id)).then((rows) => rows[0]),
    findByStaffNo: (staffNo) => db.select().from(teachers).where(eq(teachers.staffNo, staffNo)).then((rows) => rows[0]),
    create: (data) => db.insert(teachers).values(data).returning().then((rows) => rows[0]),
    update: (id, data) => db.update(teachers).set(data).where(eq(teachers.id, id)).returning().then((rows) => rows[0]),
};

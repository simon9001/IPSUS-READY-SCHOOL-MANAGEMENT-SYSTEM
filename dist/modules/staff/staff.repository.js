import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { staff } from '../../db/schema/index.js';
export const staffRepository = {
    findAll: () => db.select().from(staff),
    findById: (id) => db.select().from(staff).where(eq(staff.id, id)).then((rows) => rows[0]),
    findByStaffNo: (staffNo) => db.select().from(staff).where(eq(staff.staffNo, staffNo)).then((rows) => rows[0]),
    create: (data) => db.insert(staff).values(data).returning().then((rows) => rows[0]),
    update: (id, data) => db.update(staff).set(data).where(eq(staff.id, id)).returning().then((rows) => rows[0]),
};

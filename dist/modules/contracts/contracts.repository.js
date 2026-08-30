import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { staffContracts } from '../../db/schema/index.js';
export const contractsRepository = {
    findAll: () => db.select().from(staffContracts),
    findByStaff: (staffId) => db.select().from(staffContracts).where(eq(staffContracts.staffId, staffId)),
    findById: (id) => db.select().from(staffContracts).where(eq(staffContracts.id, id)).then((rows) => rows[0]),
    create: (data) => db.insert(staffContracts).values(data).returning().then((rows) => rows[0]),
    updateStatus: (id, status) => db.update(staffContracts).set({ status }).where(eq(staffContracts.id, id)).returning().then((rows) => rows[0]),
};

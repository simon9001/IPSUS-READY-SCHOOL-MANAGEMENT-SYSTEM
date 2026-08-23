import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { classes, streams, students } from '../../db/schema/index.js';
export const studentsRepository = {
    findAllClasses: () => db.select().from(classes).orderBy(classes.level),
    createClass: (data) => db.insert(classes).values(data).returning().then((rows) => rows[0]),
    findStreamsByClass: (classId) => db.select().from(streams).where(eq(streams.classId, classId)),
    createStream: (data) => db.insert(streams).values(data).returning().then((rows) => rows[0]),
    findAll: () => db.select().from(students),
    findById: (id) => db.select().from(students).where(eq(students.id, id)).then((rows) => rows[0]),
    findByAdmissionNo: (admissionNo) => db.select().from(students).where(eq(students.admissionNo, admissionNo)).then((rows) => rows[0]),
    findByClass: (classId) => db.select().from(students).where(eq(students.classId, classId)),
    create: (data) => db.insert(students).values(data).returning().then((rows) => rows[0]),
    update: (id, data) => db
        .update(students)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(students.id, id))
        .returning()
        .then((rows) => rows[0]),
};

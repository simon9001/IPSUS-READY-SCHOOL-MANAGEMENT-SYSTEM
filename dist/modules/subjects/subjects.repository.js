import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { classSubjects, subjects, subjectStrands, teacherAssignments } from '../../db/schema/index.js';
export const subjectsRepository = {
    findAll: () => db.select().from(subjects),
    findById: (id) => db.select().from(subjects).where(eq(subjects.id, id)).then((rows) => rows[0]),
    findByCode: (code) => db.select().from(subjects).where(eq(subjects.code, code)).then((rows) => rows[0]),
    create: (data) => db.insert(subjects).values(data).returning().then((rows) => rows[0]),
    findStrandsBySubject: (subjectId) => db.select().from(subjectStrands).where(eq(subjectStrands.subjectId, subjectId)),
    findStrandByName: (subjectId, name) => db.select().from(subjectStrands).where(and(eq(subjectStrands.subjectId, subjectId), eq(subjectStrands.name, name))).then((rows) => rows[0]),
    createStrand: (data) => db.insert(subjectStrands).values(data).returning().then((rows) => rows[0]),
    findOfferingsByClass: (classId) => db.select().from(classSubjects).where(eq(classSubjects.classId, classId)),
    findOffering: (classId, subjectId) => db
        .select()
        .from(classSubjects)
        .where(and(eq(classSubjects.classId, classId), eq(classSubjects.subjectId, subjectId)))
        .then((rows) => rows[0]),
    offerToClass: (data) => db.insert(classSubjects).values(data).returning().then((rows) => rows[0]),
    findAssignments: (classId, periodId) => db.select().from(teacherAssignments).where(and(eq(teacherAssignments.classId, classId), eq(teacherAssignments.periodId, periodId))),
    assignTeacher: (data) => db.insert(teacherAssignments).values(data).returning().then((rows) => rows[0]),
};

import { pgTable, serial, varchar, integer, boolean, unique } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { students } from './students.js';
// Guardians are just `users` with the 'parent' role — this table only
// records which student(s) a given user account is guardian of.
export const guardianStudents = pgTable('guardian_students', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    studentId: integer('student_id').notNull().references(() => students.id),
    relationship: varchar('relationship', { length: 30 }).notNull(), // 'father' | 'mother' | 'guardian'
    isPrimary: boolean('is_primary').notNull().default(false),
}, (t) => [unique().on(t.userId, t.studentId)]);

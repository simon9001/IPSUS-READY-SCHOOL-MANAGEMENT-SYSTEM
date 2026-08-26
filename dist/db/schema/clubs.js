import { pgTable, serial, varchar, integer, date, text, pgEnum } from 'drizzle-orm/pg-core';
import { students } from './students.js';
import { staff } from './staff.js';
export const clubCategoryEnum = pgEnum('club_category', ['club', 'sport', 'society']);
export const clubStatusEnum = pgEnum('club_status', ['active', 'inactive']);
export const clubs = pgTable('clubs', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    category: clubCategoryEnum('category').notNull().default('club'),
    patronStaffId: integer('patron_staff_id').references(() => staff.id),
    description: text('description'),
    status: clubStatusEnum('status').notNull().default('active'),
});
export const membershipStatusEnum = pgEnum('membership_status', ['active', 'inactive']);
export const clubMemberships = pgTable('club_memberships', {
    id: serial('id').primaryKey(),
    clubId: integer('club_id').notNull().references(() => clubs.id),
    studentId: integer('student_id').notNull().references(() => students.id),
    joinedDate: date('joined_date').notNull(),
    role: varchar('role', { length: 60 }), // e.g. "Chairperson", "Captain", "Member"
    status: membershipStatusEnum('status').notNull().default('active'),
});
// Kenyan school competition tiers: school -> zonal -> county -> regional -> national
export const competitionLevelEnum = pgEnum('competition_level', ['school', 'zonal', 'county', 'regional', 'national']);
export const competitions = pgTable('competitions', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    clubId: integer('club_id').references(() => clubs.id),
    level: competitionLevelEnum('level').notNull().default('school'),
    competitionDate: date('competition_date').notNull(),
    venue: varchar('venue', { length: 150 }),
});
export const competitionParticipants = pgTable('competition_participants', {
    id: serial('id').primaryKey(),
    competitionId: integer('competition_id').notNull().references(() => competitions.id),
    studentId: integer('student_id').notNull().references(() => students.id),
    result: varchar('result', { length: 100 }), // "1st Place", "Qualified for Nationals"
    achievement: text('achievement'),
});

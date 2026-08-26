import { pgTable, serial, varchar, integer, date, numeric, boolean, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { students } from './students.js';
import { users } from './identity.js';
export const bookStatusEnum = pgEnum('book_status', ['active', 'withdrawn']);
export const libraryBooks = pgTable('library_books', {
    id: serial('id').primaryKey(),
    isbn: varchar('isbn', { length: 20 }),
    title: varchar('title', { length: 200 }).notNull(),
    author: varchar('author', { length: 150 }),
    category: varchar('category', { length: 60 }), // "Fiction", "Textbook", "Reference"
    totalCopies: integer('total_copies').notNull().default(1),
    status: bookStatusEnum('status').notNull().default('active'),
});
export const borrowingStatusEnum = pgEnum('borrowing_status', ['borrowed', 'returned', 'lost']);
export const bookBorrowings = pgTable('book_borrowings', {
    id: serial('id').primaryKey(),
    bookId: integer('book_id').notNull().references(() => libraryBooks.id),
    studentId: integer('student_id').notNull().references(() => students.id),
    borrowedDate: date('borrowed_date').notNull(),
    dueDate: date('due_date').notNull(),
    returnedDate: date('returned_date'),
    status: borrowingStatusEnum('status').notNull().default('borrowed'),
    fineAmount: numeric('fine_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    finePaid: boolean('fine_paid').notNull().default(false),
    issuedBy: integer('issued_by').notNull().references(() => users.id),
    returnedTo: integer('returned_to').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

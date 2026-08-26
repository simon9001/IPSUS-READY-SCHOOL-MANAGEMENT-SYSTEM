import { and, eq, lt, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { bookBorrowings, libraryBooks } from '../../db/schema/index.js';
export const libraryRepository = {
    findAllBooks: () => db.select().from(libraryBooks),
    findBookById: (id) => db.select().from(libraryBooks).where(eq(libraryBooks.id, id)).then((rows) => rows[0]),
    createBook: (data) => db.insert(libraryBooks).values(data).returning().then((rows) => rows[0]),
    async activeBorrowCount(bookId) {
        const [row] = await db
            .select({ count: sql `count(*)::int` })
            .from(bookBorrowings)
            .where(and(eq(bookBorrowings.bookId, bookId), eq(bookBorrowings.status, 'borrowed')));
        return row?.count ?? 0;
    },
    findActiveBorrowingForStudentAndBook: (bookId, studentId) => db
        .select()
        .from(bookBorrowings)
        .where(and(eq(bookBorrowings.bookId, bookId), eq(bookBorrowings.studentId, studentId), eq(bookBorrowings.status, 'borrowed')))
        .then((rows) => rows[0]),
    findBorrowingsByStudent: (studentId) => db.select().from(bookBorrowings).where(eq(bookBorrowings.studentId, studentId)),
    findBorrowingById: (id) => db.select().from(bookBorrowings).where(eq(bookBorrowings.id, id)).then((rows) => rows[0]),
    createBorrowing: (data) => db.insert(bookBorrowings).values(data).returning().then((rows) => rows[0]),
    updateBorrowing: (id, data) => db.update(bookBorrowings).set(data).where(eq(bookBorrowings.id, id)).returning().then((rows) => rows[0]),
    findOverdue: (asOfDate) => db.select().from(bookBorrowings).where(and(eq(bookBorrowings.status, 'borrowed'), lt(bookBorrowings.dueDate, asOfDate))),
};

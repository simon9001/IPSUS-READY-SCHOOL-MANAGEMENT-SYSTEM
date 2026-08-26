import { and, eq, lt, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { bookBorrowings, libraryBooks } from '../../db/schema/index.js'
import type { NewBookBorrowing, NewLibraryBook } from './library.types.js'

export const libraryRepository = {
  findAllBooks: () => db.select().from(libraryBooks),
  findBookById: (id: number) =>
    db.select().from(libraryBooks).where(eq(libraryBooks.id, id)).then((rows) => rows[0]),
  createBook: (data: NewLibraryBook) => db.insert(libraryBooks).values(data).returning().then((rows) => rows[0]),

  async activeBorrowCount(bookId: number) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookBorrowings)
      .where(and(eq(bookBorrowings.bookId, bookId), eq(bookBorrowings.status, 'borrowed')))
    return row?.count ?? 0
  },

  findActiveBorrowingForStudentAndBook: (bookId: number, studentId: number) =>
    db
      .select()
      .from(bookBorrowings)
      .where(and(eq(bookBorrowings.bookId, bookId), eq(bookBorrowings.studentId, studentId), eq(bookBorrowings.status, 'borrowed')))
      .then((rows) => rows[0]),

  findBorrowingsByStudent: (studentId: number) => db.select().from(bookBorrowings).where(eq(bookBorrowings.studentId, studentId)),
  findBorrowingById: (id: number) =>
    db.select().from(bookBorrowings).where(eq(bookBorrowings.id, id)).then((rows) => rows[0]),
  createBorrowing: (data: NewBookBorrowing) => db.insert(bookBorrowings).values(data).returning().then((rows) => rows[0]),
  updateBorrowing: (id: number, data: Partial<NewBookBorrowing>) =>
    db.update(bookBorrowings).set(data).where(eq(bookBorrowings.id, id)).returning().then((rows) => rows[0]),

  findOverdue: (asOfDate: string) =>
    db.select().from(bookBorrowings).where(and(eq(bookBorrowings.status, 'borrowed'), lt(bookBorrowings.dueDate, asOfDate))),
}

import { libraryRepository } from './library.repository.js'
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js'
import type { BorrowBookInput, CreateBookInput, PayFineInput, ReturnBookInput } from './library.schema.js'

// Placeholder flat rate — adjust to the school's actual library policy.
const FINE_PER_DAY_LATE = 5

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))
}

export const libraryService = {
  listBooks: () => libraryRepository.findAllBooks(),

  async getBookById(id: number) {
    const book = await libraryRepository.findBookById(id)
    if (!book) throw new NotFoundError(`Book ${id} not found`)
    const activeBorrows = await libraryRepository.activeBorrowCount(id)
    return { ...book, availableCopies: book.totalCopies - activeBorrows }
  },

  createBook: (input: CreateBookInput) => libraryRepository.createBook(input),

  listBorrowingsByStudent: (studentId: number) => libraryRepository.findBorrowingsByStudent(studentId),
  listOverdue: (asOfDate: string) => libraryRepository.findOverdue(asOfDate),

  async borrow(input: BorrowBookInput) {
    const book = await libraryRepository.findBookById(input.bookId)
    if (!book) throw new NotFoundError(`Book ${input.bookId} not found`)

    const existing = await libraryRepository.findActiveBorrowingForStudentAndBook(input.bookId, input.studentId)
    if (existing) throw new ConflictError('This student already has this book borrowed')

    const activeBorrows = await libraryRepository.activeBorrowCount(input.bookId)
    if (activeBorrows >= book.totalCopies) throw new ConflictError(`No copies of "${book.title}" are currently available`)

    return libraryRepository.createBorrowing({ ...input, status: 'borrowed' })
  },

  async returnBook(id: number, input: ReturnBookInput) {
    const borrowing = await libraryRepository.findBorrowingById(id)
    if (!borrowing) throw new NotFoundError(`Borrowing ${id} not found`)
    if (borrowing.status !== 'borrowed') throw new ConflictError(`Borrowing ${id} is already ${borrowing.status}`)

    const daysLate = Math.max(0, daysBetween(borrowing.dueDate, input.returnedDate))
    const fineAmount = daysLate * FINE_PER_DAY_LATE

    return libraryRepository.updateBorrowing(id, {
      status: input.lost ? 'lost' : 'returned',
      returnedDate: input.returnedDate,
      returnedTo: input.returnedTo,
      fineAmount: fineAmount.toFixed(2),
    })
  },

  async payFine(id: number, input: PayFineInput) {
    const borrowing = await libraryRepository.findBorrowingById(id)
    if (!borrowing) throw new NotFoundError(`Borrowing ${id} not found`)
    if (Number(borrowing.fineAmount) <= 0) throw new ValidationError(`Borrowing ${id} has no outstanding fine`)
    if (borrowing.finePaid) throw new ConflictError(`Borrowing ${id}'s fine is already paid`)
    return libraryRepository.updateBorrowing(id, { finePaid: true, returnedTo: input.paidTo })
  },
}

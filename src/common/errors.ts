export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

// 401 vs 403 is a meaningful distinction for the client, not a nicety: 401
// means "your session is no longer valid, sign in again", while 403 means
// "you are signed in but not allowed to do this". Conflating them forces the
// frontend either to sign people out when they merely lack a permission, or
// to leave a dead session in place until the user notices nothing loads.
export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403)
  }
}

// Constraints are the last line of defence, and hitting one is the caller's
// mistake rather than a server fault. The driver wraps the Postgres error, and
// its message names tables and columns, so only the code is ever looked at.
const CLIENT_ERRORS_BY_POSTGRES_CODE: Record<string, () => AppError> = {
  '23505': () => new ConflictError('A record with these details already exists'),
  '23503': () => new ValidationError('This refers to a record that does not exist, or is still in use'),
  '22003': () => new ValidationError('A number is too large'),
  // Controllers do Number(param), so /students/abc or a missing ?periodId= arrives as NaN.
  '22P02': () => new ValidationError('An id or number in this request is missing or invalid'),
}

export function toClientError(err: unknown): AppError | undefined {
  for (let current = err; current && typeof current === 'object'; current = (current as { cause?: unknown }).cause) {
    const code = (current as { code?: unknown }).code
    if (typeof code === 'string' && code in CLIENT_ERRORS_BY_POSTGRES_CODE) return CLIENT_ERRORS_BY_POSTGRES_CODE[code]()
  }
  return undefined
}

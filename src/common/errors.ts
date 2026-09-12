export class AppError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = new.target.name
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404) }
}

export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409) }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400) }
}

// 401 vs 403 is a meaningful distinction for the client, not a nicety: 401
// means "your session is no longer valid, sign in again", while 403 means
// "you are signed in but not allowed to do this". Conflating them forces the
// frontend either to sign people out when they merely lack a permission, or
// to leave a dead session in place until the user notices nothing loads.
export class UnauthorizedError extends AppError {
  constructor(message: string) { super(message, 401) }
}

export class ForbiddenError extends AppError {
  constructor(message: string) { super(message, 403) }
}

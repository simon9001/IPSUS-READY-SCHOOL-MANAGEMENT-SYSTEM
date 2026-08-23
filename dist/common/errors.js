export class AppError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = new.target.name;
    }
}
export class NotFoundError extends AppError {
    constructor(message) { super(message, 404); }
}
export class ConflictError extends AppError {
    constructor(message) { super(message, 409); }
}
export class ValidationError extends AppError {
    constructor(message) { super(message, 400); }
}
export class ForbiddenError extends AppError {
    constructor(message) { super(message, 403); }
}

import { AppError } from "./app-error.js";

// 400 Bad Request
export class BadRequestError extends AppError {
  constructor(description = "Bad Request", name: string = "BAD_REQUEST") {
    super(name, 400, description);
  }
}

export class InsufficientAmountError extends BadRequestError {
  constructor(description = "Insufficient funds") {
    super(description, "INSUFFICIENT_FUNDS");
  }
}

export class InvalidPinError extends BadRequestError {
  constructor(description = "Invalid pin") {
    super(description, "INVALID_PIN");
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(description = "Unauthorized") {
    super("UNAUTHORIZED", 401, description);
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(description = "Forbidden", name = "FORBIDDEN") {
    super(name, 403, description);
  }
}

export class HighRiskOperationDetected extends ForbiddenError {
  constructor(description: string) {
    super(description, "HIGH_RISK_OPERATION");
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(description = "Not Found") {
    super("NOT_FOUND", 404, description);
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(description = "Conflict") {
    super("CONFLICT", 409, description);
  }
}

// 422 Unprocessable Entity (Validation errors)
export class ValidationError extends AppError {
  constructor(description = "Validation Error", public readonly details?: any) {
    super("VALIDATION_ERROR", 422, description);
  }
}

// 500 Internal Server Error
export class InternalServerError extends AppError {
  constructor(description = "Internal Server Error") {
    super("INTERNAL_SERVER_ERROR", 500, description, false);
  }
}

export class ValueError extends AppError {
  constructor(description = "Value Error", public readonly details?: any) {
    super("VALUE", 500, description);
  }
}

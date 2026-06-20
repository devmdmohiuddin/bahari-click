// Typed application errors. Services throw or return these; the action/route
// layer maps them to user-safe messages. Never leak raw exceptions to users.

export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTEGRATION"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export const notFound = (message = "Not found", details?: unknown) =>
  new AppError("NOT_FOUND", message, details);

export const unauthorized = (message = "Unauthorized", details?: unknown) =>
  new AppError("UNAUTHORIZED", message, details);

export const forbidden = (message = "Forbidden", details?: unknown) =>
  new AppError("FORBIDDEN", message, details);

export const conflict = (message = "Conflict", details?: unknown) =>
  new AppError("CONFLICT", message, details);

export const validationError = (message = "Invalid input", details?: unknown) =>
  new AppError("VALIDATION", message, details);

import { z } from "zod";
import { AppError, type ErrorCode } from "./errors";

// Discriminated result type returned by Server Actions to the client.
// Services may throw AppError; actions catch and convert to a Result so the
// UI always receives a typed, serializable outcome (never a raw exception).

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; details?: unknown } };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err(code: ErrorCode, message: string, details?: unknown): Result<never> {
  return { ok: false, error: { code, message, details } };
}

/** Convert any thrown value into a user-safe Result. */
export function toResult(error: unknown): Result<never> {
  if (error instanceof AppError) {
    return err(error.code, error.message, error.details);
  }
  if (error instanceof z.ZodError) {
    return err("VALIDATION", "Invalid input", z.treeifyError(error));
  }
  console.error("[unhandled]", error);
  return err("INTERNAL", "Something went wrong. Please try again.");
}

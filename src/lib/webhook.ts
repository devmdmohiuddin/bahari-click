import { createHmac, timingSafeEqual } from "node:crypto";

// HMAC-SHA256 webhook signature verification (timing-safe). Providers sign the
// raw request body with a shared secret; we recompute and compare.

export function verifyHmacSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  // Accept an optional "sha256=" prefix.
  const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(provided, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

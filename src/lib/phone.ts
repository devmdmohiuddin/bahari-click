// BD phone normalization. Canonical form: +8801XXXXXXXXX (E.164).
// Accepts 01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX with spaces/dashes.

const BD_E164 = /^\+8801[3-9]\d{8}$/;

export function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "");

  let normalized: string;
  if (digits.startsWith("+880")) {
    normalized = digits;
  } else if (digits.startsWith("880")) {
    normalized = `+${digits}`;
  } else if (digits.startsWith("01")) {
    normalized = `+88${digits}`;
  } else {
    return null;
  }

  return BD_E164.test(normalized) ? normalized : null;
}

export function isValidBdPhone(input: string): boolean {
  return normalizeBdPhone(input) !== null;
}

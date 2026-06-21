// Display helpers. Money is whole BDT (Int) throughout the app.

const bdt = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });

/** Format whole-taka amount, e.g. 1500 → "৳1,500". */
export function formatBdt(amount: number): string {
  return `৳${bdt.format(amount)}`;
}

// All customer-facing times render in Bangladesh time regardless of server TZ.
const DHAKA_TZ = "Asia/Dhaka";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: DHAKA_TZ,
});

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: DHAKA_TZ,
});

/** Format a date as "21 Jun 2026" in Asia/Dhaka. */
export function formatDate(date: Date | string): string {
  return dateFmt.format(typeof date === "string" ? new Date(date) : date);
}

/** Format a date+time as "21 Jun 2026, 4:30 pm" in Asia/Dhaka. */
export function formatDateTime(date: Date | string): string {
  return dateTimeFmt.format(typeof date === "string" ? new Date(date) : date);
}

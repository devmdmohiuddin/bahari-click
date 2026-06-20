// Display helpers. Money is whole BDT (Int) throughout the app.

const bdt = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });

/** Format whole-taka amount, e.g. 1500 → "৳1,500". */
export function formatBdt(amount: number): string {
  return `৳${bdt.format(amount)}`;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Format a date as "21 Jun 2026". */
export function formatDate(date: Date | string): string {
  return dateFmt.format(typeof date === "string" ? new Date(date) : date);
}

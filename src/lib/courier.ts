// Client-safe helper: best-effort public tracking URL for a consignment.
// The mock courier has no public tracker, so it returns null (UI shows the
// code only). Steadfast gets its consignment tracking page.
export function courierTrackingUrl(
  courierName: string | null,
  trackingCode: string | null,
): string | null {
  if (!courierName || !trackingCode) return null;
  switch (courierName.toLowerCase()) {
    case "steadfast":
      return `https://steadfast.com.bd/t/${encodeURIComponent(trackingCode)}`;
    default:
      return null;
  }
}

// Transient handoff of the just-placed order from checkout → confirmation page.
// Stored in sessionStorage (not the cart store) so a refresh on the confirmation
// page degrades gracefully to a generic success message + track link.

export type LastOrder = {
  orderNumber: string;
  total: number;
  phone: string;
  name: string;
  /** Shared id so the client Purchase pixel dedupes against the server CAPI. */
  metaEventId: string | null;
};

const KEY = "bahari-last-order";

export function saveLastOrder(order: LastOrder): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // sessionStorage unavailable (private mode / SSR) — non-fatal.
  }
}

export function readLastOrder(): LastOrder | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch {
    return null;
  }
}

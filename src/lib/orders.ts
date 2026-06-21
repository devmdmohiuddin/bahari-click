// Client-safe order-status constants: the transition map, display labels, and
// badge variants. Shared by the order service (authoritative enforcement) and
// the admin UI (which transitions to offer, how to render a status).

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "dispatched",
  "delivered",
  "returned",
  "cancelled",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

// Allowed forward transitions. returned/cancelled are terminal.
export const ORDER_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["dispatched", "cancelled"],
  dispatched: ["delivered", "returned"],
  delivered: ["returned"],
  returned: [],
  cancelled: [],
};

export const STATUS_LABEL: Record<OrderStatusValue, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  returned: "Returned",
  cancelled: "Cancelled",
};

export type StatusBadgeVariant = "secondary" | "info" | "warning" | "success" | "destructive";

export const STATUS_BADGE: Record<OrderStatusValue, StatusBadgeVariant> = {
  pending: "warning",
  confirmed: "info",
  packed: "info",
  dispatched: "info",
  delivered: "success",
  returned: "destructive",
  cancelled: "destructive",
};

// Items can only be edited before the order is handed to a courier.
export const EDITABLE_STATUSES: OrderStatusValue[] = ["pending", "confirmed"];

/** Fraud verdict → badge variant. Verdicts: "good" | "risky" | "unknown". */
export function fraudBadgeVariant(verdict: string | null): StatusBadgeVariant {
  switch (verdict?.toLowerCase()) {
    case "risky":
      return "destructive";
    case "good":
      return "success";
    default:
      return "secondary"; // unknown / not assessed
  }
}

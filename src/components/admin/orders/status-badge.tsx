import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE, STATUS_LABEL, fraudBadgeVariant, type OrderStatusValue } from "@/lib/orders";

export function OrderStatusBadge({ status }: { status: OrderStatusValue }) {
  return <Badge variant={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function FraudBadge({ verdict, score }: { verdict: string | null; score: number | null }) {
  if (!verdict || verdict === "unknown") {
    return (
      <Badge variant="secondary" title="Not assessed">
        —
      </Badge>
    );
  }
  return (
    <Badge variant={fraudBadgeVariant(verdict)} className="capitalize">
      {verdict}
      {score !== null ? ` ${score}` : ""}
    </Badge>
  );
}

import { listPayments, paymentSummary } from "@/server/services/payment";
import { PaymentsView } from "@/components/admin/payments/payments-view";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [payments, summary] = await Promise.all([listPayments(), paymentSummary()]);
  const rows = payments.map((p) => ({
    id: p.id,
    transactionId: p.transactionId,
    provider: p.provider,
    amount: p.amount,
    status: p.status,
    cardType: p.cardType,
    createdAt: p.createdAt.toISOString(),
    orderNumber: p.order.orderNumber,
    custPhone: p.order.custPhone,
  }));
  return <PaymentsView payments={rows} summary={summary} />;
}

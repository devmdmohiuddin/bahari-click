import { OrderStatus, PaymentStatus, type Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { conflict, notFound, validationError } from "@/lib/errors";
import { payments } from "@/server/integrations/payments";
import { transitionOrderStatus } from "@/server/services/order";

// Online payment flow (SSLCommerz sandbox in dev). Supports prepaid or
// advance-charge: a Payment row is created, the buyer is redirected to the
// gateway, and success is confirmed server-side via validation/IPN.

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function newTransactionId(orderNumber: string) {
  return `${orderNumber}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

export interface InitiatePaymentResult {
  gatewayUrl: string;
  transactionId: string;
  amount: number;
}

/** Create a pending Payment and get the gateway redirect URL. Amount defaults to the order total. */
export async function initiatePayment(
  orderId: string,
  amount?: number,
): Promise<InitiatePaymentResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      custName: true,
      custPhone: true,
      custAddress: true,
      payments: { where: { status: PaymentStatus.success }, select: { id: true } },
    },
  });
  if (!order) throw notFound("Order not found");
  if (order.payments.length > 0) throw conflict("This order is already paid");

  const charge = amount ?? order.total;
  if (charge <= 0 || charge > order.total) {
    throw validationError("Invalid payment amount");
  }

  const transactionId = newTransactionId(order.orderNumber);
  const base = appUrl();

  const init = await payments.initiate({
    transactionId,
    amount: charge,
    customer: { name: order.custName, phone: order.custPhone, address: order.custAddress },
    productName: `Order ${order.orderNumber}`,
    successUrl: `${base}/api/payments/sslcommerz/success`,
    failUrl: `${base}/api/payments/sslcommerz/fail`,
    cancelUrl: `${base}/api/payments/sslcommerz/cancel`,
    ipnUrl: `${base}/api/payments/sslcommerz/ipn`,
  });

  await db.payment.create({
    data: {
      orderId: order.id,
      provider: payments.name,
      transactionId,
      amount: charge,
      status: PaymentStatus.pending,
      gatewaySessionId: init.sessionId ?? null,
    },
  });

  return { gatewayUrl: init.gatewayUrl, transactionId, amount: charge };
}

/**
 * Confirm a payment from a gateway callback / IPN. Validates server-side, marks
 * the Payment success, and advances a still-pending order to confirmed.
 * Idempotent: a second confirmation is a no-op.
 */
export async function confirmPayment(transactionId: string, valId?: string) {
  const payment = await db.payment.findUnique({
    where: { transactionId },
    select: { id: true, orderId: true, amount: true, status: true },
  });
  if (!payment) throw notFound("Payment not found");
  if (payment.status === PaymentStatus.success) {
    return { id: payment.id, status: payment.status, changed: false };
  }

  const result = await payments.validate({ transactionId, valId });
  if (!result.valid) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.failed, raw: (result.raw ?? {}) as Prisma.InputJsonValue },
    });
    throw validationError("Payment validation failed");
  }
  if (result.amount !== undefined && result.amount !== payment.amount) {
    throw validationError("Payment amount mismatch");
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.success,
      gatewayValId: result.valId ?? null,
      cardType: result.cardType ?? null,
      raw: (result.raw ?? {}) as Prisma.InputJsonValue,
    },
  });

  // Paid → confirm the order if it's still pending (fires confirmation SMS).
  const order = await db.order.findUnique({
    where: { id: payment.orderId },
    select: { status: true },
  });
  if (order?.status === OrderStatus.pending) {
    await transitionOrderStatus(payment.orderId, OrderStatus.confirmed, {
      note: `payment:${transactionId}`,
    });
  }

  return { id: payment.id, status: PaymentStatus.success, changed: true };
}

export async function markPaymentFailed(
  transactionId: string,
  status: typeof PaymentStatus.failed | typeof PaymentStatus.cancelled,
) {
  const payment = await db.payment.findUnique({
    where: { transactionId },
    select: { id: true, status: true },
  });
  if (!payment) throw notFound("Payment not found");
  if (payment.status === PaymentStatus.success) return { id: payment.id, status: payment.status };

  await db.payment.update({ where: { id: payment.id }, data: { status } });
  return { id: payment.id, status };
}

export async function getPaymentByTransactionId(transactionId: string) {
  return db.payment.findUnique({ where: { transactionId } });
}

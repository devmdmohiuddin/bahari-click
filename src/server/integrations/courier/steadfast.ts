import { AppError } from "@/lib/errors";
import type {
  ConsignmentResult,
  CourierAdapter,
  CourierStatus,
  CreateConsignmentInput,
  FraudCheckResult,
} from "./types";

// Steadfast courier adapter (BD). Used when COURIER_PROVIDER=steadfast and
// STEADFAST_* credentials are set. Dev defaults to the mock (৳0). Docs:
// https://docs.steadfast.com.bd

const BASE_URL = process.env.STEADFAST_BASE_URL ?? "https://portal.steadfast.com.bd/api/v1";

function headers() {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secret = process.env.STEADFAST_SECRET_KEY;
  if (!apiKey || !secret) {
    throw new AppError("INTEGRATION", "Steadfast credentials are not configured");
  }
  return {
    "Api-Key": apiKey,
    "Secret-Key": secret,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// Map Steadfast delivery statuses to our internal courier status vocabulary.
function mapStatus(raw: string): CourierStatus {
  switch (raw) {
    case "delivered":
    case "partial_delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    case "returned":
      return "returned";
    case "in_review":
      return "in_review";
    case "pending":
    case "hold":
    default:
      return "pending";
  }
}

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new AppError("INTEGRATION", `Steadfast ${path} failed (${res.status})`);
  }
  return res.json();
}

async function getJson(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: headers() });
  if (!res.ok) {
    throw new AppError("INTEGRATION", `Steadfast ${path} failed (${res.status})`);
  }
  return res.json();
}

export const steadfastAdapter: CourierAdapter = {
  name: "steadfast",

  // Steadfast doesn't expose a first-party fraud score; treat as unknown so the
  // checkout flow fails open. (A dedicated fraud provider can be added later.)
  async fraudCheck(): Promise<FraudCheckResult> {
    return { score: 0, verdict: "unknown" };
  },

  async createConsignment(input: CreateConsignmentInput): Promise<ConsignmentResult> {
    const data = await postJson("/create_order", {
      invoice: input.orderNumber,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone.replace(/^\+88/, ""),
      recipient_address: input.recipientAddress,
      cod_amount: input.codAmount,
      note: input.note ?? "",
    });

    const c = data?.consignment ?? data;
    return {
      trackingCode: String(c?.tracking_code ?? ""),
      consignmentId: String(c?.consignment_id ?? ""),
    };
  },

  async getStatus(trackingCode: string): Promise<CourierStatus> {
    const data = await getJson(`/status_by_trackingcode/${encodeURIComponent(trackingCode)}`);
    return mapStatus(String(data?.delivery_status ?? "pending"));
  },
};

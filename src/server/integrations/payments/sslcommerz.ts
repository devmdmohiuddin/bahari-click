import { AppError } from "@/lib/errors";
import type { InitiateParams, InitiateResult, PaymentAdapter, ValidationResult } from "./types";

// SSLCommerz adapter. Defaults to the sandbox; set SSLCOMMERZ_SANDBOX=false +
// live credentials to go to production. Docs: https://developer.sslcommerz.com

function config() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePasswd = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePasswd) {
    throw new AppError("INTEGRATION", "SSLCommerz credentials are not configured");
  }
  const sandbox = process.env.SSLCOMMERZ_SANDBOX !== "false";
  const base = sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
  return { storeId, storePasswd, base };
}

export const sslcommerzAdapter: PaymentAdapter = {
  name: "sslcommerz",

  async initiate(params: InitiateParams): Promise<InitiateResult> {
    const { storeId, storePasswd, base } = config();
    const body = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePasswd,
      total_amount: String(params.amount),
      currency: "BDT",
      tran_id: params.transactionId,
      success_url: params.successUrl,
      fail_url: params.failUrl,
      cancel_url: params.cancelUrl,
      ipn_url: params.ipnUrl,
      shipping_method: "Courier",
      product_name: params.productName,
      product_category: "general",
      product_profile: "general",
      cus_name: params.customer.name,
      cus_email: params.customer.email ?? "customer@bahari.local",
      cus_phone: params.customer.phone,
      cus_add1: params.customer.address,
    });

    const res = await fetch(`${base}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      GatewayPageURL?: string;
      sessionkey?: string;
      failedreason?: string;
    };

    if (data.status !== "SUCCESS" || !data.GatewayPageURL) {
      throw new AppError("INTEGRATION", data.failedreason ?? "SSLCommerz init failed");
    }
    return { gatewayUrl: data.GatewayPageURL, sessionId: data.sessionkey };
  },

  async validate(input): Promise<ValidationResult> {
    const { storeId, storePasswd, base } = config();
    if (!input.valId) {
      return { valid: false, status: "NO_VAL_ID", transactionId: input.transactionId ?? "" };
    }

    const url = new URL(`${base}/validator/api/validationserverAPI.php`);
    url.searchParams.set("val_id", input.valId);
    url.searchParams.set("store_id", storeId);
    url.searchParams.set("store_passwd", storePasswd);
    url.searchParams.set("format", "json");

    const res = await fetch(url, { method: "GET" });
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      tran_id?: string;
      val_id?: string;
      amount?: string;
      card_type?: string;
    };

    const valid = data.status === "VALID" || data.status === "VALIDATED";
    return {
      valid,
      status: data.status ?? "UNKNOWN",
      transactionId: data.tran_id ?? input.transactionId ?? "",
      valId: data.val_id ?? input.valId,
      amount: data.amount ? Math.round(Number(data.amount)) : undefined,
      cardType: data.card_type,
      raw: data,
    };
  },
};

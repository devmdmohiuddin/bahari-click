import type { NextRequest } from "next/server";

// Gateway callbacks arrive as a browser POST (SSLCommerz form-encoded) or GET
// (our mock). Read params from either.
export async function readCallbackParams(request: NextRequest): Promise<Record<string, string>> {
  const params: Record<string, string> = {};
  new URL(request.url).searchParams.forEach((v, k) => (params[k] = v));

  if (request.method === "POST") {
    const ct = request.headers.get("content-type") ?? "";
    if (ct.includes("form")) {
      const form = await request.formData();
      for (const [k, v] of form.entries()) params[k] = String(v);
    }
  }
  return params;
}

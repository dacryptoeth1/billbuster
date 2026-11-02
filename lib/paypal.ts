import "server-only";
import type { TestPaymentResult } from "@/lib/schema";

/** Payments here are simulations, so anything other than PayPal's sandbox is refused. */
const SANDBOX_ORIGIN = "https://api-m.sandbox.paypal.com";

export class PayPalNotConfiguredError extends Error {}

export class PayPalApiError extends Error {
  constructor(
    readonly status: number,
    /** PayPal's error code, such as ORDER_NOT_APPROVED, when it sends one. */
    readonly issue: string | undefined,
  ) {
    super(`PayPal request failed with HTTP ${status}${issue ? ` (${issue})` : ""}`);
  }
}

type PayPalOrder = {
  id?: string;
  links?: { rel?: string; href?: string }[];
  purchase_units?: {
    payments?: {
      captures?: { id?: string; status?: TestPaymentResult["status"]; amount?: { value?: string } }[];
    };
  }[];
};

function getConfig() {
  const { PAYPAL_CLIENT_ID: clientId, PAYPAL_CLIENT_SECRET: clientSecret, PAYPAL_BASE_URL } = process.env;
  if (!clientId || !clientSecret || !PAYPAL_BASE_URL) {
    throw new PayPalNotConfiguredError("PAYPAL_* variables are not set. See .env.example.");
  }
  if (!URL.canParse(PAYPAL_BASE_URL) || new URL(PAYPAL_BASE_URL).origin !== SANDBOX_ORIGIN) {
    throw new PayPalNotConfiguredError(`PAYPAL_BASE_URL must be ${SANDBOX_ORIGIN}.`);
  }
  return { clientId, clientSecret };
}

function send(path: string, init: RequestInit) {
  return fetch(`${SANDBOX_ORIGIN}${path}`, { ...init, signal: AbortSignal.timeout(20_000) });
}

/** A 202 may have no body, so an unreadable response is treated as having no details. */
async function readOrder(res: Response): Promise<PayPalOrder> {
  return res.json().catch(() => ({}));
}

async function toApiError(res: Response) {
  const body = (await res.json().catch(() => ({}))) as {
    name?: string;
    debug_id?: string;
    details?: { issue?: string }[];
  };
  const issue = body.details?.[0]?.issue ?? body.name;
  console.warn(
    `PayPal HTTP ${res.status}: ${issue ?? "unknown error"} (debug id ${body.debug_id ?? "none"})`,
  );
  return new PayPalApiError(res.status, issue);
}

async function getAccessToken() {
  const { clientId, clientSecret } = getConfig();
  const res = await send("/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw await toApiError(res);
  const { access_token: token } = (await res.json()) as { access_token?: string };
  if (!token) throw new PayPalApiError(res.status, "NO_ACCESS_TOKEN");
  return token;
}

/** Creates a sandbox order. Only the amount and a generic label go to PayPal, no bill details. */
export async function createTestOrder(input: { amount: number; returnUrl: string; cancelUrl: string }) {
  const token = await getAccessToken();
  const res = await send("/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": crypto.randomUUID(),
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: "BillBuster simulated test payment (sandbox)",
          amount: { currency_code: "USD", value: input.amount.toFixed(2) },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "BillBuster sandbox test",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  });
  if (!res.ok) throw await toApiError(res);

  const order = await readOrder(res);
  // PayPal says not to hardcode the rel: it's payer-action or approve depending on the request.
  const approvalUrl = order.links?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!order.id || !approvalUrl) throw new PayPalApiError(res.status, "NO_APPROVAL_LINK");
  return { orderId: order.id, approvalUrl };
}

function toResult(orderId: string, order: PayPalOrder): TestPaymentResult {
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  const value = capture?.amount?.value;
  return {
    orderId,
    // A 202 has no capture details yet, so never assume it completed.
    status: capture?.status ?? "PENDING",
    captureId: capture?.id ?? null,
    amount: value && Number.isFinite(Number(value)) ? Number(value) : null,
  };
}

/**
 * Captures an approved sandbox order. The request ID comes from the order, so a page
 * refresh replays the first result (PayPal answers 200) instead of capturing again.
 */
export async function captureTestOrder(orderId: string): Promise<TestPaymentResult> {
  const token = await getAccessToken();
  const auth = { Authorization: `Bearer ${token}` };
  const res = await send(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      ...auth,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `billbuster-capture-${orderId}`,
      Prefer: "return=representation",
    },
    body: "{}",
  });
  if (res.ok) return toResult(orderId, await readOrder(res));

  const error = await toApiError(res);
  if (error.issue !== "ORDER_ALREADY_CAPTURED") throw error;

  // PayPal no longer replays the first response, so read back the capture that already happened.
  const existing = await send(`/v2/checkout/orders/${orderId}`, { headers: auth });
  if (!existing.ok) throw await toApiError(existing);
  return toResult(orderId, await readOrder(existing));
}

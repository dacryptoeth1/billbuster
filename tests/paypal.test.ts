import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createOrder } from "@/app/api/paypal/orders/route";
import { POST as captureOrder } from "@/app/api/paypal/orders/[id]/capture/route";
import { correctedTotal } from "@/lib/flags";
import type { Bill } from "@/lib/schema";

vi.mock("server-only", () => ({}));

const SANDBOX = "https://api-m.sandbox.paypal.com";

const bill: Bill = {
  provider: "Secret Clinic",
  patientRef: "ACCT-SECRET-1",
  dateOfService: "2026-01-01",
  lineItems: [
    { code: "99213", description: "Office visit", quantity: 1, charge: 180, dateOfService: "" },
    { code: "85025", description: "CBC", quantity: 1, charge: 40, dateOfService: "" },
  ],
  totalBilled: 220,
  insurancePaid: 120,
  patientOwes: 100,
};

const json = (body: unknown, status = 200) => Response.json(body, { status });
const tokenResponse = () => json({ access_token: "ACCESS-TOKEN" });
const paypalError = (status: number, issue: string) =>
  json({ name: "UNPROCESSABLE_ENTITY", debug_id: "dbg", details: [{ issue }] }, status);
const capturedOrder = (status = "COMPLETED") =>
  json({
    id: "ORDER1",
    purchase_units: [
      { payments: { captures: [{ id: "CAP1", status, amount: { currency_code: "USD", value: "100.00" } }] } },
    ],
  });

const postOrder = (body: unknown) =>
  createOrder(
    new Request("http://localhost:3000/api/paypal/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
const postCapture = (id: string) =>
  captureOrder(new Request(`http://localhost:3000/api/paypal/orders/${id}/capture`, { method: "POST" }), {
    params: Promise.resolve({ id }),
  });

/** Queues fetch responses in order and records each call. */
function mockFetch(...responses: (() => Response)[]) {
  const mock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => {
    const next = responses.shift();
    if (!next) throw new Error("Unexpected fetch");
    return next();
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

beforeEach(() => {
  vi.stubEnv("PAYPAL_CLIENT_ID", "TEST-ID");
  vi.stubEnv("PAYPAL_CLIENT_SECRET", "TEST-SECRET");
  vi.stubEnv("PAYPAL_BASE_URL", SANDBOX);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("correctedTotal", () => {
  it("subtracts the questionable dollars from the amount due", () => {
    expect(correctedTotal(bill, 25.5)).toBe(74.5);
  });

  it("floors at 0 when more is questionable than is owed", () => {
    expect(correctedTotal(bill, 300)).toBe(0);
  });

  it("returns null when the bill has no amount due", () => {
    expect(correctedTotal({ ...bill, patientOwes: 0 }, 0)).toBeNull();
    expect(correctedTotal({ ...bill, patientOwes: -5 }, 0)).toBeNull();
  });
});

describe("POST /api/paypal/orders", () => {
  const created = () =>
    json(
      {
        id: "ORDER1",
        status: "PAYER_ACTION_REQUIRED",
        links: [
          { rel: "self", href: `${SANDBOX}/v2/checkout/orders/ORDER1` },
          { rel: "payer-action", href: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER1" },
        ],
      },
      200,
    );

  it("creates an order for the amount it calculated, without bill details", async () => {
    const fetchMock = mockFetch(tokenResponse, created);
    const res = await postOrder({ bill, amount: 0.01 });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      orderId: "ORDER1",
      approvalUrl: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER1",
    });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(`${SANDBOX}/v2/checkout/orders`);
    const sent = init.body as string;
    const body = JSON.parse(sent);
    expect(body.intent).toBe("CAPTURE");
    expect(body.purchase_units[0].amount).toEqual({ currency_code: "USD", value: "100.00" });
    expect(body.payment_source.paypal.experience_context).toMatchObject({
      return_url: "http://localhost:3000/pay/return",
      cancel_url: "http://localhost:3000/pay/return?cancelled=1",
    });
    expect(body.application_context).toBeUndefined();
    expect(sent).not.toContain("ACCT-SECRET-1");
    expect(sent).not.toContain("Secret Clinic");
  });

  it("accepts the approve link rel too", async () => {
    mockFetch(tokenResponse, () =>
      json({ id: "ORDER1", links: [{ rel: "approve", href: "https://sandbox.example/approve" }] }),
    );
    expect(await (await postOrder({ bill })).json()).toMatchObject({
      approvalUrl: "https://sandbox.example/approve",
    });
  });

  it.each([
    ["the amount due is missing", { ...bill, patientOwes: 0 }],
    [
      "the corrected total is $0",
      {
        ...bill,
        patientOwes: 10,
        lineItems: [bill.lineItems[0], bill.lineItems[0]],
        totalBilled: 360,
        insurancePaid: 350,
      },
    ],
  ])("never contacts PayPal when %s", async (_name, unpayable) => {
    const fetchMock = mockFetch();
    const res = await postOrder({ bill: unpayable });
    expect(res.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid bill", async () => {
    const fetchMock = mockFetch();
    expect((await postOrder({ amount: 50 })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["https://api-m.paypal.com", "https://api-m.sandbox.paypal.com.evil.test", "not a url"])(
    "refuses to send credentials when PAYPAL_BASE_URL is %s",
    async (baseUrl) => {
      vi.stubEnv("PAYPAL_BASE_URL", baseUrl);
      const fetchMock = mockFetch();
      const res = await postOrder({ bill });
      expect(res.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("reports missing configuration without contacting PayPal", async () => {
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "");
    const fetchMock = mockFetch();
    expect((await postOrder({ bill })).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("doesn't leak credentials or PayPal's error text to the browser", async () => {
    mockFetch(() => json({ error: "invalid_client", error_description: "TEST-SECRET" }, 401));
    const res = await postOrder({ bill });
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("TEST-SECRET");
  });
});

describe("POST /api/paypal/orders/[id]/capture", () => {
  it("captures with a request ID tied to the order", async () => {
    const fetchMock = mockFetch(tokenResponse, capturedOrder);
    const res = await postCapture("ORDER1");

    expect(await res.json()).toEqual({
      result: { orderId: "ORDER1", status: "COMPLETED", captureId: "CAP1", amount: 100 },
    });
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(`${SANDBOX}/v2/checkout/orders/ORDER1/capture`);
    expect(init.headers).toMatchObject({
      "PayPal-Request-Id": "billbuster-capture-ORDER1",
      Prefer: "return=representation",
    });
  });

  it("sends the same request ID on a repeat, so a refresh can't capture twice", async () => {
    const fetchMock = mockFetch(tokenResponse, capturedOrder, tokenResponse, capturedOrder);
    await postCapture("ORDER1");
    await postCapture("ORDER1");
    const ids = [fetchMock.mock.calls[1], fetchMock.mock.calls[3]].map(
      ([, init]) => (init.headers as Record<string, string>)["PayPal-Request-Id"],
    );
    expect(ids[0]).toBe(ids[1]);
  });

  it("reads back the existing capture if the order was already captured", async () => {
    const fetchMock = mockFetch(
      tokenResponse,
      () => paypalError(422, "ORDER_ALREADY_CAPTURED"),
      capturedOrder,
    );
    const { result } = await (await postCapture("ORDER1")).json();
    expect(result).toMatchObject({ status: "COMPLETED", captureId: "CAP1" });
    expect(fetchMock.mock.calls[2][0]).toBe(`${SANDBOX}/v2/checkout/orders/ORDER1`);
    expect(fetchMock.mock.calls[2][1].method).toBeUndefined();
  });

  it("reports a 202 with no details as pending, not completed", async () => {
    mockFetch(tokenResponse, () => new Response(null, { status: 202 }));
    const { result } = await (await postCapture("ORDER1")).json();
    expect(result).toEqual({ orderId: "ORDER1", status: "PENDING", captureId: null, amount: null });
  });

  it("passes through a declined capture status", async () => {
    mockFetch(tokenResponse, () => capturedOrder("DECLINED"));
    expect((await (await postCapture("ORDER1")).json()).result.status).toBe("DECLINED");
  });

  it.each([
    ["INSTRUMENT_DECLINED", "declined"],
    ["ORDER_NOT_APPROVED", "approval"],
  ])("explains %s", async (issue, text) => {
    mockFetch(tokenResponse, () => paypalError(422, issue));
    const res = await postCapture("ORDER1");
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain(text);
  });

  it.each(["order1", "../../v1/oauth2/token", "A".repeat(37), ""])("rejects order ID %j", async (id) => {
    const fetchMock = mockFetch();
    expect((await postCapture(id)).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

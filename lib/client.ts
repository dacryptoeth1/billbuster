"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Bill, TestPaymentResult } from "@/lib/schema";

/** Browser-side API helpers. Each throws an Error with a user-friendly message. */

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readResponse<T>(res);
}

async function readResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

// Covers the server's retry: two model calls plus upload time.
const EXTRACT_TIMEOUT_MS = 60_000;

export async function extractBill(file: File, timeoutMs = EXTRACT_TIMEOUT_MS): Promise<Bill> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/extract", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(timeoutMs),
  }).catch((err: unknown) => {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    throw new Error(
      timedOut
        ? "Reading your bill took too long. Please try again, or try a sample bill."
        : "Couldn't reach the server. Check your connection and try again.",
    );
  });
  return (await readResponse<{ bill: Bill }>(res)).bill;
}

// One in-flight request per bill, so re-renders (and React Strict Mode's double
// effects in dev) don't spend extra Gemini quota.
const explainRequests = new Map<string, Promise<string[]>>();

export function explainItems(lineItems: Bill["lineItems"]): Promise<string[]> {
  const key = JSON.stringify(lineItems);
  let request = explainRequests.get(key);
  if (!request) {
    request = postJson<{ explanations: string[] }>("/api/explain", { lineItems }).then((r) => r.explanations);
    request.catch(() => explainRequests.delete(key)); // let a later visit retry after a failure
    explainRequests.set(key, request);
  }
  return request;
}

export async function draftLetter(bill: Bill, financialAssistance: boolean): Promise<string> {
  return (await postJson<{ letter: string }>("/api/letter", { bill, financialAssistance })).letter;
}

export async function getVoiceSession(): Promise<string> {
  const res = await fetch("/api/voice-session", { cache: "no-store" });
  return (await readResponse<{ signedUrl: string }>(res)).signedUrl;
}

// PayPal's docs don't promise an order ID on the return URL, so the tab remembers it.
const TEST_ORDER_KEY = "billbuster:test-order";

/** Creates a sandbox order, remembers it for the return page, and returns PayPal's approval URL. */
export async function startTestPayment(bill: Bill): Promise<string> {
  const { orderId, approvalUrl } = await postJson<{ orderId: string; approvalUrl: string }>(
    "/api/paypal/orders",
    { bill },
  );
  sessionStorage.setItem(TEST_ORDER_KEY, orderId);
  return approvalUrl;
}

// One in-flight capture per order, for the same reason as explainRequests above.
const captureRequests = new Map<string, Promise<TestPaymentResult>>();

export function captureTestPayment(orderId: string): Promise<TestPaymentResult> {
  let request = captureRequests.get(orderId);
  if (!request) {
    request = postJson<{ result: TestPaymentResult }>(
      `/api/paypal/orders/${encodeURIComponent(orderId)}/capture`,
      {},
    ).then((r) => r.result);
    captureRequests.set(orderId, request);
  }
  return request;
}

// The current bill lives only in this browser tab's sessionStorage.
const STORAGE_KEY = "billbuster:bill";

export function saveBill(bill: Bill) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bill));
}

const noopSubscribe = () => () => {};

/** The remembered sandbox order: `undefined` while rendering on the server, `null` if none. */
export function useTestOrderId(): string | null | undefined {
  return useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem(TEST_ORDER_KEY),
    () => undefined,
  );
}

/**
 * The saved bill: `undefined` while rendering on the server, `null` if none is saved.
 * Reads the raw string (a stable snapshot) and parses it once per change.
 */
export function useStoredBill(): Bill | null | undefined {
  const raw = useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem(STORAGE_KEY),
    () => undefined,
  );
  return useMemo(() => {
    if (raw === undefined) return undefined;
    try {
      return raw ? (JSON.parse(raw) as Bill) : null;
    } catch {
      return null;
    }
  }, [raw]);
}

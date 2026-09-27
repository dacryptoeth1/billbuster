"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Bill } from "@/lib/schema";

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

export async function extractBill(file: File): Promise<Bill> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/extract", { method: "POST", body: form });
  return (await readResponse<{ bill: Bill }>(res)).bill;
}

export async function explainItems(lineItems: Bill["lineItems"]): Promise<string[]> {
  return (await postJson<{ explanations: string[] }>("/api/explain", { lineItems })).explanations;
}

export async function draftLetter(bill: Bill, financialAssistance: boolean): Promise<string> {
  return (await postJson<{ letter: string }>("/api/letter", { bill, financialAssistance })).letter;
}

// The current bill lives only in this browser tab's sessionStorage.
const STORAGE_KEY = "billbuster:bill";

export function saveBill(bill: Bill) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bill));
}

const noopSubscribe = () => () => {};

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

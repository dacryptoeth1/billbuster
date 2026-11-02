"use client";

import { useState } from "react";
import { Alert } from "@/components/Alert";
import { startTestPayment } from "@/lib/client";
import { correctedTotal } from "@/lib/flags";
import { formatUsd } from "@/lib/money";
import type { Bill } from "@/lib/schema";

type Props = { bill: Bill; questionableTotal: number };

export function PayPanel({ bill, questionableTotal }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const total = correctedTotal(bill, questionableTotal);

  async function simulate() {
    setLoading(true);
    setError("");
    try {
      window.location.assign(await startTestPayment(bill));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the test payment.");
      setLoading(false);
    }
  }

  return (
    <section className="paper rounded-2xl p-6 sm:p-8">
      <h2 className="font-display text-2xl font-extrabold">Try the payment flow</h2>
      {!total ? (
        <p className="mt-1 text-ink-soft">
          {total === 0
            ? "Your estimated corrected total is $0, so there's nothing to simulate a payment for."
            : "We couldn't find an amount due on this bill, so there's nothing to simulate a payment for."}
        </p>
      ) : (
        <>
          <p className="mt-1 text-ink-soft">
            Estimated corrected total: <span className="font-semibold text-ink">{formatUsd(total)}</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            This is a simulation using PayPal&apos;s sandbox and test accounts. No real money moves, and your
            provider isn&apos;t paid.
          </p>
          <button
            type="button"
            onClick={simulate}
            disabled={loading}
            className="btn btn-secondary mt-4 w-full sm:w-auto"
          >
            {loading ? "Opening PayPal sandbox…" : "Simulate payment (sandbox)"}
          </button>
          {error && (
            <div className="mt-3">
              <Alert>{error}</Alert>
            </div>
          )}
        </>
      )}
    </section>
  );
}

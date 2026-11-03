"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Alert } from "@/components/Alert";
import { HeartbeatCheck } from "@/components/medical/HeartbeatCheck";
import { captureTestPayment, useTestOrderId } from "@/lib/client";
import { formatUsd } from "@/lib/money";
import type { TestPaymentResult } from "@/lib/schema";

export function PaymentReturnView({ cancelled }: { cancelled: boolean }) {
  const orderId = useTestOrderId();

  if (orderId === undefined) return null;
  if (cancelled) return <Message>You cancelled the test payment. Nothing was captured.</Message>;
  if (orderId === null) return <Message>There&apos;s no test payment in progress.</Message>;
  return <Capture orderId={orderId} />;
}

function Capture({ orderId }: { orderId: string }) {
  const [result, setResult] = useState<TestPaymentResult>();
  const [error, setError] = useState("");

  useEffect(() => {
    let stale = false;
    captureTestPayment(orderId).then(
      (captured) => !stale && setResult(captured),
      (err: unknown) =>
        !stale && setError(err instanceof Error ? err.message : "Couldn't complete the test payment."),
    );
    return () => {
      stale = true;
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl">
        <Alert>{error}</Alert>
        <BackLink />
      </div>
    );
  }
  if (!result) return <p className="text-center text-ink-soft">Finishing your test payment…</p>;
  return <TestReceipt result={result} />;
}

function TestReceipt({ result }: { result: TestPaymentResult }) {
  return (
    <div className="mx-auto max-w-xl">
      <section className="paper rounded-2xl p-6 sm:p-8">
        {result.status === "COMPLETED" && <HeartbeatCheck className="mb-3 block" />}
        <p className="text-sm font-semibold text-pen">Simulation: no real money moved</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">
          {result.status === "COMPLETED" ? "Test payment receipt" : "Test payment not completed"}
        </h1>
        <dl className="mt-4 space-y-1 font-mono text-sm">
          {result.amount !== null && <Row label="Test amount" value={formatUsd(result.amount)} />}
          <Row label="Sandbox status" value={result.status} />
          <Row label="Sandbox order" value={result.orderId} />
          {result.captureId && <Row label="Sandbox capture" value={result.captureId} />}
        </dl>
        <p className="mt-4 font-semibold">
          This is a test payment. It does not settle your bill with your provider, and you may still owe the
          amount on your bill.
        </p>
      </section>
      <BackLink />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right break-all tabular-nums">{value}</dd>
    </div>
  );
}

function Message({ children }: { children: ReactNode }) {
  return (
    <div className="text-center">
      <p className="text-ink-soft">{children}</p>
      <BackLink />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/results" className="mt-4 inline-block font-semibold underline underline-offset-4">
      ← Back to your results
    </Link>
  );
}

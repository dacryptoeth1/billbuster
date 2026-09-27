"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/Alert";
import { draftLetter } from "@/lib/client";
import type { Bill } from "@/lib/schema";

export function LetterPanel({ bill }: { bill: Bill }) {
  const [financialAssistance, setFinancialAssistance] = useState(false);
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      setLetter(await draftLetter(bill, financialAssistance));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't draft the letter.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([letter], { type: "text/plain" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: "dispute-letter.txt" });
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="paper rounded-2xl p-6 sm:p-8">
      <h2 className="font-display text-2xl font-extrabold">Now let&apos;s get it back</h2>
      <p className="mt-1 text-ink-soft">
        We&apos;ll draft a polite, firm letter to the billing office that cites each flagged item.
      </p>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={financialAssistance}
          onChange={(e) => setFinancialAssistance(e.target.checked)}
          className="size-4 accent-ink"
        />
        Also ask about financial assistance
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={generate} disabled={loading} className="btn btn-primary">
          {loading ? "Drafting…" : letter ? "Redraft letter" : "Draft dispute letter"}
        </button>
        <Link href="/practice" className="btn btn-secondary">
          Practice the call
        </Link>
      </div>

      {error && (
        <div className="mt-3">
          <Alert>{error}</Alert>
        </div>
      )}

      {letter && (
        <div className="mt-6">
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={18}
            aria-label="Dispute letter"
            className="w-full rounded-xl border border-rule bg-paper p-4 font-mono text-sm leading-relaxed focus:border-ink focus:outline-none"
          />
          <div className="mt-3 flex gap-3">
            <SecondaryButton onClick={copy}>{copied ? "Copied!" : "Copy"}</SecondaryButton>
            <SecondaryButton onClick={download}>Download .txt</SecondaryButton>
          </div>
        </div>
      )}
    </section>
  );
}

function SecondaryButton(props: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="btn btn-secondary flex-1 py-2 text-sm sm:flex-none"
    >
      {props.children}
    </button>
  );
}

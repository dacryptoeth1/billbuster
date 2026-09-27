"use client";

import { useState } from "react";
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
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Dispute these charges</h2>
      <p className="mt-1 text-sm text-slate-600">
        We&apos;ll draft a polite, firm letter to the billing office that cites each flagged item.
      </p>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={financialAssistance}
          onChange={(e) => setFinancialAssistance(e.target.checked)}
          className="size-4 accent-emerald-600"
        />
        Also ask about financial assistance
      </label>

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="mt-4 w-full rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {loading ? "Drafting…" : letter ? "Redraft letter" : "Draft dispute letter"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {letter && (
        <div className="mt-6">
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={18}
            aria-label="Dispute letter"
            className="w-full rounded-xl border border-slate-300 p-4 font-mono text-sm leading-relaxed focus:border-emerald-500 focus:outline-none"
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
      className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 sm:flex-none"
    >
      {props.children}
    </button>
  );
}

import type { BillSource } from "@/lib/client";

const LABELS: Record<BillSource, { text: string; className: string }> = {
  ai: { text: "Read by AI", className: "border-rule text-ink-soft" },
  "saved-sample": { text: "Using saved sample data", className: "border-highlight bg-[#fff6c7] text-ink" },
};

/** Says which path produced these results, so a sample's silent fallback is never mistaken for AI. */
export function BillSourceLabel({ source }: { source: BillSource }) {
  const { text, className } = LABELS[source];
  return <p className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{text}</p>;
}

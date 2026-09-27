import type { ReactNode } from "react";

/** A visible, announced message. "error" for failures, "notice" for recoverable hiccups. */
export function Alert({ tone = "error", children }: { tone?: "error" | "notice"; children: ReactNode }) {
  const styles =
    tone === "error" ? "border-pen/30 bg-pen-soft text-[#9b1c13]" : "border-highlight bg-[#fff6c7] text-ink";
  return (
    <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

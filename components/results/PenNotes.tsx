import type { CSSProperties } from "react";
import type { Flag } from "@/lib/schema";
import { formatUsd } from "@/lib/money";
import { SeverityBadge } from "./SeverityBadge";

/** Red-pen margin notes explaining why a line was marked; fade in after the pen passes. */
export function PenNotes({ flags, delay = 0 }: { flags: Flag[]; delay?: number }) {
  return (
    <ul className="pen-note mt-2 space-y-1.5" style={{ "--pen-delay": `${delay}ms` } as CSSProperties}>
      {flags.map((flag, i) => (
        <li key={i} className="flex flex-wrap items-start gap-2 text-sm text-[#9b1c13]">
          <SeverityBadge severity={flag.severity} />
          <span className="min-w-0 flex-1">{flag.reason}</span>
          {flag.estimatedOvercharge > 0 && (
            <span className="font-mono font-semibold tabular-nums">
              ~{formatUsd(flag.estimatedOvercharge)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

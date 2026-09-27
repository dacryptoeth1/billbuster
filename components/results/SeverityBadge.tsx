import type { Severity } from "@/lib/schema";

const STYLES: Record<Severity, string> = {
  high: "bg-pen text-white",
  medium: "bg-pen-soft text-[#9b1c13] ring-1 ring-pen/40",
  low: "bg-desk text-ink-soft ring-1 ring-rule",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STYLES[severity]}`}>
      {severity}
    </span>
  );
}

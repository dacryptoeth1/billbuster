import type { Severity } from "@/lib/schema";

const STYLES: Record<Severity, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STYLES[severity]}`}>
      {severity}
    </span>
  );
}

import type { Flag } from "@/lib/schema";
import { formatUsd } from "@/lib/money";
import { SeverityBadge } from "./SeverityBadge";

export function FlagReasons({ flags }: { flags: Flag[] }) {
  return (
    <ul className="space-y-2">
      {flags.map((flag, i) => (
        <li key={i} className="flex flex-wrap items-start gap-2 text-sm text-red-900">
          <SeverityBadge severity={flag.severity} />
          <span className="min-w-0 flex-1">{flag.reason}</span>
          {flag.estimatedOvercharge > 0 && (
            <span className="font-medium tabular-nums">~{formatUsd(flag.estimatedOvercharge)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

import type { Bill, Flag, Severity } from "@/lib/schema";
import { toCents } from "@/lib/money";
import { findDuplicates } from "./duplicates";
import { findQuantityAnomalies } from "./quantity";
import { findPriceOutliers } from "./pricing";
import { findMathErrors } from "./math";

export type Analysis = {
  flags: Flag[];
  /** Estimated questionable dollars, without double-counting a line flagged by several rules. */
  questionableTotal: number;
};

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** Runs every rule. Pure and deterministic: same bill in, same flags out. */
export function analyzeBill(bill: Bill): Analysis {
  const flags = [
    ...findDuplicates(bill),
    ...findQuantityAnomalies(bill),
    ...findPriceOutliers(bill),
    ...findMathErrors(bill),
  ].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  return { flags, questionableTotal: questionableTotal(bill, flags) };
}

function questionableTotal(bill: Bill, flags: Flag[]) {
  // Per line, count only the largest overcharge, capped at what the line actually costs.
  const perLine = new Map<number, number>();
  let billLevel = 0;

  for (const flag of flags) {
    if (flag.lineIndex === null) {
      billLevel += flag.estimatedOvercharge;
      continue;
    }
    const current = perLine.get(flag.lineIndex) ?? 0;
    const cap = bill.lineItems[flag.lineIndex]?.charge ?? 0;
    perLine.set(flag.lineIndex, Math.min(cap, Math.max(current, flag.estimatedOvercharge)));
  }

  const lineTotal = [...perLine.values()].reduce((a, b) => a + b, 0);
  return toCents(lineTotal + billLevel);
}

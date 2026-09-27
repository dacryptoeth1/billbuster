import type { Bill, Flag, Severity } from "@/lib/schema";
import { formatUsd, toCents } from "@/lib/money";
import { lookupPrice } from "./prices";

function severityFor(ratio: number): Severity {
  if (ratio >= 2) return "high";
  if (ratio >= 1.5) return "medium";
  return "low";
}

/**
 * Unit price above the high end of our estimated typical range.
 * Overcharge is measured against the high end, so it's a conservative estimate.
 */
export function findPriceOutliers(bill: Bill): Flag[] {
  const flags: Flag[] = [];

  bill.lineItems.forEach((item, i) => {
    const ref = lookupPrice(item.code);
    if (!ref || item.quantity <= 0) return;

    const unitPrice = item.charge / item.quantity;
    if (unitPrice <= ref.high) return;

    const ratio = unitPrice / ref.high;
    flags.push({
      type: "price",
      severity: severityFor(ratio),
      lineIndex: i,
      reason: `${formatUsd(unitPrice)} per unit is ${ratio.toFixed(1)}× the high end of the typical range (est. ${formatUsd(ref.low)}–${formatUsd(ref.high)}).`,
      estimatedOvercharge: toCents((unitPrice - ref.high) * item.quantity),
    });
  });

  return flags;
}

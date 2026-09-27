import type { Bill, Flag } from "@/lib/schema";
import { toCents } from "@/lib/money";
import { lookupPrice } from "./prices";

/** Quantity above what's normal for a single visit (e.g. 10 ER visits in one day). */
export function findQuantityAnomalies(bill: Bill): Flag[] {
  const flags: Flag[] = [];

  bill.lineItems.forEach((item, i) => {
    const ref = lookupPrice(item.code);
    if (!ref || item.quantity <= ref.maxUnits) return;

    const extraUnits = item.quantity - ref.maxUnits;
    flags.push({
      type: "quantity",
      severity: item.quantity >= ref.maxUnits * 3 ? "high" : "medium",
      lineIndex: i,
      reason: `Billed ${item.quantity} units of "${ref.description}", which is usually billed at most ${ref.maxUnits} per visit.`,
      estimatedOvercharge: toCents((item.charge / item.quantity) * extraUnits),
    });
  });

  return flags;
}

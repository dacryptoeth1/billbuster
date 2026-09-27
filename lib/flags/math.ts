import type { Bill, Flag } from "@/lib/schema";
import { formatUsd, toCents } from "@/lib/money";

const TOLERANCE = 0.01;

/** Bill-level arithmetic: line items vs. total, and total − insurance vs. amount owed. */
export function findMathErrors(bill: Bill): Flag[] {
  const flags: Flag[] = [];
  const lineSum = toCents(bill.lineItems.reduce((sum, item) => sum + item.charge, 0));
  const totalDiff = toCents(bill.totalBilled - lineSum);

  if (totalDiff > TOLERANCE) {
    flags.push({
      type: "math",
      severity: "high",
      lineIndex: null,
      reason: `Line items add up to ${formatUsd(lineSum)}, but the bill's total is ${formatUsd(bill.totalBilled)} — ${formatUsd(totalDiff)} more than the items listed.`,
      estimatedOvercharge: totalDiff,
    });
  } else if (totalDiff < -TOLERANCE) {
    flags.push({
      type: "math",
      severity: "low",
      lineIndex: null,
      reason: `Line items add up to ${formatUsd(lineSum)}, but the bill's total is ${formatUsd(bill.totalBilled)}. Ask the provider to explain the difference.`,
      estimatedOvercharge: 0,
    });
  }

  const expectedOwed = toCents(bill.totalBilled - bill.insurancePaid);
  const owedDiff = toCents(bill.patientOwes - expectedOwed);
  if (owedDiff > TOLERANCE) {
    flags.push({
      type: "math",
      severity: "high",
      lineIndex: null,
      reason: `Total (${formatUsd(bill.totalBilled)}) minus insurance (${formatUsd(bill.insurancePaid)}) is ${formatUsd(expectedOwed)}, but you're asked to pay ${formatUsd(bill.patientOwes)}.`,
      estimatedOvercharge: owedDiff,
    });
  }

  return flags;
}

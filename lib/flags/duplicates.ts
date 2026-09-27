import type { Bill, Flag } from "@/lib/schema";

/** Same code billed more than once on the same date: every repeat after the first is flagged. */
export function findDuplicates(bill: Bill): Flag[] {
  const seen = new Map<string, number>();
  const flags: Flag[] = [];

  bill.lineItems.forEach((item, i) => {
    const code = item.code.trim().toUpperCase();
    if (!code) return;
    const key = `${code}|${item.dateOfService || bill.dateOfService}`;
    const firstIndex = seen.get(key);

    if (firstIndex === undefined) {
      seen.set(key, i);
      return;
    }
    flags.push({
      type: "duplicate",
      severity: "high",
      lineIndex: i,
      reason: `Code ${code} is billed again on the same date (also on line ${firstIndex + 1}). This may be a duplicate charge.`,
      estimatedOvercharge: item.charge,
    });
  });

  return flags;
}

import type { Bill, Flag } from "@/lib/schema";
import type { Analysis } from "@/lib/flags";
import { lookupPrice } from "@/lib/flags/prices";
import { describeFlag } from "@/lib/letter";
import { formatUsd } from "@/lib/money";

export type TalkingPoint = {
  title: string;
  amount: number;
  /** A calm, specific sentence the user can say on the call. */
  say: string;
};

/** Deterministic talking points, one per flag, so they work even if the voice agent doesn't. */
export function buildTalkingPoints(bill: Bill, flags: Flag[]): TalkingPoint[] {
  return flags.map((flag) => ({
    title: titleFor(bill, flag),
    amount: flag.estimatedOvercharge,
    say: sentenceFor(bill, flag),
  }));
}

function titleFor(bill: Bill, flag: Flag) {
  const item = flag.lineIndex === null ? null : bill.lineItems[flag.lineIndex];
  const labels = {
    duplicate: "Duplicate charge",
    quantity: "Unusual quantity",
    price: "High price",
    math: "Math error",
  };
  return item ? `${labels[flag.type]}: ${item.description}` : labels[flag.type];
}

function sentenceFor(bill: Bill, flag: Flag): string {
  const item = flag.lineIndex === null ? null : bill.lineItems[flag.lineIndex];
  const line = flag.lineIndex === null ? 0 : flag.lineIndex + 1;

  if (item && flag.type === "duplicate") {
    return `Code ${item.code} is billed twice on the same day. I only received that service once, so please remove the duplicate ${formatUsd(item.charge)} charge on line ${line}.`;
  }
  if (item && flag.type === "quantity") {
    const max = lookupPrice(item.code)?.maxUnits ?? 1;
    const usual = max === 1 ? "once per visit" : `at most ${max} units per visit`;
    return `Line ${line} bills ${item.quantity} units of ${item.description}, which is normally billed ${usual}. Can you check the quantity and correct it?`;
  }
  if (item && flag.type === "price") {
    const ref = lookupPrice(item.code);
    const range = ref
      ? ` when the typical range is about ${formatUsd(ref.low)} to ${formatUsd(ref.high)}`
      : "";
    return `Line ${line} charges ${formatUsd(item.charge)} for ${item.description}${range}. Can you review that price or tell me how it was calculated?`;
  }

  // Math flags are bill-level; their reason already states both numbers.
  return `I checked the math on my bill. ${flag.reason} Can you correct that?`;
}

/**
 * Values injected into Pat's prompt. Keys must match the double-brace variables
 * in docs/pat-agent-prompt.md exactly.
 */
export function buildDynamicVariables(bill: Bill, { flags, questionableTotal }: Analysis) {
  return {
    provider_name: bill.provider || "the hospital",
    account_ref: bill.patientRef || "unknown",
    date_of_service: bill.dateOfService || "unknown",
    amount_owed: formatUsd(bill.patientOwes),
    questionable_total: formatUsd(questionableTotal),
    flagged_items: flags.map((f) => describeFlag(bill, f)).join("\n"),
  };
}

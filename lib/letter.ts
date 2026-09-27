import type { Bill, Flag } from "@/lib/schema";
import { formatUsd } from "@/lib/money";

export type LetterInput = {
  bill: Bill;
  flags: Flag[];
  questionableTotal: number;
  financialAssistance: boolean;
};

export function describeFlag(bill: Bill, flag: Flag) {
  const item = flag.lineIndex === null ? null : bill.lineItems[flag.lineIndex];
  const label = item
    ? `Line ${flag.lineIndex! + 1}: ${item.code} ${item.description} (${formatUsd(item.charge)})`
    : "Bill totals";
  return `- ${label} — ${flag.reason}`;
}

export function buildLetterPrompt({ bill, flags, questionableTotal, financialAssistance }: LetterInput) {
  return `Write a polite but firm billing dispute letter from a patient to a medical provider's billing office.

Facts (use exactly, do not invent others):
- Provider: ${bill.provider}
- Account/reference number: ${bill.patientRef || "[Account Number]"}
- Date of service: ${bill.dateOfService || "[Date of Service]"}
- Amount billed to patient: ${formatUsd(bill.patientOwes)}
- Estimated questionable charges: ${formatUsd(questionableTotal)}
- Items in question:
${flags.map((f) => describeFlag(bill, f)).join("\n")}

Requirements:
- Plain text only, no markdown. Under 350 words.
- Use placeholders [Your Name], [Your Address], [Phone], [Email], and [Date]. Never invent personal details.
- Request an itemized bill with CPT codes, a written explanation or correction of each item above, and that the account be placed on hold (not sent to collections) during the review.
- Ask for a written response within 30 days.
${financialAssistance ? "- Also request a financial assistance / charity care application and the provider's financial assistance policy." : ""}
- Close with "Sincerely," and [Your Name].`;
}

/** Deterministic letter used if the model is unavailable, so the demo never dead-ends. */
export function fallbackLetter({ bill, flags, questionableTotal, financialAssistance }: LetterInput) {
  const assistance = financialAssistance
    ? "\nI would also like to apply for financial assistance. Please send me your financial assistance policy and application.\n"
    : "";

  return `[Your Name]
[Your Address]
[Phone] | [Email]
[Date]

${bill.provider}
Billing Department

Re: Account ${bill.patientRef || "[Account Number]"}, date of service ${bill.dateOfService || "[Date of Service]"}

To whom it may concern,

I am writing to dispute charges on the bill referenced above. After reviewing it, I found the following items that appear to be incorrect, totaling an estimated ${formatUsd(questionableTotal)}:

${flags.map((f) => describeFlag(bill, f)).join("\n")}

Please send me a fully itemized bill with CPT codes, and correct or explain each item listed above in writing. I ask that this account be placed on hold and not referred to collections while this review is in progress.
${assistance}
Please respond in writing within 30 days. Thank you for your help resolving this.

Sincerely,
[Your Name]`;
}

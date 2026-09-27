import { z } from "zod";

// `charge` is the total for the line (unit price × quantity), as printed on most bills.
export const LineItemSchema = z.object({
  code: z.string().describe("CPT/HCPCS/revenue code exactly as printed, or empty string if none"),
  description: z.string(),
  quantity: z.number().describe("Units billed; use 1 if not shown"),
  charge: z.number().describe("Total dollar charge for this line (not unit price)"),
  dateOfService: z
    .string()
    .describe("YYYY-MM-DD for this line if shown, otherwise empty string"),
});

export const BillSchema = z.object({
  provider: z.string(),
  patientRef: z.string().describe("Account or reference number only, never a patient name"),
  dateOfService: z.string().describe("YYYY-MM-DD of the visit, or empty string"),
  lineItems: z.array(LineItemSchema),
  totalBilled: z.number().describe("Total charges as printed on the bill"),
  insurancePaid: z.number().describe("Insurance payments/adjustments; 0 if not shown"),
  patientOwes: z.number().describe("Amount due from patient as printed"),
});

export type LineItem = z.infer<typeof LineItemSchema>;
export type Bill = z.infer<typeof BillSchema>;

export const SeveritySchema = z.enum(["high", "medium", "low"]);
export type Severity = z.infer<typeof SeveritySchema>;

export type FlagType = "duplicate" | "quantity" | "price" | "math";

export type Flag = {
  type: FlagType;
  severity: Severity;
  /** Index into bill.lineItems; null for bill-level flags (e.g. math). */
  lineIndex: number | null;
  reason: string;
  estimatedOvercharge: number;
};

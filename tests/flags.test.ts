import { describe, expect, it } from "vitest";
import { analyzeBill } from "@/lib/flags";
import { getSample } from "@/lib/samples";
import type { Bill } from "@/lib/schema";

const cleanBill: Bill = {
  provider: "Test Clinic",
  patientRef: "T-1",
  dateOfService: "2026-01-01",
  lineItems: [
    { code: "99213", description: "Office visit", quantity: 1, charge: 180, dateOfService: "" },
    { code: "85025", description: "CBC", quantity: 1, charge: 40, dateOfService: "" },
  ],
  totalBilled: 220,
  insurancePaid: 120,
  patientOwes: 100,
};

function withItems(overrides: Partial<Bill>): Bill {
  return { ...cleanBill, ...overrides };
}

describe("analyzeBill", () => {
  it("returns no flags for a clean bill", () => {
    expect(analyzeBill(cleanBill)).toEqual({ flags: [], questionableTotal: 0 });
  });

  it("flags the repeat of a duplicate code on the same date", () => {
    const { flags, questionableTotal } = analyzeBill(getSample("er-visit")!.bill);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ type: "duplicate", severity: "high", lineIndex: 6 });
    expect(questionableTotal).toBe(295);
  });

  it("does not flag the same code on different dates", () => {
    const bill = withItems({
      lineItems: [
        { code: "99213", description: "Visit", quantity: 1, charge: 110, dateOfService: "2026-01-01" },
        { code: "99213", description: "Visit", quantity: 1, charge: 110, dateOfService: "2026-01-08" },
      ],
    });
    expect(analyzeBill(bill).flags).toEqual([]);
  });

  it("flags a price far above the typical range", () => {
    const { flags, questionableTotal } = analyzeBill(getSample("lab-work")!.bill);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ type: "price", severity: "high", lineIndex: 2 });
    expect(questionableTotal).toBe(265); // $385 vs $120 high end
  });

  it("flags a total that exceeds the sum of line items", () => {
    const { flags, questionableTotal } = analyzeBill(getSample("imaging")!.bill);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ type: "math", severity: "high", lineIndex: null });
    expect(questionableTotal).toBe(300);
  });

  it("flags patientOwes that doesn't match total minus insurance", () => {
    const { flags } = analyzeBill(withItems({ patientOwes: 150 }));
    expect(flags).toEqual([expect.objectContaining({ type: "math", estimatedOvercharge: 50 })]);
  });

  it("flags quantity anomalies and prorates the overcharge", () => {
    const bill = withItems({
      lineItems: [{ code: "99284", description: "ER visit", quantity: 10, charge: 12000, dateOfService: "" }],
      totalBilled: 12000,
      insurancePaid: 0,
      patientOwes: 12000,
    });
    const quantity = analyzeBill(bill).flags.find((f) => f.type === "quantity");
    expect(quantity).toMatchObject({ severity: "high", estimatedOvercharge: 10800 });
  });

  it("does not double-count a line flagged by several rules", () => {
    const bill = withItems({
      lineItems: [
        { code: "36415", description: "Draw", quantity: 1, charge: 30, dateOfService: "" },
        { code: "36415", description: "Draw", quantity: 5, charge: 500, dateOfService: "" },
      ],
      totalBilled: 530,
      insurancePaid: 0,
      patientOwes: 530,
    });
    const { flags, questionableTotal } = analyzeBill(bill);
    expect(flags.map((f) => f.type).sort()).toEqual(["duplicate", "price", "quantity"]);
    expect(questionableTotal).toBe(500); // capped at the line's own charge
  });

  it("orders flags by severity", () => {
    const bill = withItems({
      lineItems: [
        { code: "85025", description: "CBC", quantity: 1, charge: 90, dateOfService: "" }, // low
        { code: "80061", description: "Lipid", quantity: 1, charge: 400, dateOfService: "" }, // high
      ],
      totalBilled: 490,
      insurancePaid: 0,
      patientOwes: 490,
    });
    expect(analyzeBill(bill).flags.map((f) => f.severity)).toEqual(["high", "low"]);
  });
});

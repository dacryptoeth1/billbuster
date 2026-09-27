import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyzeBill } from "@/lib/flags";
import { buildDynamicVariables, buildTalkingPoints } from "@/lib/practice";
import { SAMPLE_BILLS, getSample } from "@/lib/samples";

describe("buildTalkingPoints", () => {
  it.each(SAMPLE_BILLS.map((s) => [s.id, s.bill] as const))("gives one point per flag for %s", (_, bill) => {
    const { flags } = analyzeBill(bill);
    const points = buildTalkingPoints(bill, flags);
    expect(points).toHaveLength(flags.length);
    points.forEach((p) => expect(p.say.length).toBeGreaterThan(20));
  });

  it("names the duplicated code and amount", () => {
    const bill = getSample("er-visit")!.bill;
    const [point] = buildTalkingPoints(bill, analyzeBill(bill).flags);
    expect(point.say).toContain("96374");
    expect(point.say).toContain("$295.00");
  });

  it("states both numbers for a math error", () => {
    const bill = getSample("imaging")!.bill;
    const [point] = buildTalkingPoints(bill, analyzeBill(bill).flags);
    expect(point.say).toContain("$3,075.00");
    expect(point.say).toContain("$3,375.00");
  });
});

describe("buildDynamicVariables", () => {
  it("provides every {{variable}} used in Pat's agent prompt", () => {
    const prompt = readFileSync("docs/pat-agent-prompt.md", "utf8");
    const used = new Set([...prompt.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
    const bill = getSample("lab-work")!.bill;
    const vars = buildDynamicVariables(bill, analyzeBill(bill));

    expect(used.size).toBeGreaterThan(0);
    for (const name of used) expect(vars).toHaveProperty(name);
    Object.values(vars).forEach((v) => expect(v).not.toBe(""));
  });
});

import table from "@/data/typical-prices.json";

export type TypicalPrice = {
  code: string;
  description: string;
  low: number;
  high: number;
  /** Units that would be unusual to exceed on a single date of service. */
  maxUnits: number;
};

const byCode = new Map<string, TypicalPrice>(table.prices.map((p) => [p.code, p]));

export function lookupPrice(code: string): TypicalPrice | undefined {
  return byCode.get(code.trim().toUpperCase());
}

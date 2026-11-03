import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BillSourceLabel } from "@/components/results/BillSourceLabel";
import { readBillSource, readSample, saveBill } from "@/lib/client";
import { getSample } from "@/lib/samples";
import type { Bill } from "@/lib/schema";

const sample = getSample("urgent-care")!;
const aiBill: Bill = { ...sample.bill, provider: "Read from the image" };

const imageOk = () => new Response(new Blob(["png"], { type: "image/png" }));

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BillSourceLabel", () => {
  it("says the results were read by AI", () => {
    const html = renderToStaticMarkup(createElement(BillSourceLabel, { source: "ai" }));
    expect(html).toContain("Read by AI");
    expect(html).not.toContain("saved sample data");
  });

  it("says the results use saved sample data", () => {
    const html = renderToStaticMarkup(createElement(BillSourceLabel, { source: "saved-sample" }));
    expect(html).toContain("Using saved sample data");
    expect(html).not.toContain("Read by AI");
  });
});

describe("readSample", () => {
  it("reports AI when extraction succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => imageOk()),
    );
    const extract = vi.fn<(file: File) => Promise<Bill>>(async () => aiBill);

    expect(await readSample(sample, extract)).toEqual({ bill: aiBill, source: "ai" });
    expect(extract.mock.calls[0][0].name).toBe("urgent-care.png");
  });

  it("reports saved data when extraction fails, as on a timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => imageOk()),
    );
    const timeout = new DOMException("Timed out", "TimeoutError");

    expect(await readSample(sample, () => Promise.reject(timeout))).toEqual({
      bill: sample.bill,
      source: "saved-sample",
    });
  });

  it("reports saved data when the sample image can't be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 404 })),
    );
    const extract = vi.fn(async () => aiBill);

    expect(await readSample(sample, extract)).toEqual({ bill: sample.bill, source: "saved-sample" });
    expect(extract).not.toHaveBeenCalled();
  });
});

describe("stored bill source", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
  });

  it("is saved with the bill and replaced by the next one", () => {
    saveBill(sample.bill, "saved-sample");
    expect(readBillSource()).toBe("saved-sample");
    saveBill(aiBill, "ai");
    expect(readBillSource()).toBe("ai");
  });

  it("is unknown for a bill saved before labels existed", () => {
    expect(readBillSource()).toBeNull();
  });
});

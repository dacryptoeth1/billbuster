import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@google/genai";
import { z } from "zod";

vi.mock("server-only", () => ({}));

const generateContent = vi.hoisted(() => vi.fn());
vi.mock("@google/genai", async (original) => ({
  ...(await original<typeof import("@google/genai")>()),
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

const { generateJson, generateText, GeminiBusyError } = await import("@/lib/gemini");
const { POST: extract } = await import("@/app/api/extract/route");

const MAIN = "gemini-3.8-flash";
const LIGHT = "gemini-3.1-flash-lite";
const Schema = z.object({ ok: z.boolean() });

const apiError = (status: number) => new ApiError({ status, message: "secret bill text" });
const good = () => ({ text: JSON.stringify({ ok: true }) });
const modelsCalled = () => generateContent.mock.calls.map(([request]) => request.model);

/** Runs the promise to completion while skipping through backoff pauses. */
async function settle<T>(promise: Promise<T>) {
  let done = false;
  const settled = promise
    .then(
      (value) => ({ value, error: undefined }),
      (error: unknown) => ({ value: undefined, error }),
    )
    .finally(() => (done = true));
  // Loops because parsing an upload takes real ticks before any pause is scheduled.
  while (!done) await vi.advanceTimersByTimeAsync(250);
  return settled;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  vi.stubEnv("GEMINI_API_KEY", "TEST-KEY");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  generateContent.mockReset();
});

describe("Gemini retries and fallback", () => {
  it("makes one call when the main model answers", async () => {
    generateContent.mockResolvedValueOnce(good());
    const { value } = await settle(generateJson(Schema, [{ text: "hi" }]));
    expect(value).toEqual({ ok: true });
    expect(modelsCalled()).toEqual([MAIN]);
  });

  it("retries the main model with growing pauses after a 503", async () => {
    generateContent
      .mockRejectedValueOnce(apiError(503))
      .mockRejectedValueOnce(apiError(503))
      .mockResolvedValueOnce(good());
    const started = Date.now();
    const { value } = await settle(generateJson(Schema, [{ text: "hi" }]));
    expect(value).toEqual({ ok: true });
    expect(modelsCalled()).toEqual([MAIN, MAIN, MAIN]);
    const waited = Date.now() - started;
    expect(waited).toBeGreaterThanOrEqual(3000); // at least 750ms + 2250ms with jitter
    expect(waited).toBeLessThanOrEqual(5000);
  });

  it("falls back to the lighter model once the main one stays overloaded", async () => {
    generateContent
      .mockRejectedValueOnce(apiError(503))
      .mockRejectedValueOnce(apiError(503))
      .mockRejectedValueOnce(apiError(503))
      .mockResolvedValueOnce(good());
    const { value } = await settle(generateJson(Schema, [{ text: "hi" }]));
    expect(value).toEqual({ ok: true });
    expect(modelsCalled()).toEqual([MAIN, MAIN, MAIN, LIGHT]);
  });

  it("goes straight to the lighter model when rate limited", async () => {
    generateContent.mockRejectedValueOnce(apiError(429)).mockResolvedValueOnce(good());
    await settle(generateJson(Schema, [{ text: "hi" }]));
    expect(modelsCalled()).toEqual([MAIN, LIGHT]);
  });

  it("goes straight to the lighter model when the main one hangs", async () => {
    generateContent.mockImplementationOnce(
      ({ config }) =>
        new Promise((_, reject) => {
          // Stands in for the abort, since AbortSignal.timeout ignores fake timers.
          setTimeout(() => {
            Object.defineProperty(config.abortSignal, "aborted", { value: true });
            reject(new Error("exception sending request"));
          }, 20_000);
        }),
    );
    generateContent.mockResolvedValueOnce(good());
    const { value } = await settle(generateJson(Schema, [{ text: "hi" }]));
    expect(value).toEqual({ ok: true });
    expect(modelsCalled()).toEqual([MAIN, LIGHT]);
  });

  it("spends leftover time retrying the lighter model when it is the last one left", async () => {
    generateContent
      .mockRejectedValueOnce(apiError(429))
      .mockRejectedValueOnce(apiError(429))
      .mockResolvedValueOnce(good());
    const { value } = await settle(generateJson(Schema, [{ text: "hi" }]));
    expect(value).toEqual({ ok: true });
    expect(modelsCalled()).toEqual([MAIN, LIGHT, LIGHT]);
  });

  it("gives every attempt an abort signal", async () => {
    generateContent.mockResolvedValueOnce({ text: "a letter" });
    await settle(generateText("hi"));
    expect(generateContent.mock.calls[0][0].config.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it("reports busy once both models stay overloaded, without trying forever", async () => {
    generateContent.mockRejectedValue(apiError(503));
    const started = Date.now();
    const { error } = await settle(generateJson(Schema, [{ text: "hi" }]));
    expect(error).toBeInstanceOf(GeminiBusyError);
    expect(modelsCalled()).toEqual([MAIN, MAIN, MAIN, LIGHT, LIGHT, LIGHT]);
    expect(Date.now() - started).toBeLessThan(15_000);
  });

  it("stays inside the deadline when every attempt is slow to fail", async () => {
    const started = Date.now();
    const attemptStarts: number[] = [];
    generateContent.mockImplementation(() => {
      attemptStarts.push(Date.now() - started);
      return new Promise((_, reject) => setTimeout(() => reject(apiError(503)), 15_000));
    });
    const { error } = await settle(generateJson(Schema, [{ text: "hi" }]));
    expect(error).toBeInstanceOf(GeminiBusyError);
    expect(modelsCalled()).toContain(LIGHT);
    // A real attempt's abort signal is capped to the time left, so none outlasts the deadline.
    expect(Math.max(...attemptStarts)).toBeLessThan(50_000);
  });

  it("doesn't retry a request Gemini rejects as wrong", async () => {
    generateContent.mockRejectedValue(apiError(403));
    const { error } = await settle(generateJson(Schema, [{ text: "hi" }]));
    expect((error as ApiError).status).toBe(403);
    expect(modelsCalled()).toEqual([MAIN]);
  });

  it("tries the lighter model once when the main one returns invalid output", async () => {
    generateContent.mockResolvedValueOnce({ text: "not json" }).mockResolvedValueOnce(good());
    const { value } = await settle(generateJson(Schema, [{ text: "hi" }]));
    expect(value).toEqual({ ok: true });
    expect(modelsCalled()).toEqual([MAIN, LIGHT]);
  });

  it("isn't busy when both models return invalid output", async () => {
    generateContent.mockResolvedValue({ text: "not json" });
    const { error } = await settle(generateJson(Schema, [{ text: "hi" }]));
    expect(error).toBeInstanceOf(SyntaxError);
  });

  it("never logs Gemini's error text", async () => {
    generateContent.mockRejectedValue(apiError(503));
    await settle(generateJson(Schema, [{ text: "hi" }]));
    const logged = vi.mocked(console.warn).mock.calls.flat().join(" ");
    expect(logged).toContain("HTTP 503");
    expect(logged).not.toContain("secret bill text");
  });
});

describe("POST /api/extract when Gemini fails", () => {
  const upload = () => {
    const form = new FormData();
    form.append("file", new File(["bill"], "bill.png", { type: "image/png" }));
    return extract(new Request("http://localhost:3000/api/extract", { method: "POST", body: form }));
  };

  it("asks the person to try again shortly when both models are busy", async () => {
    generateContent.mockRejectedValue(apiError(503));
    const { value: res } = await settle(upload());
    expect(res?.status).toBe(503);
    expect((await res?.json()).error).toContain("very busy");
  });

  it("keeps the unreadable-bill message for other failures", async () => {
    generateContent.mockResolvedValue({ text: "not json" });
    const { value: res } = await settle(upload());
    expect(res?.status).toBe(422);
    expect((await res?.json()).error).toContain("couldn't read that bill");
  });
});

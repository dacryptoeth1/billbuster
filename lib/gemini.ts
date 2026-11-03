import "server-only";
import { ApiError, GoogleGenAI, type Part } from "@google/genai";
import { z } from "zod";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
/** A lighter model with its own capacity and rate limit, for when the main one is overloaded. */
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";
const MODELS = [MODEL, FALLBACK_MODEL];

const MAX_ATTEMPTS_PER_MODEL = 3;
const BACKOFF_MS = [1_000, 3_000];
const ATTEMPT_TIMEOUT_MS = 20_000;
/** The main model stops retrying after this long, so the fallback still gets a fair turn. */
const MAIN_MODEL_BUDGET_MS = 20_000;
/** Answers before the browser's 60-second limit and the routes' `maxDuration`. */
const DEADLINE_MS = 50_000;

/** Every model was overloaded, rate limited, or too slow. Trying again later may work. */
export class GeminiBusyError extends Error {
  constructor() {
    super("Gemini is too busy to answer right now.");
    this.name = "GeminiBusyError";
  }
}

class EmptyResponseError extends Error {}

let client: GoogleGenAI | null = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local.");
  }
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

type NextStep =
  | "retry" // a brief overload or network failure: same model again after a pause
  | "switch-busy" // rate limited or too slow: waiting won't help, so go straight to the next model
  | "switch-invalid" // this model gave a bad answer or doesn't exist; another one might not
  | "stop"; // our request or credentials are wrong, which no retry can fix

function nextStepFor(err: unknown, timedOut: boolean): NextStep {
  if (timedOut || (err instanceof ApiError && err.status === 429)) return "switch-busy";
  if (err instanceof ApiError) {
    if (err.status >= 500) return "retry";
    return err.status === 404 ? "switch-invalid" : "stop";
  }
  if (err instanceof z.ZodError || err instanceof SyntaxError || err instanceof EmptyResponseError) {
    return "switch-invalid";
  }
  return "retry";
}

function failureLabel(err: unknown, timedOut: boolean) {
  if (timedOut) return "timed out";
  // Never log the error text: invalid-output errors can quote what was read from a patient's bill.
  return err instanceof ApiError ? `HTTP ${err.status}` : err instanceof Error ? err.name : "unknown error";
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms * (0.75 + Math.random() / 2)));

/** Tries the main model with backoff, then the fallback the same way, all within one deadline. */
async function withRetries<R>(call: (model: string, signal: AbortSignal) => Promise<R>): Promise<R> {
  const started = Date.now();
  const elapsed = () => Date.now() - started;
  let lastError: unknown;
  let lastWasBusy = false;

  for (const [modelIndex, model] of MODELS.entries()) {
    const isLastModel = modelIndex === MODELS.length - 1;
    const budget = isLastModel ? DEADLINE_MS : MAIN_MODEL_BUDGET_MS;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      const remaining = DEADLINE_MS - elapsed();
      if (remaining <= 0) throw new GeminiBusyError();

      const signal = AbortSignal.timeout(Math.min(ATTEMPT_TIMEOUT_MS, remaining));
      try {
        const result = await call(model, signal);
        if (modelIndex > 0 || attempt > 1) {
          console.info(`Gemini ${model} answered on attempt ${attempt} after ${elapsed()}ms.`);
        }
        return result;
      } catch (err) {
        const step = nextStepFor(err, signal.aborted);
        console.warn(
          `Gemini ${model} attempt ${attempt} failed (${failureLabel(err, signal.aborted)}) at ${elapsed()}ms.`,
        );
        if (step === "stop") throw err;
        lastError = err;
        lastWasBusy = step !== "switch-invalid";

        const delay = BACKOFF_MS[attempt - 1];
        // With no model left to switch to, the time remaining is better spent trying again.
        const wantsRetry = step === "retry" || (step === "switch-busy" && isLastModel);
        const canRetry = wantsRetry && delay !== undefined && elapsed() + delay < budget;
        if (!canRetry) break;
        await pause(delay);
      }
    }
  }
  throw lastWasBusy ? new GeminiBusyError() : lastError;
}

/** Ask Gemini for JSON matching `schema`, validated with zod; invalid output counts as a failure. */
export async function generateJson<T extends z.ZodType>(schema: T, parts: Part[]): Promise<z.infer<T>> {
  const gemini = getClient();
  return withRetries(async (model, abortSignal) => {
    const response = await gemini.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(schema),
        temperature: 0,
        abortSignal,
      },
    });
    return schema.parse(JSON.parse(response.text ?? ""));
  });
}

/** Ask Gemini for free-form text (used for the dispute letter). */
export async function generateText(prompt: string): Promise<string> {
  const gemini = getClient();
  return withRetries(async (model, abortSignal) => {
    const response = await gemini.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.4, abortSignal },
    });
    const text = response.text?.trim();
    if (!text) throw new EmptyResponseError("Gemini returned an empty response.");
    return text;
  });
}

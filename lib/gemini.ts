import "server-only";
import { GoogleGenAI, type Part } from "@google/genai";
import { z } from "zod";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
/**
 * Used for the retry. It has its own rate limit, so a busy or rate-limited
 * primary model (free tier: 5 requests/minute) doesn't take the demo down.
 */
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";
const MODELS = [MODEL, FALLBACK_MODEL];

let client: GoogleGenAI | null = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local.");
  }
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/** Runs `call` with the primary model, then once more with the fallback model. */
async function withFallback<R>(call: (model: string) => Promise<R>): Promise<R> {
  let lastError: unknown;
  for (const [i, model] of MODELS.entries()) {
    try {
      return await call(model);
    } catch (err) {
      lastError = err;
      console.warn(`Gemini attempt ${i + 1} (${model}) failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastError;
}

/** Ask Gemini for JSON matching `schema`, validated with zod; invalid output counts as a failure. */
export function generateJson<T extends z.ZodType>(schema: T, parts: Part[]): Promise<z.infer<T>> {
  return withFallback(async (model) => {
    const response = await getClient().models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(schema),
        temperature: 0,
      },
    });
    return schema.parse(JSON.parse(response.text ?? ""));
  });
}

/** Ask Gemini for free-form text (used for the dispute letter). */
export function generateText(prompt: string): Promise<string> {
  return withFallback(async (model) => {
    const response = await getClient().models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.4 },
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Gemini returned an empty response.");
    return text;
  });
}

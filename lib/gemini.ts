import "server-only";
import { GoogleGenAI, type Part } from "@google/genai";
import { z } from "zod";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

let client: GoogleGenAI | null = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local.");
  }
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/**
 * Ask Gemini for JSON matching `schema`. Validates with zod and retries once
 * on invalid output before giving up.
 */
export async function generateJson<T extends z.ZodType>(
  schema: T,
  parts: Part[],
  attempts = 2,
): Promise<z.infer<T>> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await getClient().models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts }],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(schema),
          temperature: 0,
        },
      });
      return schema.parse(JSON.parse(response.text ?? ""));
    } catch (err) {
      lastError = err;
      console.warn(`Gemini attempt ${i + 1} failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastError;
}

/** Ask Gemini for free-form text (used for the dispute letter). */
export async function generateText(prompt: string): Promise<string> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { temperature: 0.4 },
  });
  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

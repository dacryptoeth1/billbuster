import { z } from "zod";
import { generateJson } from "@/lib/gemini";
import { LineItemSchema, type LineItem } from "@/lib/schema";
import { errorResponse } from "@/lib/api";

const RequestSchema = z.object({ lineItems: z.array(LineItemSchema).min(1).max(100) });

const ResponseSchema = z.object({
  explanations: z.array(
    z.object({
      index: z.number().int(),
      explanation: z.string().describe("One sentence, 8th-grade reading level, no jargon"),
    }),
  ),
});

/**
 * Explanations depend only on the code and description (no patient data), so they're
 * safe to reuse across requests. Saves rate limit when the same charges come up again.
 */
const cache = new Map<string, string>();
const MAX_CACHE = 1000;
const keyFor = (item: LineItem) =>
  `${item.code.trim().toUpperCase()}|${item.description.trim().toLowerCase()}`;

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("Invalid line items.", 400);

  const { lineItems } = parsed.data;
  const missing = [
    ...new Map(lineItems.filter((i) => !cache.has(keyFor(i))).map((i) => [keyFor(i), i])).values(),
  ];

  if (missing.length > 0) {
    try {
      for (const [key, text] of await explain(missing)) {
        if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
        cache.set(key, text);
      }
    } catch {
      return errorResponse("Explanations are unavailable right now.", 502);
    }
  }

  return Response.json({ explanations: lineItems.map((item) => cache.get(keyFor(item)) ?? "") });
}

async function explain(items: LineItem[]): Promise<[string, string][]> {
  const list = items.map((item, i) => `${i}. [${item.code || "no code"}] ${item.description}`).join("\n");
  const prompt = `Explain each medical bill line item to a patient in ONE short sentence
at an 8th-grade reading level. Say what the service is and why someone might get it.
Avoid jargon. Do not comment on price or whether it's correct. Return one entry per index.

${list}`;

  const { explanations } = await generateJson(ResponseSchema, [{ text: prompt }]);
  return explanations
    .filter((e) => items[e.index] && e.explanation.trim())
    .map((e) => [keyFor(items[e.index]), e.explanation.trim()]);
}

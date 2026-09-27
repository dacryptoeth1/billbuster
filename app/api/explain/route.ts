import { z } from "zod";
import { generateJson } from "@/lib/gemini";
import { LineItemSchema } from "@/lib/schema";
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

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("Invalid line items.", 400);

  const { lineItems } = parsed.data;
  const list = lineItems.map((item, i) => `${i}. [${item.code || "no code"}] ${item.description}`).join("\n");

  const prompt = `Explain each medical bill line item to a patient in ONE short sentence
at an 8th-grade reading level. Say what the service is and why someone might get it.
Avoid jargon. Do not comment on price or whether it's correct. Return one entry per index.

${list}`;

  try {
    const { explanations } = await generateJson(ResponseSchema, [{ text: prompt }]);
    const byIndex = new Map(explanations.map((e) => [e.index, e.explanation]));
    return Response.json({ explanations: lineItems.map((_, i) => byIndex.get(i) ?? "") });
  } catch {
    return errorResponse("Explanations are unavailable right now.", 502);
  }
}

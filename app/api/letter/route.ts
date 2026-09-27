import { z } from "zod";
import { generateText } from "@/lib/gemini";
import { analyzeBill } from "@/lib/flags";
import { BillSchema } from "@/lib/schema";
import { buildLetterPrompt, fallbackLetter, type LetterInput } from "@/lib/letter";
import { errorResponse } from "@/lib/api";

const RequestSchema = z.object({
  bill: BillSchema,
  financialAssistance: z.boolean().default(false),
});

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("Invalid bill data.", 400);

  // Recompute flags on the server so the letter only cites what the rules actually found.
  const { bill, financialAssistance } = parsed.data;
  const input: LetterInput = { bill, financialAssistance, ...analyzeBill(bill) };
  if (input.flags.length === 0) return errorResponse("No flagged charges to dispute.", 400);

  try {
    return Response.json({ letter: await generateText(buildLetterPrompt(input)) });
  } catch (err) {
    console.warn("Letter generation failed, using template:", err instanceof Error ? err.message : err);
    return Response.json({ letter: fallbackLetter(input) });
  }
}

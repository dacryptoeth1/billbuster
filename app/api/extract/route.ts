import { generateJson } from "@/lib/gemini";
import { BillSchema } from "@/lib/schema";
import { errorResponse } from "@/lib/api";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic"];

const PROMPT = `You are reading a US medical bill or Explanation of Benefits (EOB).
Extract every billed line item exactly as printed. Rules:
- "charge" is the line's total dollar amount, not the unit price.
- Keep duplicate-looking lines as separate items; do not merge or deduplicate.
- Copy totals exactly as printed, even if they don't add up.
- For patientRef, use only an account/reference number. Never output a patient's name or address.
- Use empty strings for missing text and 0 for missing amounts.`;

// Files are processed in memory only and never written to disk.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return errorResponse("No file uploaded.", 400);
  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse("Please upload a PDF, PNG, JPG, or WEBP file.", 415);
  }
  if (file.size > MAX_BYTES) return errorResponse("File is larger than 10 MB.", 413);

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const bill = await generateJson(BillSchema, [
      { text: PROMPT },
      { inlineData: { mimeType: file.type, data } },
    ]);
    return Response.json({ bill });
  } catch {
    return errorResponse(
      "We couldn't read that bill. Try a clearer photo or PDF, or use a sample bill.",
      422,
    );
  }
}

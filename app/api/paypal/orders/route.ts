import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { analyzeBill, correctedTotal } from "@/lib/flags";
import { createTestOrder, PayPalNotConfiguredError } from "@/lib/paypal";
import { BillSchema } from "@/lib/schema";

const RequestSchema = z.object({ bill: BillSchema });

/** Creates a PayPal sandbox order. The amount is recalculated here, never taken from the browser. */
export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("Invalid bill.", 400);

  const { bill } = parsed.data;
  const amount = correctedTotal(bill, analyzeBill(bill).questionableTotal);
  if (!amount) return errorResponse("This bill has no corrected total to simulate a payment for.", 422);

  try {
    return Response.json(
      await createTestOrder({
        amount,
        returnUrl: new URL("/pay/return", request.url).href,
        cancelUrl: new URL("/pay/return?cancelled=1", request.url).href,
      }),
    );
  } catch (err) {
    if (err instanceof PayPalNotConfiguredError) {
      console.warn(err.message);
      return errorResponse("The PayPal sandbox isn't set up on this server.", 503);
    }
    return errorResponse("Couldn't start the test payment. Please try again.", 502);
  }
}

import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { captureTestOrder, PayPalApiError, PayPalNotConfiguredError } from "@/lib/paypal";

// The ID travels in the body because the Next dev server sends dynamic routes through a
// worker that can crash, returning a 500 before this handler runs.
const RequestSchema = z.object({ orderId: z.string().regex(/^[A-Z0-9]{1,36}$/) });

const NOT_CAPTURED = "Nothing was captured.";
const START_AGAIN = "Please start a new test payment.";

const ISSUE_MESSAGES: Record<string, string> = {
  INSTRUMENT_DECLINED: `The sandbox test account's payment method was declined. ${NOT_CAPTURED}`,
  INVALID_RESOURCE_ID: `PayPal can't find this test payment. ${NOT_CAPTURED} ${START_AGAIN}`,
  MAX_NUMBER_OF_PAYMENT_ATTEMPTS_EXCEEDED: `This test payment has had too many attempts. ${NOT_CAPTURED} ${START_AGAIN}`,
  ORDER_ALREADY_CAPTURED:
    "PayPal says this test payment was already captured, but its receipt couldn't be loaded. Refresh this page to try again.",
  ORDER_EXPIRED: `This test payment has expired. ${NOT_CAPTURED} ${START_AGAIN}`,
  ORDER_NOT_APPROVED: `PayPal hasn't recorded an approval for this test payment. ${NOT_CAPTURED}`,
  PAYER_ACTION_REQUIRED: `PayPal needs more from the test buyer. ${NOT_CAPTURED}`,
  TRANSACTION_REFUSED: `PayPal refused this test payment. ${NOT_CAPTURED} ${START_AGAIN}`,
};

/** Captures an approved PayPal sandbox order. */
export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("Invalid order.", 400);

  try {
    return Response.json({ result: await captureTestOrder(parsed.data.orderId) });
  } catch (err) {
    if (err instanceof PayPalNotConfiguredError) {
      console.warn(err.message);
      return errorResponse("The PayPal sandbox isn't set up on this server.", 503);
    }
    if (!(err instanceof PayPalApiError)) console.warn("PayPal capture failed:", err);
    const message = err instanceof PayPalApiError && err.issue ? ISSUE_MESSAGES[err.issue] : undefined;
    return errorResponse(
      message ?? "Couldn't complete the test payment. Refresh this page to try again.",
      502,
    );
  }
}

import { errorResponse } from "@/lib/api";
import { captureTestOrder, PayPalApiError, PayPalNotConfiguredError } from "@/lib/paypal";

const ORDER_ID = /^[A-Z0-9]{1,36}$/;

const ISSUE_MESSAGES: Record<string, string> = {
  INSTRUMENT_DECLINED: "The sandbox test account's payment method was declined. Nothing was captured.",
  ORDER_NOT_APPROVED: "PayPal hasn't recorded an approval for this test payment. Nothing was captured.",
  PAYER_ACTION_REQUIRED: "PayPal needs more from the test buyer. Nothing was captured.",
};

/** Captures an approved PayPal sandbox order. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ORDER_ID.test(id)) return errorResponse("Invalid order.", 400);

  try {
    return Response.json({ result: await captureTestOrder(id) });
  } catch (err) {
    if (err instanceof PayPalNotConfiguredError) {
      console.warn(err.message);
      return errorResponse("The PayPal sandbox isn't set up on this server.", 503);
    }
    const message = err instanceof PayPalApiError && err.issue ? ISSUE_MESSAGES[err.issue] : undefined;
    return errorResponse(message ?? "Couldn't complete the test payment.", 502);
  }
}

import { NextResponse } from "next/server";
import { verifyAndProcessStripeWebhook } from "@/lib/payments/webhookHandlers";

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  try {
    const result = await verifyAndProcessStripeWebhook(rawBody, signature);

    if (result?.order) {
      return NextResponse.json({
        success: true,
        duplicate: result.duplicate,
        orderId: result.order.id,
      });
    }

    if (result?.action) {
      return NextResponse.json({ success: true, action: result.action });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error.type === "StripeSignatureVerificationError") {
      console.error("Webhook signature verification failed:", error.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.error("Webhook handler failed:", error.message);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

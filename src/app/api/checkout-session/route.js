import { NextResponse } from "next/server";
import {
  createCheckoutSession,
  CheckoutSessionError,
} from "@/lib/payments/createCheckoutSession";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`checkout:${ip}`, { limit: 8, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait a moment." },
        { status: 429 }
      );
    }

    const { cartItems, billingDetails, shippingDetails } = await req.json();

    const result = await createCheckoutSession({
      cartItems,
      billingDetails,
      shippingDetails,
    });

    return NextResponse.json({ id: result.sessionId });
  } catch (error) {
    if (error instanceof CheckoutSessionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error creating checkout session:", error.message);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

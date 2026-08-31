export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { firestore } from "@/app/firebaseAdmin";
import { sanitizeOrderForCustomer } from "@/lib/orderUtils";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`verify-session:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const sessionId = new URL(request.url).searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          verified: false,
          paymentStatus: session.payment_status,
          message: "Payment has not been completed yet.",
        },
        { status: 402 }
      );
    }

    const snapshot = await firestore
      .collection("orders")
      .where("stripeSessionId", "==", sessionId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        {
          verified: true,
          paymentStatus: session.payment_status,
          pendingFulfillment: true,
          message:
            "Payment confirmed. Your order is being finalized — check your email shortly.",
        },
        { status: 202 }
      );
    }

    const doc = snapshot.docs[0];
    const order = { id: doc.id, ...doc.data() };

    return NextResponse.json({
      verified: true,
      paymentStatus: session.payment_status,
      order: sanitizeOrderForCustomer(order),
    });
  } catch (error) {
    console.error("Session verification failed:", error.message);
    return NextResponse.json({ error: "Unable to verify payment session." }, { status: 500 });
  }
}

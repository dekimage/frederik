import Stripe from "stripe";

import { NextResponse } from "next/server";
import { firestore } from "@/app/firebaseAdmin";

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle Stripe's raw request body
  },
};

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature"); // Get Stripe's signature from headers

  let event;

  try {
    // Verify that the event came from Stripe using the webhook secret
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.NEXT_STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the `checkout.session.completed` event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const billingDetails = JSON.parse(session.metadata.billingDetails);

      // Store the order in Firestore using the Firebase Admin SDK from the utility file
      await firestore.collection("orders").add({
        billingDetails,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total / 100, // Stripe sends amount in cents, convert to euros
        stripeSessionId: session.id,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error saving order to Firestore:", error);
      return NextResponse.json(
        { error: "Error saving order" },
        { status: 500 }
      );
    }
  }

  // Acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

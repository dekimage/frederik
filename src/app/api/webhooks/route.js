import Stripe from "stripe";

import { NextResponse } from "next/server";
import { firestore } from "@/app/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature"); // Get Stripe's signature from headers

  let event;

  try {
    // Verify that the event came from Stripe using the webhook secret
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the `checkout.session.completed` event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      // Retrieve the pending order from Firestore
      const orderRef = firestore
        .collection("pendingOrders")
        .doc(session.metadata.orderRef);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new Error("Pending order not found");
      }

      const orderData = orderDoc.data();

      // Create the final order
      await firestore.collection("orders").add({
        ...orderData,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total / 100,
        stripeSessionId: session.id,
        paidAt: new Date(),
      });

      // Optionally, delete the pending order
      await orderRef.delete();

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error processing order:", error);
      return NextResponse.json(
        { error: "Error processing order" },
        { status: 500 }
      );
    }
  }

  // Acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

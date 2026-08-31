import { NextResponse } from "next/server";
import { firestore } from "@/app/firebaseAdmin";
import {
  orderEmailMatches,
  sanitizeOrderForCustomer,
} from "@/lib/orderUtils";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`order-lookup:${ip}`, { limit: 15, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many lookup attempts." }, { status: 429 });
    }

    const { orderId, email } = await request.json();
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedOrderId = (orderId || "").trim();

    if (!normalizedOrderId || !normalizedEmail) {
      return NextResponse.json(
        { error: "Order ID and email are required." },
        { status: 400 }
      );
    }

    const doc = await firestore.collection("orders").doc(normalizedOrderId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "No order found for those details." },
        { status: 404 }
      );
    }

    const order = { id: doc.id, ...doc.data() };

    if (!orderEmailMatches(order, normalizedEmail)) {
      return NextResponse.json(
        { error: "No order found for those details." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: sanitizeOrderForCustomer(order),
    });
  } catch (error) {
    console.error("Order lookup failed:", error.message);
    return NextResponse.json({ error: "Unable to look up order." }, { status: 500 });
  }
}

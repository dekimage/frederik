// app/api/checkout-session/route.js

import { firestore } from "@/app/firebaseAdmin";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendEmails } from "./email";
import { getQuote, materialLabel } from "@/lib/pricingCatalog";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const {
      cartItems,
      taxRate = 0.1,
      billingDetails,
      shippingDetails,
    } = await req.json();

    console.log("Received data:", {
      cartItems,
      billingDetails,
      shippingDetails,
    });

    const validatedItems = [];
    let subtotal = 0;

    const shippingCountry = (shippingDetails?.country || "")
      .toString()
      .toUpperCase();
    if (!shippingCountry || shippingCountry.length !== 2) {
      return NextResponse.json(
        { error: "Shipping country is required (ISO alpha-2)." },
        { status: 400 }
      );
    }

    for (const cartItem of cartItems) {
      const { productId, quantity } = cartItem;
      const material = cartItem.material;
      const sizeKey = cartItem.sizeKey;

      if (!material || !sizeKey) {
        return NextResponse.json(
          {
            error:
              "Each cart line must include material and sizeKey from the print catalog.",
          },
          { status: 400 }
        );
      }

      const productRef = firestore.collection("products").doc(productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        console.error(`Product ${productId} does not exist`);
        return NextResponse.json(
          { error: `Product ${productId} does not exist.` },
          { status: 400 }
        );
      }

      const productData = productDoc.data();

      const row = getQuote(shippingCountry, material, sizeKey);
      if (!row || !row.available) {
        return NextResponse.json(
          {
            error: `Print option not available for ${shippingCountry}: ${materialLabel(
              material
            )} · ${sizeKey}`,
          },
          { status: 400 }
        );
      }

      const unit = Number(row.priceIncShipping);

      const itemTotal = unit * quantity;
      subtotal += itemTotal;

      validatedItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: productData.name,
            description: `${materialLabel(material)} · ${row.sizeRaw} · ship ${shippingCountry}`,
            images: productData.image ? [productData.image] : [],
          },
          unit_amount: Math.round(unit * 100),
        },
        quantity: quantity,
      });
    }

    console.log("Validated items:", validatedItems);

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Store order details in Firestore first
    const orderRef = await firestore.collection("pendingOrders").add({
      billingDetails,
      cartItems,
      shippingDetails,
      total,
      createdAt: new Date(),
    });

    console.log("Order stored in Firestore, ID:", orderRef.id);

    // Create Stripe session with automatic tax calculation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: validatedItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
      customer_email: billingDetails.email,
      metadata: {
        orderRef: orderRef.id,
      },
      automatic_tax: {
        enabled: true,
      },
      // tax_rates: [process.env.STRIPE_TAX_RATE_ID],
    });

    console.log("Stripe session created:", session.id);

    // Send emails after successful checkout session creation
    await sendEmails(
      orderRef.id,
      billingDetails,
      shippingDetails,
      cartItems,
      total
    );

    console.log("Emails sent successfully");

    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
}

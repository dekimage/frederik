// app/api/checkout-session/route.js

import { firestore } from "@/app/firebaseAdmin";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendEmails } from "./email";

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const {
      cartItems,
      shippingCost,
      taxRate,
      billingDetails,
      shippingDetails,
    } = await req.json();

    console.log("Received data:", {
      cartItems,
      shippingCost,
      taxRate,
      billingDetails,
      shippingDetails,
    });

    const validatedItems = [];
    let subtotal = 0;

    // Fetch the shop configuration
    const shopConfigRef = firestore
      .collection("shopConfig")
      .doc("productSpecifications");
    const shopConfigDoc = await shopConfigRef.get();
    const shopConfig = shopConfigDoc.exists ? shopConfigDoc.data() : null;

    if (!shopConfig) {
      console.error("Shop configuration not found");
      return NextResponse.json(
        { error: "Shop configuration not found." },
        { status: 400 }
      );
    }

    for (const cartItem of cartItems) {
      const { productId, quantity, size } = cartItem;

      // Fetch the product details
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

      // Find the size and corresponding price in shopConfig
      const sizeConfig = shopConfig.sizes.find((s) => s.size === size);
      if (!sizeConfig) {
        console.error(`Size ${size} not found for product ${productId}`);
        return NextResponse.json(
          { error: `Size ${size} not found for product ${productId}.` },
          { status: 400 }
        );
      }

      // Calculate total for the line item based on size price
      const itemTotal = parseFloat(sizeConfig.price) * quantity;
      subtotal += itemTotal;

      validatedItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: productData.name,
            images: [productData.image],
          },
          unit_amount: Math.round(parseFloat(sizeConfig.price) * 100),
        },
        quantity: quantity,
      });
    }

    console.log("Validated items:", validatedItems);

    const tax = subtotal * taxRate;
    const total = subtotal + shippingCost + tax;

    // Add shipping as a separate line item
    validatedItems.push({
      price_data: {
        currency: "eur",
        product_data: {
          name: "Shipping Fee",
          description: "Flat rate shipping",
        },
        unit_amount: Math.round(shippingCost * 100),
      },
      quantity: 1,
    });

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

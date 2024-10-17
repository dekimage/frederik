// app/api/checkout-session/route.js

import { firestore } from "@/app/firebaseAdmin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY);

export async function POST(req) {
  const { cartItems, shippingCost, taxRate, billingDetails, shippingDetails } =
    await req.json();

  console.log({
    cartItems,
    shippingCost,
    taxRate,
    billingDetails,
    shippingDetails,
  });

  try {
    const validatedItems = [];
    let subtotal = 0;

    // Fetch the shop configuration
    const shopConfigRef = firestore
      .collection("shopConfig")
      .doc("productSpecifications");
    const shopConfigDoc = await shopConfigRef.get();
    const shopConfig = shopConfigDoc.exists ? shopConfigDoc.data() : null;

    if (!shopConfig) {
      return NextResponse.json(
        { error: "Shop configuration not found." },
        { status: 400 }
      );
    }

    for (const cartItem of cartItems) {
      const { productId, quantity, size } = cartItem; // Get size from cartItem

      // Fetch the product details
      const productRef = firestore.collection("products").doc(productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return NextResponse.json(
          { error: `Product ${productId} does not exist.` },
          { status: 400 }
        );
      }

      const productData = productDoc.data();

      // Find the size and corresponding price in shopConfig
      const sizeConfig = shopConfig.sizes.find((s) => s.size === size);
      if (!sizeConfig) {
        return NextResponse.json(
          { error: `Size ${size} not found for product ${productId}.` },
          { status: 400 }
        );
      }

      // Calculate total for the line item based on size price
      const itemTotal = parseFloat(sizeConfig.price) * quantity; // Use the price from sizeConfig
      subtotal += itemTotal; // Accumulate subtotal

      validatedItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: productData.name,
            images: [productData.image],
          },
          unit_amount: Math.round(parseFloat(sizeConfig.price) * 100), // Each item's price in cents
        },
        quantity: quantity, // Use quantity specified in cart
      });
    }

    const tax = subtotal * taxRate;
    const total = subtotal + shippingCost + tax;

    // Store order details in Firestore first
    const orderRef = await firestore.collection("pendingOrders").add({
      billingDetails,
      cartItems,
      shippingDetails,
      createdAt: new Date(),
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: validatedItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
      customer_email: billingDetails.email,
      metadata: {
        orderRef: orderRef.id, // Pass only the reference ID
      },
    });

    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

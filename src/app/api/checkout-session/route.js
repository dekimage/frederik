// app/api/checkout-session/route.js

import { firestore } from "@/app/firebaseAdmin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY);

export async function POST(req) {
  const { cartItems, shippingCost, taxRate, billingDetails } = await req.json();

  console.log({ cartItems, shippingCost, taxRate, billingDetails });

  try {
    const validatedItems = [];
    let subtotal = 0;

    for (const cartItem of cartItems) {
      const productRef = firestore.collection("products").doc(cartItem.id);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return NextResponse.json(
          { error: `Product ${cartItem.id} does not exist.` },
          { status: 400 }
        );
      }

      const productData = productDoc.data();
      const itemTotal = productData.price * cartItem.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: productData.name,
            images: [productData.image],
          },
          unit_amount: Math.round(productData.price * 100), // Stripe needs amount in cents
        },
        quantity: cartItem.quantity,
      });
    }

    const tax = subtotal * taxRate;
    const total = subtotal + shippingCost + tax;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: validatedItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
      customer_email: billingDetails.email,
      metadata: {
        billingDetails: JSON.stringify(billingDetails),
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

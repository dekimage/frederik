import Stripe from "stripe";
import { firestore } from "@/app/firebaseAdmin";
import {
  getQuote,
  materialLabel,
  isSupportedShippingCountry,
} from "@/lib/pricingCatalog";
import {
  normalizeAddressFormValues,
  ORDER_STATUS,
  toStripeAddress,
} from "@/lib/orderUtils";
import {
  getStripeCheckoutLocale,
  getStripePaymentMethodTypes,
} from "@/lib/stripePaymentMethods";
import {
  clampLineQuantity,
  validateOrderQuantities,
} from "@/lib/cartLimits";

const PENDING_ORDER_TTL_MS = 24 * 60 * 60 * 1000;

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

/**
 * Creates a Firestore pending order and Stripe Checkout Session.
 * Used by the checkout API route and payment integration tests.
 */
export async function createCheckoutSession({
  cartItems,
  billingDetails,
  shippingDetails,
  testRunId = null,
}) {
  const stripe = getStripeClient();

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new CheckoutSessionError("Cart is empty.", 400);
  }

  const quantityCheck = validateOrderQuantities(cartItems);
  if (!quantityCheck.ok) {
    throw new CheckoutSessionError(quantityCheck.error, 400);
  }

  const normalizedShipping = normalizeAddressFormValues(shippingDetails);
  const normalizedBilling = normalizeAddressFormValues(
    billingDetails?.email || billingDetails?.firstName
      ? billingDetails
      : shippingDetails
  );

  const shippingCountry = normalizedShipping.country;
  if (!shippingCountry || shippingCountry.length !== 2) {
    throw new CheckoutSessionError(
      "Shipping country is required (ISO alpha-2).",
      400
    );
  }

  if (!isSupportedShippingCountry(shippingCountry)) {
    throw new CheckoutSessionError(
      "We only ship to countries on our official price list.",
      400
    );
  }

  if (!normalizedShipping.email) {
    throw new CheckoutSessionError("Shipping email is required.", 400);
  }

  if (!normalizedShipping.postalCode) {
    throw new CheckoutSessionError(
      "Postal / ZIP code is required for shipping.",
      400
    );
  }

  const validatedLineItems = [];
  const stripeLineItems = [];
  let subtotal = 0;

  for (const cartItem of cartItems) {
    const { productId, quantity } = cartItem;
    const material = cartItem.material;
    const sizeKey = cartItem.sizeKey;

    if (!material || !sizeKey) {
      throw new CheckoutSessionError(
        "Each cart line must include material and sizeKey.",
        400
      );
    }

    const productRef = firestore.collection("products").doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      throw new CheckoutSessionError(`Product ${productId} does not exist.`, 400);
    }

    const productData = productDoc.data();
    const row = getQuote(shippingCountry, material, sizeKey);

    if (!row || !row.available) {
      throw new CheckoutSessionError(
        `Print option not available for ${shippingCountry}: ${materialLabel(
          material
        )} · ${sizeKey}`,
        400
      );
    }

    const qty = clampLineQuantity(quantity);
    const unit = Number(row.priceIncShipping);
    const lineTotal = unit * qty;
    subtotal += lineTotal;

    validatedLineItems.push({
      productId,
      name: productData.name,
      image: productData.image || null,
      material,
      sizeKey,
      sizeRaw: row.sizeRaw,
      quantity: qty,
      unitPriceIncShipping: unit,
      lineTotalIncShipping: lineTotal,
      priceExShipping: Number(row.priceExShipping),
      shippingCost: Number(row.shippingCost),
    });

    stripeLineItems.push({
      price_data: {
        currency: "eur",
        product_data: {
          name: productData.name,
          description: `${materialLabel(material)} · ${row.sizeRaw} · ship ${shippingCountry}`,
          images: productData.image ? [productData.image] : [],
        },
        unit_amount: Math.round(unit * 100),
      },
      quantity: qty,
    });
  }

  const now = new Date();
  const pendingPayload = {
    billingDetails: normalizedBilling,
    shippingDetails: normalizedShipping,
    cartItems,
    validatedLineItems,
    subtotal,
    currency: "eur",
    paymentStatus: "pending",
    orderStatus: ORDER_STATUS.PENDING_PAYMENT,
    customerEmail: normalizedShipping.email,
    createdAt: now,
    expiresAt: new Date(now.getTime() + PENDING_ORDER_TTL_MS),
  };

  if (testRunId) {
    pendingPayload.testRunId = testRunId;
  }

  const orderRef = await firestore.collection("pendingOrders").add(pendingPayload);

  const customer = await stripe.customers.create({
    email: normalizedBilling.email || normalizedShipping.email,
    name: normalizedShipping.name || normalizedBilling.name,
    address: toStripeAddress(normalizedBilling),
    shipping: {
      name: normalizedShipping.name,
      address: toStripeAddress(normalizedShipping),
    },
    metadata: testRunId ? { testRunId } : undefined,
  });

  const paymentMethodTypes = getStripePaymentMethodTypes(shippingCountry);
  const checkoutLocale = getStripeCheckoutLocale(shippingCountry);

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: paymentMethodTypes,
    locale: checkoutLocale,
    line_items: stripeLineItems,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart?cancelled=1`,
    metadata: {
      orderRef: orderRef.id,
      ...(testRunId ? { testRunId } : {}),
    },
    automatic_tax: {
      enabled: true,
    },
  });

  await orderRef.update({
    stripeSessionId: session.id,
    stripeCustomerId: customer.id,
    stripePaymentIntentId: session.payment_intent || null,
    paymentMethodTypes,
    updatedAt: new Date(),
  });

  return {
    sessionId: session.id,
    pendingOrderId: orderRef.id,
    stripeCustomerId: customer.id,
    paymentMethodTypes,
    shippingCountry,
    session,
  };
}

export class CheckoutSessionError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "CheckoutSessionError";
    this.status = status;
  }
}

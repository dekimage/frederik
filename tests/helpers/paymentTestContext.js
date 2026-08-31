import Stripe from "stripe";
import { firestore } from "@/app/firebaseAdmin";
import {
  getQuote,
  listMaterials,
  listSizesForMaterial,
} from "@/lib/pricingCatalog";
import { logResult, logSection, logStep, logWarning } from "./paymentTestLogger.js";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createTestRunId(label = "run") {
  return `vitest-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTestAddress(country = "NL", testRunId = createTestRunId()) {
  return {
    firstName: "Payment",
    lastName: "Test",
    country,
    streetAddress1: "Damrak 1",
    streetAddress2: "",
    city: country === "NL" ? "Amsterdam" : "Berlin",
    state: "",
    postalCode: country === "NL" ? "1012 LG" : "10115",
    email: `payment-tests+${testRunId}@example.com`,
  };
}

export async function resolveTestCartLine(country = "NL") {
  const configuredId = process.env.PAYMENT_TEST_PRODUCT_ID;
  let productDoc = null;

  if (configuredId) {
    const doc = await firestore.collection("products").doc(configuredId).get();
    if (doc.exists) productDoc = doc;
  }

  if (!productDoc) {
    const snap = await firestore.collection("products").limit(1).get();
    productDoc = snap.docs[0];
  }

  if (!productDoc?.exists) {
    throw new Error(
      "No Firestore product found. Seed products or set PAYMENT_TEST_PRODUCT_ID."
    );
  }

  for (const material of listMaterials()) {
    for (const size of listSizesForMaterial(material)) {
      const row = getQuote(country, material, size.sizeKey);
      if (row?.available) {
        return {
          productId: productDoc.id,
          quantity: 1,
          material,
          sizeKey: size.sizeKey,
        };
      }
    }
  }

  throw new Error(`No shippable catalog line found for country ${country}.`);
}

export async function getPendingOrder(pendingOrderId) {
  const doc = await firestore.collection("pendingOrders").doc(pendingOrderId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function getOrderBySessionId(sessionId) {
  const snap = await firestore
    .collection("orders")
    .where("stripeSessionId", "==", sessionId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function waitForOrderBySessionId(sessionId, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const order = await getOrderBySessionId(sessionId);
    if (order) return order;
    await sleep(500);
  }
  throw new Error(`Timed out waiting for order with session ${sessionId}`);
}

export function getStripeTestClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function simulateSuccessfulCheckoutPayment(sessionId) {
  const stripe = getStripeTestClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session.metadata?.orderRef) {
    throw new Error("Checkout session missing orderRef metadata.");
  }

  const amount = session.amount_total;
  if (!amount || amount <= 0) {
    throw new Error(
      `Checkout session ${sessionId} has no amount_total — check Stripe Tax / line items.`
    );
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: session.currency || "eur",
    customer: session.customer,
    payment_method: "pm_card_visa",
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: {
      checkout_session_id: sessionId,
      orderRef: session.metadata.orderRef,
    },
  });

  await firestore
    .collection("pendingOrders")
    .doc(session.metadata.orderRef)
    .update({
      stripePaymentIntentId: paymentIntent.id,
      updatedAt: new Date(),
    });

  const completedSession = {
    ...session,
    object: "checkout.session",
    payment_status: "paid",
    status: "complete",
    payment_intent: paymentIntent.id,
    amount_subtotal: session.amount_subtotal ?? paymentIntent.amount,
    amount_total: session.amount_total ?? paymentIntent.amount,
    total_details: session.total_details ?? { amount_tax: 0 },
    currency: session.currency || "eur",
  };

  return { completedSession, paymentIntentId: paymentIntent.id, paymentIntent };
}

export async function simulateDeclinedCheckoutPayment(sessionId) {
  const stripe = getStripeTestClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const amount = session.amount_total || 2000;

  try {
    await stripe.paymentIntents.create({
      amount,
      currency: session.currency || "eur",
      customer: session.customer,
      payment_method: "pm_card_chargeDeclined",
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });
    return { declined: false };
  } catch (error) {
    return { declined: true, error };
  }
}

export async function createFailedPaymentIntentForPending(sessionId) {
  const stripe = getStripeTestClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const amount = session.amount_total || 2000;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: session.currency || "eur",
    customer: session.customer,
    payment_method: "pm_card_visa",
    metadata: { checkout_session_id: sessionId },
  });

  if (session.metadata?.orderRef) {
    await firestore
      .collection("pendingOrders")
      .doc(session.metadata.orderRef)
      .update({
        stripePaymentIntentId: paymentIntent.id,
        updatedAt: new Date(),
      });
  }

  return paymentIntent.id;
}

/** @deprecated Checkout Sessions often lack payment_intent until UI load — use simulateSuccessfulCheckoutPayment */
export async function payCheckoutSessionWithTestPaymentMethod(
  sessionId,
  paymentMethod = "pm_card_visa"
) {
  if (paymentMethod === "pm_card_chargeDeclined") {
    return { ...(await simulateDeclinedCheckoutPayment(sessionId)), session: null, paymentIntentId: null };
  }

  const result = await simulateSuccessfulCheckoutPayment(sessionId);
  return {
    session: result.completedSession,
    paymentIntentId: result.paymentIntentId,
    declined: false,
  };
}

export async function cleanupTestArtifacts({ testRunId, stripeCustomerId, sessionIds = [] }) {
  const stripe = getStripeTestClient();
  const summary = {
    testRunId,
    stripeCustomerDeleted: false,
    sessionsProcessed: 0,
    refundsIssued: 0,
    pendingOrdersDeleted: 0,
    ordersDeleted: 0,
    errors: [],
  };

  logSection(`CLEANUP after test (testRunId=${testRunId})`);

  if (stripeCustomerId) {
    try {
      await stripe.customers.del(stripeCustomerId);
      summary.stripeCustomerDeleted = true;
      logStep("Stripe customer deleted", { stripeCustomerId });
    } catch (error) {
      summary.errors.push(`customer: ${error.message}`);
      logWarning(`Could not delete Stripe customer ${stripeCustomerId}: ${error.message}`);
    }
  }

  for (const sessionId of sessionIds) {
    summary.sessionsProcessed += 1;
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      logStep("Stripe checkout session inspected for refund", {
        sessionId,
        payment_status: session.payment_status,
        status: session.status,
      });

      if (session.payment_intent) {
        const piId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent.id;
        const pi = await stripe.paymentIntents.retrieve(piId);
        if (pi.latest_charge) {
          const chargeId =
            typeof pi.latest_charge === "string"
              ? pi.latest_charge
              : pi.latest_charge.id;
          const charge = await stripe.charges.retrieve(chargeId);
          if (charge.refunded) {
            logStep("Charge already refunded", { chargeId });
          } else if (charge.status === "succeeded") {
            await stripe.refunds.create({ charge: chargeId });
            summary.refundsIssued += 1;
            logStep("Refund issued for test charge", { chargeId, paymentIntentId: piId });
          }
        }
      }
    } catch (error) {
      summary.errors.push(`session ${sessionId}: ${error.message}`);
      logWarning(`Session cleanup issue for ${sessionId}: ${error.message}`);
    }
  }

  const pendingSnap = await firestore
    .collection("pendingOrders")
    .where("testRunId", "==", testRunId)
    .get();
  for (const doc of pendingSnap.docs) {
    await doc.ref.delete();
    summary.pendingOrdersDeleted += 1;
    logStep("Firestore pendingOrders doc deleted", { id: doc.id });
  }

  const ordersSnap = await firestore
    .collection("orders")
    .where("testRunId", "==", testRunId)
    .get();
  for (const doc of ordersSnap.docs) {
    await doc.ref.delete();
    summary.ordersDeleted += 1;
    logStep("Firestore orders doc deleted", { id: doc.id });
  }

  if (summary.pendingOrdersDeleted === 0 && summary.ordersDeleted === 0) {
    logStep("No Firestore docs left with this testRunId (already moved/deleted by test logic)");
  }

  logResult("cleanup summary", summary);
  return summary;
}

export function buildStripeEvent(type, object) {
  return {
    id: `evt_test_${Date.now()}`,
    object: "event",
    type,
    data: { object },
  };
}

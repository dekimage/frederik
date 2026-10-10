import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { sendOrderPaidEmails } from "@/app/api/checkout-session/email";

import { createCheckoutSession } from "@/lib/payments/createCheckoutSession";

import { processStripeWebhookEvent } from "@/lib/payments/webhookHandlers";

import { ORDER_STATUS } from "@/lib/orderUtils";

import { getStripePaymentMethodTypes } from "@/lib/stripePaymentMethods";

import {

  buildStripeEvent,

  buildTestAddress,

  cleanupTestArtifacts,

  createTestRunId,

  getOrderBySessionId,

  getPendingOrder,

  getStripeTestClient,

  createFailedPaymentIntentForPending,

  simulateDeclinedCheckoutPayment,

  simulateSuccessfulCheckoutPayment,

  resolveTestCartLine,

  sleep,

} from "../helpers/paymentTestContext.js";

import {

  logResult,

  logSection,

  logStep,

  logTestEnd,

  logTestStart,

  logWarning,

} from "../helpers/paymentTestLogger.js";



const hasRequiredEnv =

  process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") &&

  process.env.STRIPE_WEBHOOK_SECRET &&

  process.env.FIREBASE_PROJECT_ID;



const describeIfReady = hasRequiredEnv ? describe : describe.skip;



describeIfReady("Payment integration (Stripe test mode + Firestore)", () => {

  const artifacts = [];



  afterEach(async () => {

    while (artifacts.length > 0) {

      const item = artifacts.pop();

      await cleanupTestArtifacts(item);

    }

  });



  beforeAll(() => {

    if (!hasRequiredEnv) {

      console.warn(

        "Skipping payment integration tests — set sk_test_ Stripe keys and Firebase env vars."

      );

      return;

    }



    logSection("Payment integration suite — environment");

    logStep("Uses real Stripe test API (sk_test_*) and real Firestore");

    logStep("Each test gets a unique testRunId; afterEach cleans Stripe + Firestore artifacts");

    logStep("Card payments are simulated via pm_card_visa — no browser redirect");

    logWarning(

      "iDEAL is only checked as a payment_method_types config for NL — no iDEAL bank redirect is completed in these tests"

    );

    logWarning(

      "Enabling iDEAL in Stripe Dashboard is still required for real customers to see it at checkout"

    );

    logStep("Set PAYMENT_TEST_QUIET=1 to suppress detailed logs");

  });



  function trackArtifact(meta) {

    artifacts.push(meta);

    return meta;

  }



  async function startCheckout({

    country = "NL",

    testRunId = createTestRunId("checkout"),

  } = {}) {

    const address = buildTestAddress(country, testRunId);

    const cartItems = [await resolveTestCartLine(country)];



    logStep("Creating checkout (pendingOrders + Stripe Customer + Checkout Session)", {

      testRunId,

      country,

      email: address.email,

      cartItems,

    });



    const checkout = await createCheckoutSession({

      cartItems,

      billingDetails: address,

      shippingDetails: address,

      testRunId,

    });



    trackArtifact({

      testRunId,

      stripeCustomerId: checkout.stripeCustomerId,

      sessionIds: [checkout.sessionId],

    });



    logStep("Checkout created", {

      pendingOrderId: checkout.pendingOrderId,

      sessionId: checkout.sessionId,

      stripeCustomerId: checkout.stripeCustomerId,

      paymentMethodTypes: checkout.paymentMethodTypes,

      shippingCountry: checkout.shippingCountry,

      amountTotalCents: checkout.session?.amount_total,

    });



    return { ...checkout, testRunId, address, cartItems };

  }



  it("creates checkout session with NL iDEAL + card payment methods", async () => {

    logTestStart("creates checkout session with NL iDEAL + card payment methods", {

      scenario:

        "NL shipping address → createCheckoutSession → Stripe session should request card + ideal",

      asserts: [

        "paymentMethodTypes includes ideal and card",

        "pendingOrders doc exists with PENDING_PAYMENT",

        "stripeSessionId starts with cs_test_",

        "automatic_tax is off and amount_tax is 0 (Path KOR)",

      ],

      notTested: [

        "iDEAL bank redirect payment flow",

        "iDEAL visible on Stripe hosted checkout UI (Dashboard enablement)",

        "completing payment with iDEAL",

      ],

    });



    const { paymentMethodTypes, shippingCountry, pendingOrderId, session } =

      await startCheckout({ country: "NL" });



    logStep("Stripe session payment_method_types returned", paymentMethodTypes);



    expect(shippingCountry).toBe("NL");

    expect(paymentMethodTypes).toEqual(getStripePaymentMethodTypes("NL"));

    expect(paymentMethodTypes).toContain("ideal");

    expect(paymentMethodTypes).toContain("card");

    expect(session?.automatic_tax?.enabled).toBe(false);

    expect(session?.total_details?.amount_tax ?? 0).toBe(0);



    const pending = await getPendingOrder(pendingOrderId);

    logStep("Firestore pendingOrders snapshot", {

      id: pendingOrderId,

      orderStatus: pending?.orderStatus,

      paymentStatus: pending?.paymentStatus,

      stripeSessionId: pending?.stripeSessionId,

      testRunId: pending?.testRunId,

    });



    expect(pending).toBeTruthy();

    expect(pending.orderStatus).toBe(ORDER_STATUS.PENDING_PAYMENT);

    expect(pending.stripeSessionId).toMatch(/^cs_test_/);



    logTestEnd("creates checkout session with NL iDEAL + card payment methods");

  });



  it("creates checkout session with card-only for non-NL shipping", async () => {

    logTestStart("creates checkout session with card-only for non-NL shipping", {

      scenario: "DE shipping address → payment methods should be card only",

      asserts: ["paymentMethodTypes equals [card]"],

    });



    const { paymentMethodTypes, shippingCountry } = await startCheckout({

      country: "DE",

    });



    logStep("Non-NL payment methods", paymentMethodTypes);



    expect(shippingCountry).toBe("DE");

    expect(paymentMethodTypes).toEqual(["card"]);



    logTestEnd("creates checkout session with card-only for non-NL shipping");

  });



  it("completes card payment and syncs paid order to Firestore", async () => {

    logTestStart("completes card payment and syncs paid order to Firestore", {

      scenario:

        "Create checkout → simulate card pay (pm_card_visa) → fire checkout.session.completed webhook → order in orders collection",

      asserts: [

        "order paymentStatus paid, orderStatus PROCESSING",

        "pendingOrders doc removed",

        "invoice HTML contains order id",

        "sendOrderPaidEmails called (mocked)",

      ],

      notTested: ["actual email delivery", "iDEAL payment"],

    });



    const { sessionId, pendingOrderId } = await startCheckout();

    logStep("Simulating successful card payment", { sessionId, paymentMethod: "pm_card_visa" });



    const { completedSession: paidSession } =

      await simulateSuccessfulCheckoutPayment(sessionId);

    logStep("Simulated paid session", {

      payment_status: paidSession.payment_status,

      payment_intent: paidSession.payment_intent,

    });



    expect(paidSession.payment_status).toBe("paid");



    logStep("Processing checkout.session.completed webhook");

    const result = await processStripeWebhookEvent(

      buildStripeEvent("checkout.session.completed", paidSession)

    );



    logStep("Webhook result", {

      duplicate: result.duplicate,

      orderId: result.order?.id,

      paymentStatus: result.order?.paymentStatus,

      orderStatus: result.order?.orderStatus,

    });



    expect(result.duplicate).toBe(false);

    expect(result.order.paymentStatus).toBe("paid");

    expect(result.order.orderStatus).toBe(ORDER_STATUS.PROCESSING);

    expect(result.order.invoice?.html).toContain(result.order.id);



    const pendingAfter = await getPendingOrder(pendingOrderId);

    logStep("pendingOrders after webhook", { pendingOrderId, exists: Boolean(pendingAfter) });

    expect(pendingAfter).toBeNull();



    const stored = await getOrderBySessionId(sessionId);

    logStep("orders collection lookup by stripeSessionId", {

      orderId: stored?.id,

      lineItemCount: stored?.validatedLineItems?.length,

      testRunId: stored?.testRunId,

    });



    expect(stored?.stripeSessionId).toBe(sessionId);

    expect(stored?.validatedLineItems?.length).toBeGreaterThan(0);

    expect(vi.mocked(sendOrderPaidEmails)).toHaveBeenCalled();



    logTestEnd("completes card payment and syncs paid order to Firestore");

  });



  it("is idempotent when checkout.session.completed webhook is replayed", async () => {

    logTestStart("is idempotent when checkout.session.completed webhook is replayed", {

      scenario: "Same checkout.session.completed event processed twice → second is duplicate",

      asserts: ["first.duplicate false", "second.duplicate true", "same order id"],

    });



    const { sessionId } = await startCheckout();

    const { completedSession: paidSession } =

      await simulateSuccessfulCheckoutPayment(sessionId);



    const event = buildStripeEvent("checkout.session.completed", paidSession);

    logStep("First webhook delivery");

    const first = await processStripeWebhookEvent(event);

    logStep("Second webhook delivery (replay)");

    const second = await processStripeWebhookEvent(event);



    logStep("Idempotency check", {

      firstDuplicate: first.duplicate,

      secondDuplicate: second.duplicate,

      orderId: first.order?.id,

    });



    expect(first.duplicate).toBe(false);

    expect(second.duplicate).toBe(true);

    expect(first.order.id).toBe(second.order.id);



    logTestEnd("is idempotent when checkout.session.completed webhook is replayed");

  });



  it("waits for async payment success before fulfilling an order", async () => {

    logTestStart("waits for async payment success before fulfilling an order", {

      scenario:
        "Unpaid checkout.session.completed keeps pending order → async success fulfills it",

      asserts: [

        "unpaid completion does not create an order",

        "pending order remains",

        "async success creates the paid order",

      ],

    });



    const { sessionId, pendingOrderId } = await startCheckout();

    const stripe = getStripeTestClient();

    const unpaidSession = await stripe.checkout.sessions.retrieve(sessionId);



    const processing = await processStripeWebhookEvent(

      buildStripeEvent("checkout.session.completed", unpaidSession)

    );



    expect(processing.action).toBe("payment_processing");

    expect(await getOrderBySessionId(sessionId)).toBeNull();

    expect(await getPendingOrder(pendingOrderId)).not.toBeNull();



    const { completedSession: paidSession } =

      await simulateSuccessfulCheckoutPayment(sessionId);

    const completed = await processStripeWebhookEvent(

      buildStripeEvent("checkout.session.async_payment_succeeded", paidSession)

    );



    expect(completed.duplicate).toBe(false);

    expect(completed.order.paymentStatus).toBe("paid");

    expect(await getPendingOrder(pendingOrderId)).toBeNull();



    logTestEnd("waits for async payment success before fulfilling an order");

  });



  it("marks pending checkout failed on payment_intent.payment_failed", async () => {

    logTestStart("marks pending checkout failed on payment_intent.payment_failed", {

      scenario:

        "Create checkout → attach payment intent → fire payment_intent.payment_failed webhook",

      asserts: [

        "pendingOrders still exists",

        "paymentStatus failed",

        "orderStatus PAYMENT_FAILED",

      ],

    });



    const { sessionId, pendingOrderId } = await startCheckout();

    const paymentIntentId = await createFailedPaymentIntentForPending(sessionId);

    logStep("Created payment intent linked to pending order", { paymentIntentId });



    await processStripeWebhookEvent(

      buildStripeEvent("payment_intent.payment_failed", {

        id: paymentIntentId,

        object: "payment_intent",

      })

    );



    const pending = await getPendingOrder(pendingOrderId);

    logStep("pendingOrders after payment_failed", {

      pendingOrderId,

      paymentStatus: pending?.paymentStatus,

      orderStatus: pending?.orderStatus,

    });



    expect(pending.paymentStatus).toBe("failed");

    expect(pending.orderStatus).toBe(ORDER_STATUS.PAYMENT_FAILED);



    logTestEnd("marks pending checkout failed on payment_intent.payment_failed");

  });



  it("declines card payment with Stripe test decline payment method", async () => {

    logTestStart("declines card payment with Stripe test decline payment method", {

      scenario: "Attempt pm_card_chargeDeclined on checkout session amount",

      asserts: ["outcome.declined is true"],

      notTested: ["Firestore state after decline (only Stripe API error path)"],

    });



    const { sessionId } = await startCheckout();

    logStep("Simulating declined card", { sessionId, paymentMethod: "pm_card_chargeDeclined" });

    const outcome = await simulateDeclinedCheckoutPayment(sessionId);



    logResult("decline outcome", { declined: outcome.declined });

    expect(outcome.declined).toBe(true);



    logTestEnd("declines card payment with Stripe test decline payment method");

  });



  it("cleans up pending order on checkout.session.expired", async () => {

    logTestStart("cleans up pending order on checkout.session.expired", {

      scenario:

        "Create checkout → expire session via Stripe API → fire checkout.session.expired webhook",

      asserts: ["pendingOrders doc deleted"],

    });



    const { sessionId, pendingOrderId } = await startCheckout();

    const stripe = getStripeTestClient();



    logStep("Expiring Stripe checkout session", { sessionId });

    await stripe.checkout.sessions.expire(sessionId);

    const expiredSession = await stripe.checkout.sessions.retrieve(sessionId);

    logStep("Expired session status", { status: expiredSession.status });



    await processStripeWebhookEvent(

      buildStripeEvent("checkout.session.expired", expiredSession)

    );



    const pending = await getPendingOrder(pendingOrderId);

    logStep("pendingOrders after expired webhook", { pendingOrderId, exists: Boolean(pending) });

    expect(pending).toBeNull();



    logTestEnd("cleans up pending order on checkout.session.expired");

  });



  it("marks order refunded after charge.refunded webhook", async () => {

    logTestStart("marks order refunded after charge.refunded webhook", {

      scenario:

        "Pay order → webhook complete → Stripe refund → charge.refunded webhook → order REFUNDED",

      asserts: ["paymentStatus refunded", "orderStatus REFUNDED"],

    });



    const { sessionId } = await startCheckout();

    const { completedSession: paidSession, paymentIntentId } =

      await simulateSuccessfulCheckoutPayment(sessionId);



    await processStripeWebhookEvent(

      buildStripeEvent("checkout.session.completed", paidSession)

    );

    logStep("Order paid; creating Stripe refund", { paymentIntentId });



    const stripe = getStripeTestClient();

    const refund = await stripe.refunds.create({

      payment_intent: paymentIntentId,

    });

    logStep("Refund created", { refundId: refund.id, status: refund.status });

    expect(refund.status === "succeeded" || refund.status === "pending").toBe(true);



    await sleep(1500);



    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {

      expand: ["latest_charge"],

    });

    const charge =

      typeof pi.latest_charge === "string"

        ? await stripe.charges.retrieve(pi.latest_charge)

        : pi.latest_charge;



    logStep("Processing charge.refunded webhook", { chargeId: charge.id });

    await processStripeWebhookEvent(buildStripeEvent("charge.refunded", charge));



    const order = await getOrderBySessionId(sessionId);

    logStep("Order after refund webhook", {

      orderId: order?.id,

      paymentStatus: order?.paymentStatus,

      orderStatus: order?.orderStatus,

    });



    expect(order.paymentStatus).toBe("refunded");

    expect(order.orderStatus).toBe(ORDER_STATUS.REFUNDED);



    logTestEnd("marks order refunded after charge.refunded webhook");

  });



  it("flags dispute on charge.dispute.created webhook", async () => {

    logTestStart("flags dispute on charge.dispute.created webhook", {

      scenario: "Pay order → webhook complete → synthetic charge.dispute.created → disputeStatus open",

      asserts: ["disputeStatus open"],

      notTested: ["real Stripe dispute creation (uses synthetic webhook payload)"],

    });



    const { sessionId } = await startCheckout();

    const { completedSession: paidSession, paymentIntentId } =

      await simulateSuccessfulCheckoutPayment(sessionId);



    await processStripeWebhookEvent(

      buildStripeEvent("checkout.session.completed", paidSession)

    );



    const disputePayload = {

      id: `dp_test_${Date.now()}`,

      object: "dispute",

      payment_intent: paymentIntentId,

    };

    logStep("Processing charge.dispute.created webhook", disputePayload);



    await processStripeWebhookEvent(

      buildStripeEvent("charge.dispute.created", disputePayload)

    );



    const order = await getOrderBySessionId(sessionId);

    logStep("Order after dispute webhook", {

      orderId: order?.id,

      disputeStatus: order?.disputeStatus,

    });



    expect(order.disputeStatus).toBe("open");



    logTestEnd("flags dispute on charge.dispute.created webhook");

  });

});



describe("Payment integration prerequisites", () => {

  it("documents required env vars when tests are skipped", () => {

    if (hasRequiredEnv) {

      expect(process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")).toBe(true);

      return;

    }



    expect(hasRequiredEnv).toBe(false);

  });

});



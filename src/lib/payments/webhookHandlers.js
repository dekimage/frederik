import Stripe from "stripe";
import { firestore } from "@/app/firebaseAdmin";
import { sendOrderPaidEmails } from "@/app/api/checkout-session/email";
import { buildInvoiceHtml } from "@/lib/invoice";
import { ORDER_STATUS } from "@/lib/orderUtils";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

async function findOrderByStripeSessionId(sessionId) {
  const snapshot = await firestore
    .collection("orders")
    .where("stripeSessionId", "==", sessionId)
    .limit(1)
    .get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    ref: doc.ref,
    order: { id: doc.id, ...doc.data() },
  };
}

async function deliverOrderEmails(orderDocRef, order) {
  if (
    order.emailDelivery?.status === "sent" &&
    !order.emailDelivery.customer &&
    !order.emailDelivery.admin
  )
    return order.emailDelivery;
  try {
    await sendOrderPaidEmails(order);
    await orderDocRef.update({
      "emailDelivery.provider": "resend",
      "emailDelivery.status": "sent",
      "emailDelivery.sentAt": new Date(),
    });
    return (await orderDocRef.get()).data().emailDelivery;
  } catch (error) {
    await orderDocRef.update({
      "emailDelivery.provider": "resend",
      "emailDelivery.status": "failed",
      "emailDelivery.lastAttemptAt": new Date(),
      "emailDelivery.lastError": error.message,
    });
    throw error;
  }
}

async function finalizePaidOrder(session) {
  if (session.payment_status !== "paid") {
    throw new Error(
      `Refusing to fulfill unpaid Checkout Session ${session.id} (${session.payment_status})`,
    );
  }

  const stripe = getStripeClient();
  const existingRecord = await findOrderByStripeSessionId(session.id);

  const orderRefId = session.metadata?.orderRef;
  if (!orderRefId) {
    throw new Error("Missing orderRef metadata on Stripe session");
  }

  const pendingRef = firestore.collection("pendingOrders").doc(orderRefId);
  const pendingDoc = await pendingRef.get();
  const deterministicRecord = await firestore
    .collection("orders")
    .doc(orderRefId)
    .get();

  if (!pendingDoc.exists && !existingRecord && !deterministicRecord.exists) {
    throw new Error("Pending order not found");
  }

  const pendingData = pendingDoc.data() || {};

  let receiptUrl = null;
  if (session.payment_intent) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent,
        { expand: ["latest_charge"] },
      );
      receiptUrl = paymentIntent.latest_charge?.receipt_url || null;
    } catch (error) {
      console.error("Unable to fetch Stripe receipt URL:", error.message);
      throw error; // Let Stripe retry instead of permanently emailing missing documents.
    }
  }

  const amountSubtotal = (session.amount_subtotal || 0) / 100;
  const amountTax = (session.total_details?.amount_tax || 0) / 100;
  const amountTotal = (session.amount_total || 0) / 100;

  if (amountTax > 0) {
    console.warn(
      "Stripe reported tax on a KOR checkout (automatic_tax is off). amountTax:",
      amountTax,
      "session:",
      session.id,
    );
  }

  const orderPayload = {
    ...pendingData,
    paymentStatus: session.payment_status,
    orderStatus:
      session.payment_status === "paid"
        ? ORDER_STATUS.PROCESSING
        : ORDER_STATUS.PAYMENT_FAILED,
    amountSubtotal,
    amountTax,
    amountTotal,
    currency: session.currency || "eur",
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent || null,
    stripeMode: session.livemode ? "live" : "test",
    stripeLivemode: Boolean(session.livemode),
    paidAt: new Date(),
    isFulfilled: false,
    statusHistory: [
      {
        status: ORDER_STATUS.PROCESSING,
        at: new Date().toISOString(),
        source: "webhook:checkout.session.completed",
      },
    ],
  };

  // The pending order ID is the stable identity across concurrent Stripe events.
  // Keep legacy orders at their existing IDs, including on retry.
  const orderDocRef =
    existingRecord?.ref || firestore.collection("orders").doc(orderRefId);
  const duplicate = await firestore.runTransaction(async (tx) => {
    const current = await tx.get(orderDocRef);
    if (current.exists) return true;
    tx.create(orderDocRef, orderPayload);
    return false;
  });
  const orderId = orderDocRef.id;
  const storedOrder = (await orderDocRef.get()).data();

  let stripeInvoice = null;
  // Checkout can attach its invoice after the completed event was emitted.
  if (session.invoice_creation?.enabled || session.invoice) {
    const latest = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["invoice"],
    });
    stripeInvoice =
      typeof latest.invoice === "string"
        ? await stripe.invoices.retrieve(latest.invoice)
        : latest.invoice;
    if (!stripeInvoice?.hosted_invoice_url || !stripeInvoice?.invoice_pdf) {
      throw new Error("Stripe invoice is not ready yet; retry this webhook.");
    }
  }

  const invoiceHtml = buildInvoiceHtml({
    orderId,
    billingDetails: storedOrder.billingDetails,
    shippingDetails: storedOrder.shippingDetails,
    validatedLineItems: storedOrder.validatedLineItems || [],
    amountSubtotal,
    amountTotal,
    currency: orderPayload.currency,
    paidAt: storedOrder.paidAt?.toDate?.() || storedOrder.paidAt,
    receiptUrl,
  });

  const invoice = {
    ...storedOrder.invoice,
    receiptUrl: receiptUrl || storedOrder.invoice?.receiptUrl || null,
    stripeInvoiceId:
      stripeInvoice?.id || storedOrder.invoice?.stripeInvoiceId || null,
    hostedInvoiceUrl:
      stripeInvoice?.hosted_invoice_url ||
      storedOrder.invoice?.hostedInvoiceUrl ||
      null,
    invoicePdf:
      stripeInvoice?.invoice_pdf || storedOrder.invoice?.invoicePdf || null,
    html: storedOrder.invoice?.html || invoiceHtml,
    amountSubtotal,
    amountTax,
    amountTotal,
    currency: orderPayload.currency,
    createdAt: storedOrder.invoice?.createdAt || new Date(),
  };

  await orderDocRef.update({ invoice });

  await pendingRef.delete();

  const order = { id: orderId, ...storedOrder, invoice };

  order.emailDelivery = await deliverOrderEmails(orderDocRef, order);

  return { duplicate, order };
}

async function deletePendingOrder(orderRefId) {
  if (!orderRefId) return;
  await firestore.collection("pendingOrders").doc(orderRefId).delete();
}

async function markPendingExpired(orderRefId) {
  if (!orderRefId) return;
  const ref = firestore.collection("pendingOrders").doc(orderRefId);
  const doc = await ref.get();
  if (!doc.exists) return;
  await ref.update({
    orderStatus: ORDER_STATUS.EXPIRED,
    paymentStatus: "expired",
    updatedAt: new Date(),
  });
}

async function markPendingPaymentState(orderRefId, paymentStatus, orderStatus) {
  if (!orderRefId) return;
  const ref = firestore.collection("pendingOrders").doc(orderRefId);
  const doc = await ref.get();
  if (!doc.exists) return;
  await ref.update({
    paymentStatus,
    orderStatus,
    updatedAt: new Date(),
  });
}

async function markOrderRefunded(charge) {
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) return;

  const snapshot = await firestore
    .collection("orders")
    .where("stripePaymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get();

  if (snapshot.empty) return;

  const doc = snapshot.docs[0];
  const fullyRefunded =
    charge.refunded === true ||
    (charge.amount > 0 && charge.amount_refunded >= charge.amount);
  await firestore.runTransaction(async (tx) => {
    const current = await tx.get(doc.ref);
    const previous = current.data();
    if (previous.amountRefunded >= (charge.amount_refunded || 0) / 100) return;
    tx.update(doc.ref, {
      paymentStatus: fullyRefunded ? "refunded" : "partially_refunded",
      orderStatus: fullyRefunded ? ORDER_STATUS.REFUNDED : previous.orderStatus,
      amountRefunded: (charge.amount_refunded || 0) / 100,
      refundedAt: new Date(),
      statusHistory: [
        ...(previous.statusHistory || []),
        {
          status: fullyRefunded ? ORDER_STATUS.REFUNDED : previous.orderStatus,
          note: fullyRefunded
            ? "Fully refunded in Stripe"
            : "Partially refunded in Stripe",
          at: new Date().toISOString(),
          source: "webhook:charge.refunded",
        },
      ],
    });
  });
}

async function markOrderDisputeOpen(dispute) {
  const paymentIntentId = dispute.payment_intent;
  if (!paymentIntentId) return;

  const snapshot = await firestore
    .collection("orders")
    .where("stripePaymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      disputeStatus: "open",
      updatedAt: new Date(),
    });
  }
}

/**
 * Core Stripe webhook processor (no HTTP/signature layer).
 * Integration tests call this directly with Stripe event payloads.
 */
export async function processStripeWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "paid") {
        await markPendingPaymentState(
          session.metadata?.orderRef,
          session.payment_status || "processing",
          ORDER_STATUS.PENDING_PAYMENT,
        );
        return { action: "payment_processing" };
      }
      return finalizePaidOrder(session);
    }

    case "checkout.session.async_payment_succeeded":
      return finalizePaidOrder(event.data.object);

    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      await markPendingPaymentState(
        session.metadata?.orderRef,
        "failed",
        ORDER_STATUS.PAYMENT_FAILED,
      );
      return { action: "async_payment_failed" };
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      await markPendingExpired(session.metadata?.orderRef);
      await deletePendingOrder(session.metadata?.orderRef);
      return { action: "expired_cleanup" };
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const orderRefId = paymentIntent.metadata?.orderRef;
      if (orderRefId) {
        await markPendingPaymentState(
          orderRefId,
          "failed",
          ORDER_STATUS.PAYMENT_FAILED,
        );
      } else {
        const pendingSnapshot = await firestore
          .collection("pendingOrders")
          .where("stripePaymentIntentId", "==", paymentIntent.id)
          .limit(1)
          .get();

        if (!pendingSnapshot.empty) {
          await pendingSnapshot.docs[0].ref.update({
            paymentStatus: "failed",
            orderStatus: ORDER_STATUS.PAYMENT_FAILED,
            updatedAt: new Date(),
          });
        }
      }
      return { action: "payment_failed" };
    }

    case "charge.refunded": {
      await markOrderRefunded(event.data.object);
      return { action: "refunded" };
    }

    case "charge.dispute.created": {
      await markOrderDisputeOpen(event.data.object);
      return { action: "dispute_created" };
    }

    default:
      return { action: "ignored", type: event.type };
  }
}

export async function verifyAndProcessStripeWebhook(rawBody, signature) {
  const stripe = getStripeClient();
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
  return processStripeWebhookEvent(event);
}

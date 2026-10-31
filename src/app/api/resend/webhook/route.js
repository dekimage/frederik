import { Resend } from "resend";
import { firestore } from "@/app/firebaseAdmin";

const statuses = {
  "email.sent": "accepted",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
  "email.delivery_delayed": "delayed",
};

export async function POST(request) {
  if (!process.env.RESEND_WEBHOOK_SECRET)
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  let event;
  try {
    event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
      payload: await request.text(),
      headers: {
        id: request.headers.get("svix-id"),
        timestamp: request.headers.get("svix-timestamp"),
        signature: request.headers.get("svix-signature"),
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    });
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  const status = statuses[event.type];
  if (!status) return Response.json({ received: true });
  const emailId = event.data?.email_id;
  if (!emailId)
    return Response.json({ error: "Missing email ID" }, { status: 400 });
  const tags = Array.isArray(event.data.tags)
    ? Object.fromEntries(
        event.data.tags.map(({ name, value }) => [name, value]),
      )
    : event.data.tags || {};
  for (const role of ["customer", "admin"]) {
    const snapshot = await firestore
      .collection("orders")
      .where(`emailDelivery.${role}.id`, "==", emailId)
      .limit(1)
      .get();
    const ref =
      snapshot.docs[0]?.ref ||
      (tags.order_id && tags.role === role
        ? firestore.collection("orders").doc(tags.order_id)
        : null);
    if (!ref) continue;
    await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) return;
      const previous = doc.data().emailDelivery?.[role] || {};
      const at = Date.parse(event.created_at);
      if (!Number.isFinite(at) || at <= (previous.eventAt || 0)) return;
      if (previous.id && previous.id !== emailId) return;
      tx.update(ref, {
        [`emailDelivery.${role}`]: {
          ...previous,
          id: emailId,
          status,
          eventAt: at,
          leaseUntil: 0,
        },
      });
    });
  }
  return Response.json({ received: true });
}

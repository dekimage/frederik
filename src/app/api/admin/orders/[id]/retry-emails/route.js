import { requireAdmin } from "@/lib/adminAuth";
import { firestore } from "@/app/firebaseAdmin";
import { sendOrderPaidEmails } from "@/app/api/checkout-session/email";

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const { id } = await params;
  const ref = firestore.collection("orders").doc(id);
  const doc = await ref.get();
  if (!doc.exists)
    return Response.json({ error: "Order not found" }, { status: 404 });
  const order = { ...doc.data(), id: doc.id };
  if (!order.paidAt)
    return Response.json(
      { error: "Only paid orders can have confirmation emails retried." },
      { status: 400 },
    );
  // Historical orders without per-recipient records require provider review first.
  if (!order.emailDelivery?.customer && !order.emailDelivery?.admin) {
    return Response.json(
      {
        error:
          "Legacy email history: check Resend before resending to prevent duplicates.",
      },
      { status: 409 },
    );
  }
  try {
    await sendOrderPaidEmails(order);
    await ref.update({
      "emailDelivery.status": "sent",
      "emailDelivery.lastError": null,
    });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 409 });
  }
}

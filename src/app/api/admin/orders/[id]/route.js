import { firestore } from "@/app/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import {
  ORDER_STATUS,
  deriveOrderStatusFromFulfillment,
} from "@/lib/orderUtils";

const ALLOWED_ORDER_STATUSES = new Set(Object.values(ORDER_STATUS));

export async function PUT(request, { params }) {
  const authResult = await requireAdmin(request);
  if (authResult.response) return authResult.response;

  try {
    const { id } = params;
    const body = await request.json();
    const { isFulfilled, orderStatus } = body;

    const docRef = firestore.collection("orders").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const current = doc.data();
    const updates = { updatedAt: new Date() };
    const historyEntry = {
      at: new Date().toISOString(),
      source: `admin:${authResult.admin.email}`,
    };

    if (typeof isFulfilled === "boolean") {
      updates.isFulfilled = isFulfilled;
      updates.orderStatus = deriveOrderStatusFromFulfillment(
        current.orderStatus,
        isFulfilled
      );
      historyEntry.status = updates.orderStatus;
      historyEntry.note = isFulfilled ? "Marked fulfilled" : "Marked unfulfilled";
    }

    if (orderStatus && ALLOWED_ORDER_STATUSES.has(orderStatus)) {
      updates.orderStatus = orderStatus;
      if (orderStatus === ORDER_STATUS.SHIPPED || orderStatus === ORDER_STATUS.DELIVERED) {
        updates.isFulfilled = true;
      }
      historyEntry.status = orderStatus;
      historyEntry.note = `Status set to ${orderStatus}`;
    }

    updates.statusHistory = [...(current.statusHistory || []), historyEntry];

    await docRef.update(updates);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating order:", error.message);
    return Response.json({ error: "Unable to update order" }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  const authResult = await requireAdmin(request);
  if (authResult.response) return authResult.response;

  try {
    const { id } = params;
    const doc = await firestore.collection("orders").doc(id).get();

    if (!doc.exists) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const order = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.().toISOString() || null,
      paidAt: doc.data().paidAt?.toDate?.().toISOString() || null,
    };

    return Response.json(order);
  } catch (error) {
    console.error("Error fetching order:", error.message);
    return Response.json({ error: "Unable to fetch order" }, { status: 500 });
  }
}

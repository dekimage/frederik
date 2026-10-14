import { firestore } from "@/app/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import {
  deriveStripeMode,
} from "@/lib/orderUtils";

export async function GET(request) {
  const authResult = await requireAdmin(request);
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 100;
    const search = searchParams.get("search");

    let query = firestore.collection("orders");
    const snapshot = await query.get();
    const total = snapshot.size;

    query = query
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset((page - 1) * limit);

    const ordersSnapshot = await query.get();

    let orders = ordersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        stripeMode: deriveStripeMode(data),
        createdAt: data.createdAt?.toDate?.().toISOString() || null,
        paidAt: data.paidAt?.toDate?.().toISOString() || null,
      };
    });

    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(
        (order) =>
          order.id.toLowerCase().includes(searchLower) ||
          order.billingDetails?.firstName?.toLowerCase().includes(searchLower) ||
          order.billingDetails?.lastName?.toLowerCase().includes(searchLower) ||
          order.billingDetails?.email?.toLowerCase().includes(searchLower) ||
          order.shippingDetails?.email?.toLowerCase().includes(searchLower)
      );
    }

    return Response.json({ orders, total });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return Response.json({ error: "Unable to fetch orders" }, { status: 500 });
  }
}

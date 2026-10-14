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
    const requestedLimit = parseInt(searchParams.get("limit")) || 100;
    const limit = Math.min(Math.max(requestedLimit, 1), 500);
    const search = searchParams.get("search");
    const archive = searchParams.get("archive") || "active";

    const snapshot = await firestore.collection("orders").get();
    let orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      const invoice = data.invoice
        ? { ...data.invoice, hasHtml: Boolean(data.invoice.html) }
        : null;
      if (invoice) delete invoice.html;
      return {
        id: doc.id,
        ...data,
        invoice,
        stripeMode: deriveStripeMode(data),
        createdAt: data.createdAt?.toDate?.().toISOString() || null,
        paidAt: data.paidAt?.toDate?.().toISOString() || null,
        archivedAt: data.archivedAt?.toDate?.().toISOString() || null,
      };
    });

    orders = orders.filter((order) => {
      if (archive === "all") return true;
      if (archive === "archived") return Boolean(order.archivedAt);
      return !order.archivedAt;
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

    orders.sort(
      (a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
        (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    );

    const total = orders.length;
    orders = orders.slice((page - 1) * limit, page * limit);

    return Response.json({ orders, total });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return Response.json({ error: "Unable to fetch orders" }, { status: 500 });
  }
}

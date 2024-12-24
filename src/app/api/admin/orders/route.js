import { firestore } from "@/app/firebaseAdmin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 100;
    const status = searchParams.get("status");
    const isFulfilled = searchParams.get("isFulfilled");
    const search = searchParams.get("search");

    let query = firestore.collection("orders");

    // Apply filters
    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    if (isFulfilled && isFulfilled !== "all") {
      query = query.where("isFulfilled", "==", isFulfilled === "true");
    }

    // Get total count for pagination
    const snapshot = await query.get();
    const total = snapshot.size;

    // Apply pagination
    query = query
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset((page - 1) * limit);

    // Execute query
    const ordersSnapshot = await query.get();

    const orders = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.().toISOString() || null,
    }));

    // If there's a search term, filter in memory
    // (Firestore doesn't support text search)
    if (search) {
      const searchLower = search.toLowerCase();
      return Response.json({
        orders: orders.filter(
          (order) =>
            order.id.toLowerCase().includes(searchLower) ||
            order.customerName?.toLowerCase().includes(searchLower)
        ),
        total,
      });
    }

    return Response.json({ orders, total });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

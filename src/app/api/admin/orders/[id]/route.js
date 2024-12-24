import { firestore } from "@/app/firebaseAdmin";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { isFulfilled } = await request.json();

    await firestore.collection("orders").doc(id).update({
      isFulfilled,
      updatedAt: new Date(),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating order:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request, { params }) {
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
    };

    return Response.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import { firestore } from "@/app/firebaseAdmin";
import { withAdminRoute } from "@/lib/withAdminRoute";

export async function GET(request) {
  return withAdminRoute(request, async () => {
    const snapshot = await firestore.collection("categories").get();
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return Response.json({ categories });
  });
}

export async function POST(request) {
  return withAdminRoute(request, async () => {
    try {
      const { name } = await request.json();
      const docRef = await firestore.collection("categories").add({
        name,
        createdAt: new Date(),
      });
      return Response.json({ id: docRef.id });
    } catch (error) {
      console.error("Error creating category:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  });
}

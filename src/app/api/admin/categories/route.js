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
      const body = await request.json();
      const name = String(body.name || "").trim();
      if (!name || name.length > 60) {
        return Response.json(
          { error: "Category name must be between 1 and 60 characters." },
          { status: 400 }
        );
      }

      const existing = await firestore.collection("categories").get();
      const duplicate = existing.docs.some(
        (doc) => String(doc.data().name || "").trim().toLowerCase() === name.toLowerCase()
      );
      if (duplicate) {
        return Response.json(
          { error: "A category with this name already exists." },
          { status: 409 }
        );
      }

      const docRef = await firestore.collection("categories").add({
        name,
        createdAt: new Date(),
      });
      return Response.json({ id: docRef.id });
    } catch (error) {
      console.error("Error creating category:", error);
      return Response.json({ error: "Unable to create category." }, { status: 500 });
    }
  });
}

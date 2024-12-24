import { firestore } from "@/app/firebaseAdmin";

export async function GET() {
  try {
    const snapshot = await firestore.collection("categories").get();
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return Response.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
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
}

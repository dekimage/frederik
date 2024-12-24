import { firestore } from "@/app/firebaseAdmin";

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await firestore.collection("categories").doc(id).delete();
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

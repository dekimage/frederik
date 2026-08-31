import { firestore } from "@/app/firebaseAdmin";
import { withAdminRoute } from "@/lib/withAdminRoute";

export async function DELETE(request, context) {
  return withAdminRoute(request, async () => {
    try {
      const { id } = context.params;
      await firestore.collection("categories").doc(id).delete();
      return Response.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  });
}

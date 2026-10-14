import { firestore } from "@/app/firebaseAdmin";
import { withAdminRoute } from "@/lib/withAdminRoute";

export async function DELETE(request, context) {
  return withAdminRoute(request, async () => {
    try {
      const { id } = context.params;
      const [products, images] = await Promise.all([
        firestore.collection("products").where("category", "==", id).get(),
        firestore.collection("images").where("category", "==", id).get(),
      ]);

      if (!products.empty || !images.empty) {
        return Response.json(
          {
            error: `This category is still used by ${products.size} product(s) and ${images.size} image(s). Reassign them before deleting it.`,
          },
          { status: 409 }
        );
      }

      await firestore.collection("categories").doc(id).delete();
      return Response.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  });
}

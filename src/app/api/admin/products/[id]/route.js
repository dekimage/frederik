import { firestore, admin } from "@/app/firebaseAdmin";
import {
  cleanupReplacedImageAsset,
  deleteStoredImageFromDoc,
} from "@/lib/cloudinaryMedia";
import { withAdminRoute } from "@/lib/withAdminRoute";

const PRODUCT_IMAGE_KEYS = { urlField: "image", publicIdField: "cloudinaryPublicId" };

export async function DELETE(request, context) {
  return withAdminRoute(request, async () => {
    try {
      const { id } = context.params;
      const doc = await firestore.collection("products").doc(id).get();
      const productData = doc.data();
      await deleteStoredImageFromDoc(productData, PRODUCT_IMAGE_KEYS);
      await firestore.collection("products").doc(id).delete();
      return Response.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  });
}

export async function PUT(request, context) {
  return withAdminRoute(request, async () => {
    try {
      const { id } = context.params;
      const data = await request.json();
      delete data.price;
      if ("published" in data) data.published = data.published === true;
      const docRef = firestore.collection("products").doc(id);
      const prevSnap = await docRef.get();
      if (!prevSnap.exists) {
        return Response.json({ error: "Product not found" }, { status: 404 });
      }
      const previous = prevSnap.data() || {};

      await docRef.update({
        ...data,
        price: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await cleanupReplacedImageAsset(previous, data, PRODUCT_IMAGE_KEYS).catch(
        (err) => {
          console.error("Asset cleanup after product update:", err);
        }
      );

      return Response.json({ success: true });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  });
}

import { firestore, admin } from "@/app/firebaseAdmin";
import {
  cleanupReplacedImageAsset,
  deleteStoredImageFromDoc,
} from "@/lib/cloudinaryMedia";
import { withAdminRoute } from "@/lib/withAdminRoute";

const IMAGE_KEYS = { urlField: "url", publicIdField: "cloudinaryPublicId" };

export async function PUT(request, context) {
  return withAdminRoute(request, async () => {
    try {
      const { id } = context.params;
      const data = await request.json();
      const docRef = firestore.collection("images").doc(id);
      const prevSnap = await docRef.get();
      const previous = prevSnap.data() || {};

      await docRef.update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await cleanupReplacedImageAsset(previous, data, IMAGE_KEYS).catch((err) => {
        console.error("Asset cleanup after image doc update:", err);
      });

      return Response.json({ success: true });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  });
}

export async function DELETE(request, context) {
  return withAdminRoute(request, async () => {
    try {
      const { id } = context.params;
      const docSnap = await firestore.collection("images").doc(id).get();
      const imageData = docSnap.data();
      await deleteStoredImageFromDoc(imageData, IMAGE_KEYS);
      await firestore.collection("images").doc(id).delete();
      return Response.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  });
}

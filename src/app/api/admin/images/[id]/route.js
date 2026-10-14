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
      if (!docSnap.exists) {
        return Response.json({ error: "Image not found" }, { status: 404 });
      }
      const imageData = docSnap.data();

      const linkedProducts = imageData.cloudinaryPublicId
        ? await firestore
            .collection("products")
            .where("cloudinaryPublicId", "==", imageData.cloudinaryPublicId)
            .get()
        : await firestore
            .collection("products")
            .where("image", "==", imageData.url || "__missing__")
            .get();

      const activeReferences = linkedProducts.docs.filter(
        (product) => product.data().sharedGalleryImage
      );
      if (activeReferences.length > 0) {
        return Response.json(
          {
            error: `This image is used by ${activeReferences.length} product(s). Change those product images before deleting it.`,
          },
          { status: 409 }
        );
      }

      await deleteStoredImageFromDoc(imageData, IMAGE_KEYS);
      await firestore.collection("images").doc(id).delete();
      return Response.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  });
}

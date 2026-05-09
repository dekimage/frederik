import { firestore, admin } from "@/app/firebaseAdmin";
import {
  cleanupReplacedImageAsset,
  deleteStoredImageFromDoc,
} from "@/lib/cloudinaryMedia";

const PRODUCT_IMAGE_KEYS = { urlField: "image", publicIdField: "cloudinaryPublicId" };

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const doc = await firestore.collection("products").doc(id).get();
    const productData = doc.data();

    await deleteStoredImageFromDoc(productData, PRODUCT_IMAGE_KEYS);

    await firestore.collection("products").doc(id).delete();

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();

    const docRef = firestore.collection("products").doc(id);
    const prevSnap = await docRef.get();
    const previous = prevSnap.data() || {};

    await docRef.update({
      ...data,
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
}

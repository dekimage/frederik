import { firestore, admin } from "@/app/firebaseAdmin";
import {
  uploadImageBuffer,
  CLOUDINARY_FOLDER_PRODUCTS,
} from "@/lib/cloudinaryMedia";

import { withAdminRoute } from "@/lib/withAdminRoute";

export async function GET(request) {
  return withAdminRoute(request, async () => {
    const productsSnapshot = await firestore.collection("products").get();
    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return Response.json({ products });
  });
}

export async function POST(request) {
  return withAdminRoute(request, async () => {
  try {
    const data = await request.formData();
    const file = data.get("file");
    const productDataString = data.get("productData");

    if (!file) {
      throw new Error("No file uploaded");
    }

    const productData = JSON.parse(productDataString);
    delete productData.price;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url: imageUrl, cloudinaryPublicId } = await uploadImageBuffer(buffer, {
      folder: CLOUDINARY_FOLDER_PRODUCTS,
    });

    const docRef = await firestore.collection("products").add({
      ...productData,
      image: imageUrl,
      cloudinaryPublicId,
      sharedGalleryImage: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return Response.json({
      id: docRef.id,
      ...productData,
      image: imageUrl,
      cloudinaryPublicId,
    });
  } catch (error) {
    console.error("Product creation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  });
}

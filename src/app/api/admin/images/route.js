import { firestore, admin } from "@/app/firebaseAdmin";
import {
  uploadImageBuffer,
  CLOUDINARY_FOLDER_IMAGES,
} from "@/lib/cloudinaryMedia";

export async function GET() {
  try {
    const imagesSnapshot = await firestore.collection("images").get();
    const images = imagesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return Response.json({ images });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    const imageData = JSON.parse(data.get("imageData"));

    if (!file) {
      throw new Error("No file uploaded");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url: imageUrl, cloudinaryPublicId } = await uploadImageBuffer(buffer, {
      folder: CLOUDINARY_FOLDER_IMAGES,
    });

    const docRef = await firestore.collection("images").add({
      ...imageData,
      url: imageUrl,
      cloudinaryPublicId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return Response.json({
      id: docRef.id,
      ...imageData,
      url: imageUrl,
      cloudinaryPublicId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

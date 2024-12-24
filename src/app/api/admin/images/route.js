import { firestore, storage, admin } from "@/app/firebaseAdmin";

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

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = storage.bucket();
    const fileName = `images/${Date.now()}-${file.name}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file publicly accessible
    await fileRef.makePublic();

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Save image data to Firestore with server timestamp
    const docRef = await firestore.collection("images").add({
      ...imageData,
      url: imageUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return Response.json({
      id: docRef.id,
      ...imageData,
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

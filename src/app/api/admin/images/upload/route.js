import { storage } from "@/app/firebaseAdmin";

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");

    if (!file) {
      throw new Error("No file uploaded");
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = storage.bucket("photography-shop.appspot.com");
    const fileName = `images/${Date.now()}-${file.name}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file publicly accessible
    await fileRef.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return Response.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

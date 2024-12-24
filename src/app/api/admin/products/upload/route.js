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
    const bucket = storage.bucket();

    // Clean the filename to remove special characters and spaces
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `products/${Date.now()}-${cleanFileName}`;
    console.log("Uploading file to:", fileName); // Debug log

    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file publicly accessible
    await fileRef.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log("File uploaded successfully:", url); // Debug log

    return Response.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

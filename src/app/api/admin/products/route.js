import { firestore, storage, admin } from "@/app/firebaseAdmin";

export async function GET() {
  try {
    const productsSnapshot = await firestore.collection("products").get();
    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return Response.json({ products });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    const productDataString = data.get("productData");

    if (!file) {
      throw new Error("No file uploaded");
    }

    // Parse the product data and ensure price is a number
    const productData = JSON.parse(productDataString);
    productData.price = Number(productData.price);

    if (isNaN(productData.price)) {
      throw new Error("Invalid price value");
    }

    // Upload image
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = storage.bucket();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `products/${Date.now()}-${cleanFileName}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    await fileRef.makePublic();

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Save to Firestore with the image URL
    const docRef = await firestore.collection("products").add({
      ...productData,
      image: imageUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return Response.json({
      id: docRef.id,
      ...productData,
      image: imageUrl,
    });
  } catch (error) {
    console.error("Product creation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

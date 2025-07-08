import { firestore, storage, admin } from "@/app/firebaseAdmin";

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Get the product document first to get the image URL
    const doc = await firestore.collection("products").doc(id).get();
    const productData = doc.data();

    if (productData?.image) {
      try {
        // Get the bucket
        const bucket = storage.bucket("photography-shop.appspot.com");

        // Extract the filename from the URL
        // URL format: https://storage.googleapis.com/BUCKET_NAME/products/filename.jpg
        const urlParts = productData.image.split("/");
        const fileName = urlParts.slice(4).join("/"); // Get everything after 'products/'

        console.log("Attempting to delete:", fileName);

        // Delete the file
        const file = bucket.file(fileName);
        const [exists] = await file.exists();

        if (exists) {
          await file
            .delete()
            .then(() => {
              console.log("Successfully deleted file:", fileName);
            })
            .catch((error) => {
              console.error("Error deleting file:", error);
            });
        } else {
          console.log("File does not exist:", fileName);
        }
      } catch (storageError) {
        console.error("Storage deletion error:", storageError);
      }
    }

    // Delete from Firestore
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

    await firestore
      .collection("products")
      .doc(id)
      .update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

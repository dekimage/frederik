import {
  uploadImageBuffer,
  CLOUDINARY_FOLDER_IMAGES,
  validateImageUpload,
} from "@/lib/cloudinaryMedia";
import { withAdminRoute } from "@/lib/withAdminRoute";

export async function POST(request) {
  return withAdminRoute(request, async () => {
    try {
      const data = await request.formData();
      const file = data.get("file");

      validateImageUpload(file);

      const buffer = Buffer.from(await file.arrayBuffer());
      const { url, cloudinaryPublicId } = await uploadImageBuffer(buffer, {
        folder: CLOUDINARY_FOLDER_IMAGES,
      });

      return Response.json({ url, cloudinaryPublicId });
    } catch (error) {
      console.error("Upload error:", error);
      return Response.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }
  });
}

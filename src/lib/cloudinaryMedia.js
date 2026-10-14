import { v2 as cloudinary } from "cloudinary";

import { storage as adminStorage } from "@/app/firebaseAdmin";
import { cloudinaryMaxQualityDeliveryUrl } from "@/lib/cloudinaryDeliveryUrl";

export const CLOUDINARY_FOLDER_IMAGES =
  process.env.CLOUDINARY_FOLDER_IMAGES || "portfolio/cms-images";

export const CLOUDINARY_FOLDER_PRODUCTS =
  process.env.CLOUDINARY_FOLDER_PRODUCTS || "portfolio/products";

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export function validateImageUpload(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    const error = new Error("No image file uploaded.");
    error.status = 400;
    throw error;
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    const error = new Error(
      "Unsupported image type. Upload JPEG, PNG, WebP, AVIF, or GIF."
    );
    error.status = 415;
    throw error;
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    const error = new Error("The uploaded image is empty.");
    error.status = 400;
    throw error;
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    const error = new Error("Image is too large. Maximum upload size is 10 MB.");
    error.status = 413;
    throw error;
  }
}

function ensureCloudinaryConfigured() {
  const hasTriple =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (!hasTriple) {
    if (!process.env.CLOUDINARY_URL) {
      throw new Error(
        "Cloudinary is not configured: set CLOUDINARY_URL (Dashboard, starts with cloudinary://) or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (server-side only)."
      );
    }
    cloudinary.config(true);
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadImageBuffer(buffer, { folder }) {
  ensureCloudinaryConfigured();

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        quality: 100,
      },
      (err, uploadResult) => {
        if (err) reject(err);
        else resolve(uploadResult);
      }
    );
    uploadStream.end(buffer);
  });

  return {
    url: cloudinaryMaxQualityDeliveryUrl(result.secure_url),
    cloudinaryPublicId: result.public_id,
  };
}

export async function destroyCloudinaryByPublicId(publicId) {
  if (!publicId || typeof publicId !== "string") return;
  ensureCloudinaryConfigured();
  const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
  if (result.result !== "ok" && result.result !== "not found") {
    console.warn("[cloudinary] unexpected destroy result:", publicId, result);
  }
  return result;
}

export function resolveFirebaseBucketName() {
  return (
    process.env.FIREBASE_STORAGE_BUCKET || "photography-shop.appspot.com"
  );
}

export async function deleteFirebaseStorageAssetByPublicUrl(imageUrl) {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.includes("storage.googleapis.com")
  ) {
    return;
  }

  const bucketName = resolveFirebaseBucketName();
  const urlParts = imageUrl.split("/");
  const marker = `${bucketName}/`;
  const idx = imageUrl.indexOf(marker);
  let filePath;
  if (idx !== -1) {
    filePath = imageUrl.slice(idx + marker.length);
  } else {
    filePath = urlParts.slice(4).join("/");
  }

  if (!filePath) return;

  const bucket = adminStorage.bucket(bucketName);
  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  if (!exists) {
    console.warn("[firebase storage] skip delete, missing:", filePath);
    return;
  }
  await file.delete();
}

/**
 * Call after Firestore succeeded and the canonical URL/Public ID changed — removes prior Cloudinary or legacy GCS file.
 */
export async function cleanupReplacedImageAsset(previousDoc, nextPayload, assetFieldKeys) {
  const { urlField, publicIdField } = assetFieldKeys;
  const prevUrl = previousDoc?.[urlField];
  const nextUrl = nextPayload?.[urlField];
  if (!prevUrl || !nextUrl || prevUrl === nextUrl) {
    return;
  }

  // Product points at the CMS gallery asset — never delete Cloudinary/File from here.
  if (previousDoc?.sharedGalleryImage) {
    return;
  }

  const prevPid = previousDoc?.[publicIdField];
  if (prevPid) {
    await destroyCloudinaryByPublicId(prevPid);
    return;
  }

  await deleteFirebaseStorageAssetByPublicUrl(prevUrl).catch((err) => {
    console.error("[legacy storage delete]", err);
  });
}

/** Full doc delete — prefer Cloudinary public_id when present. */
export async function deleteStoredImageFromDoc(doc, assetKeys) {
  if (!doc) return;

  // Linked to existing Images collection asset — deleting the product must not erase that blob.
  if (doc.sharedGalleryImage) return;

  const { urlField, publicIdField } = assetKeys;
  const publicId = doc[publicIdField];
  const url = doc[urlField];

  try {
    if (publicId) {
      await destroyCloudinaryByPublicId(publicId);
      return;
    }
    await deleteFirebaseStorageAssetByPublicUrl(url);
  } catch (err) {
    console.error("[stored image delete]", err);
  }
}

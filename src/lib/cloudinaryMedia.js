import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

import { storage as adminStorage } from "@/app/firebaseAdmin";
import { cloudinaryMaxQualityDeliveryUrl } from "@/lib/cloudinaryDeliveryUrl";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/imageUpload";
export {
  MAX_IMAGE_UPLOAD_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  validateImageUpload,
} from "@/lib/imageUpload";

export const CLOUDINARY_FOLDER_IMAGES =
  process.env.CLOUDINARY_FOLDER_IMAGES || "portfolio/cms-images";

export const CLOUDINARY_FOLDER_PRODUCTS =
  process.env.CLOUDINARY_FOLDER_PRODUCTS || "portfolio/products";

function ensureCloudinaryConfigured() {
  const hasTriple =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (!hasTriple) {
    if (!process.env.CLOUDINARY_URL) {
      throw new Error(
        "Cloudinary is not configured: set CLOUDINARY_URL (Dashboard, starts with cloudinary://) or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (server-side only).",
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
  if (buffer.length > MAX_IMAGE_UPLOAD_BYTES) {
    const error = new Error("Image is too large. Maximum upload size is 4 MB.");
    error.status = 413;
    throw error;
  }
  try {
    const metadata = await sharp(buffer, {
      limitInputPixels: 100_000_000,
    }).metadata();
    if (
      !["jpeg", "png", "webp", "avif", "heif", "gif"].includes(metadata.format)
    )
      throw new Error("Unsupported format");
  } catch {
    const error = new Error(
      "Invalid image. Upload a valid JPEG, PNG, WebP, AVIF, or GIF file.",
    );
    error.status = 415;
    throw error;
  }
  ensureCloudinaryConfigured();

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (err, uploadResult) => {
        if (err) reject(err);
        else resolve(uploadResult);
      },
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
  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
  });
  if (result.result !== "ok" && result.result !== "not found") {
    console.warn("[cloudinary] unexpected destroy result:", publicId, result);
  }
  return result;
}

export function resolveFirebaseBucketName() {
  return process.env.FIREBASE_STORAGE_BUCKET || "photography-shop.appspot.com";
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

/** Catalogue changes retain immutable source assets for historical orders. */
export async function cleanupReplacedImageAsset() {
  return { retained: true };
}
export async function deleteStoredImageFromDoc() {
  return { retained: true };
}

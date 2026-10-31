export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export function validateImageUpload(file) {
  function fail(message, status) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
  if (!file || typeof file.arrayBuffer !== "function")
    fail("No image file uploaded.", 400);
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type))
    fail("Unsupported image type. Upload JPEG, PNG, WebP, AVIF, or GIF.", 415);
  if (!Number.isFinite(file.size) || file.size <= 0)
    fail("The uploaded image is empty.", 400);
  if (file.size > MAX_IMAGE_UPLOAD_BYTES)
    fail("Image is too large. Maximum upload size is 4 MB.", 413);
}

/** Client-safe helpers only — do not import firebase-admin or cloudinary SDK here. */

export const CLOUDINARY_CDN_HOST = "res.cloudinary.com";

/**
 * Adds `q_100` to plain Cloudinary delivery URLs (`/image/upload/v…/…`) so delivery
 * does not use automatic quality. URLs that already include transforms are unchanged.
 */
export function cloudinaryMaxQualityDeliveryUrl(url) {
  if (typeof url !== "string" || !url.includes(CLOUDINARY_CDN_HOST)) {
    return url;
  }
  if (/image\/upload\/[^/]*q_/.test(url)) {
    return url;
  }
  const idx = url.indexOf("/image/upload/v");
  if (idx === -1) {
    return url;
  }
  const afterUpload = idx + "/image/upload/".length;
  return `${url.slice(0, afterUpload)}q_100/${url.slice(afterUpload)}`;
}

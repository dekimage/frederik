import Image from "next/image";
import {
  cloudinaryMaxQualityDeliveryUrl,
  CLOUDINARY_CDN_HOST,
} from "@/lib/cloudinaryDeliveryUrl";

/**
 * Photography-friendly delivery: max Cloudinary quality in the URL and no Next/Image
 * re-compression for Cloudinary assets (Next's default quality is 75).
 */
export default function RemotePhotoImage({
  src,
  alt,
  unoptimized,
  quality,
  ...props
}) {
  const resolvedSrc =
    typeof src === "string" ? cloudinaryMaxQualityDeliveryUrl(src) : src;
  const isCloudinary =
    typeof resolvedSrc === "string" && resolvedSrc.includes(CLOUDINARY_CDN_HOST);

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      unoptimized={unoptimized ?? isCloudinary}
      quality={isCloudinary ? 100 : quality}
    />
  );
}

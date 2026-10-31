import { describe, expect, it, vi } from "vitest";
import { v2 as cloudinary } from "cloudinary";
vi.mock("@/app/firebaseAdmin", () => ({ storage: {} }));
import {
  cleanupReplacedImageAsset,
  deleteStoredImageFromDoc,
  uploadImageBuffer,
} from "@/lib/cloudinaryMedia";
import { MAX_IMAGE_UPLOAD_BYTES, validateImageUpload } from "@/lib/imageUpload";

describe("photography asset safety", () => {
  it("retains source files when catalogue images are replaced or removed", async () => {
    const destroy = vi.spyOn(cloudinary.uploader, "destroy");
    await cleanupReplacedImageAsset(
      { image: "old", cloudinaryPublicId: "paid-order-source" },
      { image: "new" },
      { urlField: "image" },
    );
    await deleteStoredImageFromDoc(
      { cloudinaryPublicId: "paid-order-source" },
      {},
    );
    expect(destroy).not.toHaveBeenCalled();
    destroy.mockRestore();
  });
  it("accepts the exact maximum and rejects a single byte over it", () => {
    const file = (size) => ({
      type: "image/jpeg",
      size,
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    expect(() =>
      validateImageUpload(file(MAX_IMAGE_UPLOAD_BYTES)),
    ).not.toThrow();
    expect(() => validateImageUpload(file(MAX_IMAGE_UPLOAD_BYTES + 1))).toThrow(
      "4 MB",
    );
  });
  it("rejects invalid image content before attempting Cloudinary upload", async () => {
    await expect(
      uploadImageBuffer(Buffer.from("not an image"), { folder: "tests" }),
    ).rejects.toMatchObject({ status: 415 });
  });
});

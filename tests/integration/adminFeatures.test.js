import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_UPLOAD_BYTES,
  validateImageUpload,
} from "@/lib/cloudinaryMedia";
import { isProductPublished } from "@/lib/productVisibility";

function fakeFile({ type = "image/jpeg", size = 1024 } = {}) {
  return {
    type,
    size,
    arrayBuffer: async () => new ArrayBuffer(size),
  };
}

describe("admin image upload validation", () => {
  it("accepts supported images within 10 MB", () => {
    expect(() => validateImageUpload(fakeFile())).not.toThrow();
    expect(() =>
      validateImageUpload(fakeFile({ type: "image/webp", size: 5_000_000 }))
    ).not.toThrow();
  });

  it("rejects unsupported formats and oversized files", () => {
    expect(() =>
      validateImageUpload(fakeFile({ type: "image/svg+xml" }))
    ).toThrow(/Unsupported image type/);
    expect(() =>
      validateImageUpload(fakeFile({ size: MAX_IMAGE_UPLOAD_BYTES + 1 }))
    ).toThrow(/Maximum upload size is 10 MB/);
  });
});

describe("product publication", () => {
  it("keeps legacy products published unless explicitly drafted", () => {
    expect(isProductPublished({})).toBe(true);
    expect(isProductPublished({ published: true })).toBe(true);
    expect(isProductPublished({ published: false })).toBe(false);
  });
});

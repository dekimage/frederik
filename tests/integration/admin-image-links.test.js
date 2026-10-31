import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ linked: true, update: vi.fn() }));
vi.mock("@/lib/withAdminRoute", () => ({
  withAdminRoute: (_request, callback) => callback(),
}));
vi.mock("@/lib/cloudinaryMedia", () => ({
  cleanupReplacedImageAsset: vi.fn(async () => {}),
  deleteStoredImageFromDoc: vi.fn(async () => {}),
}));
vi.mock("@/app/firebaseAdmin", () => ({
  FieldValue: { serverTimestamp: () => "timestamp" },
  firestore: {
    collection: (name) => ({
      doc: () => ({
        get: async () => ({
          exists: true,
          data: () => ({
            url: "https://images.example/old.jpg",
            cloudinaryPublicId: "old",
          }),
        }),
        update: state.update,
      }),
      where: () => ({
        get: async () => ({
          empty: !state.linked,
          docs: state.linked
            ? [{ data: () => ({ sharedGalleryImage: true }) }]
            : [],
        }),
      }),
    }),
  },
}));
import { PUT } from "@/app/api/admin/images/[id]/route";
beforeEach(() => {
  state.linked = true;
  state.update.mockReset();
});
describe("linked gallery replacement", () => {
  it("blocks replacing a gallery image used by a product", async () => {
    const request = new Request("http://localhost/api/admin/images/image-1", {
      method: "PUT",
      body: JSON.stringify({ url: "https://images.example/new.jpg" }),
    });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "image-1" }),
    });
    expect(response.status).toBe(409);
    expect(state.update).not.toHaveBeenCalled();
  });
  it("still allows editing the linked image description", async () => {
    const request = new Request("http://localhost/api/admin/images/image-1", {
      method: "PUT",
      body: JSON.stringify({ description: "Updated caption" }),
    });
    expect(
      (await PUT(request, { params: Promise.resolve({ id: "image-1" }) }))
        .status,
    ).toBe(200);
    expect(state.update).toHaveBeenCalled();
  });
});

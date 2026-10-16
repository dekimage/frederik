import { describe, expect, it, vi } from "vitest";
import { startClientCheckout } from "@/lib/payments/startClientCheckout";

const order = { cartItems: [{ productId: "test", quantity: 1 }], billingDetails: { country: "NL" }, shippingDetails: { country: "NL" } };

describe("Client payment handoff (mocked, no payment requests)", () => {
  it("preserves the API contract and redirects using the returned session", async () => {
    const stripe = { redirectToCheckout: vi.fn(async () => ({})) };
    const request = vi.fn(async () => ({ ok: true, json: async () => ({ id: "cs_test_example" }) }));
    await startClientCheckout(stripe, order, request);
    expect(request).toHaveBeenCalledWith("/api/checkout-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) });
    expect(stripe.redirectToCheckout).toHaveBeenCalledWith({ sessionId: "cs_test_example" });
  });
  it("does not create a session if Stripe failed to load", async () => {
    const request = vi.fn();
    await expect(startClientCheckout(null, order, request)).rejects.toThrow("could not load");
    expect(request).not.toHaveBeenCalled();
  });
  it("surfaces server rejection without redirecting", async () => {
    const stripe = { redirectToCheckout: vi.fn() };
    await expect(startClientCheckout(stripe, order, async () => ({ ok: false, json: async () => ({ error: "Delivery unavailable" }) }))).rejects.toThrow("Delivery unavailable");
    expect(stripe.redirectToCheckout).not.toHaveBeenCalled();
  });
  it("provides retry guidance for non-JSON errors", async () => {
    await expect(startClientCheckout({}, order, async () => ({ ok: false, json: async () => { throw new Error("HTML response"); } }))).rejects.toThrow("Please try again");
  });
  it("rejects a success response without a session ID", async () => {
    await expect(startClientCheckout({}, order, async () => ({ ok: true, json: async () => ({}) }))).rejects.toThrow("Unable to open secure payment");
  });
  it("propagates network failure for the inline retry state", async () => {
    await expect(startClientCheckout({}, order, async () => { throw new TypeError("Failed to fetch"); })).rejects.toThrow(TypeError);
  });
  it("surfaces Stripe redirect errors", async () => {
    await expect(startClientCheckout({ redirectToCheckout: async () => ({ error: { message: "Redirect unavailable" } }) }, order, async () => ({ ok: true, json: async () => ({ id: "cs_test_example" }) }))).rejects.toThrow("Redirect unavailable");
  });
});

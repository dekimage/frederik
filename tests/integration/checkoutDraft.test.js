import { describe, it, expect, afterEach, vi } from "vitest";
import { emptyAddress, addressSchema, addressIsSaved, restoreCheckoutDraft, readCheckoutDraft, writeCheckoutDraft, clearCheckoutDraft } from "@/lib/checkoutDraft";

const address = { ...emptyAddress, firstName: "Test", lastName: "Customer", country: "NL", streetAddress1: "Example 1", city: "Amsterdam", postalCode: "1011 AB", email: "test@example.com" };

afterEach(() => vi.unstubAllGlobals());

describe("Checkout address lifecycle", () => {
  it("does not restore saved flags without actual addresses", () => {
    const draft = restoreCheckoutDraft({ shippingDetailsCompleted: true, canProceedToPayment: true });
    expect(draft.shipping).toEqual(emptyAddress);
    expect(addressIsSaved(draft.shipping, draft.savedShipping)).toBe(false);
  });
  it("restores valid saved addresses after cart navigation or refresh", () => {
    const draft = restoreCheckoutDraft(JSON.parse(JSON.stringify({ shipping: address, savedShipping: address })));
    expect(draft.shipping).toEqual(address);
    expect(addressIsSaved(draft.shipping, draft.savedShipping)).toBe(true);
  });
  it("retains unfinished addresses without marking them complete", () => {
    const draft = restoreCheckoutDraft({ shipping: { firstName: "Test" } });
    expect(draft.shipping.firstName).toBe("Test");
    expect(draft.savedShipping).toBeNull();
  });
  it.each(Object.keys(emptyAddress))("requires saving again when %s changes", (field) => {
    expect(addressIsSaved({ ...address, [field]: "changed" }, address)).toBe(false);
  });
  it("rejects a restored saved marker if a required field is missing", () => {
    const incomplete = { ...address, city: "" };
    expect(restoreCheckoutDraft({ shipping: incomplete, savedShipping: incomplete }).savedShipping).toBeNull();
  });
  it("validates US state from restored values, without a dropdown change", () => {
    const us = { ...address, country: "US" };
    expect(addressSchema.isValidSync(us)).toBe(false);
    expect(addressSchema.isValidSync({ ...us, state: "NY" })).toBe(true);
  });
  it("keeps separate billing and its saved state when toggling back", () => {
    const billing = { ...address, streetAddress1: "Invoice Street 2" };
    const draft = restoreCheckoutDraft({ shipping: address, savedShipping: address, billing, savedBilling: billing, isShippingDifferent: true });
    expect(draft.isShippingDifferent).toBe(true);
    expect(addressIsSaved(draft.billing, draft.savedBilling)).toBe(true);
    expect(draft.billing.streetAddress1).not.toBe(draft.shipping.streetAddress1);
  });
  it("handles malformed draft storage and non-string fields", () => {
    vi.stubGlobal("sessionStorage", { getItem: () => "bad json" });
    expect(readCheckoutDraft().savedShipping).toBeNull();
    expect(restoreCheckoutDraft({ shipping: { country: 42 } }).shipping.country).toBe("");
  });
  it("persists only in the current session and clears on confirmed success", () => {
    const storage = new Map();
    vi.stubGlobal("sessionStorage", { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) });
    writeCheckoutDraft({ shipping: address, savedShipping: address });
    expect(readCheckoutDraft().savedShipping).toEqual(address);
    clearCheckoutDraft();
    expect(readCheckoutDraft().shipping).toEqual(emptyAddress);
  });
  it("does not crash if browser storage is unavailable", () => {
    vi.stubGlobal("sessionStorage", { getItem: () => { throw new Error("Blocked"); }, setItem: () => { throw new Error("Blocked"); }, removeItem: () => { throw new Error("Blocked"); } });
    expect(() => writeCheckoutDraft({ shipping: address })).not.toThrow();
    expect(() => clearCheckoutDraft()).not.toThrow();
    expect(readCheckoutDraft().shipping).toEqual(emptyAddress);
  });
});

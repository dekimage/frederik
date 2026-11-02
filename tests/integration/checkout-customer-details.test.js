import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  createCustomer: vi.fn(),
  createSession: vi.fn(),
  addPending: vi.fn(),
  updatePending: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    customers = { create: state.createCustomer };
    checkout = { sessions: { create: state.createSession } };
  },
}));
vi.mock("@/app/firebaseAdmin", () => ({
  firestore: {
    collection(name) {
      if (name === "pendingOrders") return { add: state.addPending };
      if (name === "products")
        return {
          doc: () => ({
            get: async () => ({
              exists: true,
              data: () => ({ name: "Landscape", published: true }),
            }),
          }),
        };
      throw new Error(`Unexpected collection: ${name}`);
    },
  },
}));

import { createCheckoutSession } from "@/lib/payments/createCheckoutSession";

const shipping = {
  firstName: "Gift",
  lastName: "Recipient",
  email: "recipient@example.com",
  streetAddress1: "Shipping street 1",
  city: "Amsterdam",
  postalCode: "1011AB",
  country: "NL",
};
const billing = {
  ...shipping,
  firstName: "Actual",
  lastName: "Buyer",
  email: "buyer@example.com",
  streetAddress1: "Billing street 2",
};
const cartItems = [
  {
    productId: "landscape",
    quantity: 1,
    material: "aluminium",
    sizeKey: "40cmx60cmx0.1cm",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  state.createCustomer.mockResolvedValue({ id: "cus_test" });
  state.createSession.mockResolvedValue({
    id: "cs_test_details",
    payment_intent: null,
  });
  state.addPending.mockResolvedValue({
    id: "pending-order",
    update: state.updatePending,
  });
  state.updatePending.mockResolvedValue(undefined);
});

describe("Stripe invoice customer details", () => {
  it("keeps the billing buyer's name/address separate from the delivery recipient", async () => {
    await createCheckoutSession({
      cartItems,
      billingDetails: billing,
      shippingDetails: shipping,
    });
    expect(state.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Actual Buyer",
        email: "buyer@example.com",
        address: expect.objectContaining({ line1: "Billing street 2" }),
        shipping: expect.objectContaining({
          name: "Gift Recipient",
          address: expect.objectContaining({ line1: "Shipping street 1" }),
        }),
      }),
    );
    expect(state.addPending).toHaveBeenCalledWith(
      expect.objectContaining({
        billingDetails: expect.objectContaining({ name: "Actual Buyer" }),
        shippingDetails: expect.objectContaining({ name: "Gift Recipient" }),
      }),
    );
  });

  it("uses the same buyer details when no separate billing address is supplied", async () => {
    await createCheckoutSession({ cartItems, shippingDetails: shipping });
    expect(state.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Gift Recipient",
        email: "recipient@example.com",
        address: expect.objectContaining({ line1: "Shipping street 1" }),
      }),
    );
  });
});

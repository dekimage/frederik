import { describe, expect, it } from "vitest";
import {
  ORDER_STATUS,
  STRIPE_MODE,
  deriveOrderStatusFromFulfillment,
  deriveStripeMode,
} from "@/lib/orderUtils";

describe("Stripe order mode", () => {
  it("uses the explicit mode stored on new orders", () => {
    expect(deriveStripeMode({ stripeMode: "live" })).toBe(STRIPE_MODE.LIVE);
    expect(deriveStripeMode({ stripeMode: "test" })).toBe(STRIPE_MODE.TEST);
  });

  it("derives mode for existing Checkout Session orders", () => {
    expect(deriveStripeMode({ stripeSessionId: "cs_live_123" })).toBe(
      STRIPE_MODE.LIVE
    );
    expect(deriveStripeMode({ stripeSessionId: "cs_test_123" })).toBe(
      STRIPE_MODE.TEST
    );
  });

  it("does not incorrectly label an unrecognized order", () => {
    expect(deriveStripeMode({ stripeSessionId: "legacy-order" })).toBe(
      STRIPE_MODE.UNKNOWN
    );
  });
});

describe("admin fulfillment status", () => {
  it("moves shipped or delivered orders back to processing when unfulfilled", () => {
    expect(
      deriveOrderStatusFromFulfillment(ORDER_STATUS.SHIPPED, false)
    ).toBe(ORDER_STATUS.PROCESSING);
    expect(
      deriveOrderStatusFromFulfillment(ORDER_STATUS.DELIVERED, false)
    ).toBe(ORDER_STATUS.PROCESSING);
  });

  it("does not override terminal refunded status", () => {
    expect(
      deriveOrderStatusFromFulfillment(ORDER_STATUS.REFUNDED, false)
    ).toBe(ORDER_STATUS.REFUNDED);
  });
});

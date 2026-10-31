import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  document: {},
  send: vi.fn(),
  tail: Promise.resolve(),
}));
function update(values) {
  for (const [key, value] of Object.entries(values)) {
    const parts = key.split(".");
    let cursor = state.document;
    for (const part of parts.slice(0, -1)) cursor = cursor[part] ||= {};
    cursor[parts.at(-1)] = value;
  }
}
vi.mock("@/app/firebaseAdmin", () => {
  const ref = {
    get: async () => ({ data: () => structuredClone(state.document) }),
    update: async (values) => update(values),
  };
  return {
    firestore: {
      collection: () => ({ doc: () => ref }),
      runTransaction: (callback) => {
        const promise = state.tail.then(() =>
          callback({ get: ref.get, update: (_ref, values) => update(values) }),
        );
        state.tail = promise.catch(() => {});
        return promise;
      },
    },
  };
});
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: state.send };
  },
}));
const { sendOrderPaidEmails } = await vi.importActual(
  "@/app/api/checkout-session/email",
);

const order = {
  id: "test-order",
  stripeMode: "test",
  orderStatus: "processing",
  amountSubtotal: 20,
  amountTotal: 20,
  shippingDetails: {
    firstName: "Ship",
    lastName: "Person",
    email: "customer@example.com",
    streetAddress1: "Street 1",
  },
  billingDetails: {
    firstName: "Bill",
    lastName: "Person",
    email: "buyer@example.com",
    streetAddress1: "Billing 2",
  },
  validatedLineItems: [
    {
      name: "Landscape",
      material: "canvas",
      sizeRaw: "40cm",
      quantity: 1,
      lineTotalIncShipping: 20,
    },
  ],
  invoice: {
    receiptUrl: "https://pay.stripe.com/receipts/test",
    hostedInvoiceUrl: "https://invoice.stripe.com/i/test",
    invoicePdf: "https://pay.stripe.com/invoice/test.pdf",
  },
};
beforeEach(() => {
  state.document = {};
  state.tail = Promise.resolve();
  state.send.mockReset();
  state.send.mockImplementation(async (_mail, options) => ({
    data: { id: options.idempotencyKey },
    error: null,
  }));
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("RESEND_FROM_EMAIL", "orders@example.com");
  vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
  vi.stubEnv("NEXT_PUBLIC_URL", "https://shop.example.com");
});

describe("order email reliability and accounting documents", () => {
  it("includes names, both addresses in plain text, test labels, invoice PDFs and admin deep links", async () => {
    await sendOrderPaidEmails(order);
    expect(state.send).toHaveBeenCalledTimes(2);
    const customer = state.send.mock.calls[0][0];
    const admin = state.send.mock.calls[1][0];
    expect(customer.to).toBe("customer@example.com");
    expect(customer.subject).toContain("[TEST");
    expect(admin.subject).toContain("[TEST");
    for (const email of [customer, admin]) {
      expect(email.html).toContain("Ship Person");
      expect(email.html).toContain("Bill Person");
      expect(email.text).toContain("Billing 2");
      expect(email.text).toContain(order.invoice.invoicePdf);
      expect(email.html).toContain(order.invoice.receiptUrl);
      expect(email.html).toContain(order.invoice.hostedInvoiceUrl);
    }
    expect(admin.html).toContain("/admin/orders?orderId=test-order");
  });
  it("does not resend accepted messages on webhook replay", async () => {
    await sendOrderPaidEmails(order);
    await sendOrderPaidEmails(order);
    expect(state.send).toHaveBeenCalledTimes(2);
  });
  it("retries only the failed admin email", async () => {
    state.send.mockImplementation(async (mail, options) =>
      mail.to[0] === "admin@example.com"
        ? { data: null, error: { message: "temporary failure" } }
        : { data: { id: options.idempotencyKey }, error: null },
    );
    await expect(sendOrderPaidEmails(order)).rejects.toThrow(
      "temporary failure",
    );
    state.send.mockImplementation(async (_mail, options) => ({
      data: { id: options.idempotencyKey },
      error: null,
    }));
    await sendOrderPaidEmails(order);
    expect(state.send).toHaveBeenCalledTimes(3);
    expect(state.send.mock.calls[2][0].to).toEqual(["admin@example.com"]);
  });
  it("claims each recipient once under concurrent webhook processing", async () => {
    await Promise.allSettled([
      sendOrderPaidEmails(order),
      sendOrderPaidEmails(order),
    ]);
    expect(state.send).toHaveBeenCalledTimes(2);
  });
  it("requires manual review after the idempotency safety window", async () => {
    state.document = {
      emailDelivery: {
        customer: { firstAttemptAt: Date.now() - 24 * 60 * 60 * 1000 },
      },
    };
    await expect(
      sendOrderPaidEmails(order, { onlyRole: "customer" }),
    ).rejects.toThrow("manual review");
    expect(state.send).not.toHaveBeenCalled();
  });
});

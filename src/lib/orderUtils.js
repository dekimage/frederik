export const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  PAYMENT_FAILED: "payment_failed",
  EXPIRED: "expired",
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING_PAYMENT]: "Pending payment",
  [ORDER_STATUS.PAID]: "Paid",
  [ORDER_STATUS.PROCESSING]: "Processing",
  [ORDER_STATUS.SHIPPED]: "Shipped",
  [ORDER_STATUS.DELIVERED]: "Delivered",
  [ORDER_STATUS.CANCELLED]: "Cancelled",
  [ORDER_STATUS.REFUNDED]: "Refunded",
  [ORDER_STATUS.PAYMENT_FAILED]: "Payment failed",
  [ORDER_STATUS.EXPIRED]: "Expired",
};

export const STRIPE_MODE = {
  LIVE: "live",
  TEST: "test",
  UNKNOWN: "unknown",
};

export function deriveStripeMode(order = {}) {
  if (order.stripeMode === STRIPE_MODE.LIVE || order.stripeMode === STRIPE_MODE.TEST) {
    return order.stripeMode;
  }
  if (typeof order.stripeLivemode === "boolean") {
    return order.stripeLivemode ? STRIPE_MODE.LIVE : STRIPE_MODE.TEST;
  }
  const sessionId = String(order.stripeSessionId || "");
  if (sessionId.startsWith("cs_live_")) return STRIPE_MODE.LIVE;
  if (sessionId.startsWith("cs_test_")) return STRIPE_MODE.TEST;
  return STRIPE_MODE.UNKNOWN;
}

/** Normalize flat checkout form values into one schema for Firestore, emails, and Stripe. */
export function normalizeAddressFormValues(values = {}) {
  const firstName = (values.firstName || "").trim();
  const lastName = (values.lastName || "").trim();
  const country = (values.country || "").toString().trim().toUpperCase().slice(0, 2);
  const streetAddress1 = (values.streetAddress1 || "").trim();
  const streetAddress2 = (values.streetAddress2 || "").trim();
  const city = (values.city || "").trim();
  const state = (values.state || "").trim();
  const postalCode = (values.postalCode || "").trim();
  const email = (values.email || "").trim().toLowerCase();

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email,
    country,
    streetAddress1,
    streetAddress2,
    city,
    state,
    postalCode,
    address: {
      line1: streetAddress1,
      line2: streetAddress2,
      city,
      state,
      postal_code: postalCode,
      country,
    },
  };
}

export function toStripeAddress(details = {}) {
  const normalized =
    details.address?.line1 != null
      ? details
      : normalizeAddressFormValues(details);

  return {
    line1: normalized.address.line1,
    line2: normalized.address.line2 || undefined,
    city: normalized.address.city,
    state: normalized.address.state || undefined,
    postal_code: normalized.address.postal_code,
    country: normalized.address.country,
  };
}

export function formatAddressLines(details = {}) {
  if (!details || typeof details !== "object") return [];

  const line1 = details.streetAddress1 || details.address?.line1;
  const line2 = details.streetAddress2 || details.address?.line2;
  const city = details.city || details.address?.city;
  const state = details.state || details.address?.state;
  const postalCode = details.postalCode || details.address?.postal_code;
  const country = details.country || details.address?.country;

  const cityLine = [city, state, postalCode].filter(Boolean).join(", ");

  return [line1, line2, cityLine, country].filter(Boolean);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatAddressHtml(details = {}) {
  const lines = formatAddressLines(details);
  if (lines.length === 0) return "Address details not available";
  return lines.map(escapeHtml).join("<br>");
}

export function formatCurrencyEUR(value) {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  if (typeof amount !== "number" || Number.isNaN(amount)) return "€0.00";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function orderEmailMatches(order, email) {
  const target = (email || "").trim().toLowerCase();
  if (!target) return false;

  const candidates = [
    order.shippingDetails?.email,
    order.billingDetails?.email,
    order.customerEmail,
  ]
    .filter(Boolean)
    .map((e) => e.toString().trim().toLowerCase());

  return candidates.includes(target);
}

export function deriveOrderStatusFromFulfillment(orderStatus, isFulfilled) {
  if (orderStatus === ORDER_STATUS.REFUNDED) return ORDER_STATUS.REFUNDED;
  if (orderStatus === ORDER_STATUS.CANCELLED) return ORDER_STATUS.CANCELLED;
  if (orderStatus === ORDER_STATUS.PAYMENT_FAILED) return ORDER_STATUS.PAYMENT_FAILED;
  if (isFulfilled) return ORDER_STATUS.SHIPPED;
  if (
    orderStatus === ORDER_STATUS.SHIPPED ||
    orderStatus === ORDER_STATUS.DELIVERED
  ) {
    return ORDER_STATUS.PROCESSING;
  }
  return ORDER_STATUS.PROCESSING;
}

export function sanitizeOrderForCustomer(order) {
  return {
    id: order.id,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    amountSubtotal: order.amountSubtotal,
    amountTax: order.amountTax,
    amountTotal: order.amountTotal,
    currency: order.currency || "eur",
    shippingDetails: {
      name: order.shippingDetails?.name,
      country: order.shippingDetails?.country,
      city: order.shippingDetails?.city,
      postalCode: order.shippingDetails?.postalCode,
    },
    validatedLineItems: (order.validatedLineItems || []).map((item) => ({
      name: item.name,
      material: item.material,
      sizeRaw: item.sizeRaw,
      quantity: item.quantity,
      unitPriceIncShipping: item.unitPriceIncShipping,
      lineTotalIncShipping: item.lineTotalIncShipping,
    })),
    invoice: order.invoice
      ? {
          receiptUrl: order.invoice.receiptUrl,
          createdAt: order.invoice.createdAt,
        }
      : null,
  };
}

import { firestore } from "@/app/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { deriveStripeMode } from "@/lib/orderUtils";

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request) {
  const authResult = await requireAdmin(request);
  if (authResult.response) return authResult.response;

  try {
    const requestedMode = new URL(request.url).searchParams.get("mode") || "all";
    const snapshot = await firestore.collection("orders").get();
    const orders = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((order) => !order.archivedAt)
      .filter((order) => {
        if (requestedMode === "all") return true;
        return deriveStripeMode(order) === requestedMode;
      })
      .sort(
        (a, b) =>
          (asDate(b.createdAt)?.getTime() || 0) -
          (asDate(a.createdAt)?.getTime() || 0)
      );

    const headers = [
      "Order ID",
      "Created",
      "Stripe mode",
      "Payment status",
      "Order status",
      "Fulfilled",
      "Customer name",
      "Customer email",
      "Country",
      "Amount total",
      "Currency",
      "Stripe session ID",
      "Stripe payment intent ID",
      "Email delivery",
    ];

    const rows = orders.map((order) => {
      const customer = order.shippingDetails || order.billingDetails || {};
      const name =
        customer.name ||
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
      return [
        order.id,
        asDate(order.createdAt)?.toISOString() || "",
        deriveStripeMode(order),
        order.paymentStatus || "",
        order.orderStatus || "",
        order.isFulfilled ? "yes" : "no",
        name,
        customer.email || order.customerEmail || "",
        customer.country || customer.address?.country || "",
        Number(order.amountTotal || 0).toFixed(2),
        String(order.currency || "eur").toUpperCase(),
        order.stripeSessionId || "",
        order.stripePaymentIntentId || "",
        order.emailDelivery?.status || "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const date = new Date().toISOString().slice(0, 10);

    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wolfskin-orders-${date}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Order CSV export failed:", error);
    return Response.json({ error: "Unable to export orders." }, { status: 500 });
  }
}

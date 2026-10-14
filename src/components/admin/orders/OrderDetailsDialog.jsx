import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cloudinaryMaxQualityDeliveryUrl } from "@/lib/cloudinaryDeliveryUrl";
import { KOR_INVOICE_NOTICE } from "@/lib/korVat";
import {
  formatAddressLines,
  formatCurrencyEUR,
  ORDER_STATUS_LABELS,
  STRIPE_MODE,
  deriveStripeMode,
} from "@/lib/orderUtils";

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "PPP");
  } catch (error) {
    return "No date available";
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "No date available";
  try {
    const date =
      typeof timestamp === "string"
        ? new Date(timestamp)
        : new Date(timestamp._seconds * 1000);
    return format(date, "PPP");
  } catch (error) {
    return "Invalid date";
  }
};

export default function OrderDetailsDialog({ order, open, onOpenChange }) {
  const stripeMode = deriveStripeMode(order);
  const fullName = (details) => {
    if (!details) return "N/A";
    return (
      `${details.firstName || ""} ${details.lastName || ""}`.trim() || "N/A"
    );
  };

  const lineItems = order.validatedLineItems?.length
    ? order.validatedLineItems
    : order.cartItems || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] font-mono">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Order ID:</span> {order.id || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Created:</span>{" "}
                    {formatDate(order.createdAt)}
                  </p>
                  <p>
                    <span className="font-medium">Paid At:</span>{" "}
                    {formatTimestamp(order.paidAt)}
                  </p>
                  <p>
                    <span className="font-medium">Payment Status:</span>{" "}
                    {order.paymentStatus || "pending"}
                  </p>
                  <p>
                    <span className="font-medium">Stripe mode:</span>{" "}
                    <span
                      className={
                        stripeMode === STRIPE_MODE.LIVE
                          ? "font-bold text-green-700 dark:text-green-400"
                          : stripeMode === STRIPE_MODE.TEST
                            ? "font-bold text-amber-700 dark:text-amber-400"
                            : "font-bold text-muted-foreground"
                      }
                    >
                      {stripeMode.toUpperCase()}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Order Status:</span>{" "}
                    {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Order emails:</span>{" "}
                    <span
                      className={
                        order.emailDelivery?.status === "sent"
                          ? "font-medium text-green-700 dark:text-green-400"
                          : order.emailDelivery?.status === "failed"
                            ? "font-medium text-destructive"
                            : "text-muted-foreground"
                      }
                    >
                      {(order.emailDelivery?.status || "not recorded").toUpperCase()}
                    </span>
                  </p>
                  {order.emailDelivery?.lastError ? (
                    <p className="text-xs text-destructive">
                      Email error: {order.emailDelivery.lastError}
                    </p>
                  ) : null}
                  <p>
                    <span className="font-medium">Subtotal:</span>{" "}
                    {formatCurrencyEUR(order.amountSubtotal ?? order.subtotal)}
                  </p>
                  <p>
                    <span className="font-medium">VAT:</span> Not charged (KOR)
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {KOR_INVOICE_NOTICE}
                  </p>
                  <p>
                    <span className="font-medium">Total Amount:</span>{" "}
                    {formatCurrencyEUR(order.amountTotal)}
                  </p>
                </div>
              </div>
            </div>

            {order.billingDetails && (
              <div>
                <h3 className="font-semibold mb-2">Billing Details</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {fullName(order.billingDetails)}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {order.billingDetails.email || "N/A"}
                  </p>
                  <div className="mt-2">
                    <span className="font-medium">Address:</span>
                    {formatAddressLines(order.billingDetails).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {order.shippingDetails && (
              <div>
                <h3 className="font-semibold mb-2">Shipping Details</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {fullName(order.shippingDetails)}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {order.shippingDetails.email || "N/A"}
                  </p>
                  <div className="mt-2">
                    <span className="font-medium">Address:</span>
                    {formatAddressLines(order.shippingDetails).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {lineItems.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="grid gap-4">
                  {lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 border rounded-lg p-4"
                    >
                      {item.image ? (
                        <div className="w-20 h-20 relative rounded-md overflow-hidden">
                          <img
                            src={cloudinaryMaxQualityDeliveryUrl(item.image)}
                            alt={item.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : null}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name || item.productId}</h4>
                        <div className="mt-1 text-sm">
                          <span className="font-medium">Options:</span>{" "}
                          {item.material || "N/A"} · {item.sizeRaw || item.size || item.sizeKey}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Quantity:</span> {item.quantity}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Line total:</span>{" "}
                          {formatCurrencyEUR(
                            item.lineTotalIncShipping ??
                              Number(item.unitPriceIncShipping || item.price) *
                                Number(item.quantity || 1)
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.invoice ? (
              <div className="text-sm">
                <h3 className="font-semibold mb-2">Invoice / Receipt</h3>
                {order.invoice.hasHtml ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={`/api/admin/orders/${order.id}/invoice`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open HTML invoice
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/admin/orders/${order.id}/invoice?download=1`}>
                        Download HTML
                      </a>
                    </Button>
                  </div>
                ) : null}
                {order.invoice.receiptUrl ? (
                  <p>
                    <a
                      href={order.invoice.receiptUrl}
                      className="text-primary underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Stripe receipt
                    </a>
                  </p>
                ) : null}
                <p className="text-muted-foreground mt-2">
                  HTML invoice stored in Firestore on {formatTimestamp(order.invoice.createdAt)}
                </p>
              </div>
            ) : null}

            {order.statusHistory?.length ? (
              <div>
                <h3 className="font-semibold mb-2">Status history</h3>
                <div className="text-sm space-y-2">
                  {order.statusHistory.map((entry, index) => (
                    <p key={index}>
                      {entry.at}: {ORDER_STATUS_LABELS[entry.status] || entry.status}
                      {entry.note ? ` — ${entry.note}` : ""}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {order.stripeSessionId && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Stripe Session ID:</span>{" "}
                {order.stripeSessionId}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

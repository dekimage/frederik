import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

// Helper function to format currency
const formatCurrency = (value) => {
  if (typeof value === "string") {
    value = parseFloat(value);
  }
  return typeof value === "number" && !isNaN(value)
    ? `$${value.toFixed(2)}`
    : "$0.00";
};

// Helper function to format date
const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "PPP");
  } catch (error) {
    return "No date available";
  }
};

// Helper function to format Firestore timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "No date available";
  try {
    const date = new Date(timestamp._seconds * 1000);
    return format(date, "PPP");
  } catch (error) {
    return "Invalid date";
  }
};

export default function OrderDetailsDialog({ order, open, onOpenChange }) {
  const fullName = (details) => {
    if (!details) return "N/A";
    return (
      `${details.firstName || ""} ${details.lastName || ""}`.trim() || "N/A"
    );
  };

  const formatAddress = (details) => {
    if (!details) return [];
    return [
      details.streetAddress1,
      details.streetAddress2,
      details.city,
      details.state,
      details.country,
    ].filter(Boolean);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] font-mono">
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Order ID:</span>{" "}
                    {order.id || "N/A"}
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
                    <span className="font-medium">Payment Status:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        order.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.paymentStatus || "pending"}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Total Amount:</span>{" "}
                    {formatCurrency(order.amountTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Details */}
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
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {order.billingDetails.phone || "N/A"}
                  </p>
                  {order.billingDetails.companyName && (
                    <p>
                      <span className="font-medium">Company:</span>{" "}
                      {order.billingDetails.companyName}
                    </p>
                  )}
                  <div className="mt-2">
                    <span className="font-medium">Address:</span>
                    {formatAddress(order.billingDetails).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Details */}
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
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {order.shippingDetails.phone || "N/A"}
                  </p>
                  {order.shippingDetails.companyName && (
                    <p>
                      <span className="font-medium">Company:</span>{" "}
                      {order.shippingDetails.companyName}
                    </p>
                  )}
                  <div className="mt-2">
                    <span className="font-medium">Address:</span>
                    {formatAddress(order.shippingDetails).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  {order.shippingDetails.orderNotes && (
                    <div className="mt-2">
                      <span className="font-medium">Order Notes:</span>
                      <p>{order.shippingDetails.orderNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            {order.cartItems?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="grid gap-4">
                  {order.cartItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 border rounded-lg p-4"
                    >
                      <div className="w-20 h-20 relative rounded-md overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          {item.description}
                        </p>
                        <div className="mt-1 text-sm">
                          <span className="font-medium">Size:</span> {item.size}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Quantity:</span>{" "}
                          {item.quantity}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Price:</span>{" "}
                          {formatCurrency(item.price)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Total:</span>{" "}
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stripe Session ID */}
            {order.stripeSessionId && (
              <div className="text-sm text-gray-500">
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

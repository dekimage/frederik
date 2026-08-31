"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrencyEUR, ORDER_STATUS_LABELS } from "@/lib/orderUtils";

export default function TrackOrderClient() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const initialOrderId = searchParams.get("orderId");
    if (initialOrderId) setOrderId(initialOrderId);
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to find that order.");
        return;
      }

      setOrder(data.order);
    } catch {
      setError("Unable to look up your order right now.");
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = order
    ? ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus
    : "";

  return (
    <div className="bg-black text-white min-h-screen px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-3 text-center">Track your order</h1>
        <p className="text-center text-gray-400 mb-8">
          Enter your order ID and the email address used at checkout.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4"
        >
          <div>
            <label htmlFor="orderId" className="block text-sm text-gray-300 mb-2">
              Order ID
            </label>
            <Input
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
          {error ? <p className="text-red-400 text-sm">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Looking up…" : "Track order"}
          </Button>
        </form>

        {order ? (
          <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Order {order.id}</h2>
            <div className="space-y-2 text-sm text-gray-300 mb-6">
              <p>
                <span className="text-gray-400">Status:</span> {statusLabel}
              </p>
              <p>
                <span className="text-gray-400">Payment:</span>{" "}
                {order.paymentStatus || "N/A"}
              </p>
              <p>
                <span className="text-gray-400">Total paid:</span>{" "}
                {formatCurrencyEUR(order.amountTotal)}
              </p>
              {order.shippingDetails ? (
                <p>
                  <span className="text-gray-400">Ship to:</span>{" "}
                  {[order.shippingDetails.city, order.shippingDetails.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : null}
            </div>

            <h3 className="font-medium mb-3">Items</h3>
            <div className="space-y-3">
              {(order.validatedLineItems || []).map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex justify-between gap-4 border-t border-gray-800 pt-3 text-sm"
                >
                  <span>
                    {item.name} ({item.sizeRaw}) × {item.quantity}
                  </span>
                  <span>{formatCurrencyEUR(item.lineTotalIncShipping)}</span>
                </div>
              ))}
            </div>

            {order.invoice?.receiptUrl ? (
              <p className="mt-6">
                <a
                  href={order.invoice.receiptUrl}
                  className="text-blue-400 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View payment receipt
                </a>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="text-center mt-8">
          <Link href="/" className="text-gray-400 underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

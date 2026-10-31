"use client";
import { useLanguage as useStorefrontLanguage } from "@/contexts/LanguageContext";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrencyEUR, ORDER_STATUS_LABELS } from "@/lib/orderUtils";
import OrderDocuments from "@/components/OrderDocuments";

export default function TrackOrderClient() {
  const { t: tr, language } = useStorefrontLanguage();
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
        setError(data.error || tr("Unable to find that order."));
        return;
      }

      setOrder(data.order);
    } catch {
      setError(tr("Unable to look up your order right now."));
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
        <h1 className="text-3xl font-semibold mb-3 text-center">
          {" "}
          {tr("Track your order")}{" "}
        </h1>
        <p className="text-center text-gray-400 mb-8">
          {" "}
          {tr(
            "Enter your order ID and the email address used at checkout.",
          )}{" "}
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="orderId"
              className="block text-sm text-gray-300 mb-2"
            >
              {" "}
              {tr("Order ID")}{" "}
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
              {" "}
              {tr("Email")}{" "}
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
          {error ? <p className="text-red-400 text-sm">{tr(error)}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? tr("Looking up\u2026") : tr("Track order")}
          </Button>
        </form>

        {order ? (
          <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
            <OrderDocuments invoice={order.invoice} />
            <h2 className="text-xl font-semibold mb-4">
              {" "}
              {tr("Order")} {order.id}
            </h2>
            <div className="space-y-2 text-sm text-gray-300 mb-6">
              <p>
                <span className="text-gray-400"> {tr("Status:")} </span>{" "}
                {tr(statusLabel)}
              </p>
              <p>
                <span className="text-gray-400"> {tr("Payment:")} </span>{" "}
                {tr(order.paymentStatus || "N/A")}
              </p>
              <p>
                <span className="text-gray-400"> {tr("Total paid:")} </span>{" "}
                {formatCurrencyEUR(order.amountTotal)}
              </p>
              {order.shippingDetails ? (
                <p>
                  <span className="text-gray-400"> {tr("Ship to:")} </span>{" "}
                  {[order.shippingDetails.city, order.shippingDetails.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : null}
            </div>

            <h3 className="font-medium mb-3"> {tr("Items")} </h3>
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
                  {" "}
                  {tr("View payment receipt")}{" "}
                </a>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="text-center mt-8">
          <Link href="/" className="text-gray-400 underline">
            {" "}
            {tr("Back to home")}{" "}
          </Link>
        </div>
      </div>
    </div>
  );
}

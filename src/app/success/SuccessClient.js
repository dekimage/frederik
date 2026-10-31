"use client";
import { useLanguage as useStorefrontLanguage } from "@/contexts/LanguageContext";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { clearCheckoutDraft } from "@/lib/checkoutDraft";
import MobxStore from "@/mobx";
import { Button } from "@/components/ui/button";
import { formatCurrencyEUR, ORDER_STATUS_LABELS } from "@/lib/orderUtils";
import OrderDocuments from "@/components/OrderDocuments";

function SuccessContent() {
  const { t: tr, language } = useStorefrontLanguage();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [state, setState] = useState({
    loading: true,
    verified: false,
    pendingFulfillment: false,
    error: null,
    order: null,
  });

  useEffect(() => {
    if (!sessionId) {
      setState({
        loading: false,
        verified: false,
        pendingFulfillment: false,
        error:
          "Missing payment session. If you completed payment, check your email for confirmation.",

        order: null,
      });
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(
          `/api/orders/verify-session?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = await response.json();

        if (response.status === 202 && data.verified) {
          setState({
            loading: false,
            verified: true,
            pendingFulfillment: true,
            error: null,
            order: null,
          });
          MobxStore.clearCart();
          clearCheckoutDraft();
          return;
        }

        if (!response.ok || !data.verified) {
          setState({
            loading: false,
            verified: false,
            pendingFulfillment: false,
            error:
              data.message || data.error || "Payment could not be verified.",
            order: null,
          });
          return;
        }

        setState({
          loading: false,
          verified: true,
          pendingFulfillment: false,
          error: null,
          order: data.order,
        });
        MobxStore.clearCart();
        clearCheckoutDraft();
      } catch {
        setState({
          loading: false,
          verified: false,
          pendingFulfillment: false,
          error: "Unable to verify your payment right now.",
          order: null,
        });
      }
    };

    verify();
  }, [sessionId]);

  if (state.loading) {
    return (
      <div className="text-center text-white h-screen flex justify-center items-center flex-col px-6">
        <h1 className="text-3xl font-bold mb-4">
          {" "}
          {tr("Verifying payment\u2026")}{" "}
        </h1>
        <p className="text-gray-400">
          {" "}
          {tr("Please wait while we confirm your order.")}{" "}
        </p>
      </div>
    );
  }

  if (!state.verified) {
    return (
      <div className="text-center text-white h-screen flex justify-center items-center flex-col px-6 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          {" "}
          {tr("Payment not confirmed")}{" "}
        </h1>
        <p className="text-gray-300 mb-8">{tr(state.error)}</p>
        <div className="flex gap-4">
          <Link href="/cart">
            <Button variant="outline"> {tr("Back to cart")} </Button>
          </Link>
          <Link href="/">
            <Button> {tr("Home")} </Button>
          </Link>
        </div>
      </div>
    );
  }

  const order = state.order;
  const statusLabel = order
    ? ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus
    : tr("Processing");

  return (
    <div className="text-white min-h-screen flex justify-center items-center px-6 py-24">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">
          {" "}
          {tr("Payment successful")}{" "}
        </h1>
        <p className="text-gray-300 mb-6">
          {" "}
          {tr(
            "Thank you for your purchase. Your order is being prepared.",
          )}{" "}
        </p>

        {order ? (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-left mb-8">
            <OrderDocuments invoice={order.invoice} />
            <p className="mb-2">
              <span className="text-gray-400"> {tr("Order ID:")} </span>{" "}
              <strong>{order.id}</strong>
            </p>
            <p className="mb-2">
              <span className="text-gray-400"> {tr("Status:")} </span>{" "}
              {tr(statusLabel)}
            </p>
            <p className="mb-2">
              <span className="text-gray-400"> {tr("Total paid:")} </span>{" "}
              {formatCurrencyEUR(order.amountTotal)}
            </p>
            {order.invoice?.receiptUrl ? (
              <p className="mt-4">
                <a
                  href={order.invoice.receiptUrl}
                  className="text-blue-400 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {" "}
                  {tr("View Stripe receipt")}{" "}
                </a>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-gray-400 mb-8">
            {state.pendingFulfillment
              ? tr(
                  "Your payment is confirmed. Order details will arrive by email shortly.",
                )
              : tr("Check your email for order details.")}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {order ? (
            <Link href={`/track-order?orderId=${encodeURIComponent(order.id)}`}>
              <Button> {tr("Track order")} </Button>
            </Link>
          ) : (
            <Link href="/track-order">
              <Button> {tr("Track order")} </Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="outline"> {tr("Back to home")} </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const SuccessClient = observer(() => <SuccessContent />);

export default SuccessClient;

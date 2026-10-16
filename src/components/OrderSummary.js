"use client";
import Link from "next/link";
import styles from "@/app/checkout/checkout.module.css";
import {
  materialLabel,
  quoteOrderForShippingCountry,
  getCountryLabel,
  isSupportedShippingCountry,
} from "@/lib/pricingCatalog";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrencyEUR } from "@/lib/orderUtils";

const OrderSummary = ({ cartItems, shippingCountryCode = "" }) => {
  const { t } = useLanguage();

  const lines = (cartItems || []).map((item) => ({
    quantity: item.quantity,
    material: item.material,
    sizeKey: item.sizeKey,
  }));

  const printSubtotalFromCart = (cartItems || []).reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0
  );

  const cc = (shippingCountryCode || "").toString().trim().toUpperCase();
  const hasCountry = cc.length === 2;
  const quoted = hasCountry
    ? quoteOrderForShippingCountry(lines, cc)
    : null;

  const posterSubtotal =
    quoted && quoted.ok ? quoted.printSum : printSubtotalFromCart;
  const shippingSubtotal =
    quoted && quoted.ok ? quoted.shippingSum : null;
  const merchandiseWithShipping =
    quoted && quoted.ok ? quoted.totalSum : printSubtotalFromCart;

  const unsupportedCountry =
    hasCountry && !isSupportedShippingCountry(cc);
  const variantUnavailable =
    quoted &&
    hasCountry &&
    !quoted.ok &&
    quoted.reason !== "unsupported_country" &&
    quoted.unavailable.length > 0;

  return (
    <section className={styles.orderSummary} aria-labelledby="order-summary-heading">
      <div className={styles.summaryHeading}><h2 id="order-summary-heading">Your order</h2><Link href="/cart">Edit cart</Link></div>
      <div className="space-y-4">
        {(cartItems || []).map((item) => (
          <div
            key={`${item.productId}-${item.sizeKey}-${item.material}`}
            className="flex justify-between py-2 text-gray-300 gap-4"
          >
            <span>
              {item.name} ({materialLabel(item.material)} · {item.size}) ×{" "}
              {item.quantity}
            </span>
            <span className="font-medium shrink-0">
              {formatCurrencyEUR(Number(item.price) * item.quantity)}
            </span>
          </div>
        ))}
        <p className="text-xs text-gray-400 font-sans">
          {t("shippingCoverageOrderSummaryLines")}
        </p>
        <div className="border-t border-gray-700 my-4"></div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Totals for payment
        </h3>
        <div className="space-y-2 text-sm text-gray-300 mb-4 tabular-nums">
          <div className="flex justify-between gap-4">
            <span className="text-left shrink leading-snug">
              Prints
            </span>
            <span>{formatCurrencyEUR(posterSubtotal)}</span>
          </div>
          {hasCountry && quoted?.ok ? (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-left shrink">
                  Delivery ({getCountryLabel(cc)})
                </span>
                <span>{formatCurrencyEUR(Number(shippingSubtotal))}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-amber-200/90 leading-relaxed pt-1 font-sans">
              {unsupportedCountry
                ? t("checkoutPaymentBlockedUnsupported")
                : variantUnavailable
                  ? t("shippingCoverageOrderSummaryUnavailable")
                  : t("shippingCoverageOrderSummaryChooseCountry")}
            </p>
          )}
        </div>

        <div className="flex justify-between text-xl font-semibold py-4 border-t border-gray-700">
          <span>{quoted?.ok ? "Total" : "Print subtotal"}</span>
          <span>{formatCurrencyEUR(merchandiseWithShipping)}</span>
        </div>
        <p className="text-xs text-gray-400 -mt-2 pb-2 font-sans">
          {quoted?.ok ? t("checkoutTotalIsFinal") : "Delivery is calculated after you select your country."}
        </p>
        <p className="text-xs text-gray-400 pb-2 font-sans">
          {t("shippingCoverageOrderSummaryStripeNote")}
        </p>
      </div>
    </section>
  );
};

export default OrderSummary;

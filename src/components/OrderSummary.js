"use client";
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
    <div className="bg-gray-900 p-6 rounded-lg text-white border border-gray-700">
      <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>
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
        <p className="text-xs text-gray-500 font-sans">
          {t("shippingCoverageOrderSummaryLines")}
        </p>
        <div className="border-t border-gray-700 my-4"></div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Totals for payment
        </h3>
        <div className="space-y-2 text-sm text-gray-300 mb-4 tabular-nums">
          <div className="flex justify-between gap-4">
            <span className="text-left shrink leading-snug">
              Poster print (Σ qty)
            </span>
            <span>{formatCurrencyEUR(posterSubtotal)}</span>
          </div>
          {hasCountry && quoted?.ok ? (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-left shrink">
                  Postal / delivery ({getCountryLabel(cc)})
                </span>
                <span>{formatCurrencyEUR(Number(shippingSubtotal))}</span>
              </div>
              <div className="flex justify-between gap-4 font-semibold text-white pt-2 border-t border-gray-700">
                <span className="text-left shrink leading-snug">
                  Merchandise including delivery
                </span>
                <span>{formatCurrencyEUR(merchandiseWithShipping)}</span>
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
          <span>Merchandise subtotal</span>
          <span>{formatCurrencyEUR(merchandiseWithShipping)}</span>
        </div>
        <p className="text-xs text-gray-500 -mt-2 pb-2 font-sans">
          VAT / tax is calculated by Stripe at payment based on your shipping
          address. The final amount may differ slightly from this merchandise
          subtotal.
        </p>
        <p className="text-xs text-gray-500 pb-2 font-sans">
          {t("shippingCoverageOrderSummaryStripeNote")}
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;

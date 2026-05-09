"use client";
import {
  materialLabel,
  quoteOrderForShippingCountry,
  getCountryLabel,
} from "@/lib/pricingCatalog";

const OrderSummary = ({
  cartItems,
  shippingCountryCode = "",
  taxRate,
}) => {
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

  const taxBase = merchandiseWithShipping;
  const estimateTax = () => (taxBase * taxRate).toFixed(2);
  const estimateTotal = () =>
    (merchandiseWithShipping + parseFloat(estimateTax())).toFixed(2);

  const countryUnavailable =
    quoted && hasCountry && !quoted.ok && quoted.unavailable.length > 0;

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
              €{(Number(item.price) * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
        <p className="text-xs text-gray-500">
          Line amounts are list print prices; delivery is added below when your
          shipping country is known.
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
            <span>€{posterSubtotal.toFixed(2)}</span>
          </div>
          {hasCountry && quoted?.ok ? (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-left shrink">
                  Postal / delivery ({getCountryLabel(cc)})
                </span>
                <span>€{Number(shippingSubtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4 font-semibold text-white pt-2 border-t border-gray-700">
                <span className="text-left shrink leading-snug">
                  Merchandise including delivery
                </span>
                <span>€{merchandiseWithShipping.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-amber-200/90 leading-relaxed pt-1">
              {hasCountry && countryUnavailable
                ? `One or more lines are not available for ${getCountryLabel(cc)}. Adjust the cart or choose another destination.`
                : "Choose your shipping country in the form to show delivery and the full merchandise total."}
            </p>
          )}
        </div>

        <div className="flex justify-between py-2 text-gray-300 text-sm border-t border-gray-700 pt-4">
          <span>Estimated tax ({(taxRate * 100).toFixed(0)}%)</span>
          <span>€{estimateTax()}</span>
        </div>
        <div className="flex justify-between text-xl font-semibold py-4 border-t border-gray-700">
          <span>Amount due (estimate)</span>
          <span>€{estimateTotal()}</span>
        </div>
        <p className="text-xs text-gray-500 -mt-2 pb-2">
          Stripe may recalculate tax from your billing address at payment.
          Poster line items on Stripe use your shipping country price list
          (print + postal per unit).
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;

"use client";
import { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import BillingDetailsForm from "@/components/BillingDetailsForm";
import OrderSummary from "@/components/OrderSummary";
import PaymentButton from "@/components/PaymentButton";
import MobxStore from "@/mobx";
import { quoteOrderForShippingCountry, isSupportedShippingCountry } from "@/lib/pricingCatalog";
import { useLanguage } from "@/contexts/LanguageContext";

const CheckoutForm = observer(() => {
  const [isShippingDifferent, setIsShippingDifferent] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({});
  const [billingDetails, setBillingDetails] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [shippingCountryEstimate, setShippingCountryEstimate] = useState("");

  const { setIsShippingDifferent: setMobxIsShippingDifferent } = MobxStore;
  const { t } = useLanguage();

  useEffect(() => {
    const fetchCartProducts = async () => {
      const products = await MobxStore.getCartProducts();
      setCartItems(products);
    };

    fetchCartProducts();
  }, []);

  const effectiveShippingCountry =
    (shippingDetails.country || shippingCountryEstimate || "")
      .toString()
      .trim()
      .toUpperCase() || "";

  const quotedCheckout = useMemo(() => {
    const lines = cartItems.map((item) => ({
      quantity: item.quantity,
      material: item.material,
      sizeKey: item.sizeKey,
    }));
    return quoteOrderForShippingCountry(lines, effectiveShippingCountry);
  }, [cartItems, effectiveShippingCountry]);

  const paymentReady =
    effectiveShippingCountry.length === 2 && quotedCheckout?.ok;

  const handleShippingDifferentChange = (e) => {
    const newValue = e.target.checked;
    setIsShippingDifferent(newValue);
    setMobxIsShippingDifferent(newValue);
    if (!newValue) {
      MobxStore.setBillingDetailsCompleted(true);
    } else {
      MobxStore.setBillingDetailsCompleted(false);
    }
  };

  const handleShippingSubmit = (details) => {
    setShippingDetails(details);
    if (details?.country) {
      setShippingCountryEstimate(
        details.country.toString().trim().toUpperCase()
      );
    }
    MobxStore.setShippingDetailsCompleted(true);
    if (!isShippingDifferent) {
      setBillingDetails(details);
      MobxStore.setBillingDetailsCompleted(true);
    }
  };

  const handleBillingSubmit = (details) => {
    setBillingDetails(details);
    MobxStore.setBillingDetailsCompleted(true);
  };

  return (
    <div className="bg-black text-white mt-16 p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-3 text-center">Checkout</h1>
        <p className="text-center text-sm text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed font-sans">
          {t("shippingCoverageCheckoutIntro")}
        </p>
        <div className="flex gap-8 flex-col lg:flex-row mt-8">
          <BillingDetailsForm
            formTitle="Shipping Details"
            isShipping={true}
            onSubmit={handleShippingSubmit}
            onCountryChange={(cc) =>
              setShippingCountryEstimate(
                (cc || "").toString().trim().toUpperCase()
              )
            }
          />

          <div className="w-full">
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  checked={isShippingDifferent}
                  onChange={handleShippingDifferentChange}
                />
                <span className="text-gray-300">
                  Use different billing address
                </span>
              </label>
            </div>

            {isShippingDifferent && (
              <div className="mt-6">
                <BillingDetailsForm
                  formTitle="Billing Details"
                  isShipping={false}
                  onSubmit={handleBillingSubmit}
                />
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-8">
          <OrderSummary
            cartItems={cartItems}
            shippingCountryCode={effectiveShippingCountry}
          />
        </div>

        {/* Payment Button */}
        {MobxStore.canProceedToPayment && (
          <div className="mt-8 flex flex-col items-stretch max-w-md mx-auto">
            {!paymentReady && (
              <p className="text-center text-amber-400 text-sm mb-3 leading-relaxed font-sans">
                {effectiveShippingCountry.length === 2 &&
                !isSupportedShippingCountry(effectiveShippingCountry)
                  ? t("checkoutPaymentBlockedUnsupported")
                  : effectiveShippingCountry.length === 2 && !quotedCheckout?.ok
                    ? t("shippingCoverageOrderSummaryUnavailable")
                    : t("checkoutPaymentBlockedMissing")}
              </p>
            )}
            {paymentReady && (
              <p className="text-center text-gray-400 text-sm mb-3 leading-relaxed font-sans">
                {effectiveShippingCountry === "NL"
                  ? t("checkoutPaymentMethodsNl")
                  : t("checkoutPaymentMethodsDefault")}
              </p>
            )}
            <PaymentButton
              cartItems={cartItems}
              billingDetails={
                isShippingDifferent ? billingDetails : shippingDetails
              }
              shippingDetails={shippingDetails}
              disabled={!paymentReady}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default CheckoutForm;

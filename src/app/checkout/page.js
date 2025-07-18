"use client";
import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import BillingDetailsForm from "@/components/BillingDetailsForm";
import OrderSummary from "@/components/OrderSummary";
import PaymentButton from "@/components/PaymentButton";
import MobxStore from "@/mobx";

const CheckoutForm = observer(() => {
  const [isShippingDifferent, setIsShippingDifferent] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({});
  const [billingDetails, setBillingDetails] = useState({});
  const [email, setEmail] = useState("");
  const [cartItems, setCartItems] = useState([]);

  const {
    calculateSubtotal,
    shopConfig,
    setIsShippingDifferent: setMobxIsShippingDifferent,
  } = MobxStore;
  const shippingCost = shopConfig?.shippingRate;
  const taxRate = 0.1; // Example tax rate of 10%

  useEffect(() => {
    const fetchCartProducts = async () => {
      const products = await MobxStore.getCartProducts();
      setCartItems(products);
    };

    fetchCartProducts();
  }, []);

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
    <div
      className="bg-black text-white mt-16 p-8 min-h-screen"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-center">Checkout</h1>
        <div className="flex gap-8 flex-col lg:flex-row mt-8">
          <BillingDetailsForm
            formTitle="Shipping Details"
            isShipping={true}
            onSubmit={handleShippingSubmit}
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
            subtotal={calculateSubtotal()}
            shippingCost={shippingCost}
            taxRate={taxRate}
          />
        </div>

        {/* Payment Button */}
        {MobxStore.canProceedToPayment && (
          <div className="mt-8">
            <PaymentButton
              cartItems={cartItems}
              subtotal={calculateSubtotal()}
              shippingCost={shippingCost}
              tax={calculateSubtotal() * taxRate}
              billingDetails={
                isShippingDifferent ? billingDetails : shippingDetails
              }
              shippingDetails={shippingDetails}
              email={email}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default CheckoutForm;

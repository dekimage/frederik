"use client";
import { useState } from "react";
import BillingDetailsForm from "@/components/BillingDetailsForm";
import OrderSummary from "@/components/OrderSummary";
import PaymentButton from "@/components/PaymentButton";
import MobxStore from "@/mobx";

const CheckoutForm = () => {
  const [isShippingDifferent, setIsShippingDifferent] = useState(false);
  const [billingDetails, setBillingDetails] = useState({});
  const [shippingDetails, setShippingDetails] = useState({});

  const { cartItems, calculateSubtotal, shippingCost } = MobxStore;
  const taxRate = 0.1; // Example tax rate of 10%

  console.log({ cartItems, shippingCost, taxRate, billingDetails });

  return (
    <div className="bg-black text-white p-8 min-h-screen">
      {/* Billing Details */}
      <BillingDetailsForm
        formTitle="Billing Details"
        onSubmit={(details) => setBillingDetails(details)}
      />

      {/* Shipping to Different Address */}
      <div className="mt-8">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            checked={isShippingDifferent}
            onChange={() => setIsShippingDifferent(!isShippingDifferent)}
          />
          Ship to a different address?
        </label>
      </div>

      {isShippingDifferent && (
        <div className="mt-8">
          <BillingDetailsForm
            formTitle="Shipping Details"
            isShipping
            onSubmit={(details) => setShippingDetails(details)}
          />
        </div>
      )}

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
      <div className="mt-8">
        <PaymentButton
          cartItems={cartItems}
          subtotal={calculateSubtotal()}
          shippingCost={shippingCost}
          tax={calculateSubtotal() * taxRate}
          billingDetails={billingDetails}
          shippingDetails={
            isShippingDifferent ? shippingDetails : billingDetails
          }
        />
      </div>
    </div>
  );
};

export default CheckoutForm;

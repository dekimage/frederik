import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const PaymentButton = ({
  cartItems,
  subtotal,
  shippingCost,
  tax,
  billingDetails,
  shippingDetails,
}) => {
  const handlePayment = async () => {
    const stripe = await stripePromise;
    const response = await fetch("/api/checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cartItems,
        subtotal,
        shippingCost,
        tax,
        billingDetails,
        shippingDetails,
      }),
    });

    const session = await response.json();
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      console.error(result.error.message);
    }
  };

  return (
    <button
      onClick={handlePayment}
      className="bg-blue-500 text-white p-4 rounded-lg"
    >
      Proceed to Payment
    </button>
  );
};

export default PaymentButton;

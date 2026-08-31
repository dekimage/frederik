import { loadStripe } from "@stripe/stripe-js";
import { Button } from "./ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const PaymentButton = ({
  cartItems,
  billingDetails,
  shippingDetails,
  disabled = false,
}) => {
  const handlePayment = async () => {
    if (disabled) return;
    const stripe = await stripePromise;
    const response = await fetch("/api/checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cartItems,
        billingDetails,
        shippingDetails,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Unable to start checkout.";
      try {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } catch {
        errorMessage = await response.text();
      }
      console.error("Error creating checkout session:", errorMessage);
      alert(errorMessage);
      return;
    }

    const session = await response.json();

    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      console.error(result.error.message);
      alert(result.error.message);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={disabled}>
      Proceed to Payment
    </Button>
  );
};

export default PaymentButton;

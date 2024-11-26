import { loadStripe } from "@stripe/stripe-js";
import { Button } from "./ui/button";

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
        shippingCost,
        tax,
        billingDetails,
        shippingDetails,
      }),
    });

    // Check if the response is OK (status in the range 200-299)
    if (!response.ok) {
      const errorMessage = await response.text(); // Get the error message from the response
      console.error("Error creating checkout session:", errorMessage);
      return; // Exit if there's an error
    }

    // Parse the response as JSON
    const session = await response.json();

    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      console.error(result.error.message);
    }
  };

  return <Button onClick={handlePayment}>Proceed to Payment</Button>;
};

export default PaymentButton;

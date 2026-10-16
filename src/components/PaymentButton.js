import { startClientCheckout } from "@/lib/payments/startClientCheckout";
import { ArrowRight } from "lucide-react";
import styles from "@/app/checkout/checkout.module.css";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "./ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const PaymentButton = ({
  cartItems,
  billingDetails,
  shippingDetails,
  disabled = false,
  pending, setPending, setError, paymentLock,
}) => {
  const handlePayment = async () => {
    if (disabled || paymentLock.current) return;
    paymentLock.current = true;
    setPending(true);
    setError("");
    try {
      const stripe = await stripePromise;
      await startClientCheckout(stripe, { cartItems, billingDetails, shippingDetails });
    } catch (error) {
      setError(error instanceof TypeError
        ? "Could not connect to payment. Check your connection and try again. Your details are retained."
        : error.message || "Unable to open payment. Please try again. Your details are retained.");
    } finally {
      paymentLock.current = false;
      setPending(false);
    }
  };

  return (
    <Button className={styles.primaryAction} onClick={handlePayment} disabled={disabled || pending} aria-busy={pending}>
      {pending ? "Opening secure payment…" : <>Continue to payment <ArrowRight size={18} aria-hidden="true" /></>}
    </Button>
  );
};

export default PaymentButton;

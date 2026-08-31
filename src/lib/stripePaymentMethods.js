/**
 * Stripe Checkout payment methods by shipping destination.
 * Enable matching methods in Stripe Dashboard → Settings → Payment methods.
 */
export function getStripePaymentMethodTypes(shippingCountryCode) {
  const country = (shippingCountryCode || "").toString().trim().toUpperCase().slice(0, 2);

  if (country === "NL") {
    return ["card", "ideal"];
  }

  return ["card"];
}

/** Stripe Checkout locale hint for hosted payment page. */
export function getStripeCheckoutLocale(shippingCountryCode) {
  const country = (shippingCountryCode || "").toString().trim().toUpperCase().slice(0, 2);
  if (country === "NL") return "nl";
  if (country === "BE") return "nl";
  return "auto";
}

// Client-side transport only; the server remains authoritative for the order.
export async function startClientCheckout(stripe, order, request = fetch) {
  if (!stripe) throw new Error("Secure payment could not load. Please refresh and try again.");
  const response = await request("/api/checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  const session = await response.json().catch(() => null);
  if (!response.ok) throw new Error(session?.error || "Unable to start payment. Please try again.");
  if (!session?.id) throw new Error("Unable to open secure payment. Please try again.");
  const result = await stripe.redirectToCheckout({ sessionId: session.id });
  if (result?.error) throw new Error(result.error.message);
}

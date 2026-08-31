# iDEAL payment setup guide (Stripe + Next.js)

This guide covers **iDEAL** — the Netherlands bank redirect payment method — for WOLFSKIN Photography checkout.

**Code status:** iDEAL is wired in the app. NL shipping addresses get `card` + `ideal` on Stripe Checkout; other countries get card only. You still need to **enable iDEAL in the Stripe Dashboard** (test mode first) before it appears at payment.

---

## What iDEAL is

- iDEAL lets Dutch customers pay directly from their bank account via a secure redirect.
- Stripe hosts the bank selection UI when iDEAL is enabled on a Checkout Session.
- Currency must be **EUR**.
- Works well alongside cards for NL customers.

---

## Prerequisites

Before changing code, complete these in external systems:

### 1. Stripe Dashboard — enable iDEAL

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com).
2. Go to **Settings → Payment methods**.
3. Find **iDEAL** under European payment methods.
4. Click **Turn on** / **Enable**.
5. Complete any business verification Stripe requests (KVK, bank account, etc.).

> Test mode: enable iDEAL in **Test mode** first. Use Stripe test bank flows during development.

### 2. Stripe Tax (already used)

Your app uses `automatic_tax: { enabled: true }`. For accurate NL VAT:

1. In Stripe Dashboard → **Settings → Tax**, confirm your business address and tax registrations.
2. Ensure customer shipping addresses include **postal code** (already added to checkout forms).
3. Stripe Customer + shipping address are created server-side before Checkout — required for tax accuracy.

### 3. Webhook endpoint (already implemented)

Ensure production webhook listens to at least:

| Event | Purpose |
|-------|---------|
| `checkout.session.completed` | Create paid order, send emails, store invoice |
| `checkout.session.expired` | Clean up abandoned pending orders |
| `payment_intent.payment_failed` | Mark failed payment attempts |
| `charge.refunded` | Mark order refunded |
| `charge.dispute.created` | Flag disputes |

**Stripe Dashboard → Developers → Webhooks → Add endpoint**

- URL: `https://YOUR_DOMAIN/api/webhooks`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET` in production env

---

## Code changes (implemented)

### Step 1 — iDEAL on Checkout Session ✅

File: `src/lib/stripePaymentMethods.js` + `src/app/api/checkout-session/route.js`

When shipping country is **NL**, Checkout Session uses:

```javascript
payment_method_types: ["card", "ideal"],
locale: "nl",
```

All other supported countries use `["card"]` only.

### Step 2 — PaymentButton ✅

No changes needed — Stripe Checkout redirect is unchanged.

### Step 3 — Success page ✅

Already implemented: verifies `session_id` before clearing cart (required for iDEAL bank redirect).

### Step 4 — Webhook ✅

Already handles `checkout.session.completed` for iDEAL payments.

### Step 5 — Customer-facing copy ✅

Checkout shows iDEAL note for NL addresses (`checkoutPaymentMethodsNl` in translations).

---

## Environment variables

No new env vars are required for iDEAL specifically. Ensure these exist:

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_...
NEXT_PUBLIC_URL=https://www.wolfskinphotography.com
```

---

## Testing checklist

### Test mode

- [ ] iDEAL enabled in Stripe test mode
- [ ] NL shipping address + postal code on checkout
- [ ] Checkout Session created without error
- [ ] Stripe Checkout shows iDEAL option
- [ ] Complete test iDEAL payment
- [ ] Redirect to `/success?session_id=...` works
- [ ] Success page verifies payment before clearing cart
- [ ] Webhook creates `orders` document
- [ ] Customer + admin emails sent **after** payment only
- [ ] `/track-order` finds order by ID + email
- [ ] Invoice/receipt stored on order (`invoice.receiptUrl`, `invoice.html`)

### Live mode (before launch)

- [ ] Switch to live Stripe keys
- [ ] Live webhook endpoint configured
- [ ] iDEAL enabled in live mode
- [ ] Real small-value test order end-to-end

---

## Common issues

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| iDEAL not shown at checkout | Not enabled in Dashboard or wrong mode (test vs live) | Enable iDEAL in correct Stripe mode |
| `payment_method_types` error | Account not eligible for iDEAL | Complete Stripe business verification |
| Order not created after iDEAL | Webhook missing or wrong secret | Fix webhook URL + `STRIPE_WEBHOOK_SECRET` |
| Success page says not confirmed | Webhook slower than redirect | Success page already handles 202 “pending fulfillment” — wait for webhook |
| Tax seems wrong | Missing postal code | Ensure `postalCode` submitted (already required) |
| Duplicate orders | Webhook replay | Idempotency on `stripeSessionId` already implemented |

---

## Files involved (reference)

| File | Role |
|------|------|
| `src/lib/stripePaymentMethods.js` | NL → card + iDEAL; locale hint |
| `src/app/api/checkout-session/route.js` | Creates Stripe session with payment methods |
| `src/app/api/webhooks/route.js` | Finalize paid orders |
| `src/app/api/orders/verify-session/route.js` | Success page verification |
| `src/app/success/SuccessClient.js` | Post-payment UX |
| `src/components/PaymentButton.js` | Redirect to Stripe Checkout |

---

## Estimated effort

| Task | Time |
|------|------|
| Stripe Dashboard iDEAL enable | 5–15 min |
| Code change (`payment_method_types`) | 5 min |
| Test mode end-to-end test | 15–30 min |
| Live verification | 15 min |

**Total: ~1 hour** assuming Stripe account is already verified.

---

## What you need to do manually (outside the codebase)

1. **Stripe Dashboard:** Enable iDEAL (test + live).
2. **Stripe Dashboard:** Confirm webhook endpoint and events in production.
3. **Stripe Dashboard:** Confirm Tax settings for NL/EU.
4. **Firebase Console:** Ensure admin user exists for `/admin/login` with email matching `ADMIN_EMAIL`.
5. **Local maintenance (optional):** On localhost, open `/admin/dev-tools` once a month and click **Run cleanup now** to remove expired unpaid `pendingOrders`.

---

## After iDEAL is live

Consider also:

- Bancontact for BE customers (`"bancontact"`)
- Locale-aware payment method lists per shipping country
- Stripe Dashboard monitoring for failed iDEAL redirects

---

*Last updated: May 2026 — matches current checkout architecture in this repository.*

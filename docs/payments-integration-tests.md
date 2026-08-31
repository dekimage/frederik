# Payment integration tests

Automated **Stripe test mode + Firestore** integration tests for checkout, webhooks, and order status sync.

Uses [Vitest](https://vitest.dev/) — no browser required. Emails are mocked; Stripe and Firestore are real (test/sandbox).

---

## Prerequisites

1. **Stripe test keys** in `.env` or `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...   # any valid secret for signing test events
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

2. **Firebase Admin** credentials (same as the app):
   ```env
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. **At least one product** in Firestore with a print option shippable to NL (or set `PAYMENT_TEST_PRODUCT_ID`).

4. **Stripe Tax** — checkout sessions use `automatic_tax`. Your Stripe test account should have tax configured, or session creation may fail. If tests fail on checkout creation, check Stripe Dashboard → Tax.

---

## Run locally

```bash
npm install
npm run test:payments
```

Watch mode (re-run on file changes):

```bash
npm run test:payments:watch
```

Tests **refuse to run** if `STRIPE_SECRET_KEY` is not a `sk_test_` key (live keys are blocked).

---

## What is covered

| Scenario | Stripe | Firestore assertion |
|----------|--------|---------------------|
| NL checkout payment methods | Session created | `ideal` + `card` on pending order |
| DE checkout | Session created | `card` only |
| Successful card payment | Real test PaymentIntent + simulated `checkout.session.completed` | Order `processing`, pending removed, invoice stored |
| Webhook idempotency | Same `checkout.session.completed` twice | Single order document |
| Payment failed | `payment_intent.payment_failed` | Pending `payment_failed` |
| Card declined | `pm_card_chargeDeclined` | Session not paid |
| Session expired | `checkout.sessions.expire` + webhook | Pending deleted |
| Refund | Real refund API + `charge.refunded` | Order `refunded` |
| Dispute | Simulated `charge.dispute.created` | `disputeStatus: open` |

**Not automated (manual / Stripe Checkout UI):**

- iDEAL bank redirect (use Stripe Checkout UI in test mode after enabling iDEAL; webhook path is the same as card once paid)
- Full HTTP webhook signature through Next.js route (logic tested via `processStripeWebhookEvent`; optional: `stripe listen` E2E)

Card payments in tests use a **real Stripe test PaymentIntent** (confirmed with `pm_card_visa`), then fire the same webhook handler your production `/api/webhooks` uses — this matches Firestore sync without opening the hosted Checkout page.

---

## Test artifacts & cleanup

Each test tags Firestore pending orders with `testRunId`. After each test:

- Test Stripe customers are deleted
- Successful charges are refunded when possible
- Test `pendingOrders` / `orders` with matching `testRunId` are removed

Use a **development Firebase project**, not production, when running tests.

---

## Optional env

```env
# Pin a specific Firestore product for cart lines
PAYMENT_TEST_PRODUCT_ID=your_product_doc_id
```

---

## Troubleshooting

| Failure | Likely cause |
|---------|----------------|
| `No Firestore product found` | Empty `products` collection — seed or set `PAYMENT_TEST_PRODUCT_ID` |
| Checkout session 500 / tax error | Enable Stripe Tax in test mode or check business address |
| `Timed out waiting for order` | Webhook handler error — run single test with `vitest run -t "completes card"` |
| Tests skipped entirely | Missing env vars or live Stripe key |

---

## Architecture

| File | Role |
|------|------|
| `src/lib/payments/createCheckoutSession.js` | Shared checkout logic (API + tests) |
| `src/lib/payments/webhookHandlers.js` | Webhook processor (API + tests) |
| `tests/integration/payments.integration.test.js` | Scenario suite |
| `tests/helpers/paymentTestContext.js` | Fixtures, Stripe pay helper, cleanup |

---

## Before go-live checklist

After all tests pass on `sk_test_`:

1. Enable iDEAL (and webhooks) in Stripe **live** mode
2. Swap to live API keys in production env only
3. Run one small real card payment in live mode
4. Confirm webhook endpoint on production URL

# WOLFSKIN Photography production launch checklist

Use this checklist in order. Do not deploy the Resend code to production until the Resend variables are present, and do not replace Stripe test keys until the complete test-mode pass succeeds.

## What is already implemented in code

- NL shipping addresses request Stripe `card` and `ideal`; Stripe may display the latter as **iDEAL | Wero**.
- Other shipping countries request card only.
- Checkout uses EUR and server-owned catalogue prices.
- Stripe Tax is disabled for the agreed KOR flow.
- Paid orders, invoices, refunds, disputes, expired sessions, and immediate/asynchronous payment results are handled by the webhook.
- Customer and admin paid-order emails use Resend with plain-text and HTML content, retry-safe idempotency keys, and Firestore delivery state.
- Email is sent only after Stripe reports the Checkout Session as paid.

## 1. Resend setup — MUST DO in the account

1. Sign in to Resend and open **Domains → Add domain**.
2. Add `mail.wolfskin-photography.com` as a transactional sending subdomain.
3. At the DNS provider for `wolfskin-photography.com`, add every record Resend displays. Copy the host, type, value, and priority exactly. Do not replace an existing SPF record at the same hostname; resolve any conflict first.
4. Return to Resend and wait until the domain's sending capability says **Verified/Enabled**.
5. Open **API Keys → Create API Key**. Name it `wolfskin-production`, choose **Sending access**, and restrict it to the verified domain if the UI offers that choice.
6. Copy the `re_...` key immediately and store it as a secret. It is not a public browser variable.
7. Choose a real monitored reply-to inbox. Do not use a no-reply mailbox.

Add these variables to local `.env` for testing and to the Vercel project under **Production**:

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=orders@mail.wolfskin-photography.com
RESEND_FROM_NAME=WOLFSKIN Photography
RESEND_REPLY_TO=YOUR_MONITORED_INBOX
ADMIN_EMAIL=THE_EMAIL_ALLOWED_TO_SIGN_IN_TO_ADMIN
NEXT_PUBLIC_URL=https://www.wolfskin-photography.com
```

`ADMIN_EMAIL` may be a comma-separated list. Every address in it receives the paid-order admin email; the same list controls access to `/admin`. Old `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` variables are no longer used and can be removed after deployment.

## 2. Stripe test-mode replica — MUST DO in Stripe

Stay in **test/sandbox mode** for this section.

1. Open **Settings → Payment methods** and turn on **iDEAL | Wero**. The code/API identifier is still `ideal`.
2. Open **Developers → Webhooks / Event destinations** and create or edit the HTTPS destination:
   - Endpoint: `https://www.wolfskin-photography.com/api/webhooks`
   - Events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `checkout.session.expired`
     - `payment_intent.payment_failed`
     - `charge.refunded`
     - `charge.dispute.created`
3. Reveal the test destination's signing secret and set its `whsec_...` value as `STRIPE_WEBHOOK_SECRET` in the Vercel environment used by the test deployment.
4. Confirm that the deployed test environment uses matching `sk_test_...` and `pk_test_...` keys from the same Stripe account/sandbox.
5. Redeploy after any environment-variable change.

Do not act on payout or tax banners just to make iDEAL appear. Stripe account verification can still block payment-method activation, but payouts and Stripe Tax are separate from the Checkout request made by this app.

## 3. Complete test-mode end-to-end check

1. Open `https://www.wolfskin-photography.com/shop` after deploying the current build.
2. Add a real product and continue to checkout.
3. Enter a Netherlands shipping address, valid Dutch postal code, and an inbox you can inspect.
4. On hosted Stripe Checkout, confirm **iDEAL | Wero** is a separate payment choice, select it, choose the Stripe test bank, and authorize the test payment.
5. Confirm all of the following:
   - Browser returns to `/success?session_id=...` and shows payment successful.
   - Stripe payment says succeeded/paid.
   - Stripe's webhook delivery for the relevant event returns HTTP 200.
   - Firestore no longer has the corresponding `pendingOrders` record.
   - Firestore has one `orders` record with the Stripe session/payment IDs, `paymentStatus: paid`, `orderStatus: processing`, correct amount, invoice, and `emailDelivery.status: sent`.
   - The order appears to an authorized user at `/admin/orders` and its details are readable.
   - Resend's Emails page shows both the customer confirmation and admin notification as delivered.
   - Both inboxes received the correct order ID, items, addresses, total, tracking link, and Stripe receipt link.
   - `/track-order` finds the order using its order ID and customer email.

If iDEAL is absent, inspect the newly created Checkout Session in Stripe. Its payment-method list must contain both `card` and `ideal`. If it contains only `card`, the current build was not deployed or checkout did not receive `shippingDetails.country = NL`.

## 4. Stripe live setup — MUST DO after Stripe unlocks the account

Switch Stripe to **live mode**. Test settings do not automatically copy to live.

1. Complete every Stripe business-verification requirement and add the payout bank account.
2. Open **Settings → Payment methods** and turn on **iDEAL | Wero** in live mode.
3. Create the live HTTPS webhook destination at `https://www.wolfskin-photography.com/api/webhooks` with the same seven events listed above.
4. Copy the live destination's `whsec_...` secret.
5. Copy the live `sk_live_...` and `pk_live_...` API keys.
6. In Vercel **Production**, set:

```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # from the LIVE destination
NEXT_PUBLIC_URL=https://www.wolfskin-photography.com
```

7. Recheck all Resend/Firebase/Cloudinary production variables and redeploy once.
8. Confirm the deployed client is using `pk_live_...`; never expose `sk_live_...`, `whsec_...`, Firebase private keys, or `RESEND_API_KEY` to the browser.

## 5. One real live payment and handoff checks

The server ignores browser/admin product-price tampering and charges from the catalogue. There is no safe €1 switch in the current admin. Use the cheapest genuine configuration and refund it after verification rather than introducing a temporary production-only price path.

1. Place one real Netherlands order with your own bank and email.
2. Repeat every verification in section 3, now in Stripe live mode.
3. In Stripe, issue a refund after the checks.
4. Confirm the `charge.refunded` webhook returns HTTP 200 and the Firestore/admin order becomes refunded.
5. Check Stripe Balance/Payouts to confirm the payment and refund accounting are visible.
6. Review the storefront's products, prices, legal/KOR wording, privacy/cookie pages, support/reply-to inbox, and administrator account before handoff.

## Stop conditions

Do not go live if any of these is true:

- Stripe still blocks charges or payouts.
- Hosted Checkout lacks iDEAL | Wero for a Netherlands order.
- Any webhook uses a secret from the wrong Stripe mode or account.
- Webhook attempts are not HTTP 200 after a successful payment.
- The paid order is missing, duplicated, or has the wrong amount in Firestore.
- `emailDelivery.status` is not `sent`, or either email is not delivered by Resend.
- The production site still contains a test publishable key.

## Separate security upgrade before final public handoff

On 10 October 2026, `npm audit --omit=dev` still reports advisories that cannot be removed without breaking-version upgrades, including a critical advisory affecting the installed Next.js 14 line. Non-breaking fixes have already been applied and the project still builds/tests successfully, but a Next.js 16 + React 19 migration must be handled and regression-tested as a separate change before treating the entire application—not only payments—as fully launch-hardened. Do not run `npm audit fix --force` blindly.

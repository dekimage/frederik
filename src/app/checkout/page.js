"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from "lucide-react";
import styles from "./checkout.module.css";
import { observer } from "mobx-react-lite";
import BillingDetailsForm from "@/components/BillingDetailsForm";
import OrderSummary from "@/components/OrderSummary";
import PaymentButton from "@/components/PaymentButton";
import { addressIsSaved, restoreCheckoutDraft, readCheckoutDraft, writeCheckoutDraft } from "@/lib/checkoutDraft";
import { normalizeAddressFormValues } from "@/lib/orderUtils";
import MobxStore from "@/mobx";
import { quoteOrderForShippingCountry, isSupportedShippingCountry } from "@/lib/pricingCatalog";
import { useLanguage } from "@/contexts/LanguageContext";

const CheckoutForm = observer(() => {
  const [draft, setDraft] = useState(() => restoreCheckoutDraft(null));
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState("");
  const [retry, setRetry] = useState(0);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const paymentLock = useRef(false);
  const { t } = useLanguage();
  const cartKey = JSON.stringify(MobxStore.cartItems);

  useEffect(() => {
    setDraft(readCheckoutDraft());
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (draftLoaded) writeCheckoutDraft(draft);
  }, [draft, draftLoaded]);

  useEffect(() => {
    let cancelled = false;
    setCartLoading(true);
    setCartError("");
    MobxStore.getCartProducts().then((products) => {
      if (!cancelled) {
        if (products.length !== JSON.parse(cartKey).length) {
          setCartError("Some prints could not be loaded. Please review your cart before continuing.");
        }
        setCartItems(products);
      }
    }).catch(() => {
      if (!cancelled) setCartError("We couldn’t load your order. Please try again. Your address details are retained.");
    }).finally(() => {
      if (!cancelled) setCartLoading(false);
    });
    return () => { cancelled = true; };
  }, [cartKey, retry]);

  const updateShipping = useCallback((values) => {
    setDraft((previous) => JSON.stringify(previous.shipping) === JSON.stringify(values)
      ? previous : { ...previous, shipping: values, savedShipping: null });
    setPaymentError("");
  }, []);
  const updateBilling = useCallback((values) => {
    setDraft((previous) => JSON.stringify(previous.billing) === JSON.stringify(values)
      ? previous : { ...previous, billing: values, savedBilling: null });
    setPaymentError("");
  }, []);
  const isShippingDifferent = draft.isShippingDifferent;
  const effectiveShippingCountry = draft.shipping.country.toString().trim().toUpperCase();
  const shippingDetails = normalizeAddressFormValues(draft.shipping);
  const billingDetails = normalizeAddressFormValues(draft.billing);

  const quotedCheckout = useMemo(() => {
    const lines = cartItems.map((item) => ({
      quantity: item.quantity,
      material: item.material,
      sizeKey: item.sizeKey,
    }));
    return quoteOrderForShippingCountry(lines, effectiveShippingCountry);
  }, [cartItems, effectiveShippingCountry]);

  const shippingSaved = addressIsSaved(draft.shipping, draft.savedShipping);
  const billingSaved = addressIsSaved(draft.billing, draft.savedBilling);
  const detailsSaved = shippingSaved && (!isShippingDifferent || billingSaved);
  const paymentReady = detailsSaved && !cartLoading && !cartError && cartItems.length > 0 &&
    effectiveShippingCountry.length === 2 && quotedCheckout?.ok;

  const handleShippingDifferentChange = (e) => {
    const checked = e.target.checked;
    setDraft((previous) => ({ ...previous, isShippingDifferent: checked }));
    setPaymentError("");
  };
  const handleShippingSubmit = (values) => {
    setDraft((previous) => ({ ...previous, shipping: values, savedShipping: { ...values } }));
  };
  const handleBillingSubmit = (values) => {
    setDraft((previous) => ({ ...previous, billing: values, savedBilling: { ...values } }));
  };

  const nextForm = shippingSaved ? "billing-details" : "shipping-details";
  const nextLabel = shippingSaved ? "Save billing details" : "Save shipping details";
  const nextDescription = detailsSaved
    ? paymentReady
      ? "Your details are saved. Continue to secure payment to place your order."
      : "Your details are saved. Check the delivery availability below before payment."
    : shippingSaved
      ? "Shipping saved. Complete and save your billing address next."
      : "Enter your delivery address, then save your shipping details.";

  const nextAction = cartLoading || !draftLoaded ? (
    <button className={styles.primaryAction} disabled>Loading checkout…</button>
  ) : cartError ? (
    <button className={styles.primaryAction} onClick={() => setRetry((value) => value + 1)}>Retry loading order</button>
  ) : cartItems.length === 0 ? (
    <Link href="/shop" className={styles.primaryAction}>Browse prints <ArrowRight size={18} aria-hidden="true" /></Link>
  ) : detailsSaved ? (
    <PaymentButton
      cartItems={cartItems}
      billingDetails={isShippingDifferent ? billingDetails : shippingDetails}
      shippingDetails={shippingDetails}
      disabled={!paymentReady}
      pending={paymentPending}
      setPending={setPaymentPending}
      setError={setPaymentError}
      paymentLock={paymentLock}
    />
  ) : (
    <button type="submit" form={nextForm} className={styles.primaryAction}>
      {nextLabel} <ArrowRight size={18} aria-hidden="true" />
    </button>
  );

  return (
    <main className={styles.checkout}>
      <div className={styles.container}>
        <Link href="/cart" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to cart
        </Link>
        <div className={styles.heading}>
          <h1>Checkout</h1>
          <span className={styles.secure}><LockKeyhole size={15} aria-hidden="true" /> Secure payment with Stripe</span>
        </div>
        <ol className={styles.steps} aria-label="Checkout progress">
          {[
            { label: "Shipping details", done: shippingSaved, active: !shippingSaved },
            { label: "Billing details", done: detailsSaved, active: shippingSaved && !detailsSaved },
            { label: "Secure payment", done: false, active: detailsSaved },
          ].map((step, index) => (
            <li key={step.label} aria-current={step.active ? "step" : undefined} data-active={step.active} data-done={step.done}>
              <span>{step.done ? <Check size={16} aria-hidden="true" /> : index + 1}</span>{step.label}
            </li>
          ))}
        </ol>
        {!draftLoaded || cartLoading ? (
          <div className={styles.billing} role="status">Loading your checkout…</div>
        ) : cartError ? (
          <div className={styles.billing}><p role="alert">{cartError}</p>{nextAction}</div>
        ) : cartItems.length === 0 ? (
          <section className={styles.billing}><h2>Your cart is empty</h2><p>Add a print to continue to checkout. Your address draft will be here when you return.</p>{nextAction}</section>
        ) : <div className={styles.layout}>
          <div className={styles.details}>
            <BillingDetailsForm
              formTitle="Shipping details"
              isShipping={true}
              onSubmit={handleShippingSubmit}
              initialValues={draft.shipping}
              onChange={updateShipping}
              completed={shippingSaved}
              paymentPending={paymentPending}
              nextStep={nextDescription}
            />
            <section className={styles.billing} aria-labelledby="billing-heading">
              <div className={styles.sectionHeading}><h2 id="billing-heading">Billing address</h2><span>02</span></div>
              <p>By default, we use your shipping address for billing.</p>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={isShippingDifferent} disabled={paymentPending} onChange={handleShippingDifferentChange} />
                Use a different billing address
              </label>
              {isShippingDifferent && (
                <BillingDetailsForm
                  formTitle="Billing details" isShipping={false} onSubmit={handleBillingSubmit}
                  initialValues={draft.billing} onChange={updateBilling} completed={billingSaved}
                  paymentPending={paymentPending} nextStep={nextDescription}
                />
              )}
            </section>
            <p className={styles.coverage}>{t("shippingCoverageCheckoutIntro")}</p>
          </div>
          <aside className={styles.sidebar} aria-label="Order review and next step">
            <div className={styles.nextStep}>
              <p className={styles.eyebrow}>{detailsSaved && paymentReady ? "READY WHEN YOU ARE" : "YOUR NEXT STEP"}</p>
              <h2>{detailsSaved ? "Continue to payment" : shippingSaved ? "Save your billing address" : "Add your shipping details"}</h2>
              <p role="status" aria-live="polite">{nextDescription}</p>
              <div className={styles.desktopAction}>{nextAction}</div>
              {!detailsSaved && <div className={styles.paymentPreview}><LockKeyhole size={16} aria-hidden="true" /><span>Then: continue to secure payment<br /><small>Available after you save your {shippingSaved ? "billing" : "address"} details.</small></span></div>}
              {paymentError && <p className={styles.warning} role="alert">{paymentError}</p>}
              {paymentPending && <p role="status">Opening Stripe. Please wait…</p>}
              {detailsSaved && !paymentReady && (
                <p className={styles.warning} role="alert">
                  {effectiveShippingCountry.length === 2 && !isSupportedShippingCountry(effectiveShippingCountry)
                    ? t("checkoutPaymentBlockedUnsupported")
                    : effectiveShippingCountry.length === 2 && !quotedCheckout?.ok
                      ? t("shippingCoverageOrderSummaryUnavailable")
                      : t("checkoutPaymentBlockedMissing")}
                </p>
              )}
              {detailsSaved && paymentReady && (
                <p className={styles.paymentNote}>{effectiveShippingCountry === "NL" ? t("checkoutPaymentMethodsNl") : t("checkoutPaymentMethodsDefault")}</p>
              )}
            </div>
            <OrderSummary cartItems={cartItems} shippingCountryCode={effectiveShippingCountry} />
          </aside>
        </div>}
        <div className={styles.mobileAction}>
          <p>{cartLoading ? "Loading your order" : cartError ? "Your order needs attention" : cartItems.length === 0 ? "Add a print to get started" : detailsSaved ? (paymentReady ? "Details saved · Next: secure payment" : "Check delivery availability above") : shippingSaved ? "Next: save your billing address" : "Step 1 of 3 · Save your delivery address"}</p>
          {paymentError && <p role="alert">{paymentError}</p>}
          {nextAction}
        </div>
      </div>
    </main>
  );
});

export default CheckoutForm;

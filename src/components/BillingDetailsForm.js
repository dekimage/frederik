"use client";
import { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import { addressSchema, emptyAddress } from "@/lib/checkoutDraft";
import { usStates } from "../data";
// import { fallbackCountries } from "../data"; /* used only when worldwide country list below is restored */
import { observer } from "mobx-react-lite";
import { Button } from "./ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import styles from "@/app/checkout/checkout.module.css";
import { getCountryLabel, listCountries } from "@/lib/pricingCatalog";
import { useLanguage } from "@/contexts/LanguageContext";

// Keep validation feedback visible when submitting from the sticky action bar.
function FocusAddressErrors({ formId }) {
  const { submitCount, isSubmitting, isValidating, errors } = useFormikContext();
  const handledSubmit = useRef(0);
  useEffect(() => {
    if (!submitCount || isSubmitting || isValidating || handledSubmit.current === submitCount) return;
    handledSubmit.current = submitCount;
    const firstError = Object.keys(errors)[0];
    if (firstError) document.getElementById(`${formId}-${firstError}`)?.focus();
  }, [submitCount, isSubmitting, isValidating, errors, formId]);
  return null;
}

function TrackAddressDraft({ onChange }) {
  const { values } = useFormikContext();
  useEffect(() => { onChange(values); }, [values, onChange]);
  return null;
}

const BillingDetailsForm = observer(
  ({ formTitle, isShipping = false, onSubmit, initialValues = emptyAddress, onChange, completed = false, nextStep, paymentPending = false }) => {
    const [selectedCountry, setSelectedCountry] = useState(initialValues.country || "");
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { t } = useLanguage();

    /*
     * SHIPPING DESTINATION COUNTRIES: Only ISO codes on the official price list
     * (`listCountries` from pricingNormalized.json). YourSurprise has carrier
     * contracts for those destinations only — no shipping elsewhere.
     *
     * When the client expands coverage, regenerate the CSV/JSON and uncomment the
     * worldwide dropdown below if manual-quote flow is added.
     */
    useEffect(() => {
      const catalogCodes = listCountries();
      const countryOptions = catalogCodes.map((cca2) => ({
        label: `${getCountryLabel(cca2)} (${cca2})`,
        value: cca2,
      }));
      countryOptions.sort((a, b) => a.label.localeCompare(b.label));
      setCountries(countryOptions);
      setLoading(false);
      setError(null);
    }, []);

    /*
    // --- Worldwide list (paused; do not delete) ---
    // import { fallbackCountries } from "../data"; at top when re-enabling
    //
    useEffect(() => {
      const fetchCountries = async () => {
        try {
          setLoading(true);
          const response = await fetch("https://restcountries.com/v3.1/all");
          const data = await response.json();
          const countryOptions = data
            .map((country) => ({
              label: country.name.common,
              value: country.cca2,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
          setCountries(countryOptions);
        } catch (err) {
          console.error("Failed to fetch countries:", err);
          setError("Failed to fetch countries. Using fallback list.");
          setCountries(fallbackCountries);
        } finally {
          setLoading(false);
        }
      };
      fetchCountries();
    }, []);
    */

    const formId = isShipping ? "shipping-details" : "billing-details";

    return (
      <Formik
        initialValues={initialValues}
        validationSchema={addressSchema}
        onSubmit={(values, { setSubmitting }) => {
          onSubmit(values);
          setSubmitting(false);
        }}
      >
        {({ isSubmitting, setFieldValue, submitCount, errors }) => (
          <Form id={formId} className={styles.addressForm} noValidate>
            <FocusAddressErrors formId={formId} />
            <TrackAddressDraft onChange={onChange} />
            <div className={styles.formIntro}>
              <div className={styles.sectionHeading}><h2>{formTitle}</h2><span>{isShipping ? "01" : "02"}</span></div>
              <p>{isShipping ? "Where should we send your prints?" : "Enter the address for your invoice."} Fields marked * are required.</p>
            </div>
            {submitCount > 0 && Object.keys(errors).length > 0 && (
              <div className={styles.formErrors} role="alert">
                <strong>Please complete the required details.</strong>
                <ul>{Object.entries(errors).map(([field, message]) => <li key={field}><a href={`#${formId}-${field}`}>{message}</a></li>)}</ul>
              </div>
            )}

            {/* First Name */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor={`${formId}-firstName`}
                className="text-sm font-medium text-gray-300"
              >
                First Name *
              </label>
              <Field
                disabled={paymentPending}
                name="firstName"
                id={`${formId}-firstName`}
                autoComplete={`${isShipping ? "shipping" : "billing"} given-name`}
                aria-describedby={errors.firstName ? `${formId}-firstName-error` : undefined}
                aria-invalid={submitCount > 0 && !!errors.firstName}
                className="p-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
              <ErrorMessage
                name="firstName"
                id={`${formId}-firstName-error`}
                component="div"
                className="text-red-400 text-sm"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor={`${formId}-lastName`}
                className="text-sm font-medium text-gray-300"
              >
                Last Name *
              </label>
              <Field
                disabled={paymentPending}
                name="lastName"
                id={`${formId}-lastName`}
                autoComplete={`${isShipping ? "shipping" : "billing"} family-name`}
                aria-describedby={errors.lastName ? `${formId}-lastName-error` : undefined}
                aria-invalid={submitCount > 0 && !!errors.lastName}
                className="p-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
              <ErrorMessage
                name="lastName"
                id={`${formId}-lastName-error`}
                component="div"
                className="text-red-400 text-sm"
              />
            </div>

            {/* Country/Region */}
            <div className="flex flex-col gap-2">
              <label htmlFor={`${formId}-country`}>Country/Region *</label>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t("shippingCountrySelectHint")}
              </p>
              {loading ? (
                <div className="text-white">Loading countries...</div>
              ) : (
                <Field
                  disabled={paymentPending}
                as="select"
                  name="country"
                id={`${formId}-country`}
                autoComplete={`${isShipping ? "shipping" : "billing"} country`}
                aria-describedby={errors.country ? `${formId}-country-error` : undefined}
                aria-invalid={submitCount > 0 && !!errors.country}
                  className="p-2 rounded bg-gray-800 text-white"
                  onChange={(e) => {
                    const v = e.target.value;
                    setFieldValue("country", v);
                    setSelectedCountry(v);
                  }}
                >
                  <option value="">Select a country</option>
                  {countries.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </Field>
              )}
              <ErrorMessage
                name="country"
                id={`${formId}-country-error`}
                component="div"
                className="text-red-500"
              />
              {error && <div className="text-yellow-500">{error}</div>}
            </div>

            {/* Street Address */}
            <div className="flex flex-col">
              <label htmlFor={`${formId}-streetAddress1`}>Street Address *</label>
              <Field
                disabled={paymentPending}
                name="streetAddress1"
                id={`${formId}-streetAddress1`}
                autoComplete={`${isShipping ? "shipping" : "billing"} address-line1`}
                aria-describedby={errors.streetAddress1 ? `${formId}-streetAddress1-error` : undefined}
                aria-invalid={submitCount > 0 && !!errors.streetAddress1}
                className="p-2 rounded bg-gray-800 text-white"
              />
              <ErrorMessage
                name="streetAddress1"
                id={`${formId}-streetAddress1-error`}
                component="div"
                className="text-red-500"
              />
            </div>

            {/* Street Address 2 */}
            <div className="flex flex-col">
              <label htmlFor={`${formId}-streetAddress2`}>
                Apartment, suite, unit, etc. (Optional)
              </label>
              <Field
                disabled={paymentPending}
                name="streetAddress2"
                id={`${formId}-streetAddress2`}
                autoComplete={`${isShipping ? "shipping" : "billing"} address-line2`}
                aria-describedby={errors.streetAddress2 ? `${formId}-streetAddress2-error` : undefined}
                aria-invalid={submitCount > 0 && !!errors.streetAddress2}
                className="p-2 rounded bg-gray-800 text-white"
              />
            </div>

            {/* City */}
            <div className="flex flex-col">
              <label htmlFor={`${formId}-city`}>Town/City *</label>
              <Field
                disabled={paymentPending}
                name="city"
                id={`${formId}-city`}
                autoComplete={`${isShipping ? "shipping" : "billing"} address-level2`}
                aria-describedby={errors.city ? `${formId}-city-error` : undefined}
                aria-invalid={submitCount > 0 && !!errors.city}
                className="p-2 rounded bg-gray-800 text-white"
              />
              <ErrorMessage
                name="city"
                id={`${formId}-city-error`}
                component="div"
                className="text-red-500"
              />
            </div>

            {/* Postal / ZIP */}
            <div className="flex flex-col">
              <label htmlFor={`${formId}-postalCode`}>Postal / ZIP code *</label>
              <Field
                disabled={paymentPending}
                name="postalCode"
                id={`${formId}-postalCode`}
                autoComplete={`${isShipping ? "shipping" : "billing"} postal-code`}
                aria-describedby={errors.postalCode ? `${formId}-postalCode-error` : undefined}
                aria-invalid={submitCount > 0 && !!errors.postalCode}
                className="p-2 rounded bg-gray-800 text-white"
              />
              <ErrorMessage
                name="postalCode"
                id={`${formId}-postalCode-error`}
                component="div"
                className="text-red-500"
              />
            </div>

            {/* US State Dropdown */}
            {selectedCountry === "US" && (
              <div className="flex flex-col">
                <label htmlFor={`${formId}-state`}>State *</label>
                <Field
                  disabled={paymentPending}
                as="select"
                  name="state"
                id={`${formId}-state`}
                autoComplete={`${isShipping ? "shipping" : "billing"} address-level1`}
                aria-describedby={errors.state ? `${formId}-state-error` : undefined}
                aria-invalid={submitCount > 0 && !!errors.state}
                  className="p-2 rounded bg-gray-800 text-white"
                >
                  <option value="">Select a state</option>
                  {usStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="state"
                  id={`${formId}-state-error`}
                  component="div"
                  className="text-red-500"
                />
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col">
              <label htmlFor={`${formId}-email`}>
                Email *{!isShipping ? " (billing)" : ""}
              </label>
              <Field
                disabled={paymentPending}
                name="email"
                id={`${formId}-email`}
                autoComplete={`${isShipping ? "shipping" : "billing"} email`}
                aria-describedby={errors.email ? `${formId}-email-error` : undefined}
                aria-invalid={submitCount > 0 && !!errors.email}
                type="email"
                className="p-2 rounded bg-gray-800 text-white"
              />
              <ErrorMessage
                name="email"
                id={`${formId}-email-error`}
                component="div"
                className="text-red-500"
              />
            </div>

            <div className={styles.formFooter}>
            <Button
              type="submit"
              className={styles.primaryAction}
              disabled={isSubmitting || completed || paymentPending}
            >
              {completed
                ? <><CheckCircle2 size={18} aria-hidden="true" /> Details saved</>
                : <>{isShipping ? "Save shipping details" : "Save billing details"} <ArrowRight size={18} aria-hidden="true" /></>}
            </Button>
            <p role="status">{completed
              ? nextStep
              : "Save this address to continue. Payment comes next."}</p>
            </div>
          </Form>
        )}
      </Formik>
    );
  }
);

export default BillingDetailsForm;

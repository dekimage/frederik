"use client";
import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { usStates } from "../data";
// import { fallbackCountries } from "../data"; /* used only when worldwide country list below is restored */
import { observer } from "mobx-react-lite";
import MobxStore from "@/mobx";
import { Button } from "./ui/button";
import { getCountryLabel, listCountries } from "@/lib/pricingCatalog";
import { useLanguage } from "@/contexts/LanguageContext";
import { normalizeAddressFormValues } from "@/lib/orderUtils";

const BillingDetailsForm = observer(
  ({ formTitle, isShipping = false, onSubmit, onCountryChange }) => {
    const [selectedCountry, setSelectedCountry] = useState("");
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { shippingDetailsCompleted, billingDetailsCompleted } = MobxStore;
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

    // Validation Schema
    const validationSchema = Yup.object({
      firstName: Yup.string().required("First name is required"),
      lastName: Yup.string().required("Last name is required"),
      country: Yup.string().required("Country is required"),
      streetAddress1: Yup.string().required("Street address is required"),
      city: Yup.string().required("City is required"),
      postalCode: Yup.string().required("Postal / ZIP code is required"),
      state:
        selectedCountry === "US"
          ? Yup.string().required("State is required")
          : Yup.string(),
      email: Yup.string()
        .email("Invalid email format")
        .required("Email is required"),
    });

    return (
      <Formik
        initialValues={{
          firstName: "",
          lastName: "",
          country: "",
          streetAddress1: "",
          streetAddress2: "",
          city: "",
          state: "",
          postalCode: "",
          email: "",
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          onSubmit(normalizeAddressFormValues(values));
          if (isShipping) {
            MobxStore.setShippingDetailsCompleted(true);
          } else {
            MobxStore.setBillingDetailsCompleted(true);
          }
          setSubmitting(false);
        }}
      >
        {({ isValid, dirty, isSubmitting, setFieldValue }) => (
          <Form className="space-y-4 w-full bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-white">
              {formTitle}
            </h2>

            {/* First Name */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="firstName"
                className="text-sm font-medium text-gray-300"
              >
                First Name *
              </label>
              <Field
                name="firstName"
                className="p-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
              <ErrorMessage
                name="firstName"
                component="div"
                className="text-red-400 text-sm"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="lastName"
                className="text-sm font-medium text-gray-300"
              >
                Last Name *
              </label>
              <Field
                name="lastName"
                className="p-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
              <ErrorMessage
                name="lastName"
                component="div"
                className="text-red-400 text-sm"
              />
            </div>

            {/* Country/Region */}
            <div className="flex flex-col gap-2">
              <label htmlFor="country">Country/Region *</label>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t("shippingCountrySelectHint")}
              </p>
              {loading ? (
                <div className="text-white">Loading countries...</div>
              ) : (
                <Field
                  as="select"
                  name="country"
                  className="p-2 rounded bg-gray-800 text-white"
                  onChange={(e) => {
                    const v = e.target.value;
                    setFieldValue("country", v);
                    setSelectedCountry(v);
                    if (typeof onCountryChange === "function") {
                      onCountryChange(v || "");
                    }
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
                component="div"
                className="text-red-500"
              />
              {error && <div className="text-yellow-500">{error}</div>}
            </div>

            {/* Street Address */}
            <div className="flex flex-col">
              <label htmlFor="streetAddress1">Street Address *</label>
              <Field
                name="streetAddress1"
                className="p-2 rounded bg-gray-800 text-white"
              />
              <ErrorMessage
                name="streetAddress1"
                component="div"
                className="text-red-500"
              />
            </div>

            {/* Street Address 2 */}
            <div className="flex flex-col">
              <label htmlFor="streetAddress2">
                Apartment, suite, unit, etc. (Optional)
              </label>
              <Field
                name="streetAddress2"
                className="p-2 rounded bg-gray-800 text-white"
              />
            </div>

            {/* City */}
            <div className="flex flex-col">
              <label htmlFor="city">Town/City *</label>
              <Field
                name="city"
                className="p-2 rounded bg-gray-800 text-white"
              />
              <ErrorMessage
                name="city"
                component="div"
                className="text-red-500"
              />
            </div>

            {/* Postal / ZIP */}
            <div className="flex flex-col">
              <label htmlFor="postalCode">Postal / ZIP code *</label>
              <Field
                name="postalCode"
                className="p-2 rounded bg-gray-800 text-white"
              />
              <ErrorMessage
                name="postalCode"
                component="div"
                className="text-red-500"
              />
            </div>

            {/* US State Dropdown */}
            {selectedCountry === "US" && (
              <div className="flex flex-col">
                <label htmlFor="state">State *</label>
                <Field
                  as="select"
                  name="state"
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
                  component="div"
                  className="text-red-500"
                />
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col">
              <label htmlFor="email">
                Email *{!isShipping ? " (billing)" : ""}
              </label>
              <Field
                name="email"
                type="email"
                className="p-2 rounded bg-gray-800 text-white"
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-red-500"
              />
            </div>

            <Button
              type="submit"
              className="disabled:opacity-50"
              disabled={
                !isValid ||
                !dirty ||
                isSubmitting ||
                (isShipping
                  ? shippingDetailsCompleted
                  : billingDetailsCompleted)
              }
            >
              {(isShipping ? shippingDetailsCompleted : billingDetailsCompleted)
                ? "Submitted"
                : "Submit Details"}
            </Button>
          </Form>
        )}
      </Formik>
    );
  }
);

export default BillingDetailsForm;

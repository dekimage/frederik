"use client";
import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { usStates } from "../data";
import { fallbackCountries } from "../data";
import { observer } from "mobx-react-lite";
import MobxStore from "@/mobx";
import { Button } from "./ui/button";


const BillingDetailsForm = observer(
  ({ formTitle, isShipping = false, onSubmit }) => {
    const [selectedCountry, setSelectedCountry] = useState("");
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { shippingDetailsCompleted, billingDetailsCompleted } = MobxStore;

    // Fetch countries from restcountries.com API
    useEffect(() => {
      const fetchCountries = async () => {
        try {
          setLoading(true);
          const response = await fetch("https://restcountries.com/v3.1/all");
          const data = await response.json();
          const countryOptions = data
            .map((country) => ({
              label: country.name.common,
              value: country.cca2, // 2-letter country code
            }))
            .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
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

    // Validation Schema
    const validationSchema = Yup.object({
      firstName: Yup.string().required("First name is required"),
      lastName: Yup.string().required("Last name is required"),
      country: Yup.string().required("Country is required"),
      streetAddress1: Yup.string().required("Street address is required"),
      city: Yup.string().required("City is required"),
      state:
        selectedCountry === "US"
          ? Yup.string().required("State is required")
          : Yup.string(),
      email: isShipping
        ? Yup.string()
          .email("Invalid email format")
          .required("Email is required")
        : Yup.string(),
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
          email: "",
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          onSubmit(values);
          if (isShipping) {
            MobxStore.setShippingDetailsCompleted(true);
          } else {
            MobxStore.setBillingDetailsCompleted(true);
          }
          setSubmitting(false);
        }}
      >
        {({ isValid, dirty, isSubmitting, setFieldValue }) => (
          <Form className="space-y-4 w-full">
            <h2 className="text-2xl font-bold mb-4">{formTitle}</h2>

            {/* First Name */}
            <div className="flex flex-col">
              <label htmlFor="firstName">First Name *</label>
              <Field
                name="firstName"
                className="p-2 rounded bg-gray-800 text-white"
              />
              <ErrorMessage
                name="firstName"
                component="div"
                className="text-red-500"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col">
              <label htmlFor="lastName">Last Name *</label>
              <Field
                name="lastName"
                className="p-2 rounded bg-gray-800 text-white"
              />
              <ErrorMessage
                name="lastName"
                component="div"
                className="text-red-500"
              />
            </div>

            {/* Country/Region */}
            <div className="flex flex-col">
              <label htmlFor="country">Country/Region *</label>
              {loading ? (
                <div className="text-white">Loading countries...</div>
              ) : (
                <Field
                  as="select"
                  name="country"
                  className="p-2 rounded bg-gray-800 text-white"
                  onChange={(e) => {
                    setFieldValue("country", e.target.value);
                    setSelectedCountry(e.target.value);
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
            {isShipping && (
              <div className="flex flex-col">
                <label htmlFor="email">Email *</label>
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
            )}

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

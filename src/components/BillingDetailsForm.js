"use client";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { countries, usStates } from "../data";

const BillingDetailsForm = ({ formTitle, isShipping = false, onSubmit }) => {
  const [selectedCountry, setSelectedCountry] = useState("");

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
    email: !isShipping
      ? Yup.string().email("Invalid email format").required("Email is required")
      : Yup.string(),
    phone: !isShipping ? Yup.string().optional() : Yup.string(),
  });

  return (
    <Formik
      initialValues={{
        firstName: "",
        lastName: "",
        companyName: "",
        country: "",
        streetAddress1: "",
        streetAddress2: "",
        city: "",
        state: "",
        email: "",
        phone: "",
        orderNotes: "",
      }}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        onSubmit(values); // Pass form values back to the parent component
      }}
    >
      {({ setFieldValue }) => (
        <Form className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">{formTitle}</h2>
          <div className="flex flex-col">
            <label htmlFor="firstName">First Name</label>
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

          <div className="flex flex-col">
            <label htmlFor="lastName">Last Name</label>
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

          <div className="flex flex-col">
            <label htmlFor="companyName">Company Name (Optional)</label>
            <Field
              name="companyName"
              className="p-2 rounded bg-gray-800 text-white"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="country">Country/Region</label>
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
            <ErrorMessage
              name="country"
              component="div"
              className="text-red-500"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="streetAddress1">Street Address</label>
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

          <div className="flex flex-col">
            <label htmlFor="streetAddress2">
              Apartment, suite, unit, etc. (Optional)
            </label>
            <Field
              name="streetAddress2"
              className="p-2 rounded bg-gray-800 text-white"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="city">Town/City</label>
            <Field name="city" className="p-2 rounded bg-gray-800 text-white" />
            <ErrorMessage
              name="city"
              component="div"
              className="text-red-500"
            />
          </div>

          {selectedCountry === "US" && (
            <div className="flex flex-col">
              <label htmlFor="state">State</label>
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

          {!isShipping && (
            <>
              <div className="flex flex-col">
                <label htmlFor="email">Email</label>
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

              <div className="flex flex-col">
                <label htmlFor="phone">Phone (Optional)</label>
                <Field
                  name="phone"
                  className="p-2 rounded bg-gray-800 text-white"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="orderNotes">Order Notes (Optional)</label>
                <Field
                  name="orderNotes"
                  as="textarea"
                  className="p-2 rounded bg-gray-800 text-white"
                />
              </div>
            </>
          )}

          <button type="submit" className="bg-blue-500 text-white p-4 rounded">
            Submit
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default BillingDetailsForm;

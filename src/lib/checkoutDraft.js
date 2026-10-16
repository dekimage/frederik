import * as Yup from "yup";

export const CHECKOUT_DRAFT_KEY = "wolfskin.checkout-draft.v1";
export const emptyAddress = {
  firstName: "", lastName: "", country: "", streetAddress1: "",
  streetAddress2: "", city: "", state: "", postalCode: "", email: "",
};

export const addressSchema = Yup.object({
  firstName: Yup.string().trim().required("First name is required"),
  lastName: Yup.string().trim().required("Last name is required"),
  country: Yup.string().required("Country is required"),
  streetAddress1: Yup.string().trim().required("Street address is required"),
  city: Yup.string().trim().required("City is required"),
  postalCode: Yup.string().trim().required("Postal / ZIP code is required"),
  state: Yup.string().when("country", {
    is: "US",
    then: (schema) => schema.trim().required("State is required"),
  }),
  email: Yup.string().trim().email("Invalid email format").required("Email is required"),
});

export function addressFields(value) {
  return Object.fromEntries(Object.keys(emptyAddress).map((key) => [
    key, typeof value?.[key] === "string" ? value[key] : "",
  ]));
}

export function addressIsSaved(draft, saved) {
  return !!saved && addressSchema.isValidSync(draft) &&
    Object.keys(emptyAddress).every((key) => draft[key] === saved[key]);
}

export function restoreCheckoutDraft(value) {
  const shipping = addressFields(value?.shipping);
  const billing = addressFields(value?.billing);
  return {
    shipping, billing,
    isShippingDifferent: value?.isShippingDifferent === true,
    savedShipping: addressIsSaved(shipping, value?.savedShipping) ? shipping : null,
    savedBilling: addressIsSaved(billing, value?.savedBilling) ? billing : null,
  };
}

export function readCheckoutDraft() {
  try {
    return restoreCheckoutDraft(JSON.parse(sessionStorage.getItem(CHECKOUT_DRAFT_KEY)));
  } catch {
    return restoreCheckoutDraft(null);
  }
}

export function writeCheckoutDraft(draft) {
  try { sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft)); } catch {}
}

export function clearCheckoutDraft() {
  try { sessionStorage.removeItem(CHECKOUT_DRAFT_KEY); } catch {}
}

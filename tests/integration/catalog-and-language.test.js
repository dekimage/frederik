import { describe, it, expect } from "vitest";
import { sortCatalog, categoryAliases, categoryLabel } from "@/lib/catalog";
import {
  translateStorefront,
  storefrontNl,
} from "@/data/storefrontTranslations";
import { formatAddressLines } from "@/lib/orderUtils";
import { materialLabel, getCountryLabel } from "@/lib/pricingCatalog";

describe("catalogue and localization regressions", () => {
  it("orders products by admin index with a stable tie break", () => {
    expect(
      sortCatalog([
        { id: "b", index: 3 },
        { id: "c", index: 0 },
        { id: "a", index: 3 },
      ]).map((x) => x.id),
    ).toEqual(["c", "a", "b"]);
  });
  it("keeps category links stable when names change", () => {
    expect(
      categoryAliases({ id: "stable-id", name: "New Name" }, "stable-id"),
    ).toEqual(["stable-id", "New Name", "new name"]);
    expect(categoryLabel({ name: "Landscapes" }, (key) => key)).toBe(
      "Landscapes",
    );
  });
  it("translates checkout, countries, materials and validation", () => {
    for (const key of [
      "Back",
      "Continue to checkout",
      "First name is required",
      "Payment successful",
      "Download Stripe invoice PDF",
    ]) {
      expect(translateStorefront(key, "nl")).not.toBe(key);
      expect(translateStorefront(key, "en")).toBe(key);
    }
    expect(getCountryLabel("NL", "nl")).toBe("Nederland");
    expect(materialLabel("canvas", "nl")).toContain("zonder lijst");
    expect(Object.keys(storefrontNl).length).toBeGreaterThan(150);
  });
  it("includes the recipient name in invoice and email address blocks", () => {
    expect(
      formatAddressLines({
        firstName: "Jane",
        lastName: "Buyer",
        streetAddress1: "Street 1",
        city: "Amsterdam",
        country: "NL",
      })[0],
    ).toBe("Jane Buyer");
  });
});

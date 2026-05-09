import data from "@/data/pricingNormalized.json";

const INDEX = new Map();
for (const r of data.rows) {
  INDEX.set(`${r.country}|${r.material}|${r.sizeKey}`, r);
}

export const MATERIAL_LABELS = {
  photoprint: "Photoprint, frameless",
  canvas: "Photo on canvas, frameless",
  aluminium: "Photo on aluminium, frameless",
  plexiglass: "Photo on plexiglass, frameless",
  forex: "Photo on forex PVC, frameless",
  wood: "Photo on wood, frameless",
};

/** Reference market for PDP/cart list prices (print column). Set `NEXT_PUBLIC_PDP_PRICE_COUNTRY` to override. */
export const PDP_REFERENCE_COUNTRY = (
  process.env.NEXT_PUBLIC_PDP_PRICE_COUNTRY || "NL"
).toString()
  .toUpperCase()
  .slice(0, 2) || "NL";

export function getPricingMeta() {
  return data.meta;
}

export function listMaterials() {
  const s = new Set(data.rows.map((r) => r.material));
  return [...s].sort();
}

export function listCountries() {
  return [...data.meta.countries].sort();
}

export function getCountryLabel(iso) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(iso) || iso;
  } catch {
    return iso;
  }
}

/** @param {string} material */
export function listSizesForMaterial(material) {
  const byKey = new Map();
  for (const r of data.rows) {
    if (r.material !== material) continue;
    if (!byKey.has(r.sizeKey))
      byKey.set(r.sizeKey, { sizeKey: r.sizeKey, sizeRaw: r.sizeRaw });
  }
  return [...byKey.values()].sort((a, b) =>
    a.sizeRaw.localeCompare(b.sizeRaw, undefined, { numeric: true })
  );
}

/**
 * @param {string} countryCode ISO 3166-1 alpha-2
 * @param {string} material
 * @param {string} sizeKey normalized size key from catalog
 */
export function getQuote(countryCode, material, sizeKey) {
  if (!countryCode || !material || !sizeKey) return null;
  return INDEX.get(`${countryCode}|${material}|${sizeKey}`) ?? null;
}

/** Row for material × size using the shop reference market (PDP + cart list price). */
export function getPdpQuote(material, sizeKey) {
  return getQuote(PDP_REFERENCE_COUNTRY, material, sizeKey);
}

/**
 * Full order totals for a shipping destination (matches CSV columns for that country).
 * @param {Array<{ quantity?: number, material?: string, sizeKey?: string }>} lines
 * @param {string} shippingCountryCode ISO alpha-2
 */
export function quoteOrderForShippingCountry(lines, shippingCountryCode) {
  const code = (shippingCountryCode || "").toString().toUpperCase().slice(0, 2);
  if (!code || code.length !== 2) {
    return {
      ok: false,
      reason: "no_country",
      printSum: 0,
      shippingSum: 0,
      totalSum: 0,
      unavailable: [],
    };
  }

  let printSum = 0;
  let shippingSum = 0;
  let totalSum = 0;
  const unavailable = [];

  for (const line of lines || []) {
    const qty = Math.max(1, Number(line.quantity) || 1);
    if (!line.material || !line.sizeKey) continue;
    const row = getQuote(code, line.material, line.sizeKey);
    if (!row || !row.available) {
      unavailable.push({ material: line.material, sizeKey: line.sizeKey });
      continue;
    }
    printSum += Number(row.priceExShipping) * qty;
    shippingSum += Number(row.shippingCost) * qty;
    totalSum += Number(row.priceIncShipping) * qty;
  }

  return {
    ok: unavailable.length === 0 && totalSum > 0,
    country: code,
    printSum,
    shippingSum,
    totalSum,
    unavailable,
  };
}

export function materialLabel(material) {
  return MATERIAL_LABELS[material] || material;
}

/**
 * Order-level totals matching each JSON/catalog row (same fields as CSV):
 * - posterSubtotal: Σ (TOTAL CUSTOMER PRICE WITHOUT SHIPPING × qty)
 * - shippingSubtotal: Σ (SHIPPING COSTS × qty)
 * - merchandiseWithShippingTotal: Σ (TOTAL CUSTOMER PRICE WITH SHIPPING × qty)
 *
 * Poster + shipping should match merchandise within cent rounding.
 */
export function summarizeCartSpreadsheetTotals(lines) {
  let posterSubtotal = 0;
  let shippingSubtotal = 0;
  let merchandiseWithShippingTotal = 0;

  for (const line of lines || []) {
    const qty = Math.max(1, Number(line.quantity) || 1);
    let shippingEa = Number(line.shippingBracketPerUnit);
    let posterEa = Number(line.priceExShipping);
    if (
      (!Number.isFinite(shippingEa) || !Number.isFinite(posterEa)) &&
      line.countryCode &&
      line.material &&
      line.sizeKey
    ) {
      const row = getQuote(line.countryCode, line.material, line.sizeKey);
      if (row && row.available) {
        if (!Number.isFinite(shippingEa))
          shippingEa = Number(row.shippingCost);
        if (!Number.isFinite(posterEa))
          posterEa = Number(row.priceExShipping);
      }
    }
    if (Number.isFinite(posterEa)) posterSubtotal += posterEa * qty;
    if (Number.isFinite(shippingEa)) shippingSubtotal += shippingEa * qty;
    const unitInc = Number(line.price);
    if (Number.isFinite(unitInc))
      merchandiseWithShippingTotal += unitInc * qty;
  }

  const sumParts = posterSubtotal + shippingSubtotal;
  const reconcilesWithinCent =
    Math.abs(sumParts - merchandiseWithShippingTotal) < 0.06;

  return {
    posterSubtotal,
    shippingSubtotal,
    merchandiseWithShippingTotal,
    reconcilesWithinCent,
  };
}

/** @deprecated Use summarizeCartSpreadsheetTotals */
export function summarizeShippingDisplay(lines) {
  const s = summarizeCartSpreadsheetTotals(lines);
  return {
    postalBracketAcrossOrder: s.shippingSubtotal,
    posterPrintAcrossOrder: s.posterSubtotal,
  };
}

/** Per line: catalogue fields × qty */
export function getCartLineEconomics(line) {
  const qty = Math.max(1, Number(line.quantity) || 1);
  let shippingEa = Number(line.shippingBracketPerUnit);
  let posterEa = Number(line.priceExShipping);
  if (
    (!Number.isFinite(shippingEa) || !Number.isFinite(posterEa)) &&
    line.countryCode &&
    line.material &&
    line.sizeKey
  ) {
    const row = getQuote(line.countryCode, line.material, line.sizeKey);
    if (row && row.available) {
      if (!Number.isFinite(shippingEa))
        shippingEa = Number(row.shippingCost);
      if (!Number.isFinite(posterEa))
        posterEa = Number(row.priceExShipping);
    }
  }
  const totalEa = Number(line.price);
  const resolvedTotalEa = Number.isFinite(totalEa)
    ? totalEa
    : Number.isFinite(posterEa) && Number.isFinite(shippingEa)
      ? posterEa + shippingEa
      : NaN;

  return {
    posterEa,
    shippingEa,
    totalEa: resolvedTotalEa,
    qty,
    posterLineTotal: Number.isFinite(posterEa) ? posterEa * qty : NaN,
    shippingLineTotal: Number.isFinite(shippingEa) ? shippingEa * qty : NaN,
    merchandiseLineTotal: Number.isFinite(resolvedTotalEa)
      ? resolvedTotalEa * qty
      : NaN,
  };
}

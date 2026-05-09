/**
 * Parses products.csv (WOLFSKIN pricing matrix export) into a flat JSON catalog.
 * Run: node scripts/normalize-pricing.mjs
 */
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "products.csv");
const OUT = path.join(ROOT, "src", "data", "pricingNormalized.json");

/** @returns {number} */
function parseMoneyCell(s) {
  if (s == null || s === "") return NaN;
  const t = String(s).replace(/€/g, "").replace(/\s/g, "").replace(",", ".").trim();
  if (/^-/u.test(t)) {
    const n = parseFloat(t.replace(/^-/u, ""));
    return Number.isFinite(n) ? -n : NaN;
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : NaN;
}

function slugMaterial(desc) {
  const d = String(desc).replace(/[\r\n]+/g, " ").trim().toUpperCase();
  if (d.includes("PHOTOPRINT")) return "photoprint";
  if (d.includes("CANVAS")) return "canvas";
  if (d.includes("ALUMINIUM") || d.includes("ALUMINUM")) return "aluminium";
  if (d.includes("PLEXIGLASS") || d.includes("PLEXIGLAS")) return "plexiglass";
  if (d.includes("FOREX")) return "forex";
  if (d.includes("WOOD")) return "wood";
  return d
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase() || "unknown";
}

function sizeSlug(sizeCell) {
  return String(sizeCell)
    .replace(/[\r\n]+/g, " ")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** Map header label from sheet to ISO 3166-1 alpha-2 */
const COUNTRY_HEADER_TO_CODE = {
  "THE NETHERLANDS": "NL",
  BELGIUM: "BE",
  LUXEMBURG: "LU",
  LUXEMBOURG: "LU",
  GERMANY: "DE",
  AUSTRIA: "AT",
  POLAND: "PL",
  SLOVAKIA: "SK",
  SLOVENIA: "SI",
  DENMARK: "DK",
  SWEDEN: "SE",
  "UNITED KINGDOM": "GB",
  "ICELAND (RESTRICTIONS)": "IS",
  "CANADA (RESTRICTIONS)": "CA",
  "SINGAPORE (RESTRICTIONS)": "SG",
  FRANCE: "FR",
  SPAIN: "ES",
  PORTUGAL: "PT",
  SWITZERLAND: "CH",
  ITALY: "IT",
  CZECH: "CZ",
  HUNGARY: "HU",
  ROMANIA: "RO",
  NORWAY: "NO",
  FINLAND: "FI",
  IRELAND: "IE",
  "AUSTRALIA (RESTRICTIONS)": "AU",
  "UNITED STATES OF AMERICA (NOT AVAILABLE AT THE MOMENT)": "US",
  BLANK: null,
  "ITEM INFORMATION": null,
};

function resolveCountryCode(headerCell) {
  if (!headerCell) return null;
  const k = String(headerCell).replace(/[\r\n]+/g, " ").trim().toUpperCase();
  if (COUNTRY_HEADER_TO_CODE[k] !== undefined) return COUNTRY_HEADER_TO_CODE[k];
  const compact = k.replace(/\s+/g, " ");
  for (const [label, code] of Object.entries(COUNTRY_HEADER_TO_CODE)) {
    if (compact === label || compact.startsWith(label)) return code;
  }
  return null;
}

function isProductRow(row) {
  const a = (row[0] || "").replace(/[\r\n]+/g, " ").trim();
  if (!a || a.startsWith("V = ") || a.startsWith("H = ") || a.startsWith("T = ")) return false;
  if (a.toUpperCase().includes("WARNING")) return false;
  if (a.toUpperCase() === "ITEM INFORMATION") return false;
  if (a.startsWith('"PHOTO') || a.startsWith("PHOTO") || a.includes("PHOTOPRINT")) return true;
  return false;
}

function extractCountrySpans(row) {
  const spans = [];
  for (let c = 9; c < row.length; c += 6) {
    const shipping = parseMoneyCell(row[c]);
    const manufacturing = parseMoneyCell(row[c + 1]);
    const priceEx = parseMoneyCell(row[c + 2]);
    const priceInc = parseMoneyCell(row[c + 3]);
    const profit = parseMoneyCell(row[c + 4]);
    if (
      !Number.isFinite(shipping) &&
      !Number.isFinite(manufacturing) &&
      !Number.isFinite(priceEx) &&
      !Number.isFinite(priceInc)
    ) {
      continue;
    }
    spans.push({ col: c, shipping, manufacturing, priceEx, priceInc, profit });
  }
  return spans;
}

function main() {
  const raw = fs.readFileSync(SRC, "utf8");
  const records = parse(raw, {
    relax_column_count: true,
    skip_empty_lines: false,
    bom: true,
  });

  /** @type {string[]} */
  let headerRow = null;
  for (const row of records) {
    if (row[0] && String(row[0]).includes("ITEM INFORMATION") && row.length > 20) {
      headerRow = row;
      break;
    }
  }
  if (!headerRow) {
    headerRow = records[0] || [];
  }

  /** col -> ISO code */
  const colToCountry = new Map();
  for (let c = 9; c < headerRow.length; c += 6) {
    const cell = headerRow[c - 1] ?? headerRow[c];
    const above = headerRow[c - 2];
    const candidates = [headerRow[c], headerRow[c - 1], above].filter(Boolean);
    let code = null;
    for (const cand of candidates) {
      code = resolveCountryCode(cand);
      if (code) break;
    }
    if (!code) {
      const label = String(headerRow[c] || headerRow[c - 1] || "").trim();
      if (label && label.length > 2 && !label.includes("€")) {
        const guess = resolveCountryCode(label.split(",")[0]);
        if (guess) code = guess;
      }
    }
    if (code) colToCountry.set(c, code);
  }

  const flat = [];
  const countriesSet = new Map();

  for (const row of records) {
    if (!isProductRow(row)) continue;
    const desc = String(row[0] || "").replace(/[\r\n]+/g, " ").trim();
    const sizeRaw = String(row[1] || "").replace(/[\r\n]+/g, " ").trim();
    if (!sizeRaw || !sizeRaw.includes("cm")) continue;

    const material = slugMaterial(desc);
    const sizeKey = sizeSlug(sizeRaw);
    const packingType = (row[7] || "").trim();
    const manufacturingCost = parseMoneyCell(row[2]);
    const discountPct = String(row[3] || "").trim();
    const discountEur = parseMoneyCell(row[4]);
    const manufacturingAfterDiscount = parseMoneyCell(row[5]);
    const marginLabel = String(row[6] || "").trim();

    const spans = extractCountrySpans(row);
    for (const sp of spans) {
      const country = colToCountry.get(sp.col);
      if (!country) continue;
      const available =
        Number.isFinite(sp.priceInc) &&
        sp.priceInc > 0 &&
        Number.isFinite(sp.priceEx) &&
        sp.priceEx > 0;

      countriesSet.set(country, true);
      flat.push({
        material,
        sizeRaw,
        sizeKey,
        productLabel: desc.replace(/^"|"$/g, ""),
        packingType,
        manufacturingCost,
        discountPercent: discountPct,
        discountEur,
        manufacturingAfterDiscount,
        marginLabel,
        country,
        shippingCost: sp.shipping,
        manufacturingCountry: sp.manufacturing,
        priceExShipping: sp.priceEx,
        priceIncShipping: sp.priceInc,
        profit: sp.profit,
        available,
      });
    }
  }

  /** Second matrix: file has two ITEM INFORMATION bands — remap columns for rows after 2nd header */
  let secondHeaderIdx = -1;
  for (let i = 1; i < records.length; i++) {
    if (
      records[i][0] &&
      String(records[i][0]).includes("ITEM INFORMATION") &&
      i > 5
    ) {
      secondHeaderIdx = i;
      break;
    }
  }

  if (secondHeaderIdx >= 0) {
    const h2 = records[secondHeaderIdx];
    colToCountry.clear();
    for (let c = 9; c < h2.length; c += 6) {
      const code = resolveCountryCode(h2[c]) || resolveCountryCode(h2[c - 1]);
      if (code) colToCountry.set(c, code);
    }
    for (let ri = secondHeaderIdx + 1; ri < records.length; ri++) {
      const row = records[ri];
      if (!isProductRow(row)) continue;
      const desc = String(row[0] || "").replace(/[\r\n]+/g, " ").trim();
      const sizeRaw = String(row[1] || "").replace(/[\r\n]+/g, " ").trim();
      if (!sizeRaw || !sizeRaw.includes("cm")) continue;
      const material = slugMaterial(desc);
      const sizeKey = sizeSlug(sizeRaw);
      const packingType = (row[7] || "").trim();
      const manufacturingCost = parseMoneyCell(row[2]);
      const discountPct = String(row[3] || "").trim();
      const discountEur = parseMoneyCell(row[4]);
      const manufacturingAfterDiscount = parseMoneyCell(row[5]);
      const marginLabel = String(row[6] || "").trim();
      const spans = extractCountrySpans(row);
      for (const sp of spans) {
        const country = colToCountry.get(sp.col);
        if (!country) continue;
        const available =
          Number.isFinite(sp.priceInc) &&
          sp.priceInc > 0 &&
          Number.isFinite(sp.priceEx) &&
          sp.priceEx > 0;
        countriesSet.set(country, true);
        flat.push({
          material,
          sizeRaw,
          sizeKey,
          productLabel: desc.replace(/^"|"$/g, ""),
          packingType,
          manufacturingCost,
          discountPercent: discountPct,
          discountEur,
          manufacturingAfterDiscount,
          marginLabel,
          country,
          shippingCost: sp.shipping,
          manufacturingCountry: sp.manufacturing,
          priceExShipping: sp.priceEx,
          priceIncShipping: sp.priceInc,
          profit: sp.profit,
          available,
        });
      }
    }
  }

  const countries = [...countriesSet.keys()].sort();
  const byKey = new Map();
  for (const r of flat) {
    const k = `${r.material}|${r.sizeKey}|${r.country}`;
    byKey.set(k, r); // last occurrence wins if duplicate matrices overlap
  }
  const unique = [...byKey.values()];

  const meta = {
    generatedAt: new Date().toISOString(),
    sourceFile: "products.csv",
    countries,
    rowCount: unique.length,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ meta, rows: unique }, null, 2), "utf8");
  console.log(`Wrote ${unique.length} rows -> ${OUT}`);
  console.log("Countries:", countries.join(", "));
}

main();

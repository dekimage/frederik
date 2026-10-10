# VAT & pricing — decision brief for managers

**Purpose:** Agree how prices and VAT are shown to customers, and what to configure in Stripe.  
**Audience:** Business owners, finance, operations (non-technical).  
**Shop:** WOLFSKIN Photography — physical art prints, EUR, EU shipping.

**Signed path (19 Aug 2026):** **Path KOR** — catalogue columns L/M are the amounts customers pay; Stripe does **not** add VAT. See answers below.

---

## How our shop prices work today

1. **Each photo** is a product (image + title + description). There is **no per-photo price** in admin.
2. **Print prices** come from one master table: **material × size × shipping country** (e.g. canvas 60×40 cm to Netherlands).
3. At checkout, our **server** calculates the amount and sends it to **Stripe**. Customers pay on Stripe’s secure page.
4. **Stripe Tax is off (Path KOR).** The charge equals the catalogue total (print + delivery for the shipping country). No extra VAT at payment.

**Spreadsheet (Frederik, NL columns):**

| Column | Meaning | In the shop |
|--------|---------|-------------|
| J | DHL shipping via YourSurprise (VAT already in *his* cost) | `shippingCost` |
| K | Manufacturing at YourSurprise (VAT he pays them) | manufacturing cost |
| L | What the customer pays **without** shipping | `priceExShipping` (print price on shop/PDP) |
| M | What the customer pays **with** shipping | `priceIncShipping` (Stripe charge) |
| N | Profit after YourSurprise | not shown to customers |

`priceExShipping` means **excluding shipping**, not excluding VAT.

---

## What customers see (Path KOR — live in code)

| Step | What they see |
|------|----------------|
| Shop grid | “From €X” — lowest **print** price for the reference market (default: Netherlands). Delivery added at checkout. |
| Product page | Print price for chosen material & size (reference market); delivery added at checkout |
| Checkout summary | Print + delivery for their country = **amount to pay** |
| Stripe payment page | Same total as checkout. **No extra VAT line.** |

Storefront does **not** say “incl. BTW” until Johannes confirms that wording is acceptable under KOR (KOR sales are typically VAT-exempt). The **amount** is still column L (print) / M (with shipping).

---

## VAT options (reference)

### Path KOR — charge L/M as-is, Stripe Tax off *(signed)*

- Customer pays column M. Invoice: no VAT amount; it states that the KOR exemption applies, as required by the Dutch Tax Administration.
- Matches Q4 (KOR applicable) and Frederik’s sheet (L/M = customer prices; J/K = his YourSurprise costs).

### Option A — Merchandise ex-VAT, Stripe adds VAT *(superseded)*

Was the previous code. Would **overcharge** if L/M are already the customer prices. Do not use.

### Option B — VAT-inclusive + Stripe Tax extracts VAT

Only if the shop **leaves KOR** and is VAT-registered. Not the signed path.

### Option C — Manual VAT in catalogue, Stripe Tax off

Not used. Path KOR is tax-off because of KOR, not because we bake destination VAT into the table.

---

## Netherlands & EU — practical notes

### Netherlands (primary market)

- **KOR applies** (Frederik, 19 Aug 2026). Confirm with Johannes that this activity is registered as such.
- **iDEAL** is wired in code for NL addresses — enable in Stripe Dashboard (test + live).
- Display: prices are the amount the customer pays. “Incl. BTW” only if Johannes approves.

### Other EU countries

- YourSurprise ships EU-wide. Shipping country on checkout selects the catalogue row (L/M for that country).
- Postal code is required.
- Non-EU rows still exist in the catalogue (e.g. AU, CA, US, GB, CH). Confirm with Johannes whether those stay for sale.

---

## Recommendation (signed)

| Topic | Decision |
|-------|----------|
| **Stripe products** | **Do not** create hundreds of products in Stripe. Keep photos in admin; prices in catalogue. |
| **VAT approach** | **Path KOR.** Charge L/M. Stripe Tax off. |
| **Avoid** | Adding VAT on top of L/M (old Option A). Textbook Option B while still on KOR. |
| **Legal** | Johannes Kort owns Stripe Tax / KOR status. The invoice wording in `src/lib/korVat.js` states that the KOR exemption applies and does not list VAT. |

---

## Stripe Dashboard checklist (who does what)

**Technical / ops**

- [x] Path KOR in app: `automatic_tax` disabled; checkout copy is the amount to pay  
- [ ] Live + test API keys in hosting environment  
- [ ] Webhook: `https://YOUR_DOMAIN/api/webhooks` with signing secret  
- [ ] iDEAL enabled (test + live) for NL  

**Finance / manager (Johannes Kort)**

- [ ] Confirm KOR is in force for these print sales  
- [x] KOR exemption sentence included on invoices (`src/lib/korVat.js`)  
- [ ] Stripe Tax **not** collecting VAT on Checkout  
- [ ] Business legal name and address (Netherlands)  
- [ ] Approve or reject storefront wording “From €X incl. BTW”  
- [ ] Review first test orders: total = column M, no VAT line  

**After go-live**

- [ ] One real small order NL (card + iDEAL)  
- [ ] One EU order (non-NL) if you ship there  
- [ ] Compare Stripe receipt, order email, and accountant’s expected treatment  

---

## Order limits (agreed in shop)

- **Max 50 copies** of the same line (same image + material + size)  
- **Max 50 items total** per order (sum of all quantities)  
- Enforced in cart UI and on the server at checkout  

---

## Questions for managers — answered 19 Aug 2026

1. **Are catalogue prices ex-VAT or incl-VAT today?**  
   - [x] Incl-VAT in the sense that **L/M are what customers pay** (not a net + Stripe VAT model)  
   - Path taken: **KOR** (Q4), not textbook Option B  

2. **What should the customer see on the shop?**  
   - Requested: “From €X incl. BTW”  
   - **Shipped for now:** “From €X” as the print price you pay (delivery at checkout). “Incl. BTW” waiting on Johannes (KOR wording).  

3. **Primary markets**  
   - Mostly the Netherlands; other EU via YourSurprise as well.  

4. **KOR / small business VAT scheme?**  
   - **Yes, KOR is applicable.**  

5. **Who owns Stripe Tax setup?**  
   - **Johannes Kort**  

---

## One-page summary for sign-off

> We sell photo prints with prices set by **material, size, and country**, not per image.  
> Payments go through **Stripe Checkout**; amounts are calculated **on our server**, not in the browser.  
> Customer prices are catalogue **L (print)** and **M (print + shipping)**. Stripe charges **M** and does **not** add VAT (**Path KOR**).  
> YourSurprise manufacturing and shipping costs (J/K) already include VAT Frederik pays them; that is not a second charge to the customer.  
> Complete **live iDEAL/Wero + live webhook** and confirm the business remains enrolled in KOR before heavy marketing.

---

*Document version: August 2026 — Path KOR signed from manager answers 19 Aug 2026.*

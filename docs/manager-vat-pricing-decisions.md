# VAT & pricing — decision brief for managers

**Purpose:** Agree how prices and VAT are shown to customers, and what to configure in Stripe.  
**Audience:** Business owners, finance, operations (non-technical).  
**Shop:** WOLFSKIN Photography — physical art prints, EUR, EU shipping.

---

## How our shop prices work today

1. **Each photo** is a product (image + title + description). There is **no per-photo price** in admin.
2. **Print prices** come from one master table: **material × size × shipping country** (e.g. canvas 60×40 cm to Netherlands).
3. At checkout, our **server** calculates the amount and sends it to **Stripe**. Customers pay on Stripe’s secure page.
4. **Stripe Tax** is turned on: VAT is calculated automatically from the customer’s **shipping address**.

---

## What customers see (current behaviour — Option A)

| Step | What they see |
|------|----------------|
| Shop grid | “From €X” — lowest print price for the reference market (default: Netherlands) |
| Product page | Print price for chosen material & size (reference market); delivery added at checkout |
| Checkout summary | Merchandise subtotal (print + delivery per line for their country) |
| Stripe payment page | Line items + **VAT added by Stripe** → **final total** |

**Important:** The checkout summary is **merchandise only**. VAT appears on the Stripe payment screen. The final charge can be slightly higher than the checkout subtotal.

This is **Option A** — already live in the codebase.

---

## VAT options — what to choose

### Option A — Merchandise ex-VAT at checkout, Stripe adds VAT *(current)*

**How it works**

- Our catalogue stores **print + shipping** amounts as the business uses them internally (typically **excluding VAT** or as agreed with your accountant).
- Stripe Tax calculates VAT on top at payment, based on shipping country and product tax category.

**Customer experience**

- Checkout: “€120 merchandise (incl. delivery)”  
- Stripe: “€120 + €25.20 VAT = **€145.20 total**” (example, 21% NL)

**Pros**

- Already implemented; no code change.
- Stripe handles EU VAT rules, rate changes, and many cross-border cases.
- Good for mixed EU destinations from one NL/EU business.

**Cons**

- Small “sticker shock” if customers expect the checkout total to be final.
- You must configure Stripe Tax correctly (business address, VAT registrations, product tax codes).

**Best when:** You want Stripe to own VAT compliance and your catalogue prices are **ex-VAT**.

---

### Option B — Show VAT-inclusive prices everywhere *(gross pricing)*

**How it works**

- Catalogue prices are stored **including VAT** for your home market (e.g. Netherlands 21%).
- Checkout and Stripe line items use those gross amounts.
- Stripe Tax is configured so it **does not double-charge VAT** (prices treated as tax-inclusive; Stripe extracts/reports VAT).

**Customer experience**

- Shop, cart, checkout, and Stripe all show **the same final-style total** (for NL customers).

**Pros**

- Clearer for Dutch/EU B2C — “what you see is what you pay” (for domestic VAT rate).
- Fewer support questions about “extra tax at payment”.

**Cons**

- Requires **pricing model + Stripe Tax setup** aligned with your accountant (tax-inclusive mode, correct tax behaviour).
- Cross-border EU orders may still show small differences (other countries’ VAT rates).
- Catalogue or import process may need updating if prices are currently ex-VAT.

**Best when:** Almost all customers are NL/EU B2C and marketing wants **inclusive** prices.

---

### Option C — Manual VAT in catalogue, Stripe Tax off

**How it works**

- VAT rate baked into your price table per country (or one rate for all).
- Stripe only charges the fixed total; no automatic tax engine.

**Pros**

- Full control; simplest Stripe configuration.

**Cons**

- **Not recommended** for EU cross-border B2C: you must track rate changes, OSS/IOSS, B2B reverse charge, etc. yourself.
- High compliance risk as you scale in the EU.

**Best when:** Almost never for this shop unless a tax advisor explicitly requires it.

---

## Netherlands & EU — practical notes

### Netherlands (primary market)

- Standard VAT **21%** on most physical prints (confirm with your accountant).
- **iDEAL** is enabled for NL addresses — common and trusted.
- For **Option A**: ensure Stripe Tax has your **NL VAT registration** and business address.
- Display on site: many NL shops show “prijzen excl. btw” or show incl. btw — **pick one story and stick to it**.

### Other EU countries

- Stripe Tax can apply the **destination country VAT** for B2C distance sales (OSS-style reporting when configured).
- Shipping country on checkout drives tax — postal code is required (already in the shop).
- Some destinations may have different VAT rates; automatic tax handles most of this if registrations are set up.

### Non-EU

- If you only ship to countries on your price list, confirm with finance whether VAT/export rules apply per destination.

---

## Recommendation (best practice for this shop)

| Topic | Recommendation |
|-------|----------------|
| **Stripe products** | **Do not** create hundreds of products in Stripe. Keep photos in admin; prices in catalogue. *(Already how the app works.)* |
| **VAT approach** | **Short term:** stay on **Option A** if catalogue is ex-VAT — finish Stripe Tax setup with your accountant. |
| **Long term (NL-focused B2C):** | Consider **Option B** (VAT-inclusive display) after finance confirms gross prices and Stripe inclusive-tax settings. |
| **Avoid** | **Option C** unless advised otherwise. |
| **Legal** | Confirm with your Dutch accountant/bookkeeper: B2C vs B2B, KOR (kleineondernemersregeling), OSS, invoice wording. |

---

## Stripe Dashboard checklist (who does what)

**Technical / ops**

- [ ] Live + test API keys in hosting environment  
- [ ] Webhook: `https://YOUR_DOMAIN/api/webhooks` with signing secret  
- [ ] iDEAL enabled (test + live) for NL  

**Finance / manager (Stripe → Settings → Tax)**

- [ ] Business legal name and address (Netherlands)  
- [ ] VAT number(s) and countries where you’re registered  
- [ ] Default tax behaviour: **exclusive** (Option A) vs **inclusive** (Option B)  
- [ ] Product tax category for **physical goods / prints**  
- [ ] Review first test orders: subtotal, tax, total, invoice PDF  

**After go-live**

- [ ] One real small order NL (card + iDEAL)  
- [ ] One EU order (non-NL) if you ship there  
- [ ] Compare Stripe receipt, order email, and accountant’s expected VAT  

---

## Order limits (agreed in shop)

- **Max 50 copies** of the same line (same image + material + size)  
- **Max 50 items total** per order (sum of all quantities)  
- Enforced in cart UI and on the server at checkout  

---

## Questions for managers to answer

Please reply with your choices:

1. **Are catalogue prices ex-VAT or incl-VAT today?**  
   - [ ] Ex-VAT (Option A fits)  
   - [ ] Incl-VAT (move toward Option B)  
   - [ ] Unsure — ask accountant  

2. **What should the customer see on the shop?**  
   - [ ] “From €X” ex-VAT + note at checkout  
   - [ ] “From €X incl. btw”  

3. **Primary markets** (rank): NL / BE / DE / other: ___________  

4. **KOR / small business VAT scheme?** Yes / No / Unsure  

5. **Who owns Stripe Tax setup?** Name: ___________  

---

## One-page summary for sign-off

> We sell photo prints with prices set by **material, size, and country**, not per image.  
> Payments go through **Stripe Checkout**; amounts are calculated **on our server**, not in the browser.  
> **VAT is calculated by Stripe Tax** from the customer’s shipping address (Option A today: merchandise subtotal + VAT at payment).  
> We recommend completing **Stripe Tax + accountant review** before heavy marketing.  
> For a more “Dutch webshop” feel, we can later switch display to **VAT-inclusive prices (Option B)** with finance approval.

---

*Document version: June 2026 — matches WOLFSKIN Photography checkout in this repository.*

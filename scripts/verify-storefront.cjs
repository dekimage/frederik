const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const base = process.env.TEST_BASE_URL || "http://localhost:3100";
  try {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Language (EN)", exact: true }).click();
    await page
      .getByRole("menuitemradio", { name: "Nederlands", exact: true })
      .click();
    await page.waitForFunction(() => document.documentElement.lang === "nl");
    for (const width of [320, 375, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.locator("header").evaluate((header) => {
        const logo = header.querySelector("img");
        const cart = header.querySelector('a[href="/cart"]');
        const a = logo.getBoundingClientRect(),
          b = cart.getBoundingClientRect();
        return {
          logoRight: a.right,
          cartLeft: b.left,
          width: a.width,
          objectFit: getComputedStyle(logo).objectFit,
          overflow: header.scrollWidth > innerWidth,
        };
      });
      assert(dimensions.width > 120, `Logo too small at ${width}`);
      assert(
        dimensions.logoRight <= dimensions.cartLeft + 1,
        `Logo overlaps cart at ${width}`,
      );
      assert.equal(dimensions.objectFit, "contain");
      assert.equal(dimensions.overflow, false);
      console.log(`PASS header ${width}px`);
    }
    await page.setViewportSize({ width: 375, height: 812 });
    fs.mkdirSync("artifacts", { recursive: true });
    await page.screenshot({ path: "artifacts/mobile-home-nl.png" });
    await page.goto(`${base}/cart`);
    await page.getByText("Je winkelwagen is leeg", { exact: true }).waitFor();
    assert(
      !/Your cart|Continue shopping|Explore prints/.test(
        await page.locator("main").innerText(),
      ),
    );
    console.log("PASS Dutch empty cart");
    await page.goto(`${base}/shop/all`);
    const productLink = page.locator('a[href^="/product-details/"]').first();
    await productLink.waitFor();
    const productUrl = await productLink.getAttribute("href");
    await productLink.click();
    await page
      .getByRole("button", { name: "Toevoegen aan winkelwagen" })
      .waitFor();
    await page
      .getByRole("button", { name: "Toevoegen aan winkelwagen" })
      .click();
    await page.goto(`${base}/cart`);
    await page.getByText("Je afdrukken", { exact: true }).waitFor();
    await page
      .getByRole("link", { name: "Doorgaan naar afrekenen", exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await page.locator("#shipping-details-firstName").waitFor();
    await page
      .getByRole("button", { name: "Bezorggegevens opslaan", exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await page
      .getByText("Voornaam is verplicht", { exact: true })
      .first()
      .waitFor();
    await page.locator("#shipping-details-firstName").fill("Local");
    await page.locator("#shipping-details-lastName").fill("Browser test");
    await page.locator("#shipping-details-country").selectOption("NL");
    await page.locator("#shipping-details-streetAddress1").fill("Damrak 1");
    await page.locator("#shipping-details-city").fill("Amsterdam");
    await page.locator("#shipping-details-postalCode").fill("1012LG");
    await page
      .locator("#shipping-details-email")
      .fill("browser-test@example.com");
    await page
      .getByRole("button", { name: "Bezorggegevens opslaan", exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Doorgaan naar betalen", exact: true })
      .filter({ visible: true })
      .first()
      .waitFor();
    assert(
      !/Save shipping|Continue to payment|Billing address|Your next step|First Name/.test(
        await page.locator("main").innerText(),
      ),
    );
    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      document: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("body *")]
        .filter(
          (element) => element.getBoundingClientRect().right > innerWidth + 1,
        )
        .slice(0, 10)
        .map((element) => ({
          tag: element.tagName,
          className: element.className,
          text: element.textContent?.slice(0, 60),
        })),
    }));
    console.log("checkout layout", overflow);
    assert(
      overflow.document <= overflow.width,
      "Checkout must not overflow horizontally",
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: "artifacts/mobile-checkout-nl.png",
      fullPage: true,
    });
    console.log(
      "PASS Dutch product, populated cart, validation, country and checkout (no payment initiated)",
    );
    await page.route("**/api/orders/verify-session?*", (route) =>
      route.fulfill({
        json: {
          verified: true,
          order: {
            id: "local-test-order",
            orderStatus: "processing",
            amountTotal: 31.7,
            invoice: {
              receiptUrl: "https://pay.stripe.com/receipts/test",
              hostedInvoiceUrl: "https://invoice.stripe.com/i/test",
              invoicePdf: "https://pay.stripe.com/invoice/test.pdf",
            },
          },
        },
      }),
    );
    await page.goto(`${base}/success?session_id=local-fixture`);
    await page.getByText("Betaling geslaagd", { exact: true }).waitFor();
    await page
      .getByRole("link", { name: "Stripe-factuur", exact: true })
      .waitFor();
    await page
      .getByRole("link", {
        name: "Stripe-factuur downloaden (pdf)",
        exact: true,
      })
      .waitFor();
    assert((await page.locator("body").innerText()).includes("In behandeling"));
    console.log("PASS Dutch success and Stripe document links (mocked API)");
    await page.goto(`${base}/track-order`);
    await page.getByRole("heading", { name: "Volg je bestelling" }).waitFor();
    await page.getByRole("button", { name: "Taal (NL)", exact: true }).click();
    await page
      .getByRole("menuitemradio", { name: "English", exact: true })
      .click();
    await page.waitForFunction(() => document.documentElement.lang === "en");
    await page.getByRole("heading", { name: "Track your order" }).waitFor();
    console.log("PASS language switching without reloading");
    assert.deepEqual(errors, [], "Browser runtime errors");
    console.log("PASS browser runtime: no page errors", productUrl);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

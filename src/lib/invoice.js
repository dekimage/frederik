import { KOR_INVOICE_NOTICE } from "@/lib/korVat";
import { formatAddressHtml, formatCurrencyEUR } from "@/lib/orderUtils";

export function buildInvoiceHtml({
  orderId,
  billingDetails,
  shippingDetails,
  validatedLineItems = [],
  amountSubtotal,
  amountTotal,
  currency = "eur",
  paidAt,
  receiptUrl,
}) {
  const rows = validatedLineItems
    .map(
      (item) => `
      <tr>
        <td>${item.name || "Item"}</td>
        <td>${item.material || ""} · ${item.sizeRaw || item.sizeKey || ""}</td>
        <td style="text-align:center;">${item.quantity || 1}</td>
        <td style="text-align:right;">${formatCurrencyEUR(item.unitPriceIncShipping)}</td>
        <td style="text-align:right;">${formatCurrencyEUR(item.lineTotalIncShipping)}</td>
      </tr>`
    )
    .join("");

  const paidDate = paidAt
    ? new Date(paidAt).toLocaleString("nl-NL")
    : new Date().toLocaleString("nl-NL");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${orderId}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
    h1 { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
    th { background: #f5f5f5; text-align: left; }
    .totals { margin-top: 16px; width: 320px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { font-weight: bold; border-top: 1px solid #ddd; padding-top: 8px; }
  </style>
</head>
<body>
  <h1>Invoice</h1>
  <p><strong>Order ID:</strong> ${orderId}</p>
  <p><strong>Date paid:</strong> ${paidDate}</p>
  <p><strong>Currency:</strong> ${currency.toUpperCase()}</p>

  <h2>Billing</h2>
  <p>${formatAddressHtml(billingDetails)}</p>

  <h2>Shipping</h2>
  <p>${formatAddressHtml(shippingDetails)}</p>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Options</th>
        <th>Qty</th>
        <th>Unit</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${formatCurrencyEUR(amountSubtotal)}</span></div>
    <div class="grand"><span>Total paid</span><span>${formatCurrencyEUR(amountTotal)}</span></div>
  </div>
  <p style="margin-top:16px;font-size:13px;color:#444;">${KOR_INVOICE_NOTICE}</p>

  ${
    receiptUrl
      ? `<p style="margin-top:24px;"><a href="${receiptUrl}">View Stripe receipt</a></p>`
      : ""
  }
</body>
</html>`;
}

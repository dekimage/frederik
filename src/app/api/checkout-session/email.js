import mailgun from "mailgun-js";
import {
  formatAddressHtml,
  formatCurrencyEUR,
  ORDER_STATUS_LABELS,
} from "@/lib/orderUtils";

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

export async function sendOrderPaidEmails(order) {
  const customerEmail =
    order.shippingDetails?.email ||
    order.billingDetails?.email ||
    order.customerEmail;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!customerEmail) {
    console.error("Customer email missing for paid order", order.id);
    return;
  }

  const customerEmailContent = generateCustomerEmail(order);
  const adminEmailContent = generateAdminEmail(order);

  await sendEmail(
    customerEmail,
    `Order confirmation #${order.id}`,
    customerEmailContent
  );

  if (adminEmail) {
    await sendEmail(adminEmail, `New paid order #${order.id}`, adminEmailContent);
  }
}

function generateLineItemsTable(validatedLineItems = []) {
  return validatedLineItems
    .map(
      (item) => `
    <tr>
      <td>${item.name || "Item"}</td>
      <td>${item.material || ""} · ${item.sizeRaw || item.sizeKey || ""}</td>
      <td style="text-align:center;">${item.quantity || 1}</td>
      <td style="text-align:right;">${formatCurrencyEUR(item.lineTotalIncShipping)}</td>
    </tr>`
    )
    .join("");
}

function generateTotalsBlock(order) {
  return `
    <p>Subtotal: ${formatCurrencyEUR(order.amountSubtotal)}</p>
    <p>Tax: ${formatCurrencyEUR(order.amountTax)}</p>
    <p><strong>Total paid: ${formatCurrencyEUR(order.amountTotal)}</strong></p>
  `;
}

function generateCustomerEmail(order) {
  const statusLabel =
    ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || "Processing";
  const trackUrl = `${process.env.NEXT_PUBLIC_URL}/track-order?orderId=${encodeURIComponent(order.id)}`;
  const receiptLink = order.invoice?.receiptUrl
    ? `<p><a href="${order.invoice.receiptUrl}">Download Stripe receipt</a></p>`
    : "";

  return `
    <h1>Thank you for your order</h1>
    <p>Your payment was successful. We are preparing your order.</p>
    <h2>Order ID: ${order.id}</h2>
    <p><strong>Status:</strong> ${statusLabel}</p>
    <p><a href="${trackUrl}">Track your order</a></p>
    ${receiptLink}
    <h3>Billing Details</h3>
    <p>${formatAddressHtml(order.billingDetails)}</p>
    <h3>Shipping Details</h3>
    <p>${formatAddressHtml(order.shippingDetails)}</p>
    <h3>Order Summary</h3>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <th>Product</th>
        <th>Options</th>
        <th>Qty</th>
        <th>Total</th>
      </tr>
      ${generateLineItemsTable(order.validatedLineItems)}
    </table>
    ${generateTotalsBlock(order)}
  `;
}

function generateAdminEmail(order) {
  return `
    <h1>New paid order</h1>
    <h2>Order ID: ${order.id}</h2>
    <p>Customer: ${order.shippingDetails?.email || order.billingDetails?.email || "N/A"}</p>
    <p>Status: ${ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}</p>
    <h3>Billing Details</h3>
    <p>${formatAddressHtml(order.billingDetails)}</p>
    <h3>Shipping Details</h3>
    <p>${formatAddressHtml(order.shippingDetails)}</p>
    <h3>Order Summary</h3>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <th>Product</th>
        <th>Options</th>
        <th>Qty</th>
        <th>Total</th>
      </tr>
      ${generateLineItemsTable(order.validatedLineItems)}
    </table>
    ${generateTotalsBlock(order)}
  `;
}

async function sendEmail(to, subject, content) {
  if (!to) return;

  const data = {
    from: `WOLFSKIN Photography <noreply@${process.env.MAILGUN_DOMAIN}>`,
    to,
    subject,
    html: content,
  };

  try {
    await mg.messages().send(data);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
  }
}

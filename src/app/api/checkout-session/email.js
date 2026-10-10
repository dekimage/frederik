import { Resend } from "resend";
import { KOR_INVOICE_NOTICE } from "@/lib/korVat";
import {
  escapeHtml,
  formatAddressHtml,
  formatAddressLines,
  formatCurrencyEUR,
  ORDER_STATUS_LABELS,
} from "@/lib/orderUtils";

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const fromName =
    process.env.RESEND_FROM_NAME?.trim() || "WOLFSKIN Photography";
  const adminEmails = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  const missing = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!fromEmail) missing.push("RESEND_FROM_EMAIL");
  if (adminEmails.length === 0) missing.push("ADMIN_EMAIL");

  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(", ")}`);
  }

  return {
    adminEmails,
    apiKey,
    from: `${fromName} <${fromEmail}>`,
    replyTo: process.env.RESEND_REPLY_TO?.trim() || undefined,
  };
}

export async function sendOrderPaidEmails(order) {
  const customerEmail =
    order.shippingDetails?.email ||
    order.billingDetails?.email ||
    order.customerEmail;

  if (!customerEmail) {
    throw new Error(`Customer email missing for paid order ${order.id}`);
  }

  const config = getEmailConfig();
  const customerEmailContent = generateCustomerEmail(order);
  const adminEmailContent = generateAdminEmail(order);

  const [customer, admin] = await Promise.all([
    sendEmail({
      config,
      to: customerEmail,
      subject: `Order confirmation #${order.id}`,
      html: customerEmailContent,
      text: generateCustomerEmailText(order),
      idempotencyKey: `order/${order.id}/customer-confirmation`,
    }),
    sendEmail({
      config,
      to: config.adminEmails,
      subject: `New paid order #${order.id}`,
      html: adminEmailContent,
      text: generateAdminEmailText(order),
      idempotencyKey: `order/${order.id}/admin-notification`,
    }),
  ]);

  return { customer, admin };
}

function generateLineItemsTable(validatedLineItems = []) {
  return validatedLineItems
    .map(
      (item) => `
    <tr>
      <td>${escapeHtml(item.name || "Item")}</td>
      <td>${escapeHtml(item.material || "")} · ${escapeHtml(
        item.sizeRaw || item.sizeKey || ""
      )}</td>
      <td style="text-align:center;">${item.quantity || 1}</td>
      <td style="text-align:right;">${formatCurrencyEUR(item.lineTotalIncShipping)}</td>
    </tr>`
    )
    .join("");
}

function generateTotalsBlock(order) {
  return `
    <p>Subtotal: ${formatCurrencyEUR(order.amountSubtotal)}</p>
    <p><strong>Total paid: ${formatCurrencyEUR(order.amountTotal)}</strong></p>
    <p style="font-size:13px;color:#444;">${KOR_INVOICE_NOTICE}</p>
  `;
}

function generateCustomerEmail(order) {
  const statusLabel =
    ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || "Processing";
  const trackUrl = `${process.env.NEXT_PUBLIC_URL}/track-order?orderId=${encodeURIComponent(order.id)}`;
  const receiptLink = order.invoice?.receiptUrl
    ? `<p><a href="${escapeHtml(order.invoice.receiptUrl)}">Download Stripe receipt</a></p>`
    : "";

  return `
    <h1>Thank you for your order</h1>
    <p>Your payment was successful. We are preparing your order.</p>
    <h2>Order ID: ${escapeHtml(order.id)}</h2>
    <p><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
    <p><a href="${escapeHtml(trackUrl)}">Track your order</a></p>
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
    <h2>Order ID: ${escapeHtml(order.id)}</h2>
    <p>Customer: ${escapeHtml(
      order.shippingDetails?.email || order.billingDetails?.email || "N/A"
    )}</p>
    <p>Status: ${escapeHtml(
      ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus
    )}</p>
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

function generateLineItemsText(validatedLineItems = []) {
  return validatedLineItems
    .map(
      (item) =>
        `- ${item.name || "Item"} | ${item.material || ""} ${
          item.sizeRaw || item.sizeKey || ""
        } | Qty ${item.quantity || 1} | ${formatCurrencyEUR(
          item.lineTotalIncShipping
        )}`
    )
    .join("\n");
}

function generateCustomerEmailText(order) {
  const trackUrl = `${process.env.NEXT_PUBLIC_URL}/track-order?orderId=${encodeURIComponent(order.id)}`;
  const receipt = order.invoice?.receiptUrl
    ? `\nStripe receipt: ${order.invoice.receiptUrl}`
    : "";

  return `Thank you for your order.

Your payment was successful and we are preparing your order.
Order ID: ${order.id}
Status: ${ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || "Processing"}
Track order: ${trackUrl}${receipt}

Shipping address:
${formatAddressLines(order.shippingDetails).join("\n")}

Order summary:
${generateLineItemsText(order.validatedLineItems)}

Subtotal: ${formatCurrencyEUR(order.amountSubtotal)}
Total paid: ${formatCurrencyEUR(order.amountTotal)}
${KOR_INVOICE_NOTICE}`;
}

function generateAdminEmailText(order) {
  return `New paid order

Order ID: ${order.id}
Customer: ${
    order.shippingDetails?.email || order.billingDetails?.email || "N/A"
  }
Status: ${ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}

Billing address:
${formatAddressLines(order.billingDetails).join("\n")}

Shipping address:
${formatAddressLines(order.shippingDetails).join("\n")}

Order summary:
${generateLineItemsText(order.validatedLineItems)}

Subtotal: ${formatCurrencyEUR(order.amountSubtotal)}
Total paid: ${formatCurrencyEUR(order.amountTotal)}
${KOR_INVOICE_NOTICE}`;
}

async function sendEmail({
  config,
  to,
  subject,
  html,
  text,
  idempotencyKey,
}) {
  const resend = new Resend(config.apiKey);
  const { data, error } = await resend.emails.send(
    {
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject,
      html,
      text,
    },
    { idempotencyKey }
  );

  if (error) {
    throw new Error(
      `Resend rejected email to ${Array.isArray(to) ? to.join(", ") : to}: ${
        error.message || "unknown error"
      }`
    );
  }

  return data;
}

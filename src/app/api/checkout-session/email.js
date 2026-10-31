import { Resend } from "resend";
import { firestore } from "@/app/firebaseAdmin";
import { deriveStripeMode } from "@/lib/orderUtils";
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

export async function sendOrderPaidEmails(order, { onlyRole } = {}) {
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

  const prefix =
    deriveStripeMode(order) === "test" ? "[TEST — NO REAL PAYMENT] " : "";
  const requests = {
    customer: {
      config,
      to: customerEmail,
      subject: `${prefix}Order confirmation #${order.id}`,
      html: customerEmailContent,
      text: generateCustomerEmailText(order),
      idempotencyKey: `order/${order.id}/customer-confirmation`,
    },
    admin: {
      config,
      to: config.adminEmails,
      subject: `${prefix}New paid order #${order.id}`,
      html: adminEmailContent,
      text: generateAdminEmailText(order),
      idempotencyKey: `order/${order.id}/admin-notification`,
    },
  };
  const results = await Promise.allSettled(
    Object.entries(requests)
      .filter(([role]) => !onlyRole || role === onlyRole)
      .map(([role, request]) => sendOnce(order.id, role, request)),
  );
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length)
    throw new Error(failures.map((result) => result.reason.message).join("; "));
  return results;
}

async function sendOnce(orderId, role, request) {
  const ref = firestore.collection("orders").doc(orderId);
  const claim = await firestore.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const previous = doc.data()?.emailDelivery?.[role] || {};
    if (previous.id) return false; // Accepted by Resend: never resend on Stripe replay.
    if (previous.leaseUntil > Date.now())
      throw new Error(`${role} email is already being sent; retry later.`);
    if (
      previous.firstAttemptAt &&
      Date.now() - previous.firstAttemptAt > 23 * 60 * 60 * 1000
    ) {
      throw new Error(
        `${role} email needs manual review in Resend before retrying after 23 hours.`,
      );
    }
    tx.update(ref, {
      [`emailDelivery.${role}`]: {
        ...previous,
        status: "sending",
        firstAttemptAt: previous.firstAttemptAt || Date.now(),
        leaseUntil: Date.now() + 120_000,
      },
    });
    return true;
  });
  if (!claim) return;
  try {
    const result = await sendEmail({ ...request, orderId, role });
    await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const previous = doc.data()?.emailDelivery?.[role] || {};
      tx.update(ref, {
        [`emailDelivery.${role}`]: {
          ...previous,
          id: result.id,
          status: previous.eventAt ? previous.status : "accepted",
          leaseUntil: 0,
          acceptedAt: new Date().toISOString(),
          lastError: null,
        },
      });
    });
  } catch (error) {
    await ref.update({
      [`emailDelivery.${role}.status`]: "failed",
      [`emailDelivery.${role}.leaseUntil`]: 0,
      [`emailDelivery.${role}.lastError`]: error.message,
    });
    throw error;
  }
}

function documentLinksHtml(order) {
  const links = [
    [order.invoice?.receiptUrl, "Stripe payment receipt"],
    [order.invoice?.hostedInvoiceUrl, "Stripe invoice"],
    [order.invoice?.invoicePdf, "Download Stripe invoice PDF"],
  ];
  return links
    .filter(([url]) => url)
    .map(([url, text]) => `<p><a href="${escapeHtml(url)}">${text}</a></p>`)
    .join("");
}

function documentLinksText(order) {
  return [
    [order.invoice?.receiptUrl, "Stripe payment receipt"],
    [order.invoice?.hostedInvoiceUrl, "Stripe invoice"],
    [order.invoice?.invoicePdf, "Stripe invoice PDF"],
  ]
    .filter(([url]) => url)
    .map(([url, label]) => `${label}: ${url}`)
    .join("\n");
}

function testNotice(order) {
  return deriveStripeMode(order) === "test"
    ? "TEST ORDER — no real payment was made. Do not fulfill this order."
    : "";
}

function generateLineItemsTable(validatedLineItems = []) {
  return validatedLineItems
    .map(
      (item) => `
    <tr>
      <td>${escapeHtml(item.name || "Item")}</td>
      <td>${escapeHtml(item.material || "")} · ${escapeHtml(
        item.sizeRaw || item.sizeKey || "",
      )}</td>
      <td style="text-align:center;">${item.quantity || 1}</td>
      <td style="text-align:right;">${formatCurrencyEUR(item.lineTotalIncShipping)}</td>
    </tr>`,
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

  return `
    <h1>Thank you for your order</h1>
    <p>${testNotice(order)}</p>
    <p>Your payment was successful. We are preparing your order.</p>
    <h2>Order ID: ${escapeHtml(order.id)}</h2>
    <p><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
    <p><a href="${escapeHtml(trackUrl)}">Track your order</a></p>
    ${documentLinksHtml(order)}
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
    <p>${testNotice(order)}</p>
    <h2>Order ID: ${escapeHtml(order.id)}</h2>
    <p><a href="${escapeHtml(`${process.env.NEXT_PUBLIC_URL}/admin/orders?orderId=${encodeURIComponent(order.id)}`)}">Open order in admin</a></p>
    ${documentLinksHtml(order)}
    <p>Customer: ${escapeHtml(
      order.shippingDetails?.email || order.billingDetails?.email || "N/A",
    )}</p>
    <p>Status: ${escapeHtml(
      ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus,
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
          item.lineTotalIncShipping,
        )}`,
    )
    .join("\n");
}

function generateCustomerEmailText(order) {
  const trackUrl = `${process.env.NEXT_PUBLIC_URL}/track-order?orderId=${encodeURIComponent(order.id)}`;

  return `Thank you for your order.
${testNotice(order)}

Your payment was successful and we are preparing your order.
Order ID: ${order.id}
Status: ${ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || "Processing"}
Track order: ${trackUrl}
${documentLinksText(order)}

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

function generateAdminEmailText(order) {
  return `New paid order
${testNotice(order)}

Order ID: ${order.id}
Open order in admin: ${process.env.NEXT_PUBLIC_URL}/admin/orders?orderId=${encodeURIComponent(order.id)}
${documentLinksText(order)}
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
  orderId,
  role,
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
      tags: [
        { name: "order_id", value: orderId },
        { name: "role", value: role },
      ],
    },
    { idempotencyKey },
  );

  if (error) {
    throw new Error(
      `Resend rejected email to ${Array.isArray(to) ? to.join(", ") : to}: ${
        error.message || "unknown error"
      }`,
    );
  }

  if (!data?.id)
    throw new Error(
      "Resend did not return an email ID; review the provider response before retrying.",
    );
  return data;
}

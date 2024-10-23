import mailgun from "mailgun-js";

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

export async function sendEmails(
  orderId,
  billingDetails,
  shippingDetails,
  cartItems,
  total
) {
  const customerEmail = shippingDetails?.email || billingDetails?.email;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!customerEmail) {
    console.error("Customer email not found in shipping or billing details");
    return;
  }

  const customerEmailContent = generateCustomerEmail(
    orderId,
    billingDetails,
    shippingDetails,
    cartItems,
    total
  );
  const adminEmailContent = generateAdminEmail(
    orderId,
    billingDetails,
    shippingDetails,
    cartItems,
    total
  );

  await sendEmail(
    customerEmail,
    "Your Order Confirmation",
    customerEmailContent
  );
  await sendEmail(adminEmail, "New Order Arrived!", adminEmailContent);
}

function generateAddressHtml(details) {
  if (!details || typeof details !== "object") {
    return "Address details not available";
  }

  return `
    ${details.name || ""}<br>
    ${details.address?.line1 || ""}<br>
    ${details.address?.line2 ? details.address.line2 + "<br>" : ""}
    ${details.address?.city || ""}, ${details.address?.state || ""} ${
    details.address?.postal_code || ""
  }<br>
    ${details.address?.country || ""}
  `;
}

function generateCustomerEmail(
  orderId,
  billingDetails,
  shippingDetails,
  cartItems,
  total
) {
  const itemsSummary = cartItems
    .map(
      (item) => `
    <tr>
      <td>${item.productId || "N/A"}</td>
      <td>${item.quantity || "N/A"}</td>
      <td>${item.size || "N/A"}</td>
      <td>€${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  const formattedTotal = typeof total === "number" ? total.toFixed(2) : "N/A";

  return `
    <h1>Order Confirmation</h1>
    <p>Thank you for your order! Here are the details:</p>
    <h2>Order ID: ${orderId}</h2>
    <h3>Billing Details:</h3>
    <p>${generateAddressHtml(billingDetails)}</p>
    <h3>Shipping Details:</h3>
    <p>${generateAddressHtml(shippingDetails)}</p>
    <h3>Order Summary:</h3>
    <table border="1" cellpadding="5" cellspacing="0">
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Size</th>
        <th>Price</th>
      </tr>
      ${itemsSummary}
    </table>
    <p><strong>Total: €${formattedTotal}</strong></p>
  `;
}

function generateAdminEmail(
  orderId,
  billingDetails,
  shippingDetails,
  cartItems,
  total
) {
  const itemsSummary = cartItems
    .map(
      (item) => `
    <tr>
      <td>${item.productId || "N/A"}</td>
      <td>${item.quantity || "N/A"}</td>
      <td>${item.size || "N/A"}</td>
      <td>€${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  const formattedTotal = typeof total === "number" ? total.toFixed(2) : "N/A";

  return `
    <h1>New Order Arrived!</h1>
    <h2>Order ID: ${orderId}</h2>
    <h3>Customer Information:</h3>
    <p>Email: ${shippingDetails?.email || billingDetails?.email || "N/A"}</p>
    <h3>Billing Details:</h3>
    <p>${generateAddressHtml(billingDetails)}</p>
    <h3>Shipping Details:</h3>
    <p>${generateAddressHtml(shippingDetails)}</p>
    <h3>Order Summary:</h3>
    <table border="1" cellpadding="5" cellspacing="0">
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Size</th>
        <th>Price</th>
      </tr>
      ${itemsSummary}
    </table>
    <p><strong>Total: €${formattedTotal}</strong></p>
  `;
}

async function sendEmail(to, subject, content) {
  const data = {
    from: `Your Store <noreply@${process.env.MAILGUN_DOMAIN}>`,
    to: to,
    subject: subject,
    html: content,
  };

  try {
    await mg.messages().send(data);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
}

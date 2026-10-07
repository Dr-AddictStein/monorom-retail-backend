import nodemailer from "nodemailer";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (value) => `Tk. ${Number(value || 0).toFixed(2)}`;

const deliveryLabel = (place) => {
  if (place === "inside_dhaka") return "Inside Dhaka";
  if (place === "outside_dhaka") return "Outside Dhaka";
  return place || "Not specified";
};

const display = (value, fallback = "—") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const formatWhen = (date) => {
  const value = date ? new Date(date) : new Date();
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleString("en-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "full",
    timeStyle: "short",
  });
};

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const pass = String(process.env.SMTP_PASS || "").replace(/\s+/g, "");
  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set to send order emails");
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_PORT || 465) !== "587",
    auth: { user, pass },
  });

  return transporter;
};

const buildSubject = (order) => {
  const name = display(order.name, "a customer");
  const items = Array.isArray(order.cartData) ? order.cartData : [];
  const pieces = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const pieceLabel = pieces === 1 ? "1 item" : `${pieces} items`;
  return `New order from ${name} — ${money(order.totalCost)} · ${pieceLabel} · ${deliveryLabel(order.deliveryPlace)} | Monorom Crockery`;
};

const buildHtml = (order) => {
  const items = Array.isArray(order.cartData) ? order.cartData : [];
  const rows = items
    .map((item, index) => {
      const name = escapeHtml(display(item.name, "Product"));
      const category = escapeHtml(display(item.category));
      const qty = Number(item.qty || 0);
      const unit = money(item.price);
      const line = money(item.totalPrice ?? Number(item.price || 0) * qty);
      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #eee;color:#6b7280;">${index + 1}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#111827;">${name}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">${category}</div>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:right;">${unit}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${line}</td>
        </tr>`;
    })
    .join("");

  const field = (label, value) => `
    <tr>
      <td style="padding:8px 0;color:#6b7280;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(display(value))}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#111827;padding:28px 32px;color:#ffffff;">
                <div style="letter-spacing:0.22em;font-size:11px;text-transform:uppercase;color:#d1d5db;">Monorom Crockery</div>
                <h1 style="margin:10px 0 0;font-size:26px;font-weight:normal;font-family:Georgia, serif;">A new order has arrived</h1>
                <p style="margin:8px 0 0;color:#d1d5db;font-size:14px;font-family:Arial, sans-serif;">
                  Placed ${escapeHtml(formatWhen(order.createdAt))} · Order ${escapeHtml(String(order._id || ""))}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;font-family:Arial, sans-serif;">
                <h2 style="margin:0 0 12px;font-size:16px;letter-spacing:0.08em;text-transform:uppercase;color:#111827;">Customer</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
                  ${field("Name", order.name)}
                  ${field("Phone", order.phone)}
                  ${field("Email", order.email)}
                  ${field("Company", order.companyName)}
                  ${field("Account", order.userId && order.userId !== "guest" ? order.userId : "Guest checkout")}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 8px;font-family:Arial, sans-serif;">
                <h2 style="margin:16px 0 12px;font-size:16px;letter-spacing:0.08em;text-transform:uppercase;color:#111827;">Delivery</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
                  ${field("Home address", order.homeAddress)}
                  ${field("Thana", order.thana)}
                  ${field("District", order.district)}
                  ${field("Full address", order.address)}
                  ${field("Delivery area", deliveryLabel(order.deliveryPlace))}
                  ${field("Notes", order.requirements)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 8px;font-family:Arial, sans-serif;">
                <h2 style="margin:0 0 12px;font-size:16px;letter-spacing:0.08em;text-transform:uppercase;color:#111827;">Items</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-collapse:collapse;font-size:14px;">
                  <thead>
                    <tr style="background:#f9fafb;color:#374151;text-align:left;">
                      <th style="padding:10px 14px;font-weight:600;">#</th>
                      <th style="padding:10px 14px;font-weight:600;">Product</th>
                      <th style="padding:10px 14px;font-weight:600;text-align:center;">Qty</th>
                      <th style="padding:10px 14px;font-weight:600;text-align:right;">Price</th>
                      <th style="padding:10px 14px;font-weight:600;text-align:right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows || `<tr><td colspan="5" style="padding:14px;color:#6b7280;">No items were attached to this order.</td></tr>`}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px;font-family:Arial, sans-serif;">
                <table role="presentation" align="right" cellspacing="0" cellpadding="0" style="margin-top:16px;font-size:14px;color:#111827;">
                  <tr>
                    <td style="padding:4px 16px;color:#6b7280;">Subtotal</td>
                    <td style="padding:4px 0;text-align:right;">${money(order.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 16px;color:#6b7280;">Delivery (${escapeHtml(deliveryLabel(order.deliveryPlace))})</td>
                    <td style="padding:4px 0;text-align:right;">${money(order.deliveryCharge)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 16px 0;font-size:16px;font-weight:700;">Total</td>
                    <td style="padding:10px 0 0;text-align:right;font-size:16px;font-weight:700;">${money(order.totalCost)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;padding:16px 32px;font-family:Arial, sans-serif;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
                This notice was sent automatically when a customer placed an order on Monorom Crockery. Status: ${escapeHtml(display(order.status, "received"))}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const buildText = (order) => {
  const items = Array.isArray(order.cartData) ? order.cartData : [];
  const lines = items.map((item, index) => {
    const qty = Number(item.qty || 0);
    const line = money(item.totalPrice ?? Number(item.price || 0) * qty);
    return `${index + 1}. ${display(item.name, "Product")} (${display(item.category)}) × ${qty} @ ${money(item.price)} = ${line}`;
  });

  return [
    "A new order has arrived at Monorom Crockery.",
    "",
    `Order ID: ${order._id || "—"}`,
    `Placed: ${formatWhen(order.createdAt)}`,
    `Status: ${display(order.status, "received")}`,
    "",
    "Customer",
    `Name: ${display(order.name)}`,
    `Phone: ${display(order.phone)}`,
    `Email: ${display(order.email)}`,
    `Company: ${display(order.companyName)}`,
    `Account: ${order.userId && order.userId !== "guest" ? order.userId : "Guest checkout"}`,
    "",
    "Delivery",
    `Home address: ${display(order.homeAddress)}`,
    `Thana: ${display(order.thana)}`,
    `District: ${display(order.district)}`,
    `Full address: ${display(order.address)}`,
    `Delivery area: ${deliveryLabel(order.deliveryPlace)}`,
    `Notes: ${display(order.requirements)}`,
    "",
    "Items",
    ...(lines.length ? lines : ["No items were attached to this order."]),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Delivery: ${money(order.deliveryCharge)}`,
    `Total: ${money(order.totalCost)}`,
  ].join("\n");
};

export async function sendNewOrderEmail(order) {
  const to = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!to) {
    throw new Error("ADMIN_EMAIL is not set");
  }

  const from = process.env.SMTP_FROM || `"Monorom Crockery" <${process.env.SMTP_USER}>`;

  await getTransporter().sendMail({
    from,
    to,
    subject: buildSubject(order),
    text: buildText(order),
    html: buildHtml(order),
  });
}

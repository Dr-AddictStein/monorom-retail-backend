const BDBULKSMS_URL = "https://api.bdbulksms.net/api.php?json";

export async function sendBdBulkSms(to, message) {
  const token = process.env.BDBULKSMS_TOKEN;
  if (!token) {
    throw new Error("BDBULKSMS_TOKEN is not set in environment");
  }

  const body = new URLSearchParams();
  body.set("to", String(to).trim());
  body.set("message", message);
  body.set("token", token);

  const smsRes = await fetch(BDBULKSMS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const rawText = await smsRes.text();
  let providerPayload = rawText;
  try {
    providerPayload = JSON.parse(rawText);
  } catch {
    /* keep string */
  }

  if (!smsRes.ok) {
    const err = new Error("BD Bulk SMS HTTP error");
    err.status = smsRes.status;
    err.provider = providerPayload;
    throw err;
  }

  const list = Array.isArray(providerPayload) ? providerPayload : null;
  if (list?.[0]?.status && String(list[0].status).toUpperCase() !== "SENT") {
    const err = new Error(list[0].statusmsg || "SMS not sent");
    err.provider = providerPayload;
    throw err;
  }

  return providerPayload;
}

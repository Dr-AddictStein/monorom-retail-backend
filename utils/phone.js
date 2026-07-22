/**
 * Normalizes phone strings for Bangladesh mobiles:
 * - "+8801972110895" → "01972110895"
 * - "8801972110895" (no +) → "01972110895"
 * - "01972110895" → unchanged (after trim / removing internal spaces)
 */
export function phoneAsEntered(input) {
  if (input == null) return "";
  let p = String(input).trim().replace(/\s+/g, "");

  if (p.startsWith("+880")) {
    const rest = p.slice(4);
    p = rest.length ? `0${rest}` : "";
  } else if (p.startsWith("8801") && p.length >= 13) {
    p = `0${p.slice(3)}`;
  }

  return p;
}

/** Minimal check for OTP/SMS: non-empty and a plausible phone field length. */
export function isUsablePhoneForOtp(phone) {
  const p = phoneAsEntered(phone);
  return p.length >= 8 && p.length <= 22;
}

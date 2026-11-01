const MOBILE = /^[35789]\d{8}$/;

const digits = (raw: string) => raw.replace(/\D/g, "");

/** National significant number (9 digits) for a VN mobile, or null if it is not one. */
export function normalizeVnPhone(raw: string): string | null {
  let d = digits(raw);
  if (d.length === 11 && d.startsWith("84")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("0")) d = d.slice(1);
  return MOBILE.test(d) ? d : null;
}

/** "90 123 4567" — groups input as typed. */
export function formatVnPhone(raw: string): string {
  let d = digits(raw);
  // AutoFill pastes "+84 …": drop the country code (with "+", or as 84 + 9 digits).
  if (d.startsWith("84") && (raw.trim().startsWith("+") || d.length >= 11)) d = d.slice(2);
  d = d.replace(/^0/, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5)].filter(Boolean).join(" ");
}

export function maskPhone(national: string): string {
  return `•••• ${national.slice(-4)}`;
}

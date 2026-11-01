import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 60 * 60_000;

const mac = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

/** `<signupId>.<expiry ms>.<hmac>`: lets the browser that just signed up answer the survey once. */
export function signSurveyToken(id: string, secret: string, now: number): string {
  const payload = `${id}.${now + TTL_MS}`;
  return `${payload}.${mac(payload, secret)}`;
}

/** The sign-up id, or null when the token is malformed, tampered with or expired. */
export function verifySurveyToken(token: string, secret: string, now: number): string | null {
  const [id, exp, sig] = token.split(".");
  if (!id || !exp || !sig || !/^\d+$/.test(exp)) return null;
  const want = Buffer.from(mac(`${id}.${exp}`, secret));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  return Number(exp) >= now ? id : null;
}

/** Runtime secrets (Dokploy env), read per request. Dev falls back to Cloudflare's always-pass test secret. */
const prod = process.env.NODE_ENV === "production";

function need(name: string, devValue?: string): string {
  const v = process.env[name];
  if (v) return v;
  if (!prod && devValue) return devValue;
  throw new Error(`${name} is not set`);
}

export const turnstileSecret = () =>
  need("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
export const signingSecret = () => need("SIGNING_SECRET", "dev-only-signing-secret-not-for-prod");
/** Unset disables the export route. */
export const adminToken = () => process.env.ADMIN_TOKEN || null;
export const isTestTurnstile = (secret: string) =>
  secret.startsWith("1x0000000000000000000000000000000");

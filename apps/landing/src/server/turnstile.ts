import { isTestTurnstile, turnstileSecret } from "./env";

const VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type Siteverify = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

/** True only when Cloudflare confirms the token for this action and host. */
export async function verifyTurnstile(token: string, ip: string, host: string): Promise<boolean> {
  const secret = turnstileSecret();
  const body = new URLSearchParams({ secret, response: token });
  if (ip !== "unknown") body.set("remoteip", ip);
  const res = await fetch(VERIFY, { method: "POST", body, signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`siteverify HTTP ${res.status}`);
  const out = (await res.json()) as Siteverify;
  if (!out.success) {
    console.warn("turnstile rejected", out["error-codes"]);
    return false;
  }
  // Test keys answer with a dummy hostname and no action.
  if (isTestTurnstile(secret)) return true;
  return out.action === "signup" && out.hostname === host;
}

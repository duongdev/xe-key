import { database } from "../../../db/client";
import { signups } from "../../../db/schema";
import { SITE_URL } from "../../../lib/seo";
import { signingSecret } from "../../../server/env";
import { errorSummary, json, readJson } from "../../../server/http";
import { parseSignup } from "../../../server/payload";
import { clientIp, createLimiter } from "../../../server/rate-limit";
import { signSurveyToken } from "../../../server/survey-token";
import { verifyTurnstile } from "../../../server/turnstile";

export const runtime = "nodejs";

const limit = createLimiter({ limit: 5, windowMs: 10 * 60_000 });

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (!limit(ip, Date.now())) return json(429, { error: "rate" });
  const parsed = parseSignup(await readJson(req));
  if (!parsed.ok) return json(400, { error: "invalid" });
  const { email, platform, language, turnstileToken } = parsed.value;
  try {
    if (!(await verifyTurnstile(turnstileToken, ip, SITE_URL.hostname))) {
      return json(403, { error: "verify" });
    }
    const [row] = await (await database())
      .insert(signups)
      .values({ email, platform, language })
      .onConflictDoNothing({ target: signups.email })
      .returning({ id: signups.id });
    // A repeat email gets the same success but no survey token (ADR 0009).
    const surveyToken = row ? signSurveyToken(row.id, signingSecret(), Date.now()) : null;
    return json(200, { ok: true, surveyToken });
  } catch (e) {
    console.error("signup failed", errorSummary(e));
    return json(500, { error: "server" });
  }
}

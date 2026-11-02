import { and, eq, isNull, sql } from "drizzle-orm";
import { database } from "../../../db/client";
import { signups } from "../../../db/schema";
import { signingSecret } from "../../../server/env";
import { errorSummary, json, readJson } from "../../../server/http";
import { parseSurvey } from "../../../server/payload";
import { clientIp, createLimiter } from "../../../server/rate-limit";
import { verifySurveyToken } from "../../../server/survey-token";

export const runtime = "nodejs";

const limit = createLimiter({ limit: 10, windowMs: 10 * 60_000 });

export async function POST(req: Request) {
  if (!limit(clientIp(req.headers), Date.now())) return json(429, { error: "rate" });
  const parsed = parseSurvey(await readJson(req));
  if (!parsed.ok) return json(400, { error: "invalid" });
  const { token, car, features } = parsed.value;
  try {
    const id = verifySurveyToken(token, signingSecret(), Date.now());
    if (!id) return json(403, { error: "token" });
    // First answers win: a second send with the same token changes nothing.
    await (await database())
      .update(signups)
      .set({ car, features, surveyAt: sql`now()` })
      .where(and(eq(signups.id, id), isNull(signups.surveyAt)));
    return json(200, { ok: true });
  } catch (e) {
    console.error("survey failed", errorSummary(e));
    return json(500, { error: "server" });
  }
}

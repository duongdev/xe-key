import { createHash, timingSafeEqual } from "node:crypto";
import { asc } from "drizzle-orm";
import { database } from "../../../../db/client";
import { signups } from "../../../../db/schema";
import { adminToken } from "../../../../server/env";
import { summarize, toCsv } from "../../../../server/payload";
import { clientIp, createLimiter } from "../../../../server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limit = createLimiter({ limit: 20, windowMs: 10 * 60_000 });
const PRIVATE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const digest = (s: string) => createHash("sha256").update(s).digest();

/** HTTP Basic auth: any user name, password = ADMIN_TOKEN (ADR 0009). */
function authorized(header: string | null, token: string): boolean {
  if (!header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const password = decoded.slice(decoded.indexOf(":") + 1);
  return timingSafeEqual(digest(password), digest(token));
}

export async function GET(req: Request) {
  const token = adminToken();
  if (!token) return new Response("Not found", { status: 404, headers: PRIVATE });
  if (!limit(clientIp(req.headers), Date.now())) {
    return new Response("Too many requests", { status: 429, headers: PRIVATE });
  }
  if (!authorized(req.headers.get("authorization"), token)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { ...PRIVATE, "WWW-Authenticate": 'Basic realm="xekey-admin", charset="UTF-8"' },
    });
  }
  const rows = await (await database())
    .select({
      email: signups.email,
      platform: signups.platform,
      language: signups.language,
      car: signups.car,
      features: signups.features,
      createdAt: signups.createdAt,
    })
    .from(signups)
    .orderBy(asc(signups.createdAt));
  if (new URL(req.url).searchParams.has("summary")) {
    return Response.json(summarize(rows), { headers: PRIVATE });
  }
  return new Response(toCsv(rows), {
    headers: {
      ...PRIVATE,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="xekey-waitlist.csv"',
    },
  });
}

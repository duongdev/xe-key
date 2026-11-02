import type { Lang } from "../copy";
import { isEmail } from "../lib/email";
import type { Platform } from "../lib/signup";
import { CARS, type Car, FEATURES, type Feature } from "../lib/survey-options";

const MAX_EMAIL = 254;
const MAX_TOKEN = 4096;

type Parsed<T> = { ok: true; value: T } | { ok: false };

export type SignupInput = {
  email: string;
  platform: Platform;
  language: Lang;
  turnstileToken: string;
};

export type SurveyInput = { token: string; car: Car | null; features: Feature[] };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);
const token = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= MAX_TOKEN;

export function parseSignup(body: unknown): Parsed<SignupInput> {
  if (!isRecord(body) || typeof body.email !== "string") return { ok: false };
  const email = body.email.trim().toLowerCase();
  if (email.length > MAX_EMAIL || !isEmail(email)) return { ok: false };
  if (!oneOf(["ios", "android"] as const, body.platform)) return { ok: false };
  if (!oneOf(["vi", "en"] as const, body.language)) return { ok: false };
  if (!token(body.turnstileToken)) return { ok: false };
  return {
    ok: true,
    value: {
      email,
      platform: body.platform,
      language: body.language,
      turnstileToken: body.turnstileToken,
    },
  };
}

export function parseSurvey(body: unknown): Parsed<SurveyInput> {
  if (!isRecord(body) || !token(body.token) || !Array.isArray(body.features)) return { ok: false };
  const car = body.car === null ? null : oneOf(CARS, body.car) ? body.car : undefined;
  if (car === undefined) return { ok: false };
  if (!body.features.every((f) => oneOf(FEATURES, f))) return { ok: false };
  const features = [...new Set(body.features as Feature[])];
  if (car === null && features.length === 0) return { ok: false };
  return { ok: true, value: { token: body.token, car, features } };
}

export type SignupRow = {
  email: string;
  platform: string;
  language: string;
  car: string | null;
  features: string[];
  createdAt: Date;
};

/** CSV cell: quote when needed, and prefix `'` so a spreadsheet never runs it as a formula. */
function cell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: SignupRow[]): string {
  const lines = rows.map((r) =>
    [r.email, r.platform, r.language, r.car ?? "", r.features.join("|"), r.createdAt.toISOString()]
      .map(cell)
      .join(","),
  );
  return `${["email,platform,language,car,features,created_at", ...lines].join("\n")}\n`;
}

const count = (into: Record<string, number>, key: string) => {
  into[key] = (into[key] ?? 0) + 1;
};

export function summarize(rows: SignupRow[]) {
  const s = {
    total: rows.length,
    platform: {} as Record<string, number>,
    language: {} as Record<string, number>,
    car: {} as Record<string, number>,
    features: {} as Record<string, number>,
    surveyed: 0,
  };
  for (const r of rows) {
    count(s.platform, r.platform);
    count(s.language, r.language);
    if (r.car) count(s.car, r.car);
    for (const f of r.features) count(s.features, f);
    if (r.car || r.features.length > 0) s.surveyed++;
  }
  return s;
}

import type { Lang } from "../copy";
import type { Car, Feature } from "./survey-options";

export type Platform = "ios" | "android";

/** `turnstileToken` is single-use; `/api/signup` verifies it with Cloudflare before storing. */
export type Signup = { email: string; platform: Platform; language: Lang; turnstileToken: string };

export type Survey = { token: string; car: Car | null; features: Feature[] };

export type SubmitError = "verify" | "rate" | "server";

export type SignupResult =
  | { ok: true; surveyToken: string | null }
  | { ok: false; error: SubmitError };

/** `expired`: the 1 h survey token is no longer valid; retrying cannot help. */
export type SurveyResult = { ok: true } | { ok: false; error: SubmitError | "expired" };

async function post(path: string, body: unknown): Promise<{ status: number; data: unknown }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json().catch(() => null) };
  } catch (e) {
    console.error(`${path} unreachable`, e);
    return { status: 0, data: null };
  }
}

const errorFor = (status: number): SubmitError =>
  status === 429 ? "rate" : status === 403 ? "verify" : "server";

export async function submitSignup(data: Signup): Promise<SignupResult> {
  const { status, data: out } = await post("/api/signup", data);
  if (status !== 200) return { ok: false, error: errorFor(status) };
  const token = (out as { surveyToken?: unknown } | null)?.surveyToken;
  return { ok: true, surveyToken: typeof token === "string" ? token : null };
}

export async function submitSurvey(data: Survey): Promise<SurveyResult> {
  const { status } = await post("/api/survey", data);
  if (status === 200) return { ok: true };
  if (status === 403) return { ok: false, error: "expired" };
  return { ok: false, error: status === 429 ? "rate" : "server" };
}

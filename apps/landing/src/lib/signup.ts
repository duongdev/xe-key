import type { Lang } from "../copy";

export type Platform = "ios" | "android";

/** `turnstileToken` is single-use; the server must verify it (Cloudflare siteverify) before storing. */
export type Signup = { email: string; platform: Platform; language: Lang; turnstileToken: string };

export type Survey = { email: string; car: string | null; features: string[] };

export type Result = { ok: true } | { ok: false; error: string };

// ponytail: stubs until task 012 adds storage; only their bodies change there.
export async function submitSignup(_data: Signup): Promise<Result> {
  return { ok: true };
}

export async function submitSurvey(_data: Survey): Promise<Result> {
  return { ok: true };
}

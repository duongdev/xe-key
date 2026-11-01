import { BODIES, type Body } from "../car/geometry";
import { PAINTS } from "../car/paints";
import type { RegionId } from "../onboarding/region";
import type { CodeError, SignInError } from "./auth";

const SIGN_IN: Record<string, SignInError> = {
  INVALID_CREDENTIAL: "wrong-credentials",
  OLD_APP_BLOCK_LOGIN: "app-blocked",
  USER_NOT_FOUND_IN_COUNTRY: "wrong-region",
};

const down = (status: number) => status === 0 || status >= 500;

export function signInError(status: number, code: string | undefined): SignInError {
  if (down(status)) return "server-down";
  return SIGN_IN[code ?? ""] ?? "unknown";
}

export function codeError(status: number, code: string | undefined): CodeError {
  if (down(status)) return "server-down";
  return code === "INVALID_VERIFICATION_CODE" || code === "INVALID_OTP_VERIFICATION_CODE"
    ? "wrong-code"
    : "unknown";
}

// Honda sends a paint code plus a local name ("NH-883P Trắng ngà"); match the colour word.
const WORDS: [RegExp, string][] = [
  [/trắng|white/i, "Platinum White"],
  [/đen|black/i, "Crystal Black"],
  [/đỏ|red/i, "Ignite Red"],
  [/bạc|silver/i, "Lunar Silver"],
  [/xanh|blue/i, "Obsidian Blue"],
];

export function paintFor(color: string | undefined): (typeof PAINTS)[number] {
  const name = WORDS.find(([re]) => re.test(color ?? ""))?.[1];
  return PAINTS.find((p) => p.name === name) ?? PAINTS[0];
}

/** Honda stores VN accounts by the local number with its trunk 0; a bare 9-digit number is USER_NOT_FOUND_IN_COUNTRY. */
export function hondaUsername(region: RegionId, national: string): string {
  return region === "vietnam" ? `0${national}` : national;
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Honda sends no model name (only a code like "VC5 883"); the car's name usually holds it ("CIVIC RS"). */
export function bodyFor(name: string | undefined): Body {
  const n = squash(name ?? "");
  const hit = (Object.keys(BODIES) as Body[]).find((b) => n.includes(squash(BODIES[b].name)));
  return hit ?? "crossover";
}

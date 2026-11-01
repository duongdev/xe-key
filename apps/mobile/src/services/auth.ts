import type { Body } from "../car/geometry";
import type { RegionId } from "../onboarding/region";

export type SignInError = "wrong-credentials" | "server-down" | "app-blocked";
export type CodeError = "wrong-code" | "expired-code";

export type FoundCar = {
  model: string;
  body: Body;
  paintName: string;
  paint: string;
  plate: string;
  connectActive: boolean;
  updatedAt: number;
};

export interface AuthService {
  /** Checks credentials. A new device always needs an SMS code next. */
  signIn(input: {
    region: RegionId;
    phone: string;
    password: string;
  }): Promise<{ ok: true } | { ok: false; error: SignInError }>;
  sendCode(): Promise<void>;
  verifyCode(code: string): Promise<{ ok: true; car: FoundCar } | { ok: false; error: CodeError }>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Stand-in until `@xekey/core` runs in the app (task 010). Force error states with:
 * password `wrong` · phone ending `0000` (Honda down) · `1111` (app blocked) ·
 * code `000000` (wrong) · `111111` (expired).
 */
export const mockAuth: AuthService = {
  async signIn({ phone, password }) {
    await wait(700);
    if (phone.endsWith("0000")) return { ok: false, error: "server-down" };
    if (phone.endsWith("1111")) return { ok: false, error: "app-blocked" };
    if (password === "wrong") return { ok: false, error: "wrong-credentials" };
    return { ok: true };
  },
  async sendCode() {
    await wait(400);
  },
  async verifyCode(code) {
    await wait(1100);
    if (code === "000000") return { ok: false, error: "wrong-code" };
    if (code === "111111") return { ok: false, error: "expired-code" };
    return {
      ok: true,
      car: {
        model: "HR-V e:HEV",
        body: "crossover",
        paintName: "Meteoroid Gray",
        paint: "#6B7078",
        plate: "51K-123.45",
        connectActive: true,
        updatedAt: Date.now() - 2 * 60_000,
      },
    };
  },
};

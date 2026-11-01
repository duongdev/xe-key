import type { Body } from "../car/geometry";
import type { RegionId } from "../onboarding/region";

export type SignInError =
  | "wrong-credentials"
  | "server-down"
  | "app-blocked"
  | "wrong-region"
  | "unknown";
export type CodeError = "wrong-code" | "expired-code" | "server-down" | "unknown";

export type FoundCar = {
  model: string;
  body: Body;
  paintName: string;
  paint: string;
  plate: string | null;
  connectActive: boolean;
  updatedAt: number;
};

export interface AuthService {
  /** Checks credentials. `car` is set when this device is already trusted (no SMS code needed). */
  signIn(input: {
    region: RegionId;
    phone: string;
    password: string;
  }): Promise<{ ok: true; car?: FoundCar } | { ok: false; error: SignInError; code?: string }>;
  /** Re-sends the SMS code. The first one goes out with sign-in. */
  sendCode(): Promise<void>;
  verifyCode(code: string): Promise<{ ok: true; car: FoundCar } | { ok: false; error: CodeError }>;
  signOut(): Promise<void>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Offline stand-in (dev builds, Settings > Developer). Force error states with:
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
  async signOut() {},
};

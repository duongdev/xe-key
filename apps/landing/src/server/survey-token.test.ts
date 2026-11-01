import { describe, expect, it } from "vitest";
import { signSurveyToken, verifySurveyToken } from "./survey-token";

const SECRET = "s".repeat(32);
const ID = "3f0e8a3c-6b2e-4a4e-9a1d-2f6f3c1b9e01";
const NOW = 1_800_000_000_000;

describe("survey token", () => {
  it("round-trips the sign-up id before expiry", () => {
    const token = signSurveyToken(ID, SECRET, NOW);
    expect(verifySurveyToken(token, SECRET, NOW + 59 * 60_000)).toBe(ID);
  });

  it("expires after an hour", () => {
    const token = signSurveyToken(ID, SECRET, NOW);
    expect(verifySurveyToken(token, SECRET, NOW + 61 * 60_000)).toBeNull();
  });

  it("rejects a tampered id, a wrong secret and junk", () => {
    const token = signSurveyToken(ID, SECRET, NOW);
    const [, exp, sig] = token.split(".");
    expect(
      verifySurveyToken(`00000000-0000-4000-8000-000000000000.${exp}.${sig}`, SECRET, NOW),
    ).toBeNull();
    expect(verifySurveyToken(token, "t".repeat(32), NOW)).toBeNull();
    expect(verifySurveyToken("junk", SECRET, NOW)).toBeNull();
    expect(verifySurveyToken(`${ID}.${exp}.`, SECRET, NOW)).toBeNull();
  });
});

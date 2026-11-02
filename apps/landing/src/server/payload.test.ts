import { describe, expect, it } from "vitest";
import { parseSignup, parseSurvey, summarize, toCsv } from "./payload";

const ok = { email: " An@Gmail.com ", platform: "ios", language: "vi", turnstileToken: "tok" };

describe("parseSignup", () => {
  it("normalizes the email and keeps the fields", () => {
    expect(parseSignup(ok)).toEqual({
      ok: true,
      value: { email: "an@gmail.com", platform: "ios", language: "vi", turnstileToken: "tok" },
    });
  });

  it.each([
    ["not an object", "x"],
    ["bad email", { ...ok, email: "an@" }],
    ["long email", { ...ok, email: `${"a".repeat(250)}@b.co` }],
    ["bad platform", { ...ok, platform: "windows" }],
    ["bad language", { ...ok, language: "fr" }],
    ["no token", { ...ok, turnstileToken: "" }],
    ["huge token", { ...ok, turnstileToken: "x".repeat(4097) }],
  ])("rejects %s", (_, body) => {
    expect(parseSignup(body).ok).toBe(false);
  });
});

describe("parseSurvey", () => {
  it("accepts a car, features or both, deduping features", () => {
    expect(parseSurvey({ token: "t", car: "Civic", features: ["lock", "lock", "find"] })).toEqual({
      ok: true,
      value: { token: "t", car: "Civic", features: ["lock", "find"] },
    });
    expect(parseSurvey({ token: "t", car: null, features: ["trips"] }).ok).toBe(true);
  });

  it.each([
    ["nothing picked", { token: "t", car: null, features: [] }],
    ["unknown car", { token: "t", car: "Vision", features: [] }],
    ["unknown feature", { token: "t", car: null, features: ["teleport"] }],
    ["features not a list", { token: "t", car: null, features: "lock" }],
    ["no token", { token: "", car: "City", features: [] }],
  ])("rejects %s", (_, body) => {
    expect(parseSurvey(body).ok).toBe(false);
  });
});

const first = {
  email: "a@b.co",
  platform: "ios",
  language: "vi",
  car: "Civic",
  features: ["lock", "find"],
  createdAt: new Date("2026-11-02T01:00:00Z"),
};
const rows = [
  first,
  {
    email: 'x,"y"@b.co',
    platform: "android",
    language: "en",
    car: null,
    features: [],
    createdAt: new Date("2026-11-02T02:00:00Z"),
  },
];

describe("toCsv", () => {
  it("writes a header and escapes commas and quotes", () => {
    expect(toCsv(rows)).toBe(
      [
        "email,platform,language,car,features,created_at",
        "a@b.co,ios,vi,Civic,lock|find,2026-11-02T01:00:00.000Z",
        '"x,""y""@b.co",android,en,,,2026-11-02T02:00:00.000Z',
        "",
      ].join("\n"),
    );
  });

  it("neutralizes spreadsheet formulas", () => {
    expect(toCsv([{ ...first, email: "=cmd()@b.co" }])).toContain("'=cmd()@b.co");
  });
});

describe("summarize", () => {
  it("counts platform, language, car and features", () => {
    expect(summarize(rows)).toEqual({
      total: 2,
      platform: { ios: 1, android: 1 },
      language: { vi: 1, en: 1 },
      car: { Civic: 1 },
      features: { lock: 1, find: 1 },
      surveyed: 1,
    });
  });
});

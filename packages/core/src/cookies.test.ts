import { describe, expect, it } from "vitest";
import { cookieHeader, memoryCookies, readSetCookie, splitSetCookie } from "./cookies.js";

describe("splitSetCookie", () => {
  it("splits a comma-joined header without breaking Expires dates", () => {
    const joined =
      "JSESSIONID=abc123; Path=/; HttpOnly, iprmtkn=tok%3D; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Path=/, oid=42";
    expect(splitSetCookie(joined)).toEqual([
      "JSESSIONID=abc123; Path=/; HttpOnly",
      "iprmtkn=tok%3D; Expires=Wed, 21 Oct 2026 07:28:00 GMT; Path=/",
      "oid=42",
    ]);
  });

  it("returns nothing for an empty header", () => {
    expect(splitSetCookie(null)).toEqual([]);
    expect(splitSetCookie("")).toEqual([]);
  });
});

describe("readSetCookie", () => {
  it("prefers getSetCookie() when the runtime has it (Node)", () => {
    const headers = { getSetCookie: () => ["a=1; Path=/", "b=2"], get: () => "ignored=1" };
    expect(readSetCookie(headers)).toEqual([
      ["a", "1"],
      ["b", "2"],
    ]);
  });

  it("falls back to the joined header (React Native)", () => {
    const headers = {
      get: (n: string) => (n === "set-cookie" ? "a=1; Path=/, b==x=; HttpOnly" : null),
    };
    expect(readSetCookie(headers)).toEqual([
      ["a", "1"],
      ["b", "=x="],
    ]);
  });

  it("skips malformed pairs", () => {
    expect(readSetCookie({ get: () => "=nope, ok=1; Path=/" })).toEqual([["ok", "1"]]);
  });
});

describe("cookieHeader", () => {
  it("serialises the jar, or nothing when empty", () => {
    expect(cookieHeader({ a: "1", b: "2" })).toBe("a=1; b=2");
    expect(cookieHeader({})).toBeUndefined();
  });
});

describe("memoryCookies", () => {
  it("seeds, sets and overwrites", () => {
    const jar = memoryCookies({ a: "1" });
    jar.set("b", "2");
    jar.set("a", "3");
    expect(jar.all()).toEqual({ a: "3", b: "2" });
  });
});

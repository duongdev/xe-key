import { describe, expect, it } from "vitest";
import { clientIp, createLimiter } from "./rate-limit";

describe("createLimiter", () => {
  it("allows up to the limit per key in the window, then blocks", () => {
    const hit = createLimiter({ limit: 2, windowMs: 1000 });
    expect(hit("a", 0)).toBe(true);
    expect(hit("a", 10)).toBe(true);
    expect(hit("a", 20)).toBe(false);
    expect(hit("b", 20)).toBe(true);
  });

  it("slides: old hits drop out of the window", () => {
    const hit = createLimiter({ limit: 1, windowMs: 1000 });
    expect(hit("a", 0)).toBe(true);
    expect(hit("a", 999)).toBe(false);
    expect(hit("a", 1001)).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers X-Real-IP set by the proxy", () => {
    expect(clientIp(new Headers({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe(
      "1.2.3.4",
    );
  });

  it("falls back to the last X-Forwarded-For hop, which the proxy appended", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 1.2.3.4" }))).toBe("1.2.3.4");
  });

  it("uses a shared bucket when nothing is known", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

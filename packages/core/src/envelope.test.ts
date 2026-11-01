import { describe, expect, it } from "vitest";
import { isSuccess, parseEnvelope, sessionExpired } from "./envelope.js";

describe("parseEnvelope", () => {
  it("unwraps a success envelope", () => {
    const p = parseEnvelope<{ oid: string }>({
      status: "SUCCESS",
      results: { data: { oid: "123" }, error: null },
    });
    expect(p.status).toBe("SUCCESS");
    expect(p.data.oid).toBe("123");
    expect(p.error).toEqual({});
  });

  it("is null-safe on empty/absent fields", () => {
    expect(parseEnvelope(null)).toEqual({ status: "", data: {}, error: {} });
    expect(parseEnvelope({})).toEqual({ status: "", data: {}, error: {} });
    expect(parseEnvelope({ results: { data: null, error: null } }).data).toEqual({});
  });

  it("surfaces an error code", () => {
    const p = parseEnvelope({
      status: "FAILURE",
      results: { data: null, error: { code: "NEED_VERIFICATION_CODE" } },
    });
    expect(p.error.code).toBe("NEED_VERIFICATION_CODE");
  });
});

describe("isSuccess", () => {
  it("is case-insensitive", () => {
    expect(isSuccess("SUCCESS")).toBe(true);
    expect(isSuccess("success")).toBe(true);
    expect(isSuccess("FAILURE")).toBe(false);
    expect(isSuccess("")).toBe(false);
  });
});

describe("sessionExpired", () => {
  const env = (code?: string) => ({ status: "FAILURE", results: { data: null, error: { code } } });
  it("flags the server's lost-session codes", () => {
    expect(sessionExpired(200, env("NO_LOGIN_SESSION"))).toBe(true);
    expect(sessionExpired(200, env("INVALID_TOKEN"))).toBe(true);
  });
  it("flags a 500 with no envelope (some endpoints reply so when signed out)", () => {
    expect(sessionExpired(500, null)).toBe(true);
  });
  it("does not flag other failures", () => {
    expect(sessionExpired(200, env("INVALID_CREDENTIAL"))).toBe(false);
    expect(sessionExpired(500, env("SOMETHING"))).toBe(false);
    expect(sessionExpired(200, { status: "SUCCESS" })).toBe(false);
  });
});

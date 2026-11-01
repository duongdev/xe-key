import { describe, expect, it } from "vitest";
import { isSuccess, parseEnvelope } from "./envelope.js";

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

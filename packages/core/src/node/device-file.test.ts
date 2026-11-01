import { afterEach, describe, expect, it } from "vitest";
import { resolveDeviceId } from "./device-file.js";

const ENV = "HONDA_DEVICE_ID";

describe("resolveDeviceId", () => {
  afterEach(() => {
    delete process.env[ENV];
  });

  it("prefers the env override", () => {
    process.env[ENV] = "00000000-0000-4000-8000-000000000000";
    expect(resolveDeviceId()).toBe("00000000-0000-4000-8000-000000000000");
  });

  it("generates a 16-hex id when nothing is set", () => {
    expect(resolveDeviceId()).toMatch(/^[0-9a-f]{16}$/);
  });
});

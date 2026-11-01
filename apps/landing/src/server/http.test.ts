import { describe, expect, it } from "vitest";
import { errorSummary, readJson } from "./http";

const URL_ = "http://localhost:3100/api/signup";
const headers = { "content-type": "application/json", origin: "http://localhost:3100" };

describe("readJson", () => {
  it("parses a small same-origin JSON body", async () => {
    const req = new Request(URL_, { method: "POST", headers, body: '{"a":1}' });
    expect(await readJson(req)).toEqual({ a: 1 });
  });

  it("rejects a declared Content-Length over the cap without reading", async () => {
    const req = new Request(URL_, {
      method: "POST",
      headers: { ...headers, "content-length": "999999" },
      body: "{}",
    });
    expect(await readJson(req)).toBeNull();
  });

  it("stops a streamed body once it passes the cap (counts bytes, not characters)", async () => {
    const big = `{"a":"${"ư".repeat(5000)}"}`; // 10 KB in UTF-8, 5 K characters
    const req = new Request(URL_, { method: "POST", headers, body: big });
    expect(await readJson(req)).toBeNull();
  });

  it("rejects another origin, a non-JSON type and bad JSON", async () => {
    const other = new Request(URL_, {
      method: "POST",
      headers: { ...headers, origin: "https://evil.example" },
      body: "{}",
    });
    const text = new Request(URL_, {
      method: "POST",
      headers: { ...headers, "content-type": "text/plain" },
      body: "{}",
    });
    const bad = new Request(URL_, { method: "POST", headers, body: "{" });
    expect(await readJson(other)).toBeNull();
    expect(await readJson(text)).toBeNull();
    expect(await readJson(bad)).toBeNull();
  });
});

describe("errorSummary", () => {
  it("keeps the cause message and drops query params", () => {
    const cause = new Error("duplicate key value violates unique constraint");
    const e = new Error("Failed query: insert ...\nparams: an@gmail.com", { cause });
    expect(errorSummary(e)).toBe("Error: duplicate key value violates unique constraint");
    expect(errorSummary(e)).not.toContain("an@gmail.com");
  });
});

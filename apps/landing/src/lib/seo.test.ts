import { describe, expect, it } from "vitest";
import { languageAlternates, localePath } from "./locale";
import { jsonLdScript, parseSiteUrl } from "./seo";

describe("localePath", () => {
  it("keeps Vietnamese at the root", () => {
    expect(localePath("vi", "/")).toBe("/");
    expect(localePath("vi", "/privacy")).toBe("/privacy");
  });

  it("prefixes English with /en and no trailing slash", () => {
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("en", "/privacy")).toBe("/en/privacy");
  });
});

describe("languageAlternates", () => {
  it("gives a self canonical and reciprocal hreflang with x-default on Vietnamese", () => {
    expect(languageAlternates("en", "/privacy")).toEqual({
      canonical: "/en/privacy",
      languages: { vi: "/privacy", en: "/en/privacy", "x-default": "/privacy" },
    });
    expect(languageAlternates("vi", "/").canonical).toBe("/");
  });
});

describe("parseSiteUrl", () => {
  it("accepts an https origin and drops a trailing slash", () => {
    expect(parseSiteUrl("https://xekey.app/", true).href).toBe("https://xekey.app/");
    expect(parseSiteUrl("https://xekey.app", true).origin).toBe("https://xekey.app");
  });

  it("fails a production build without it", () => {
    expect(() => parseSiteUrl(undefined, true)).toThrow(/SITE_URL/);
    expect(() => parseSiteUrl("", true)).toThrow(/SITE_URL/);
  });

  it("rejects a non-origin or non-http value", () => {
    expect(() => parseSiteUrl("xekey.app", true)).toThrow(/SITE_URL/);
    expect(() => parseSiteUrl("ftp://xekey.app", true)).toThrow(/SITE_URL/);
    expect(() => parseSiteUrl("https://xekey.app/landing", true)).toThrow(/SITE_URL/);
  });

  it("falls back to localhost in dev", () => {
    expect(parseSiteUrl(undefined, false).origin).toBe("http://localhost:3100");
  });
});

describe("jsonLdScript", () => {
  it("escapes < so data cannot close the script tag", () => {
    const out = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

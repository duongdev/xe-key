import { describe, expect, it } from "vitest";
import { baseUrl, REGIONS } from "./region.js";

describe("region", () => {
  it("maps vietnam to its host", () => {
    expect(baseUrl("vietnam")).toBe("https://vietnam-mob.aohondaconnect.com/rest/command");
  });

  it("every region ends with /rest/command", () => {
    for (const url of Object.values(REGIONS)) {
      expect(url).toMatch(/^https:\/\/.+\/rest\/command$/);
    }
  });

  it("covers the 8 APAC regions", () => {
    expect(Object.keys(REGIONS)).toHaveLength(8);
  });
});

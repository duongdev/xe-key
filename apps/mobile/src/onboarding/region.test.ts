import { REGIONS, regionFromCountry } from "./region";

describe("regionFromCountry", () => {
  it("maps an ISO country code to its Honda region", () => {
    expect(regionFromCountry("MY")).toBe("malaysia");
    expect(regionFromCountry("nz")).toBe("newzealand");
  });

  it("defaults to Vietnam", () => {
    expect(regionFromCountry(null)).toBe("vietnam");
    expect(regionFromCountry("US")).toBe("vietnam");
    expect(regionFromCountry("TH")).toBe("vietnam");
  });

  it("lists Vietnam first", () => {
    expect(REGIONS[0]?.id).toBe("vietnam");
    expect(REGIONS).toHaveLength(8);
  });
});

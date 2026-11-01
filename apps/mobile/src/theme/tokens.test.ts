import { colors, textStyle } from "./tokens";

describe("colors", () => {
  it("returns the documented dark values", () => {
    expect(colors("dark")).toEqual({
      bg: "#0B0B0C",
      s1: "#17171A",
      s2: "#232327",
      line: "#2E2E33",
      fg: "#F2F2F3",
      fg2: "#A1A1A8",
      acc: "#7CC7FF",
      onacc: "#06121C",
      warn: "#FFB547",
      onwarn: "#1A1000",
      error: "#FF8A80",
      danger: "#D93A3F",
    });
  });

  it("returns the documented light values", () => {
    expect(colors("light")).toEqual({
      bg: "#F4F4F6",
      s1: "#FFFFFF",
      s2: "#E6E6EB",
      line: "#D6D6DC",
      fg: "#0B0B0C",
      fg2: "#5C5C63",
      acc: "#0A6FC2",
      onacc: "#FFFFFF",
      warn: "#9A5200",
      onwarn: "#FFFFFF",
      error: "#C42B22",
      danger: "#D93A3F",
    });
  });

  it("falls back to dark when the scheme is unknown", () => {
    expect(colors(null)).toBe(colors("dark"));
  });
});

describe("textStyle", () => {
  it("converts em tracking to points and maps weight to the font file", () => {
    expect(textStyle("hero")).toMatchObject({
      fontFamily: "BeVietnamPro_600SemiBold",
      fontSize: 64,
      letterSpacing: -1.92,
    });
  });

  it("keeps Vietnamese body line-height at least 1.3", () => {
    const body = textStyle("body");
    expect(body.fontFamily).toBe("BeVietnamPro_400Regular");
    expect(body.lineHeight / body.fontSize).toBeGreaterThanOrEqual(1.3);
    expect(body.letterSpacing).toBe(0);
  });

  it("allows a weight override inside the style's range", () => {
    expect(textStyle("label", 600).fontFamily).toBe("BeVietnamPro_600SemiBold");
    expect(textStyle("label").fontFamily).toBe("BeVietnamPro_500Medium");
  });

  it("uses tabular figures everywhere", () => {
    expect(textStyle("caption").fontVariant).toEqual(["tabular-nums"]);
  });
});

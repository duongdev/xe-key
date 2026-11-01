export type Scheme = "dark" | "light";

const dark = {
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
} as const;

export type Colors = { readonly [K in keyof typeof dark]: string };

const light: Colors = {
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
};

export function colors(scheme: Scheme | null | undefined): Colors {
  return scheme === "light" ? light : dark;
}

export const space = { gutter: 20, card: 16, section: 20 } as const;
export const radius = { chip: 12, card: 20, cardLg: 24 } as const;
export const iconSize = { xs: 16, sm: 18, md: 22, lg: 28 } as const;

export type Weight = 400 | 500 | 600 | 700 | 800;

export const fontFamily: Record<Weight, string> = {
  400: "BeVietnamPro_400Regular",
  500: "BeVietnamPro_500Medium",
  600: "BeVietnamPro_600SemiBold",
  700: "BeVietnamPro_700Bold",
  800: "BeVietnamPro_800ExtraBold",
};

const scale = {
  hero: { size: 64, weight: 600, em: -0.03, lineHeight: 72 },
  title: { size: 40, weight: 600, em: -0.03, lineHeight: 48 },
  large: { size: 34, weight: 600, em: -0.02, lineHeight: 41 },
  stat: { size: 24, weight: 600, em: -0.02, lineHeight: 30 },
  body: { size: 17, weight: 400, em: 0, lineHeight: 23 },
  label: { size: 15, weight: 500, em: 0, lineHeight: 20 },
  caption: { size: 13, weight: 400, em: 0, lineHeight: 18 },
} as const satisfies Record<
  string,
  { size: number; weight: Weight; em: number; lineHeight: number }
>;

export type TextVariant = keyof typeof scale;

export function textStyle(variant: TextVariant, weight?: Weight) {
  const s = scale[variant];
  return {
    fontFamily: fontFamily[weight ?? s.weight],
    fontSize: s.size,
    lineHeight: s.lineHeight,
    letterSpacing: Math.round(s.em * s.size * 100) / 100,
    fontVariant: ["tabular-nums"] as ["tabular-nums"],
  };
}

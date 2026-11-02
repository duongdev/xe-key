import type { Lang } from "../copy";

export function localePath(lang: Lang, path: string): string {
  if (lang === "vi") return path;
  return path === "/" ? "/en" : `/en${path}`;
}

export function languageAlternates(lang: Lang, path: string) {
  return {
    canonical: localePath(lang, path),
    languages: {
      vi: localePath("vi", path),
      en: localePath("en", path),
      "x-default": localePath("vi", path),
    },
  };
}

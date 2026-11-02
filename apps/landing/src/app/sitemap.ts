import type { MetadataRoute } from "next";
import { languageAlternates } from "../lib/locale";
import { SITE_URL } from "../lib/seo";

const PATHS = ["/", "/privacy"];

/** One entry per language URL, each listing both languages (hreflang in the sitemap). */
export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (p: string) => new URL(p, SITE_URL).href;
  return PATHS.flatMap((path) => {
    const { languages } = languageAlternates("vi", path);
    const alternates = { languages: { vi: abs(languages.vi), en: abs(languages.en) } };
    return [
      { url: abs(languages.vi), alternates },
      { url: abs(languages.en), alternates },
    ];
  });
}

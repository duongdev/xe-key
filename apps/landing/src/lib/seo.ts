import type { Metadata } from "next";
import { COPY, type Lang } from "../copy";
import { isEmail } from "./email";
import { languageAlternates } from "./locale";

const DEV_ORIGIN = "http://localhost:3100";
const isProdBuild = process.env.NODE_ENV === "production";

/** Server-only: reads build env. Site origin from `SITE_URL`. Pages are prerendered, so it must be known at build. */
export function parseSiteUrl(raw: string | undefined, production: boolean): URL {
  if (!raw) {
    if (production) throw new Error("SITE_URL is required for a production build");
    return new URL(DEV_ORIGIN);
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`SITE_URL is not a URL: ${raw}`);
  }
  if (!/^https?:$/.test(url.protocol) || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`SITE_URL must be an http(s) origin with no path: ${raw}`);
  }
  return url;
}

export const SITE_URL = parseSiteUrl(process.env.SITE_URL, isProdBuild);

function parseContactEmail(raw: string | undefined, production: boolean): string {
  if (raw && isEmail(raw)) return raw.trim();
  if (production)
    throw new Error("CONTACT_EMAIL (a valid email) is required for a production build");
  return "hello@example.com";
}

export const CONTACT_EMAIL = parseContactEmail(process.env.CONTACT_EMAIL, isProdBuild);

const OG_LOCALE: Record<Lang, string> = { vi: "vi_VN", en: "en_US" };

/** Metadata for one page in one language; `page` is set for subpages (e.g. privacy). */
export function pageMetadata(
  lang: Lang,
  path: string,
  page?: { title: string; description: string },
): Metadata {
  const m = COPY[lang].meta;
  const alternates = languageAlternates(lang, path);
  return {
    metadataBase: SITE_URL,
    title: page ? `${page.title} · Xe Key` : m.title,
    description: page ? page.description : m.description,
    alternates,
    openGraph: {
      type: "website",
      siteName: "Xe Key",
      locale: OG_LOCALE[lang],
      alternateLocale: OG_LOCALE[lang === "vi" ? "en" : "vi"],
      url: alternates.canonical,
      title: page ? `${page.title} · Xe Key` : m.ogTitle,
      description: page ? page.description : m.ogDescription,
      images: [
        { url: `/og-${lang}.jpg`, width: 1200, height: 630, alt: m.title, type: "image/jpeg" },
      ],
    },
  };
}

/** JSON for a `<script type="application/ld+json">`; `<` is escaped so data cannot end the tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function siteJsonLd(lang: Lang) {
  const origin = SITE_URL.origin;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "Xe Key",
        url: `${origin}/`,
        inLanguage: lang,
        publisher: { "@id": `${origin}/#org` },
      },
      {
        "@type": "Organization",
        "@id": `${origin}/#org`,
        name: "Xe Key",
        url: `${origin}/`,
        logo: `${origin}/logo.png`,
        email: CONTACT_EMAIL,
      },
    ],
  };
}

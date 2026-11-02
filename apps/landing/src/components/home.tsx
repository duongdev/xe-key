import type { Lang } from "../copy";
import { CONTACT_EMAIL, jsonLdScript, pageMetadata, siteJsonLd } from "../lib/seo";
import { Landing } from "./landing";

export const homeMetadata = (lang: Lang) => pageMetadata(lang, "/");

/** Server wrapper: build-time config and structured data around the client page. */
export function Home({ lang }: { lang: Lang }) {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: escaped JSON-LD data block
        dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd(lang)) }}
      />
      <Landing lang={lang} contactEmail={CONTACT_EMAIL} />
    </>
  );
}

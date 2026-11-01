# Xe Key landing: SEO plan

Research on 2026-11-02 (4 researchers, each fact-checked against primary sources). Visible copy changes need owner OK.

## 1. TL;DR

- The page is already in good shape for crawlers. The VI content is prerendered, there is one h1, `lang="vi"` is set, and the Lighthouse SEO score is 100 on mobile and desktop. That score hides real gaps: no robots, sitemap, canonical, OG tags, OG image, favicon or JSON-LD.
- The domain decision blocks most of the work. `metadataBase`, canonical, og:image and the sitemap all need the real origin at **Docker build time**, because the HTML is built once.
- The biggest win is a correct link preview on Facebook and Zalo: an OG image, OG tags and `metadataBase`. Fix it before you share the link anywhere, because the platforms cache the first scrape.
- Make sure all FAQ answers are in the HTML (3 of 4 are missing now). Add WebSite and Organization JSON-LD. FAQ rich results stopped on 2026-05-07, so do not add FAQPage.
- Target Google only (93% of all searches in VN, 95% on mobile). For Cốc Cốc, a `Sitemap:` line in robots.txt is enough. EN needs a `/en` URL only if markets outside VN are in scope.

## 2. Owner decisions needed

1. **Production domain.** Decided for now: `SITE_URL` env at build, domain later. Options: `xekey.app`, `xekey.vn`, or another domain with only the brand name. Rec: use only the brand, and **no "honda" in the domain**. This is unverified judgment, but a domain is the hardest thing to defend in a trademark dispute. Every P0 item depends on this decision.
2. **www or apex.** Rec: apex. Send a 301 from www and from the raw Dokploy/sslip host to the apex in Traefik.
3. **Market scope / `/en`.** Decided 2026-11-02: add an indexable `/en` (owner choice; overrides the research rec of VN only). Needs ADR 0008, which supersedes the language part of ADR 0006.
4. **VI/EN switch.** With `/en` it becomes a plain link to the other URL. No localStorage, no Accept-Language redirect.
5. **OG image source.** Options: a static PNG/JPG exported from the hero board, or `opengraph-image.tsx` with ImageResponse. Rec: the static file. The diacritics are baked into the image, and you avoid the TTF trace and `process.cwd()` problems in standalone. The image has no Honda logo, no date and no platform badge.
6. **New title and description wording** (§4). Rec: add "Honda CONNECT" and "từ xa" to the title. The copy comes from the design board, so it needs your OK.
7. **Model list in the copy** (HR-V, Civic, City, CR-V, BR-V, Accord). This is a compatibility claim. Rec: leave it out of the meta until you confirm which models work, and keep "xe Honda có Honda CONNECT".
8. **Copy that compares Xe Key with the official app** ("nhanh hơn", "trạng thái cửa chính xác"). Rec: not now. Do not name Honda's app or criticize it.
9. **Privacy page and contact channel.** The page collects email, and the footer `#privacy` and `#contact` links go nowhere. Rec: add a static VI `/privacy` page and a `mailto:` link. Use the current law, PDP Law 91/2025/QH15 with Decree 356/2025 (in force since 2026-01-01), not Decree 13/2023. Check the details with a lawyer.
10. **Staging hosts on Dokploy.** If there are any, they need `noindex`. Rec: send `X-Robots-Tag: noindex` from Traefik for each non-prod host, and **allow** crawling there (see §7).
11. **Font weights.** Built: 700 dropped (unused); 500 kept, because the pill, chips and survey labels use it on the board.
12. **Paid search before launch?** Rec: no. If yes, keep "Honda" out of the ad text.

## 3. Prioritized changes

All files are under `apps/landing/`.

| P | Change | Files | Effort | Why |
|---|---|---|---|---|
| P0 | `ARG SITE_URL` + `ENV SITE_URL` in the build stage. Set it in the Dokploy build args. **Throw at build if it is missing**, with no localhost fallback. | `Dockerfile`, `src/app/layout.tsx` | S | Without it, og:image silently becomes `http://localhost:3000/...`. A runtime env does nothing (the page is prerendered, s-maxage=1y). |
| P0 | `metadataBase: new URL(SITE_URL)` and `alternates: { canonical: '/' }` | `src/app/layout.tsx` | S | Joins the `?fbclid` / `?utm` / `?zarsrc` variants into one URL. The canonical resolves to `https://domain` with no trailing slash. |
| P0 | `openGraph: { type: 'website', siteName: 'Xe Key', locale: 'vi_VN', url: '/' }` (+ title and description if they differ from the meta ones) | `src/app/layout.tsx` | S | Facebook defaults og:locale to en_US. Google reads og:site_name. `canonical` does **not** fill og:url. |
| P0 | `opengraph-image.jpg` (1200x630) + `opengraph-image.alt.txt` | `src/app/` | S | Gives a large card on Facebook and Zalo. Next emits the type, width and height and adds a content-hash `?query`. The twitter tags come automatically. |
| P0 | Icons: `favicon.ico`, `icon.svg` or `icon.png`, `apple-icon.png` (180x180) | `src/app/` | S | The 404 is the only Best Practices failure. Google shows the favicon in mobile results (square, at least 8px, more than 48px recommended). |
| P0 | `robots.ts`: allow all, `sitemap: SITE_URL + '/sitemap.xml'` | `src/app/robots.ts` | S | Also the official way to submit a sitemap to Cốc Cốc. |
| P0 | Footer: real `/privacy` page + `mailto:` contact | `src/app/privacy/page.tsx`, `src/components/landing.tsx` | M | Trust, plus the legal notice for email collection. Not a ranking factor. |
| P1 | Always render the FAQ answers. Use `hidden={!on}` or `<details>`. Do the same for the inactive tour `Detail` blocks. | `src/components/straight-talk.tsx:49`, `src/components/tour.tsx` | S | The long-tail VI text gets indexed. It also fixes the broken `aria-controls`. |
| P1 | JSON-LD `@graph`: WebSite (name, url) + Organization (name, url, logo). Use a native `<script type="application/ld+json">` and escape `<`. | `src/app/page.tsx` | S | The documented way to get "Xe Key" as the site name. The current CSP allows it (a data block does not run). |
| P1 | New title and description (§4) | `src/app/layout.tsx` (or `copy.ts` `meta`) | S | The current title does not contain "Honda CONNECT" or "từ xa". |
| P1 | After deploy: Facebook Sharing Debugger, Zalo debug tool, a test share in a Zalo chat | — | S | Clears the caches and confirms the card. |
| P2 | `sitemap.ts` with `/` (+ `/privacy`). Use the required SITE_URL. Leave out `lastModified` or use a real date. | `src/app/sitemap.ts` | S | Lets you submit to GSC. Optional for 1–2 pages. |
| P2 | Tour `<img>`: `loading="lazy" decoding="async"` + width/height. Check the first slide on mobile first. | `src/components/tour.tsx:146` | S | Removes 6 eager image preloads (~77 KB) from the first load. |
| P2 | Cut the Be Vietnam Pro weights to 400, 600 and 800. Map `<b>` to 600. Keep the `latin` + `vietnamese` subsets. | `src/app/layout.tsx`, `globals.css` | S | 10 woff2 files are preloaded now, about 1/3 of the page bytes. |
| P2 | `<main>` landmark. Fix the tablist children (tour and hero:92). | `src/components/landing.tsx`, `tour.tsx`, `hero.tsx` | S | a11y fix (desktop 94). Small SEO effect. |
| P2 | VI `not-found.tsx` with a link home | `src/app/not-found.tsx` | S | The default 404 is in English. Its status and noindex are already correct. |
| P2 | `title: { default, template: '%s · Xe Key' }` when `/privacy` lands | `src/app/layout.tsx` | S | Avoids duplicate titles. |
| P2 | `/tour/*` Cache-Control `max-age=31536000, immutable` | `next.config.ts` | S | Images are now `max-age=0`. |
| P2 | Server/client split of `landing.tsx`, **only after** a field or PSI test says INP is poor | `src/components/*` | M | Lighthouse mobile is Perf 100, TBT 0 ms, so skip for now. |
| P1 (decided) | `/en`: two route-group root layouts, `(vi)` and `(en)`, each with its own `<html lang>`. Self-canonical + reciprocal hreflang `vi:'/'`, `en:'/en'`, `x-default:'/'`. Per-locale OG. VI/EN as `<a href>` links. `global-not-found.tsx` (needs `experimental.globalNotFound`). No Accept-Language redirect. Signup `language` from the route prop. ADR 0008. | `src/app/(vi)/…`, `src/app/(en)/en/…`, `landing.tsx`, `next.config.ts` | M | Google cannot see a localStorage toggle. One URL = one indexed language. |

## 4. Title, meta and OG proposals

Counts are NFC characters. Google sets no fixed limit and cuts titles by device width, so these lengths are a choice, not a rule. None of the texts gives a date or a platform, and all use the "cho Honda CONNECT" + "độc lập" form.

| Field | VI | # | EN | # |
|---|---|---|---|---|
| Current title | Xe Key: điều khiển xe Honda ngay trong tầm tay | 46 | — | — |
| Title (rec) | Xe Key – Điều khiển xe từ xa cho Honda CONNECT | 46 | Xe Key – Remote control for your Honda CONNECT car | 50 |
| Title (alt, longer) | Xe Key: điều khiển xe Honda CONNECT từ xa trên điện thoại | 57 | — | — |
| Current description | Khóa cửa, bật điều hòa, tìm xe. Ứng dụng độc lập cho Honda CONNECT. Đăng ký danh sách chờ. | 90 | — | — |
| Description (rec) | Khóa cửa, bật điều hòa, tìm xe ngay trên điện thoại. Ứng dụng độc lập cho xe Honda có Honda CONNECT. Đăng ký danh sách chờ miễn phí. | 132 | Lock the doors, start the A/C and find your car from your phone. An independent app for Honda cars with Honda CONNECT. Join the waitlist for free. | 146 |
| og:title | Xe Key – điều khiển xe Honda CONNECT từ xa | 42 | Xe Key – control your Honda CONNECT car remotely | 48 |
| og:description | Khóa cửa, bật điều hòa, tìm xe ngay trên điện thoại. Ứng dụng độc lập cho Honda CONNECT. | 88 | Lock, cool and find your car from your phone. An independent app for Honda CONNECT. | 83 |

Notes:
- "miễn phí" is based on the FAQ line "Xe Key miễn phí".
- The EN strings are needed only when `/en` exists.
- Zalo cards cut titles short, so the keyword comes early in og:title.
- The model names stay out until decision 7.
- Copy flag for you: the FAQ item "Có phiên bản Android không?" and the "Face ID" line hint which platform comes first. Check them against the "no platform order" rule.

## 5. Keyword map

There is no volume data yet. Check trends.google.com (geo=VN, 12 months) and Keyword Planner with your account before you lock the wording. All on-page copy comes from the design board, so **any change below needs your OK**.

| Keyword (VI) | Type | Where |
|---|---|---|
| Honda CONNECT | primary | title, meta description, og:title, FAQ q1, the "Không phải app của Honda" card (already there) |
| điều khiển xe từ xa | primary | title, og:title; option: h1 subline or the hero sub (h1 stays "Điều khiển xe Honda ngay trong tầm tay." unless you change it) |
| Honda CONNECT One | secondary (the official app name owners know) | once in body copy, e.g. FAQ q1 answer or ho3s ("…kết nối với tài khoản Honda CONNECT One của bạn") |
| khóa cửa / mở khóa từ xa | secondary | meta description, FAQ q4 (already there), tour h2f section |
| bật điều hòa từ xa | secondary | meta description, tour bullets (must be in the HTML, P1) |
| tìm xe | secondary | meta description, tour |
| nổ máy / đề nổ từ xa | secondary (check volume) | FAQ q4 (already has "nổ máy"), tour |
| HR-V, Civic, City, CR-V, BR-V, Accord | long tail | FAQ q1 answer, only after the compatibility check |
| ứng dụng Honda CONNECT chậm / báo cửa mở | long tail (complaint angle) | a future FAQ item, only if decision 8 says yes |

Rules:
- Write titles, h1, h2 and OG with full diacritics. Do not add a keyword line without diacritics. Google seems to match unaccented queries, but it does not document this.
- A future slug can be ASCII with hyphens (`/dieu-khien-xe-tu-xa`). That is a choice, not a requirement.
- Never write "ứng dụng Honda" or "Honda Xe Key".

## 6. Off-page and distribution

- **Google Search Console:** verify the domain with a DNS TXT record, submit `sitemap.xml`, then use URL Inspection on `/` and request indexing.
- **Cốc Cốc:** has about 5.6% overall and 11.7% on desktop. Its official method is the `Sitemap:` line in robots.txt, and there is no form. Do nothing more.
- **Bing:** under 1%. It is optional, and you can import the site from GSC in Bing Webmaster Tools.
- **Facebook groups** (owner groups per model, Honda car owner groups): share only after the P0 items are live and the Sharing Debugger shows a clean card. Ask the admins first. Use a `?utm_source=` link per group, and the canonical joins them.
- **Zalo:** run the debug tool at developers.zalo.me/tools/debug-sharing after deploy, then test a share in a chat. The tool's behaviour is not verified, so test by hand.
- **Backlinks:** for a pre-launch page, a few real mentions are enough: otofun or forum threads where you answer Honda CONNECT questions, a dev write-up (the API RE story), GitHub README links. Do not buy links.
- **Trademark:** keep the footer disclaimer, which is already in copy.ts. Do not use the Honda logo, wing mark or Honda's red. Ask a VN IP lawyer before any paid promotion.

## 7. Refuted or corrected claims

- "With no metadataBase, the canonical becomes localhost." **Wrong.** The canonical stays relative. Only og:image and twitter:image get `http://localhost:${PORT||3000}`, with a warning only. The nextjs.org docs say "build error", but in 16.4.3 it only warns, so trust the source code.
- "Add `twitter: { card: 'summary_large_image' }` or a twitter-image file." **Redundant.** Next fills the twitter tags from openGraph, and the card defaults to summary_large_image when images exist.
- "`alternates.canonical` sets og:url." **Wrong.** Set `openGraph.url: '/'` yourself.
- "Rename the OG image or add `?v=` to bust the cache." **Not needed.** Next appends a content hash. Check this in the Turbopack output.
- "On staging, use robots.txt disallow **and** noindex." **Wrong.** If robots.txt disallows the page, Googlebot never sees the noindex. Use noindex and allow crawling.
- "The favicon must be a multiple of 48x48." **Out of date.** The rule now is square, at least 8x8, and more than 48 is recommended.
- "FAQ rich results are limited to gov and health sites." **Out of date.** Google stopped them for all sites on 2026-05-07. Do not add FAQPage.
- "Add SoftwareApplication or MobileApplication markup now." **Gives no rich result.** It needs offers.price + rating. Wait for the store listing. Fake ratings break Google's spam policy.
- "Split rare font weights into a second `Be_Vietnam_Pro()` call with `preload: false`." **Not simple.** It makes a separate font family. Cut the weights instead.
- "Keep subsets latin + vietnamese" as a change. **No-op.** It is already the setting. latin-ext is not requested.
- "Set a modern browserslist to drop polyfills." **Likely a no-op.** The Next 16 default is already modern.
- "`sitemap url: process.env.SITE_URL`" fails the type check, and "`lastModified: new Date()`" gives a false lastmod. Use the required constant, and no date or a real date.
- "There is no Cốc Cốc webmaster tool or docs." **Wrong.** The docs are at coccoc.com/search/console. The method is the robots.txt `Sitemap:` line.
- Search share "Google 95.6%, Cốc Cốc 3.6%" is **out of date**. Oct 2026: 93.38% / 5.6% overall, 95.17% / 4.69% mobile, 81.36% / 11.73% desktop.
- "Google Ads allows compatible-product landing pages" does **not** cover a free waitlist (no prices or buy path).
- "Decree 13/2023 governs email collection" is **out of date**. Use PDP Law 91/2025/QH15 + Decree 356/2025.
- "A 150–160 char / 920 px description limit" is an industry estimate, **not a Google rule**. The real proposed description in the source was 158 characters, not ~155.
- "Facebook asks for a canonical og:url." Its docs say an "undecorated URL", not "canonical".
- "Googlebot does not click." The documented rule is that it follows only `<a href>`. The conclusion is the same.
- "Put not-found in the (vi) group" for multiple root layouts. **Wrong.** You need `global-not-found.tsx` + `experimental.globalNotFound`.
- My Honda+ has 10k ratings now, not 9.4k.
- **Not verified (do not treat as facts):** Zalo's tag list and debug-tool steps; the OG crop safe-area of ~1000x500; "Messenger uses the Facebook crawler"; the 165–172 KB JS figure and the hydration cost; the trademark analysis under VN IP Law Art. 125 (2022 text not checked); the advice to keep "honda" out of the domain (judgment only); X/Twitter fallback rules (docs returned 402).

## 8. Sources

- Next.js metadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata (#metadatabase, #opengraph, #alternates, #merging, #template, #url-composition)
- Next.js OG image: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image · https://nextjs.org/docs/app/api-reference/functions/image-response
- Next.js icons, robots, sitemap: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons · https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots · https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Next.js JSON-LD: https://nextjs.org/docs/app/guides/json-ld
- Next.js not-found, route groups, i18n: https://nextjs.org/docs/app/api-reference/file-conventions/not-found · https://nextjs.org/docs/app/api-reference/file-conventions/route-groups · https://nextjs.org/docs/app/guides/internationalization
- Next.js fonts, browsers, server/client components: https://nextjs.org/docs/app/api-reference/components/font · https://nextjs.org/docs/architecture/supported-browsers · https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js source: https://github.com/vercel/next.js/blob/canary/packages/next/src/lib/metadata/resolvers/resolve-opengraph.ts · https://github.com/vercel/next.js/blob/canary/packages/next/src/lib/metadata/resolvers/resolve-url.ts · https://github.com/vercel/next.js/blob/canary/packages/next/src/build/webpack/loaders/next-metadata-image-loader.ts
- Google Search updates changelog (FAQ rich result removal): https://developers.google.com/search/updates
- Google site names, Organization, software app: https://developers.google.com/search/docs/appearance/site-names · https://developers.google.com/search/docs/appearance/structured-data/organization · https://developers.google.com/search/docs/appearance/structured-data/software-app
- Google favicon, title links, snippets: https://developers.google.com/search/docs/appearance/favicon-in-search · https://developers.google.com/search/docs/appearance/title-link · https://developers.google.com/search/docs/appearance/snippet
- Google canonical, robots, noindex: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls · https://developers.google.com/search/docs/crawling-indexing/robots/intro · https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Google sitemaps, URL structure, crawlable links: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview · https://developers.google.com/search/docs/crawling-indexing/url-structure · https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Google JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics · https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript
- Google international and localized versions: https://developers.google.com/search/docs/specialty/international/localized-versions · https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Google Core Web Vitals: https://developers.google.com/search/docs/appearance/core-web-vitals
- Facebook sharing: https://developers.facebook.com/docs/sharing/webmasters/ · https://developers.facebook.com/tools/debug/
- Zalo debug tool: https://developers.zalo.me/tools/debug-sharing (unverified) · LadiPage guide (third party): https://helpv3.ladipage.vn/cac-tinh-nang-mo-rong/sua-loi-chia-se-tren-facebook-va-zalo
- Cốc Cốc: https://coccoc.com/search/console/en/submit-sitemap-to-coc-coc-search · https://coccoc.com/search/console/en/robots.txt
- StatCounter VN: https://gs.statcounter.com/search-engine-market-share/all/viet-nam · https://gs.statcounter.com/search-engine-market-share/mobile/viet-nam · https://gs.statcounter.com/search-engine-market-share/desktop/viet-nam
- App Store: https://apps.apple.com/vn/app/id6502376314 (Honda CONNECT One) · https://apps.apple.com/vn/app/id1482745552 (My Honda+)
- Google Ads trademark policy: https://support.google.com/adspolicy/answer/6118
- VN PDP law: https://luatvietnam.vn/legal-updates/the-latest-law-on-personal-data-protection-and-the-guiding-documents-892-106778-article.html · https://www.dlapiperdataprotection.com/?c=VN&t=law
- VN IP Law Art. 125: https://hethongphapluat.com/luat-so-huu-tri-tue-2005/dieu-125
- Web performance and markup: https://react.dev/reference/react-dom/components/img · https://web.dev/articles/browser-level-image-lazy-loading · https://web.dev/articles/font-best-practices · https://html.spec.whatwg.org/multipage/scripting.html#data-block · https://ogp.me/
- a11y: https://dequeuniversity.com/rules/axe/4.10/landmark-one-main · https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- Local evidence: `apps/landing/src/components/straight-talk.tsx:49`, `apps/landing/src/components/tour.tsx:146`, `apps/landing/Dockerfile`, live build at http://localhost:3200
- Lighthouse reports: (local Lighthouse run, not kept) and (local Lighthouse run, not kept)
import type { ReactNode } from "react";
import { COPY, type Lang } from "../copy";
import { localePath } from "../lib/locale";
import s from "./chrome.module.css";

export function Tile({ big }: { big?: boolean }) {
  return (
    <span className={big ? s.bigtile : s.tile} aria-hidden="true">
      xe<i>.</i>
    </span>
  );
}

const LANGS: [Lang, string][] = [
  ["vi", "VI"],
  ["en", "EN"],
];

/** Top bar. `path` is the language-neutral path of this page (e.g. "/privacy"). */
export function Nav({
  lang,
  path,
  cta,
  current = true,
}: {
  lang: Lang;
  path: string;
  cta?: ReactNode;
  /** False on pages that are not `path` itself (the 404). */
  current?: boolean;
}) {
  return (
    <nav className={s.nav} aria-label="Main">
      <a className={s.brand} href={localePath(lang, "/")}>
        <Tile />
        Xe Key
      </a>
      <div className={s.navr}>
        <div className={s.seg}>
          {LANGS.map(([l, label]) => (
            <a
              key={l}
              href={localePath(l, path)}
              hrefLang={l}
              lang={l}
              aria-current={current && l === lang ? "page" : undefined}
            >
              {label}
              <span className="sr-only"> {COPY[l].langName}</span>
            </a>
          ))}
        </div>
        {cta}
      </div>
    </nav>
  );
}

export function NavCta({ children }: { children: ReactNode }) {
  return (
    <a className={s.navcta} href="#join">
      {children}
    </a>
  );
}

export function Footer({ lang, contactEmail }: { lang: Lang; contactEmail: string }) {
  const t = COPY[lang];
  return (
    <div className="wrap">
      <footer className={s.foot}>
        <span>{t.legal}</span>
        <span className={s.links}>
          <a href={localePath(lang, "/privacy")}>{t.privacy}</a>
          <a href={`mailto:${contactEmail}`}>{t.contact}</a>
          <span>© 2026 Xe Key</span>
        </span>
      </footer>
    </div>
  );
}

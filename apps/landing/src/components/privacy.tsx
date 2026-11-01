import { COPY, type Lang } from "../copy";
import { CONTACT_EMAIL, pageMetadata } from "../lib/seo";
import { Footer, Nav } from "./chrome";
import s from "./privacy.module.css";

export const privacyMetadata = (lang: Lang) =>
  pageMetadata(lang, "/privacy", {
    title: COPY[lang].pv.title,
    description: COPY[lang].pv.intro,
  });

export function Privacy({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <div className="page">
      <div className="wrap">
        <Nav lang={lang} path="/privacy" />
      </div>
      <main className="wrap">
        <div className={s.doc}>
          <h1>{t.pv.title}</h1>
          <p className={s.updated}>{t.pv.updated}</p>
          <p>{t.pv.intro}</p>
          {t.pv.sections.map(([h, body]) => (
            <section key={h}>
              <h2>{h}</h2>
              <p>{body}</p>
            </section>
          ))}
          <section>
            <h2>{t.pv.contactT}</h2>
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </section>
        </div>
      </main>
      <Footer lang={lang} contactEmail={CONTACT_EMAIL} />
    </div>
  );
}

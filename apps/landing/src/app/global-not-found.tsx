import type { Metadata } from "next";
import { Footer, Nav } from "../components/chrome";
import s from "../components/privacy.module.css";
import { COPY } from "../copy";
import { CONTACT_EMAIL } from "../lib/seo";
import { Document } from "./document";

export { viewport } from "./document";

export const metadata: Metadata = {
  title: "404 · Xe Key",
};

export default function GlobalNotFound() {
  const vi = COPY.vi;
  const en = COPY.en;
  return (
    <Document lang="vi">
      <div className="page">
        <div className="wrap">
          <Nav lang="vi" path="/" current={false} />
        </div>
        <main className="wrap">
          <div className={s.doc}>
            <h1>{vi.notFoundT}</h1>
            <p>{vi.notFoundS}</p>
            <p>
              <a href="/">{vi.home}</a>
            </p>
            <p lang="en">
              {en.notFoundT} <a href="/en">{en.home}</a>
            </p>
          </div>
        </main>
        <Footer lang="vi" contactEmail={CONTACT_EMAIL} />
      </div>
    </Document>
  );
}

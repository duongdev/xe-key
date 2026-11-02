import type { ReactNode } from "react";
import { en } from "../../app-i18n/en";
import { vi } from "../../app-i18n/vi";
import type { Lang } from "../../copy";
import s from "./phone.module.css";

/** The app's own words for a site language. */
export const appStrings = (lang: Lang) => (lang === "vi" ? vi : en);

export type ScreenProps = { lang: Lang };

/** A 390 × 870 pt app screen (iPhone points); the tour scales it into the frame. */
export function Phone({ children }: { children: ReactNode }) {
  return (
    <div className={s.phone}>
      {children}
      <StatusBar />
    </div>
  );
}

function StatusBar() {
  return (
    <div className={s.status}>
      <span>9:41</span>
      <svg width="72" height="13" viewBox="0 0 72 13" fill="currentColor" aria-hidden="true">
        <rect x="0" y="8" width="3.5" height="5" rx="1" />
        <rect x="5" y="5.5" width="3.5" height="7.5" rx="1" />
        <rect x="10" y="3" width="3.5" height="10" rx="1" />
        <rect x="15" y="0.5" width="3.5" height="12.5" rx="1" />
        <path d="M31 2.8a10.6 10.6 0 0 1 7.4 3l1.3-1.4A12.6 12.6 0 0 0 31 .8a12.6 12.6 0 0 0-8.7 3.6l1.3 1.4a10.6 10.6 0 0 1 7.4-3Zm0 4a6.7 6.7 0 0 1 4.6 1.9l1.4-1.4A8.7 8.7 0 0 0 31 4.8a8.7 8.7 0 0 0-6 2.5l1.4 1.4A6.7 6.7 0 0 1 31 6.8Zm0 4 2.6-2.6a3.7 3.7 0 0 0-5.2 0Z" />
        <rect
          x="45.5"
          y="1"
          width="23"
          height="11"
          rx="3.5"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".4"
        />
        <rect x="47.5" y="3" width="19" height="7" rx="2" />
        <path d="M70 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fillOpacity=".45" />
      </svg>
    </div>
  );
}

/** 44 pt glass circle (header buttons, map controls). */
export function GlassCircle({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={className ? `${s.glass} ${className}` : s.glass}>{children}</span>;
}

/** Glass capsule (filters, tabs). */
export function GlassCapsule({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={className ? `${s.capsule} ${className}` : s.capsule}>{children}</span>;
}

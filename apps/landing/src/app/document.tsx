import { Be_Vietnam_Pro } from "next/font/google";
import type { ReactNode } from "react";
import type { Lang } from "../copy";
import "./globals.css";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "800"],
  variable: "--font",
  display: "swap",
});

/** The `<html>` shell shared by the per-language root layouts and the global 404. */
export function Document({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <html lang={lang} className={font.variable}>
      <body>{children}</body>
    </html>
  );
}

export const viewport = { themeColor: "#0B0B0C" };

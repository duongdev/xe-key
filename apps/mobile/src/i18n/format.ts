import { getCalendars } from "expo-localization";
import { usePrefs } from "../prefs";
import { useLang } from "./index";

export type Clock = "24h" | "12h";

/** Hand-rolled so output is the same on every device (Intl varies by iOS version). */
export function formatTime(ts: number, clock: Clock, lang: "en" | "vi"): string {
  const d = new Date(ts);
  const m = String(d.getMinutes()).padStart(2, "0");
  if (clock === "24h") return `${String(d.getHours()).padStart(2, "0")}:${m}`;
  const h = d.getHours() % 12 || 12;
  const pm = d.getHours() >= 12;
  const suffix = lang === "vi" ? (pm ? "CH" : "SA") : pm ? "PM" : "AM";
  return `${h}:${m} ${suffix}`;
}

/** Time formatter that follows the Format setting, else the device's 24-hour setting. */
export function useFormatTime() {
  const { format } = usePrefs().prefs;
  const lang = useLang();
  const clock: Clock =
    format === "system" ? (getCalendars()[0]?.uses24hourClock === false ? "12h" : "24h") : format;
  return (ts: number) => formatTime(ts, clock, lang);
}

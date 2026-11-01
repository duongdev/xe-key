import { getLocales } from "expo-localization";
import { usePrefs } from "../prefs";
import { type Dict, en } from "./en";
import { vi } from "./vi";

export function useLang(): "en" | "vi" {
  const { language } = usePrefs().prefs;
  const lang = language === "system" ? getLocales()[0]?.languageCode : language;
  return lang === "vi" ? "vi" : "en";
}

export function useT(): Dict {
  return useLang() === "vi" ? vi : en;
}
